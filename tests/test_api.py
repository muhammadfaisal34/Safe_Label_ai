from fastapi.testclient import TestClient

from app.backend.app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_analyze():
    response = client.post("/scans/analyze", json={"text": "Milk, sugar", "profile": ["milk"]})
    assert response.status_code == 200
    assert response.json()["verdict"] == "danger"


def test_analyze_with_packaging_metadata():
    raw_text = "SNACK BAR\nINGREDIENTS: Wheat flour, sugar, whole milk powder.\nStore in cool place.\nNet Wt 50g"
    response = client.post("/scans/analyze", json={"text": raw_text, "profile": ["milk"]})
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "danger"
    assert "SNACK BAR" not in data["ingredients"]
    assert "Store in cool place." not in data["ingredients"]
    assert "Net Wt 50g" not in data["ingredients"]
    assert "Wheat flour" in data["ingredients"]
    assert "whole milk powder" in data["ingredients"]
    assert "SNACK BAR" not in data["ingredients_text"]

