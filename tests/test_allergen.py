from app.backend.app.services.nlp_service import analyze_text


def test_detects_profile_allergen():
    result = analyze_text("Wheat flour, peanuts, sugar", ["peanut"])
    assert result["verdict"] == "danger"
    assert result["mine"][0]["allergen"] == "peanut"
    assert result["entities"][0]["label"] == "ALLERGEN"
