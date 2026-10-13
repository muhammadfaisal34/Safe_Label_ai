import asyncio

from app.backend.ai.ocr.extractor import (
    extract_ingredients_from_ocr,
    extract_ingredients_text,
    split_into_ingredients,
)
from app.backend.app.services.ocr_service import extract_text


def test_empty_ocr_upload_is_rejected():
    try:
        asyncio.run(extract_text(b""))
    except ValueError:
        return
    raise AssertionError("empty OCR uploads must be rejected")


def test_extract_ingredients_strips_packaging_metadata():
    raw_ocr_text = """DELICIOUS SNACK BAR
The ultimate energy booster!
Net Wt: 50g (1.76 oz)
INGREDIENTS: Whole wheat flour, cane sugar, cocoa butter, whole milk powder, soy lecithin, sea salt.
MAY CONTAIN: Peanuts, tree nuts.
STORE IN A COOL, DRY PLACE.
MANUFACTURED BY: Sweet Snacks Inc, Hershey PA.
NUTRITION FACTS: Per bar (50g) Calories 220, Fat 9g ...
"""
    extracted = extract_ingredients_text(raw_ocr_text)
    assert "DELICIOUS SNACK BAR" not in extracted
    assert "Net Wt" not in extracted
    assert "STORE IN A COOL" not in extracted
    assert "NUTRITION FACTS" not in extracted
    assert "MANUFACTURED BY" not in extracted
    assert "Whole wheat flour" in extracted
    assert "soy lecithin" in extracted
    assert "Peanuts" in extracted

    ingredients = split_into_ingredients(extracted)
    assert "Whole wheat flour" in ingredients
    assert "cane sugar" in ingredients
    assert "cocoa butter" in ingredients
    assert "soy lecithin" in ingredients


def test_multilingual_and_parentheses_ingredients():
    german_label = """CRUNCHY BISCUITS
Zutaten: Weizenmehl (65%), Palmöl, Zucker, Glukosesirup, Emulgator (Sojalecithin, E471), Backtriebmittel (E500). Kann Spuren von Milch enthalten.
Mindestens haltbar bis: 12.2027
Hergestellt in Deutschland
"""
    extracted = extract_ingredients_text(german_label)
    assert "CRUNCHY BISCUITS" not in extracted
    assert "Hergestellt in Deutschland" not in extracted
    assert "Mindestens haltbar" not in extracted
    assert "Weizenmehl (65%)" in extracted

    ingredients = split_into_ingredients(extracted)
    assert "Weizenmehl (65%)" in ingredients
    assert "Emulgator (Sojalecithin, E471)" in ingredients


def test_extract_ingredients_from_ocr_lines():
    lines = [
        {"text": "BRAND NAME", "confidence": 0.99},
        {"text": "INGREDIENTS: Oats, honey, almonds, cinnamon.", "confidence": 0.95},
        {"text": "Contains: Tree nuts.", "confidence": 0.92},
        {"text": "Best Before: 2026", "confidence": 0.98},
    ]
    raw_text = "\n".join(l["text"] for l in lines)
    result = extract_ingredients_from_ocr(lines, raw_text, "en")

    assert "BRAND NAME" not in result["text"]
    assert "Best Before" not in result["text"]
    assert "Oats" in result["text"]
    assert len(result["ingredients"]) >= 3
    assert result["ingredients"][0] == "Oats"

