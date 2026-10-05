from fastapi.testclient import TestClient

from app.backend.app.main import app

client = TestClient(app)


def test_auth_requires_bearer_token():
    assert client.get("/users/me").status_code == 401


def test_register_email_validation():
    # Invalid email format
    response = client.post(
        "/auth/register",
        json={"email": "invalidemail", "password": "Password123!", "display_name": "Test User"},
    )
    assert response.status_code == 400
    assert "valid email address" in response.json()["detail"]


def test_register_password_validation():
    # Missing special char
    res1 = client.post(
        "/auth/register",
        json={"email": "user@gmail.com", "password": "Password123", "display_name": "Test User"},
    )
    assert res1.status_code == 400
    assert "special character" in res1.json()["detail"]

    # Missing number
    res2 = client.post(
        "/auth/register",
        json={"email": "user@gmail.com", "password": "Password!", "display_name": "Test User"},
    )
    assert res2.status_code == 400
    assert "number" in res2.json()["detail"]

    # Too short
    res3 = client.post(
        "/auth/register",
        json={"email": "user@gmail.com", "password": "P1!", "display_name": "Test User"},
    )
    assert res3.status_code == 400
    assert "at least 8 characters" in res3.json()["detail"]


def test_2fa_signup_and_verify_flow():
    import uuid
    test_email = f"test2fa_{uuid.uuid4().hex[:6]}@gmail.com"
    # 1. Register new user -> requires 2FA
    reg_res = client.post(
        "/auth/register",
        json={"email": test_email, "password": "Password123!", "display_name": "User 2FA"},
    )
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert data["two_factor_required"] is True
    assert data["access_token"] is None

    # Get code from store helper for testing
    from app.backend.app.core.database import _2FA_CODES
    code = _2FA_CODES[test_email]["code"]
    assert len(code) == 6

    # 2. Verify with wrong code -> fails
    bad_res = client.post(
        "/auth/verify-2fa",
        json={"email": test_email, "code": "000000"},
    )
    assert bad_res.status_code == 400

    # 3. Verify with correct code -> success, access token issued
    good_res = client.post(
        "/auth/verify-2fa",
        json={"email": test_email, "code": code},
    )
    assert good_res.status_code == 200
    token_data = good_res.json()
    assert token_data["access_token"] is not None

    # 4. Fetch /users/me using access token
    user_res = client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {token_data['access_token']}"},
    )
    assert user_res.status_code == 200
    assert user_res.json()["email"] == test_email


