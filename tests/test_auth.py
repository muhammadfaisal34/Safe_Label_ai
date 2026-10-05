from fastapi.testclient import TestClient

from app.backend.app.main import app

client = TestClient(app)


def test_auth_requires_bearer_token():
    assert client.get("/users/me").status_code == 401
