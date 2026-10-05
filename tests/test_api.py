from fastapi.testclient import TestClient

from app.backend.app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_analyze():
    response = client.post("/scans/analyze", json={"text": "Milk, sugar", "profile": ["milk"]})
    assert response.status_code == 200
    assert response.json()["verdict"] == "danger"
