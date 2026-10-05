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

