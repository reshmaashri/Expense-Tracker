from datetime import date, datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class ExpenseCategory(str, Enum):
    FOOD = "Food"
    TRANSPORT = "Transport"
    EDUCATION = "Education"
    SHOPPING = "Shopping"
    ENTERTAINMENT = "Entertainment"
    BILLS = "Bills"
    HEALTH = "Health"
    OTHER = "Other"


class PaymentMethod(str, Enum):
    CASH = "Cash"
    UPI = "UPI"
    CREDIT_CARD = "Credit Card"
    DEBIT_CARD = "Debit Card"
    BANK_TRANSFER = "Bank Transfer"
    OTHER = "Other"


class ExpenseBase(BaseModel):
    amount: float = Field(..., gt=0, description="Expense amount (must be positive)")
    category: ExpenseCategory = Field(..., description="Category from allowed list")
    description: str = Field(..., min_length=1, max_length=500, description="Description of the expense")
    date: str = Field(..., description="Date of expense in YYYY-MM-DD format")
    payment_method: PaymentMethod = Field(..., description="Payment method used")

    @field_validator("date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        try:
            # Validate ISO date string (YYYY-MM-DD)
            parsed_date = datetime.strptime(v, "%Y-%m-%d").date()
            return parsed_date.isoformat()
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format (e.g. 2026-09-14)")


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[ExpenseCategory] = None
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    date: Optional[str] = None
    payment_method: Optional[PaymentMethod] = None

    @field_validator("date")
    @classmethod
    def validate_date_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        try:
            parsed_date = datetime.strptime(v, "%Y-%m-%d").date()
            return parsed_date.isoformat()
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format (e.g. 2026-09-14)")


class ExpenseResponse(ExpenseBase):
    id: str = Field(..., description="Expense ID")
    user_id: str = Field(..., description="Owner User ID")
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseListResponse(BaseModel):
    expenses: list[ExpenseResponse]
    total: int
    page: int
    limit: int
    total_pages: int

