from fastapi import APIRouter, File, Form, HTTPException, UploadFile

try:
    from app.backend.ai.ner import extract_entities, merge_results
    from app.backend.ai.ocr import extract_text
    from app.backend.ai.translation import to_english
except (ModuleNotFoundError, ImportError):
    from ai.ner import extract_entities, merge_results
    from ai.ocr import extract_text
    from ai.translation import to_english



MAX_UPLOAD_BYTES = 8 * 1024 * 1024

router = APIRouter()


@router.post("/scan")
async def scan(image: UploadFile = File(...), lang: str = Form("en")):
    data = await image.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Image too large")

    try:
        ocr = await extract_text(data, lang)
    except ValueError as error:
        raise HTTPException(400, str(error))

    tr = await to_english(ocr["text"])
    entities = merge_results(
        extract_entities(tr["text"]),
        extract_entities(tr["original"]),
    )

    warnings = []
    if ocr["low_confidence"]:
        warnings.append("low_ocr_confidence")
    if tr["error"]:
        warnings.append(tr["error"])

    try:
        from ..core.database import record_scan
        detected = [e["allergen"] for e in entities if e.get("allergen")]
        verdict = "danger" if detected else "safe"
        record_scan(
            product_name="Scanned Label",
            extracted_text=ocr.get("text", ""),
            language=lang,
            source="ocr",
            verdict=verdict,
            detected_allergens=detected,
        )
    except Exception:
        pass

    return {"ocr": ocr, "translation": tr, "entities": entities, "warnings": warnings}