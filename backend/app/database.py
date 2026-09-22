import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Union
import certifi
from bson import ObjectId
import pymongo
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, PyMongoError, ServerSelectionTimeoutError, AutoReconnect

from app.config import settings

logger = logging.getLogger("uvicorn.error")

_client: Optional[MongoClient] = None
_db: Optional[Database] = None
_atlas_available: bool = False

# Local fallback store directory
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
LOCAL_STORE_PATH = os.path.join(DATA_DIR, "local_storage.json")


def _ensure_local_store():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(LOCAL_STORE_PATH):
        with open(LOCAL_STORE_PATH, "w", encoding="utf-8") as f:
            json.dump({"users": [], "expenses": []}, f)


def _load_local_store() -> Dict[str, List[Dict[str, Any]]]:
    _ensure_local_store()
    try:
        with open(LOCAL_STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"users": [], "expenses": []}


def _save_local_store(data: Dict[str, List[Dict[str, Any]]]):
    _ensure_local_store()
    with open(LOCAL_STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, default=str, indent=2)


class LocalCursor:
    """Mock cursor for find() operations on local storage."""
    def __init__(self, items: List[Dict[str, Any]]):
        self._items = list(items)

    def sort(self, key_or_list, direction=None):
        if isinstance(key_or_list, list):
            key, direction = key_or_list[0]
        else:
            key = key_or_list
        rev = (direction == pymongo.DESCENDING or direction == -1)
        
        def get_sort_val(item):
            val = item.get(key)
            if isinstance(val, (int, float)):
                return val
            try:
                return float(val)
            except (ValueError, TypeError):
                return str(val or "")

        self._items.sort(key=get_sort_val, reverse=rev)
        return self

    def skip(self, n: int):
        self._items = self._items[n:]
        return self

    def limit(self, n: int):
        self._items = self._items[:n]
        return self

    def __iter__(self):
        return iter(self._items)

    def __list__(self):
        return self._items


class InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class DeleteResult:
    def __init__(self, deleted_count: int):
        self.deleted_count = deleted_count


class UpdateResult:
    def __init__(self, modified_count: int, matched_count: int):
        self.modified_count = modified_count
        self.matched_count = matched_count


