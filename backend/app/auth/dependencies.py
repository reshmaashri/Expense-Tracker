from typing import Dict, Any
from bson import ObjectId, errors as bson_errors
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.auth.security import decode_access_token
from app.database import get_users_collection

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Dependency that authenticates the user using the Bearer JWT token.
    Returns the sanitized user dictionary without password_hash.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exception

    users_col = get_users_collection()
    
    # Query by ObjectId or string ID
    user = None
    try:
        if ObjectId.is_valid(user_id):
            user = users_col.find_one({"_id": ObjectId(user_id)})
    except Exception:
        pass
    
    if not user:
        user = users_col.find_one({"_id": user_id})

    if not user:
        raise credentials_exception

    # Return safe user dictionary
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "created_at": user.get("created_at")
    }
