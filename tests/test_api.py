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


def test_barcode_product_endpoint_cleans_ingredients():
    from unittest.mock import patch, MagicMock

    fake_off_payload = {
        "status": 1,
        "product": {
            "product_name": "Test Snack",
            "brands": "BrandX",
            "ingredients_text": "INGREDIENTS: Oats (40%), brown sugar, palm oil, salt.\nStore in cool place.\nNet weight: 100g",
            "lang": "en",
        },
    }
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = fake_off_payload
        mock_response.raise_for_status = lambda: None
        mock_get.return_value = mock_response

        response = client.get("/products/123456789")
        assert response.status_code == 200
        data = response.json()
        assert data is not None
        assert "Store in cool" not in data["ingredients_text"]
        assert "Net weight" not in data["ingredients_text"]
        assert "Oats (40%)" in data["ingredients"]
        assert "brown sugar" in data["ingredients"]
        assert "INGREDIENTS:" not in data["ingredients"][0]


def test_barcode_product_prefers_english_ingredients():
    from unittest.mock import patch, MagicMock

    fake_off_payload = {
        "status": 1,
        "product": {
            "product_name": "Nutella",
            "brands": "Ferrero",
            "ingredients_text": "Sucre, huile de palme, noisettes 13%, cacao maigre, lait écrémé en poudre. Sans gluten.",
            "ingredients_text_en": "Sugar, palm oil, hazelnuts 13%, low-fat cocoa, skimmed milk powder.",
            "lang": "fr",
        },
    }
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = fake_off_payload
        mock_response.raise_for_status = lambda: None
        mock_get.return_value = mock_response

        response = client.get("/products/3017620422003")
        assert response.status_code == 200
        data = response.json()
        assert data is not None
        assert "Sucre" not in data["ingredients_text"]
        assert "Sugar" in data["ingredients_text"]
        assert "hazelnuts 13%" in data["ingredients"]
        assert "skimmed milk powder" in data["ingredients"]