class ResilientCollection:
    """
    Wrapper that connects to MongoDB Atlas by default,
    falling back to a local persisted store if Atlas is temporarily degraded.
    """
    def __init__(self, name: str):
        self.name = name

    def _get_real_col(self) -> Optional[Collection]:
        global _db, _atlas_available
        if _atlas_available and _db is not None:
            return _db[self.name]
        return None

    def _matches_filter(self, doc: Dict[str, Any], filter_doc: Dict[str, Any]) -> bool:
        for k, v in filter_doc.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches_filter(doc, sub_filter) for sub_filter in v):
                    return False
                continue
            doc_v = doc.get(k)
            # Handle ObjectId or string IDs
            if k in ("_id", "user_id"):
                if str(doc_v) != str(v):
                    return False
            elif isinstance(v, dict):
                # MongoDB operators: $gte, $lte, $gt, $lt, $regex, $in
                if "$gte" in v and not (str(doc_v) >= str(v["$gte"])):
                    return False
                if "$lte" in v and not (str(doc_v) <= str(v["$lte"])):
                    return False
                if "$gt" in v and not (str(doc_v) > str(v["$gt"])):
                    return False
                if "$lt" in v and not (str(doc_v) < str(v["$lt"])):
                    return False
                if "$in" in v and (doc_v not in v["$in"]):
                    return False
                if "$regex" in v:
                    pattern = v["$regex"]
                    if not re.search(pattern, str(doc_v or ""), re.IGNORECASE):
                        return False
            else:
                if str(doc_v).lower() != str(v).lower():
                    return False
        return True

    def find_one(self, filter_doc: Dict[str, Any], *args, **kwargs) -> Optional[Dict[str, Any]]:
        real_col = self._get_real_col()
        if real_col is not None:
            try:
                return real_col.find_one(filter_doc, *args, **kwargs)
            except (ConnectionFailure, ServerSelectionTimeoutError, AutoReconnect) as e:
                logger.warning(f"Atlas find_one failed ({e}). Falling back to local store.")
        
        # Local fallback
        store = _load_local_store()
        items = store.get(self.name, [])
        for item in items:
            if self._matches_filter(item, filter_doc):
                res = dict(item)
                # Ensure _id is present
                if "_id" not in res:
                    res["_id"] = str(ObjectId())
                return res
        return None

    def insert_one(self, document: Dict[str, Any], *args, **kwargs) -> InsertResult:
        doc = dict(document)
        if "_id" not in doc:
            doc["_id"] = ObjectId()

        real_col = self._get_real_col()
        if real_col is not None:
            try:
                res = real_col.insert_one(doc, *args, **kwargs)
                return res
            except (ConnectionFailure, ServerSelectionTimeoutError, AutoReconnect) as e:
                logger.warning(f"Atlas insert_one failed ({e}). Falling back to local store.")

        # Local fallback
        store = _load_local_store()
        items = store.setdefault(self.name, [])
        doc_to_save = dict(doc)
        doc_to_save["_id"] = str(doc_to_save["_id"])
        items.append(doc_to_save)
        _save_local_store(store)
        return InsertResult(doc["_id"])

    def find(self, filter_doc: Optional[Dict[str, Any]] = None, *args, **kwargs):
        filter_doc = filter_doc or {}
        real_col = self._get_real_col()
        if real_col is not None:
            try:
                return real_col.find(filter_doc, *args, **kwargs)
            except (ConnectionFailure, ServerSelectionTimeoutError, AutoReconnect) as e:
                logger.warning(f"Atlas find failed ({e}). Falling back to local store.")

        # Local fallback
        store = _load_local_store()
        items = store.get(self.name, [])
        matched = [dict(item) for item in items if self._matches_filter(item, filter_doc)]
        return LocalCursor(matched)

    def update_one(self, filter_doc: Dict[str, Any], update_doc: Dict[str, Any], *args, **kwargs) -> UpdateResult:
        real_col = self._get_real_col()
        if real_col is not None:
            try:
                return real_col.update_one(filter_doc, update_doc, *args, **kwargs)
            except (ConnectionFailure, ServerSelectionTimeoutError, AutoReconnect) as e:
                logger.warning(f"Atlas update_one failed ({e}). Falling back to local store.")

        # Local fallback
        store = _load_local_store()
        items = store.get(self.name, [])
        modified = 0
        set_fields = update_doc.get("$set", {})
        for item in items:
            if self._matches_filter(item, filter_doc):
                item.update(set_fields)
                modified += 1
                break
        if modified:
            _save_local_store(store)
        return UpdateResult(modified, modified)

    def delete_one(self, filter_doc: Dict[str, Any], *args, **kwargs) -> DeleteResult:
        real_col = self._get_real_col()
        if real_col is not None:
            try:
                return real_col.delete_one(filter_doc, *args, **kwargs)
            except (ConnectionFailure, ServerSelectionTimeoutError, AutoReconnect) as e:
                logger.warning(f"Atlas delete_one failed ({e}). Falling back to local store.")

        # Local fallback
        store = _load_local_store()
        items = store.get(self.name, [])
        initial_len = len(items)
        store[self.name] = [item for item in items if not self._matches_filter(item, filter_doc)]
        deleted = initial_len - len(store[self.name])
        if deleted:
            _save_local_store(store)
        return DeleteResult(deleted)

    def count_documents(self, filter_doc: Optional[Dict[str, Any]] = None, *args, **kwargs) -> int:
        filter_doc = filter_doc or {}
        real_col = self._get_real_col()
        if real_col is not None:
            try:
                return real_col.count_documents(filter_doc, *args, **kwargs)
            except (ConnectionFailure, ServerSelectionTimeoutError, AutoReconnect) as e:
                logger.warning(f"Atlas count_documents failed ({e}). Falling back to local store.")

        store = _load_local_store()
        items = store.get(self.name, [])
        return sum(1 for item in items if self._matches_filter(item, filter_doc))

    def aggregate(self, pipeline: List[Dict[str, Any]], *args, **kwargs):
        real_col = self._get_real_col()
        if real_col is not None:
            try:
                return list(real_col.aggregate(pipeline, *args, **kwargs))
            except (ConnectionFailure, ServerSelectionTimeoutError, AutoReconnect) as e:
                logger.warning(f"Atlas aggregate failed ({e}). Falling back to local store.")

        # Local aggregation execution
        store = _load_local_store()
        current_data = [dict(item) for item in store.get(self.name, [])]

        for stage in pipeline:
            if "$match" in stage:
                match_filter = stage["$match"]
                current_data = [doc for doc in current_data if self._matches_filter(doc, match_filter)]
            elif "$group" in stage:
                group_spec = stage["$group"]
                id_spec = group_spec.get("_id")
                groups: Dict[Any, List[Dict[str, Any]]] = {}
                for doc in current_data:
                    # Evaluate group key
                    if id_spec is None:
                        key = None
                    elif isinstance(id_spec, str) and id_spec.startswith("$"):
                        field = id_spec[1:]
                        key = doc.get(field)
                    elif isinstance(id_spec, dict) and "$substr" in id_spec:
                        field_expr, start, length = id_spec["$substr"]
                        field_name = field_expr[1:] if field_expr.startswith("$") else field_expr
                        val = str(doc.get(field_name, ""))
                        key = val[start:start + length]
                    else:
                        key = str(id_spec)

                    if key not in groups:
                        groups[key] = []
                    groups[key].append(doc)

                # Aggregate accumulators for each group
                new_data = []
                for key, group_docs in groups.items():
                    grouped_record = {"_id": key}
                    for field, acc in group_spec.items():
                        if field == "_id":
                            continue
                        if isinstance(acc, dict):
                            if "$sum" in acc:
                                sum_spec = acc["$sum"]
                                if isinstance(sum_spec, (int, float)):
                                    grouped_record[field] = sum_spec * len(group_docs)
                                elif isinstance(sum_spec, str) and sum_spec.startswith("$"):
                                    f_name = sum_spec[1:]
                                    grouped_record[field] = round(sum(float(d.get(f_name, 0) or 0) for d in group_docs), 2)
                            elif "$max" in acc:
                                max_spec = acc["$max"]
                                f_name = max_spec[1:] if max_spec.startswith("$") else max_spec
                                vals = [float(d.get(f_name, 0) or 0) for d in group_docs]
                                grouped_record[field] = max(vals) if vals else 0
                            elif "$avg" in acc:
                                avg_spec = acc["$avg"]
                                f_name = avg_spec[1:] if avg_spec.startswith("$") else avg_spec
                                vals = [float(d.get(f_name, 0) or 0) for d in group_docs]
                                grouped_record[field] = round(sum(vals) / len(vals), 2) if vals else 0
                    new_data.append(grouped_record)
                current_data = new_data
            elif "$sort" in stage:
                sort_spec = stage["$sort"]
                for sort_field, sort_dir in reversed(list(sort_spec.items())):
                    rev = (sort_dir == -1 or sort_dir == pymongo.DESCENDING)
                    current_data.sort(
                        key=lambda x: (
                            x.get(sort_field) if isinstance(x.get(sort_field), (int, float))
                            else float(x.get(sort_field)) if str(x.get(sort_field, "")).replace(".", "", 1).isdigit()
                            else str(x.get(sort_field, ""))
                        ),
                        reverse=rev
                    )
            elif "$limit" in stage:
                current_data = current_data[:stage["$limit"]]

        return current_data

    def create_index(self, *args, **kwargs):
        real_col = self._get_real_col()
        if real_col is not None:
            try:
                return real_col.create_index(*args, **kwargs)
            except Exception as e:
                logger.warning(f"Atlas index creation skipped: {e}")
        return "index_mock"


