from typing import List
from pydantic import BaseModel, Field


class AnalyticsSummaryResponse(BaseModel):
    total_expenses: float = Field(..., description="Sum of all user expenses")
    current_month_expenses: float = Field(..., description="Sum of expenses in the current month")
    today_expenses: float = Field(..., description="Sum of expenses incurred today")
    transaction_count: int = Field(..., description="Total number of expense transactions")
    highest_expense: float = Field(..., description="Highest single expense recorded")


class CategoryAnalyticsItem(BaseModel):
    category: str = Field(..., description="Expense category name")
    amount: float = Field(..., description="Total spending in this category")
    count: int = Field(..., description="Number of transactions in this category")
    percentage: float = Field(..., description="Percentage of total spending")


class CategoryAnalyticsResponse(BaseModel):
    categories: List[CategoryAnalyticsItem]
    total_expenses: float


class MonthlyAnalyticsItem(BaseModel):
    month: str = Field(..., description="Month in YYYY-MM format")
    amount: float = Field(..., description="Total spending for this month")
    count: int = Field(..., description="Transaction count for this month")


class MonthlyAnalyticsResponse(BaseModel):
    months: List[MonthlyAnalyticsItem]
    total_expenses: float
