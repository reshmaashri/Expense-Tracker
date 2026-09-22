import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_expense_crud_workflow():
    ts = int(time.time() * 1000)
    
    print("--- 1. Setting up Test Users (User A and User B) ---")
    user_a_email = f"user_a_{ts}@example.com"
    user_b_email = f"user_b_{ts}@example.com"
    
    # Register User A
    res_a = client.post("/api/auth/register", json={
        "name": "User A",
        "email": user_a_email,
        "password": "Password123!"
    })
    assert res_a.status_code == 201
    
    # Login User A
    login_a = client.post("/api/auth/login", json={"email": user_a_email, "password": "Password123!"})
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    
    # Register & Login User B
    client.post("/api/auth/register", json={
        "name": "User B",
        "email": user_b_email,
        "password": "Password123!"
    })
    login_b = client.post("/api/auth/login", json={"email": user_b_email, "password": "Password123!"})
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    print("[OK] Test users registered and authenticated.")

    print("\n--- 2. Testing Expense Validation Constraints ---")
    # Amount <= 0
    res = client.post("/api/expenses", headers=headers_a, json={
        "amount": 0,
        "category": "Food",
        "description": "Free food",
        "date": "2026-09-14",
        "payment_method": "Cash"
    })
    assert res.status_code == 422, f"Expected 422 for amount=0, got {res.status_code}"
    
    res = client.post("/api/expenses", headers=headers_a, json={
        "amount": -50.0,
        "category": "Food",
        "description": "Negative amount",
        "date": "2026-09-14",
        "payment_method": "Cash"
    })
    assert res.status_code == 422, f"Expected 422 for amount < 0, got {res.status_code}"

    # Invalid Category
    res = client.post("/api/expenses", headers=headers_a, json={
        "amount": 100,
        "category": "Spaceship",
        "description": "Invalid category",
        "date": "2026-09-14",
        "payment_method": "Cash"
    })
    assert res.status_code == 422, f"Expected 422 for invalid category, got {res.status_code}"

    # Invalid Date format (e.g. DD/MM/YYYY instead of YYYY-MM-DD)
    res = client.post("/api/expenses", headers=headers_a, json={
        "amount": 100,
        "category": "Food",
        "description": "Invalid date format",
        "date": "14-09-2026",
        "payment_method": "Cash"
    })
    assert res.status_code == 422, f"Expected 422 for invalid date, got {res.status_code}"

    # Invalid Payment Method
    res = client.post("/api/expenses", headers=headers_a, json={
        "amount": 100,
        "category": "Food",
        "description": "Invalid payment method",
        "date": "2026-09-14",
        "payment_method": "Crypto"
    })
    assert res.status_code == 422, f"Expected 422 for invalid payment method, got {res.status_code}"
    print("[OK] Input validation strictly enforced (amount > 0, category, date format, payment method).")

    print("\n--- 3. Testing POST /api/expenses (Creation) ---")
    # User A creates expenses
    exp1_payload = {
        "amount": 250.50,
        "category": "Food",
        "description": "Lunch at college canteen",
        "date": "2026-09-14",
        "payment_method": "UPI"
    }
    create_res1 = client.post("/api/expenses", headers=headers_a, json=exp1_payload)
    assert create_res1.status_code == 201
    exp1 = create_res1.json()
    assert exp1["amount"] == 250.50
    assert exp1["category"] == "Food"
    assert exp1["description"] == "Lunch at college canteen"
    assert exp1["date"] == "2026-09-14"
    assert exp1["payment_method"] == "UPI"
    assert "id" in exp1
    assert "created_at" in exp1
    exp1_id = exp1["id"]

    # More expenses for User A
    exp2_res = client.post("/api/expenses", headers=headers_a, json={
        "amount": 120.00,
        "category": "Transport",
        "description": "Metro card recharge",
        "date": "2026-09-13",
        "payment_method": "Debit Card"
    })
    assert exp2_res.status_code == 201
    exp2_id = exp2_res.json()["id"]

    exp3_res = client.post("/api/expenses", headers=headers_a, json={
        "amount": 1500.00,
        "category": "Education",
        "description": "Textbooks and engineering stationary",
        "date": "2026-09-10",
        "payment_method": "Credit Card"
    })
    assert exp3_res.status_code == 201

    exp4_res = client.post("/api/expenses", headers=headers_a, json={
        "amount": 890.00,
        "category": "Shopping",
        "description": "New backpack",
        "date": "2026-08-25",
        "payment_method": "Cash"
    })
    assert exp4_res.status_code == 201

    # User B creates an expense
    exp_b_res = client.post("/api/expenses", headers=headers_b, json={
        "amount": 999.00,
        "category": "Bills",
        "description": "User B mobile bill",
        "date": "2026-09-14",
        "payment_method": "UPI"
    })
    assert exp_b_res.status_code == 201
    exp_b_id = exp_b_res.json()["id"]
    print("[OK] Expenses created successfully for both users.")

    print("\n--- 4. Testing User Ownership Isolation ---")
    # User A lists expenses
    list_a = client.get("/api/expenses", headers=headers_a)
    assert list_a.status_code == 200
    data_a = list_a.json()
    assert data_a["total"] == 4
    for item in data_a["expenses"]:
        assert item["description"] != "User B mobile bill", "Security breach: User A sees User B expense!"

    # User B lists expenses
    list_b = client.get("/api/expenses", headers=headers_b)
    assert list_b.status_code == 200
    data_b = list_b.json()
    assert data_b["total"] == 1
    assert data_b["expenses"][0]["description"] == "User B mobile bill"
    print("[OK] Complete isolation verified: users only access their own records.")

    print("\n--- 5. Testing Filtering, Search, and Pagination ---")
    # Category filter
    food_filter_res = client.get("/api/expenses?category=Food", headers=headers_a)
    assert food_filter_res.status_code == 200
    food_data = food_filter_res.json()
    assert food_data["total"] == 1
    assert food_data["expenses"][0]["category"] == "Food"
    print("[OK] Category filtering verified.")

    # Search filter (case-insensitive substring)
    search_res = client.get("/api/expenses?search=canteen", headers=headers_a)
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["total"] == 1
    assert "canteen" in search_data["expenses"][0]["description"].lower()
    print("[OK] Keyword search across description/category verified.")

    # Date range filter
    date_range_res = client.get("/api/expenses?start_date=2026-09-01&end_date=2026-09-30", headers=headers_a)
    assert date_range_res.status_code == 200
    date_data = date_range_res.json()
    assert date_data["total"] == 3  # Excludes the Aug 25 expense
    print("[OK] Date range filtering verified.")

    # Pagination: page 1, limit 2
    page1_res = client.get("/api/expenses?page=1&limit=2", headers=headers_a)
    assert page1_res.status_code == 200
    p1 = page1_res.json()
    assert len(p1["expenses"]) == 2
    assert p1["total"] == 4
    assert p1["total_pages"] == 2
    assert p1["page"] == 1

    page2_res = client.get("/api/expenses?page=2&limit=2", headers=headers_a)
    assert page2_res.status_code == 200
    p2 = page2_res.json()
    assert len(p2["expenses"]) == 2
    assert p2["page"] == 2
    print("[OK] Pagination verified.")

    # Sorting by amount descending
    sort_amt_res = client.get("/api/expenses?sort_by=amount&sort_order=desc", headers=headers_a)
    assert sort_amt_res.status_code == 200
    sort_data = sort_amt_res.json()
    amounts = [e["amount"] for e in sort_data["expenses"]]
    assert amounts == sorted(amounts, reverse=True)
    print("[OK] Sorting by amount descending verified.")

    print("\n--- 6. Testing GET /api/expenses/{expense_id} ---")
    # User A gets own expense
    get_res = client.get(f"/api/expenses/{exp1_id}", headers=headers_a)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == exp1_id

    # User B attempts to get User A's expense (should return 404)
    get_cross_res = client.get(f"/api/expenses/{exp1_id}", headers=headers_b)
    assert get_cross_res.status_code == 404
    print("[OK] Single expense retrieval and unauthorized access prevention verified.")

    print("\n--- 7. Testing PUT /api/expenses/{expense_id} (Update) ---")
    # User B attempts to update User A's expense
    put_cross = client.put(f"/api/expenses/{exp1_id}", headers=headers_b, json={"amount": 9999})
    assert put_cross.status_code == 404

    # User A updates amount and description
    put_res = client.put(f"/api/expenses/{exp1_id}", headers=headers_a, json={
        "amount": 320.00,
        "description": "Lunch at college canteen with friends"
    })
    assert put_res.status_code == 200
    updated_exp = put_res.json()
    assert updated_exp["amount"] == 320.00
    assert updated_exp["description"] == "Lunch at college canteen with friends"
    assert updated_exp["category"] == "Food" # Preserved unchanged field
    print("[OK] Expense update and authorization isolation verified.")

    print("\n--- 8. Testing DELETE /api/expenses/{expense_id} ---")
    # User B attempts to delete User A's expense
    del_cross = client.delete(f"/api/expenses/{exp1_id}", headers=headers_b)
    assert del_cross.status_code == 404

    # User A deletes expense
    del_res = client.delete(f"/api/expenses/{exp1_id}", headers=headers_a)
    assert del_res.status_code == 200

    # Verify deleted
    get_del = client.get(f"/api/expenses/{exp1_id}", headers=headers_a)
    assert get_del.status_code == 404
    print("[OK] Expense deletion verified.")

    print("\n==================================================")
    print("ALL EXPENSE CRUD TESTS PASSED PERFECTLY!")
    print("==================================================")


if __name__ == "__main__":
    test_expense_crud_workflow()
