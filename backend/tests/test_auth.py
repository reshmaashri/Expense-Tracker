import sys
import os
import time
from datetime import timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app
from app.auth.security import create_access_token

client = TestClient(app)


def test_authentication_workflow():
    print("--- 1. Testing User Registration ---")
    timestamp = int(time.time() * 1000)
    test_email = f"student_{timestamp}@example.com"
    test_password = "StrongPassword123!"
    
    reg_payload = {
        "name": "Student Tester",
        "email": test_email,
        "password": test_password
    }
    
    res = client.post("/api/auth/register", json=reg_payload)
    print(f"Registration Status: {res.status_code}")
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    user_data = res.json()
    assert user_data["email"] == test_email.lower()
    assert user_data["name"] == "Student Tester"
    assert "id" in user_data
    assert "created_at" in user_data
    # CRITICAL: Verify password_hash is NEVER exposed
    assert "password_hash" not in user_data, "Security alert: password_hash was leaked in response!"
    assert "password" not in user_data
    print("[OK] Registration succeeded and credentials are secure (no hash leak).")

    print("\n--- 2. Testing Duplicate Email Registration Prevention ---")
    dup_res = client.post("/api/auth/register", json=reg_payload)
    print(f"Duplicate Email Status: {dup_res.status_code}")
    assert dup_res.status_code == 400, f"Expected 400, got {dup_res.status_code}: {dup_res.text}"
    assert "already registered" in dup_res.json()["detail"].lower()
    print("[OK] Duplicate email registration was properly blocked with 400 Bad Request.")

    print("\n--- 3. Testing Input Validation ---")
    # Invalid email
    invalid_email_res = client.post("/api/auth/register", json={
        "name": "Invalid Email",
        "email": "not-an-email",
        "password": "ValidPassword123"
    })
    assert invalid_email_res.status_code == 422, f"Expected 422, got {invalid_email_res.status_code}"
    
    # Password too short (< 6 chars)
    short_pwd_res = client.post("/api/auth/register", json={
        "name": "Short Pwd",
        "email": "short@example.com",
        "password": "123"
    })
    assert short_pwd_res.status_code == 422, f"Expected 422, got {short_pwd_res.status_code}"
    print("[OK] Validation constraints (email format and min password length) enforced with 422.")

    print("\n--- 4. Testing Login Endpoint ---")
    # Wrong password
    wrong_pwd_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "WrongPassword!"
    })
    assert wrong_pwd_res.status_code == 401, f"Expected 401, got {wrong_pwd_res.status_code}"
    print("[OK] Incorrect password rejected with 401 Unauthorized.")

    # Wrong email
    wrong_email_res = client.post("/api/auth/login", json={
        "email": "nonexistent@example.com",
        "password": test_password
    })
    assert wrong_email_res.status_code == 401, f"Expected 401, got {wrong_email_res.status_code}"
    print("[OK] Nonexistent email rejected with 401 Unauthorized.")

    # Successful login
    login_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    assert login_res.status_code == 200, f"Expected 200, got {login_res.status_code}"
    login_data = login_res.json()
    assert "access_token" in login_data
    assert login_data["token_type"].lower() == "bearer"
    assert login_data["user"]["email"] == test_email.lower()
    token = login_data["access_token"]
    print(f"[OK] Successful login returned valid JWT token (length: {len(token)}).")

    print("\n--- 5. Testing Protected /api/auth/me Endpoint ---")
    # Unauthenticated call
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code == 401, f"Expected 401, got {unauth_res.status_code}"
    print("[OK] Protected route blocked unauthenticated request with 401.")

    # Invalid token call
    invalid_token_res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.value"})
    assert invalid_token_res.status_code == 401, f"Expected 401, got {invalid_token_res.status_code}"
    print("[OK] Tampered/invalid token rejected with 401.")

    # Expired token call
    expired_token = create_access_token(
        {"sub": user_data["id"], "email": test_email},
        expires_delta=timedelta(seconds=-10) # Expired 10 seconds ago
    )
    expired_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert expired_res.status_code == 401, f"Expected 401, got {expired_res.status_code}"
    assert "expired" in expired_res.json()["detail"].lower()
    print("[OK] Expired JWT token recognized and rejected with 401 'Session has expired'.")

    # Valid token call
    valid_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert valid_res.status_code == 200, f"Expected 200, got {valid_res.status_code}"
    me_data = valid_res.json()
    assert me_data["id"] == user_data["id"]
    assert me_data["email"] == test_email.lower()
    assert me_data["name"] == "Student Tester"
    assert "password_hash" not in me_data
    print("[OK] Authenticated /api/auth/me returned correct user profile.")

    print("\n==================================================")
    print("ALL AUTHENTICATION TESTS PASSED PERFECTLY!")
    print("==================================================")


if __name__ == "__main__":
    test_authentication_workflow()
