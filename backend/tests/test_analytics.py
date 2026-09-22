import sys
import os
import time
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_analytics_workflow():
    ts = int(time.time() * 1000)
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    current_month_prefix = now.strftime("%Y-%m")
    
    print("--- 1. Setting up Test Users for Analytics ---")
    user_x_email = f"analytics_x_{ts}@example.com"
    user_y_email = f"analytics_y_{ts}@example.com"
    user_z_email = f"analytics_empty_{ts}@example.com"

    # User X
    client.post("/api/auth/register", json={"name": "Analytics User X", "email": user_x_email, "password": "Password123!"})
    login_x = client.post("/api/auth/login", json={"email": user_x_email, "password": "Password123!"})
    headers_x = {"Authorization": f"Bearer {login_x.json()['access_token']}"}

    # User Y (for cross-user isolation verification)
    client.post("/api/auth/register", json={"name": "Analytics User Y", "email": user_y_email, "password": "Password123!"})
    login_y = client.post("/api/auth/login", json={"email": user_y_email, "password": "Password123!"})
    headers_y = {"Authorization": f"Bearer {login_y.json()['access_token']}"}

    # User Z (empty account for zero-state verification)
    client.post("/api/auth/register", json={"name": "Analytics User Z", "email": user_z_email, "password": "Password123!"})
    login_z = client.post("/api/auth/login", json={"email": user_z_email, "password": "Password123!"})
    headers_z = {"Authorization": f"Bearer {login_z.json()['access_token']}"}
    print("[OK] Test users registered.")

    print("\n--- 2. Populating Real Multi-Month Expense Dataset ---")
    # User X Expenses:
    # Today
    client.post("/api/expenses", headers=headers_x, json={
        "amount": 300.00, "category": "Food", "description": "Breakfast with team",
        "date": today_str, "payment_method": "UPI"
    })
    client.post("/api/expenses", headers=headers_x, json={
        "amount": 150.00, "category": "Transport", "description": "Uber cab to college",
        "date": today_str, "payment_method": "Cash"
    })
    # Current month earlier
    client.post("/api/expenses", headers=headers_x, json={
        "amount": 1200.00, "category": "Education", "description": "Cloud course certification",
        "date": f"{current_month_prefix}-05", "payment_method": "Credit Card"
    })
    client.post("/api/expenses", headers=headers_x, json={
        "amount": 650.00, "category": "Bills", "description": "Electricity bill",
        "date": f"{current_month_prefix}-02", "payment_method": "UPI"
    })
    # Prior month (2026-08)
    client.post("/api/expenses", headers=headers_x, json={
        "amount": 1800.00, "category": "Shopping", "description": "Sneakers",
        "date": "2026-08-20", "payment_method": "Debit Card"
    })
    client.post("/api/expenses", headers=headers_x, json={
        "amount": 400.00, "category": "Food", "description": "Dinner outing",
        "date": "2026-08-10", "payment_method": "UPI"
    })
    # Two months prior (2026-07)
    client.post("/api/expenses", headers=headers_x, json={
        "amount": 750.00, "category": "Health", "description": "Medical checkup and vitamins",
        "date": "2026-07-15", "payment_method": "Bank Transfer"
    })

    # User Y Expense (Isolated)
    client.post("/api/expenses", headers=headers_y, json={
        "amount": 5000.00, "category": "Entertainment", "description": "VIP Concert Ticket",
        "date": today_str, "payment_method": "Credit Card"
    })
    print("[OK] Real expenses populated across multiple categories and months.")

    print("\n--- 3. Testing GET /api/analytics/summary ---")
    # Unauthenticated
    unauth_res = client.get("/api/analytics/summary")
    assert unauth_res.status_code == 401

    # User X Summary
    sum_res = client.get("/api/analytics/summary", headers=headers_x)
    assert sum_res.status_code == 200
    summary = sum_res.json()
    print(f"User X Summary: {summary}")

    # Expected:
    # total = 300 + 150 + 1200 + 650 + 1800 + 400 + 750 = 5250.00
    # count = 7
    # highest = 1800.00
    # today = 300 + 150 = 450.00
    # current_month = 300 + 150 + 1200 + 650 = 2300.00
    assert summary["total_expenses"] == 5250.00
    assert summary["transaction_count"] == 7
    assert summary["highest_expense"] == 1800.00
    assert summary["today_expenses"] == 450.00
    assert summary["current_month_expenses"] == 2300.00
    print("[OK] Summary metrics match exact aggregation calculations.")

    # User Y Summary (Ownership isolation check)
    sum_y = client.get("/api/analytics/summary", headers=headers_y).json()
    assert sum_y["total_expenses"] == 5000.00
    assert sum_y["transaction_count"] == 1
    assert sum_y["highest_expense"] == 5000.00
    print("[OK] Summary metrics strictly isolated between users.")

    print("\n--- 4. Testing GET /api/analytics/category ---")
    cat_res = client.get("/api/analytics/category", headers=headers_x)
    assert cat_res.status_code == 200
    cat_data = cat_res.json()
    print(f"User X Categories: {cat_data}")

    assert cat_data["total_expenses"] == 5250.00
    categories = cat_data["categories"]
    assert len(categories) == 6  # Shopping, Education, Health, Food, Bills, Transport

    # Verify descending sort by amount
    amounts = [c["amount"] for c in categories]
    assert amounts == sorted(amounts, reverse=True)
    assert categories[0]["category"] == "Shopping"
    assert categories[0]["amount"] == 1800.00
    assert categories[0]["percentage"] == round((1800.0 / 5250.0) * 100, 1)

    # Verify User Y's category "Entertainment" is NOT in User X's report
    cat_names = [c["category"] for c in categories]
    assert "Entertainment" not in cat_names
    print("[OK] Category aggregation, percentage distribution, and sorting verified.")

    print("\n--- 5. Testing GET /api/analytics/monthly ---")
    month_res = client.get("/api/analytics/monthly", headers=headers_x)
    assert month_res.status_code == 200
    month_data = month_res.json()
    print(f"User X Monthly: {month_data}")

    assert month_data["total_expenses"] == 5250.00
    months = month_data["months"]
    month_keys = [m["month"] for m in months]
    assert month_keys == sorted(month_keys) # Chronological sort
    assert "2026-07" in month_keys
    assert "2026-08" in month_keys
    assert current_month_prefix in month_keys

    # Sum of monthly amounts matches total expenses
    assert round(sum(m["amount"] for m in months), 2) == 5250.00
    print("[OK] Monthly spending trends and chronological sorting verified.")

    print("\n--- 6. Testing Zero-State / Empty User Analytics ---")
    empty_sum = client.get("/api/analytics/summary", headers=headers_z).json()
    assert empty_sum["total_expenses"] == 0.0
    assert empty_sum["transaction_count"] == 0
    assert empty_sum["highest_expense"] == 0.0
    assert empty_sum["today_expenses"] == 0.0
    assert empty_sum["current_month_expenses"] == 0.0

    empty_cat = client.get("/api/analytics/category", headers=headers_z).json()
    assert empty_cat["categories"] == []
    assert empty_cat["total_expenses"] == 0.0

    empty_mon = client.get("/api/analytics/monthly", headers=headers_z).json()
    assert empty_mon["months"] == []
    assert empty_mon["total_expenses"] == 0.0
    print("[OK] Zero-state handles empty accounts gracefully without errors.")

    print("\n==================================================")
    print("ALL ANALYTICS TESTS PASSED PERFECTLY!")
    print("==================================================")


if __name__ == "__main__":
    test_analytics_workflow()
