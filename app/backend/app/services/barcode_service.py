import httpx

try:
    from app.backend.ai.ocr.extractor import extract_ingredients_text, extract_english_portion, split_into_ingredients
    from app.backend.ai.translation.detect import is_english
    from app.backend.ai.translation.service import to_english
except (ModuleNotFoundError, ImportError):
    try:
        from ...ai.ocr.extractor import extract_ingredients_text, extract_english_portion, split_into_ingredients
        from ...ai.translation.detect import is_english
        from ...ai.translation.service import to_english
    except (ModuleNotFoundError, ImportError):
        from ai.ocr.extractor import extract_ingredients_text, extract_english_portion, split_into_ingredients
        from ai.translation.detect import is_english
        from ai.translation.service import to_english


async def lookup_barcode(code: str) -> dict | None:
    url = f"https://world.openfoodfacts.org/api/v2/product/{code}.json"
    fields = "product_name,brands,image_front_small_url,ingredients_text,ingredients_text_en,lang"
    headers = {"User-Agent": "SafeLabelAI/1.0 (https://github.com/safelabel-ai)"}
    async with httpx.AsyncClient(timeout=10, headers=headers) as client:
        response = await client.get(url, params={"fields": fields})
        response.raise_for_status()
    payload = response.json()
    if payload.get("status") != 1:
        return None
    product = payload.get("product", {})
    product_name = product.get("product_name") or ""

    # Prefer explicit English ingredients text if available
    raw_ing = product.get("ingredients_text_en")
    if not raw_ing or not str(raw_ing).strip():
        raw_ing = product.get("ingredients_text")
    if not raw_ing:
        return None

    # Check for bilingual content: if English exists, use English ONLY
    english_portion = extract_english_portion(raw_ing, product_name)
    if english_portion:
        clean_ing = extract_ingredients_text(english_portion) or english_portion.strip()
    else:
        # No English found: use translation to English
        clean_ing = extract_ingredients_text(raw_ing) or raw_ing.strip()
        try:
            tr = await to_english(clean_ing)
            if tr.get("text"):
                clean_ing = extract_ingredients_text(tr["text"]) or tr["text"].strip()
        except Exception:
            pass

    product["raw_ingredients_text"] = clean_ing
    product["ingredients_text"] = clean_ing
    product["ingredients"] = split_into_ingredients(clean_ing)
    product["lang"] = "en"
    return product


