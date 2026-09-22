from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends

from app.models.user import UserRegister, UserLogin, UserResponse
from app.auth.security import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.database import get_users_collection

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister):
    """
    Register a new user account.
    - Validates email and name format
    - Ensures email is not duplicate
    - Hashes password securely using bcrypt
    - Never returns the password hash
    """
    users_col = get_users_collection()
    normalized_email = user_data.email.lower().strip()

    # Check for existing user
    existing_user = users_col.find_one({"email": normalized_email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    # Hash password and create document
    now = datetime.now(timezone.utc)
    user_doc = {
        "name": user_data.name.strip(),
        "email": normalized_email,
        "password_hash": hash_password(user_data.password),
        "created_at": now
    }

    result = users_col.insert_one(user_doc)

    return UserResponse(
        id=str(result.inserted_id),
        name=user_doc["name"],
        email=user_doc["email"],
        created_at=user_doc["created_at"]
    )


@router.post("/login")
def login(credentials: UserLogin) -> Dict[str, Any]:
    """
    Authenticate user and return a JWT access token.
    """
    users_col = get_users_collection()
    normalized_email = credentials.email.lower().strip()

    user = users_col.find_one({"email": normalized_email})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate JWT token
    user_id = str(user["_id"])
    access_token = create_access_token(
        data={"sub": user_id, "email": user["email"]}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
            "created_at": user.get("created_at")
        }
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Return currently authenticated user profile.
    Requires Bearer JWT token.
    """
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        created_at=current_user["created_at"]
    )
