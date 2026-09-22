from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of user")
    email: EmailStr = Field(..., description="Unique email address")


class UserRegister(UserBase):
    password: str = Field(..., min_length=6, max_length=128, description="Plain text password (min 6 chars)")


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    id: str = Field(..., description="String representation of MongoDB _id")
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserInDB(UserBase):
    id: Optional[str] = None
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
