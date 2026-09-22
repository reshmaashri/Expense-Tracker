from datetime import datetime, timezone
from typing import Dict, Any, List
import pymongo
from fastapi import APIRouter, Depends

from app.models.analytics import (
    AnalyticsSummaryResponse,
    CategoryAnalyticsItem,
    CategoryAnalyticsResponse,
    MonthlyAnalyticsItem,
    MonthlyAnalyticsResponse,
)
from app.auth.dependencies import get_current_user
from app.database import get_expenses_collection

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/summary", response_model=AnalyticsSummaryResponse)
def get_analytics_summary(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get summary financial metrics for the authenticated user:
    - total expenses
    - current month expenses
    - today's expenses
    - transaction count
    - highest expense
    """
    expenses_col = get_expenses_collection()
    user_id = current_user["id"]
    
    # Calculate current dates in UTC
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    current_month_prefix = now.strftime("%Y-%m")

    # Aggregation for overall totals
    overall_pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$group": {
                "_id": None,
                "total_expenses": {"$sum": "$amount"},
                "transaction_count": {"$sum": 1},
                "highest_expense": {"$max": "$amount"}
            }
        }
    ]
    overall_res = expenses_col.aggregate(overall_pipeline)
    
    if overall_res and len(overall_res) > 0:
        total_expenses = round(float(overall_res[0].get("total_expenses", 0)), 2)
        transaction_count = int(overall_res[0].get("transaction_count", 0))
        highest_expense = round(float(overall_res[0].get("highest_expense", 0)), 2)
    else:
        total_expenses = 0.0
        transaction_count = 0
        highest_expense = 0.0

    # Current month expenses
    month_pipeline = [
        {
            "$match": {
                "user_id": user_id,
                "date": {"$regex": f"^{current_month_prefix}"}
            }
        },
        {
            "$group": {
                "_id": None,
                "month_total": {"$sum": "$amount"}
            }
        }
    ]
    month_res = expenses_col.aggregate(month_pipeline)
    current_month_expenses = (
        round(float(month_res[0].get("month_total", 0)), 2)
        if month_res and len(month_res) > 0 else 0.0
    )

    # Today's expenses
    today_pipeline = [
        {
            "$match": {
                "user_id": user_id,
                "date": today_str
            }
        },
        {
            "$group": {
                "_id": None,
                "today_total": {"$sum": "$amount"}
            }
        }
    ]
    today_res = expenses_col.aggregate(today_pipeline)
    today_expenses = (
        round(float(today_res[0].get("today_total", 0)), 2)
        if today_res and len(today_res) > 0 else 0.0
    )

    return AnalyticsSummaryResponse(
        total_expenses=total_expenses,
        current_month_expenses=current_month_expenses,
        today_expenses=today_expenses,
        transaction_count=transaction_count,
        highest_expense=highest_expense
    )


@router.get("/category", response_model=CategoryAnalyticsResponse)
def get_category_analytics(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get spending distribution grouped by category for the authenticated user.
    Includes category name, amount, transaction count, and percentage of total.
    """
    expenses_col = get_expenses_collection()
    user_id = current_user["id"]

    pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$group": {
                "_id": "$category",
                "amount": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"amount": pymongo.DESCENDING}}
    ]
    results = expenses_col.aggregate(pipeline)

    total_expenses = sum(float(item.get("amount", 0)) for item in results)

    categories: List[CategoryAnalyticsItem] = []
    for item in results:
        cat_amount = round(float(item.get("amount", 0)), 2)
        count = int(item.get("count", 0))
        pct = round((cat_amount / total_expenses) * 100, 1) if total_expenses > 0 else 0.0
        categories.append(
            CategoryAnalyticsItem(
                category=str(item.get("_id", "Other")),
                amount=cat_amount,
                count=count,
                percentage=pct
            )
        )

    return CategoryAnalyticsResponse(
        categories=categories,
        total_expenses=round(total_expenses, 2)
    )


@router.get("/monthly", response_model=MonthlyAnalyticsResponse)
def get_monthly_analytics(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get monthly spending trend for the authenticated user.
    Groups expenses by YYYY-MM and sorts chronologically.
    """
    expenses_col = get_expenses_collection()
    user_id = current_user["id"]

    pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$group": {
                "_id": {"$substr": ["$date", 0, 7]},
                "amount": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": pymongo.ASCENDING}}
    ]
    results = expenses_col.aggregate(pipeline)

    total_expenses = 0.0
    months: List[MonthlyAnalyticsItem] = []
    for item in results:
        month_str = str(item.get("_id", ""))
        amount = round(float(item.get("amount", 0)), 2)
        count = int(item.get("count", 0))
        total_expenses += amount
        months.append(
            MonthlyAnalyticsItem(
                month=month_str,
                amount=amount,
                count=count
            )
        )

    return MonthlyAnalyticsResponse(
        months=months,
        total_expenses=round(total_expenses, 2)
    )
