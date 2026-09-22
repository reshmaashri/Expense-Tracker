import math
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from bson import ObjectId
import pymongo
from fastapi import APIRouter, HTTPException, status, Depends, Query

from app.models.expense import (
    ExpenseCategory,
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseListResponse,
)
from app.auth.dependencies import get_current_user
from app.database import get_expenses_collection

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])


def _find_user_expense(expenses_col, expense_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Helper to locate an expense belonging exclusively to the authenticated user."""
    # Attempt ObjectId lookup first
    query = {"user_id": user_id}
    if ObjectId.is_valid(expense_id):
        query["_id"] = ObjectId(expense_id)
        doc = expenses_col.find_one(query)
        if doc:
            return doc
    # Fallback to string ID lookup
    query["_id"] = expense_id
    return expenses_col.find_one(query)


def _doc_to_response(doc: Dict[str, Any]) -> ExpenseResponse:
    """Format MongoDB document into ExpenseResponse."""
    return ExpenseResponse(
        id=str(doc["_id"]),
        user_id=str(doc["user_id"]),
        amount=float(doc["amount"]),
        category=doc["category"],
        description=doc["description"],
        date=str(doc["date"]),
        payment_method=doc["payment_method"],
        created_at=doc.get("created_at") or datetime.now(timezone.utc)
    )


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_in: ExpenseCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create a new expense entry for the authenticated user.
    """
    expenses_col = get_expenses_collection()
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)

    doc = {
        "user_id": user_id,
        "amount": round(float(expense_in.amount), 2),
        "category": expense_in.category.value,
        "description": expense_in.description.strip(),
        "date": expense_in.date,
        "payment_method": expense_in.payment_method.value,
        "created_at": now
    }

    result = expenses_col.insert_one(doc)
    doc["_id"] = result.inserted_id

    return _doc_to_response(doc)


@router.get("", response_model=ExpenseListResponse)
def get_expenses(
    search: Optional[str] = Query(None, description="Search term for description or category"),
    category: Optional[ExpenseCategory] = Query(None, description="Filter by category"),
    start_date: Optional[str] = Query(None, description="Filter date from (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter date to (YYYY-MM-DD)"),
    sort_by: str = Query("date", description="Field to sort by (date, amount, created_at)"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    List expenses for the authenticated user with search, filtering, sorting, and pagination.
    """
    expenses_col = get_expenses_collection()
    user_id = current_user["id"]

    # Base filter: Only user's own expenses
    filter_query: Dict[str, Any] = {"user_id": user_id}

    # Category filter
    if category:
        filter_query["category"] = category.value

    # Date range filter
    date_filter = {}
    if start_date:
        date_filter["$gte"] = start_date
    if end_date:
        date_filter["$lte"] = end_date
    if date_filter:
        filter_query["date"] = date_filter

    # Search filter (description or category)
    if search and search.strip():
        search_term = search.strip()
        filter_query["$or"] = [
            {"description": {"$regex": search_term}},
            {"category": {"$regex": search_term}}
        ]

    # Total count
    total = expenses_col.count_documents(filter_query)

    # Sort configuration
    valid_sort_fields = {"date", "amount", "created_at", "category"}
    field = sort_by if sort_by in valid_sort_fields else "date"
    direction = pymongo.DESCENDING if sort_order == "desc" else pymongo.ASCENDING

    skip = (page - 1) * limit
    cursor = expenses_col.find(filter_query).sort(field, direction).skip(skip).limit(limit)

    expenses = [_doc_to_response(item) for item in cursor]
    total_pages = math.ceil(total / limit) if total > 0 else 1

    return ExpenseListResponse(
        expenses=expenses,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieve a single expense by ID for the authenticated user.
    """
    expenses_col = get_expenses_collection()
    doc = _find_user_expense(expenses_col, expense_id, current_user["id"])

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )

    return _doc_to_response(doc)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: str,
    update_in: ExpenseUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update an existing expense owned by the authenticated user.
    """
    expenses_col = get_expenses_collection()
    doc = _find_user_expense(expenses_col, expense_id, current_user["id"])

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )

    # Build update set
    updates: Dict[str, Any] = {}
    if update_in.amount is not None:
        updates["amount"] = round(float(update_in.amount), 2)
    if update_in.category is not None:
        updates["category"] = update_in.category.value
    if update_in.description is not None:
        updates["description"] = update_in.description.strip()
    if update_in.date is not None:
        updates["date"] = update_in.date
    if update_in.payment_method is not None:
        updates["payment_method"] = update_in.payment_method.value

    if updates:
        query = {"_id": doc["_id"], "user_id": current_user["id"]}
        expenses_col.update_one(query, {"$set": updates})
        doc.update(updates)

    return _doc_to_response(doc)


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete an expense owned by the authenticated user.
    """
    expenses_col = get_expenses_collection()
    doc = _find_user_expense(expenses_col, expense_id, current_user["id"])

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )

    query = {"_id": doc["_id"], "user_id": current_user["id"]}
    expenses_col.delete_one(query)

    return {
        "message": "Expense deleted successfully",
        "id": str(doc["_id"])
    }