def sanitize_mongodb_uri(raw_uri: str) -> str:
    if not raw_uri:
        return raw_uri
    return re.sub(r':<([^>]+)>@', r':\1@', raw_uri)


def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        cleaned_uri = sanitize_mongodb_uri(settings.MONGODB_URI)
        _client = MongoClient(
            cleaned_uri,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=4000,
            connectTimeoutMS=4000,
            retryWrites=True
        )
    return _client


def get_database() -> Database:
    global _db
    if _db is None:
        client = get_mongo_client()
        _db = client[settings.DATABASE_NAME]
    return _db


def get_users_collection() -> ResilientCollection:
    return ResilientCollection("users")


def get_expenses_collection() -> ResilientCollection:
    return ResilientCollection("expenses")


def init_database() -> bool:
    global _atlas_available
    try:
        client = get_mongo_client()
        client.admin.command('ping')
        db = get_database()
        db["users"].create_index("email", unique=True)
        db["expenses"].create_index("user_id")
        db["expenses"].create_index("date")
        db["expenses"].create_index([("user_id", pymongo.ASCENDING), ("date", pymongo.DESCENDING)])
        _atlas_available = True
        logger.info(f"MongoDB Atlas connected successfully. Database '{settings.DATABASE_NAME}' active.")
        return True
    except Exception as e:
        _atlas_available = False
        _ensure_local_store()
        logger.warning(f"MongoDB Atlas unavailable ({e}). Operating in resilient mode with local persistence fallback.")
        return False


def check_database_health() -> Dict[str, Any]:
    global _atlas_available
    try:
        client = get_mongo_client()
        client.admin.command('ping')
        _atlas_available = True
        return {
            "status": "connected",
            "database": settings.DATABASE_NAME
        }
    except Exception as e:
        _atlas_available = False
        err_msg = re.sub(r':([^@]+)@', ':***@', str(e))
        return {
            "status": "degraded",
            "database": settings.DATABASE_NAME,
            "mode": "resilient_fallback",
            "error": err_msg
        }


def close_database():
    global _client, _db
    if _client is not None:
        try:
            _client.close()
        except Exception:
            pass
        finally:
            _client = None
            _db = None
