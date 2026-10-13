import time
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

try:
    from app.backend.ai.ner import extract_entities, merge_results
    from app.backend.ai.ocr import extract_text
    from app.backend.ai.translation import to_english
except (ModuleNotFoundError, ImportError):
    from ai.ner import extract_entities, merge_results
    from ai.ocr import extract_text
    from ai.translation import to_english

try:
    from app.backend.app.core.terminal_timer import (
        log_banner,
        log_pipeline_finish,
        log_step_done,
        log_step_fail,
        log_step_start,
    )
except (ModuleNotFoundError, ImportError):
    from ..core.terminal_timer import (
        log_banner,
        log_pipeline_finish,
        log_step_done,
        log_step_fail,
        log_step_start,
    )


MAX_UPLOAD_BYTES = 8 * 1024 * 1024

router = APIRouter()


@router.post("/scan")
async def scan(image: UploadFile = File(...), lang: str = Form("en")):
    data = await image.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Image too large")

    size_kb = len(data) / 1024.0
    filename = image.filename or "image.jpg"
    log_banner("Unified Photo Scan (OCR + NER)", f"File: {filename} ({size_kb:.1f} KB) | Target Lang: '{lang}'")
    total_start = time.perf_counter()

    try:
        t0 = time.perf_counter()
        log_step_start("OCR", "Extracting text from image...")
        ocr = await extract_text(data, lang)
        t_ocr = time.perf_counter() - t0
        log_step_done("OCR", t_ocr, f"Extracted {len(ocr.get('text', ''))} chars | Conf: {ocr.get('avg_confidence', 0):.1%}")
    except ValueError as error:
        log_step_fail("OCR", time.perf_counter() - total_start, str(error))
        raise HTTPException(400, str(error))

    t0 = time.perf_counter()
    log_step_start("TRANSLATION", "Checking language / translating to English if needed...")
    tr = await to_english(ocr["text"])
    t_tr = time.perf_counter() - t0
    log_step_done("TRANSLATION", t_tr, f"Source Lang: {tr.get('source_lang', 'en')} | Translated: {tr.get('translated', False)}")

    t0 = time.perf_counter()
    log_step_start("NER", "Extracting allergens and E-numbers with spaCy...")
    entities = merge_results(
        extract_entities(tr["text"]),
        extract_entities(tr["original"]),
    )
    t_ner = time.perf_counter() - t0
    allergen_cats = [a["category"] for a in entities.get("allergens", [])]
    log_step_done("NER", t_ner, f"Allergens: {allergen_cats} | E-numbers: {entities.get('e_numbers', [])}")

    warnings = []
    if ocr["low_confidence"]:
        warnings.append("low_ocr_confidence")
    if tr["error"]:
        warnings.append(tr["error"])

    detected = [e["category"] for e in entities.get("allergens", []) if e.get("category")]
    verdict = "danger" if detected else "safe"

    try:
        from ..core.database import record_scan
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

    total_elapsed = time.perf_counter() - total_start
    log_pipeline_finish(
        total_elapsed,
        summary=f"Verdict: {verdict.upper()} | Allergens: {detected} | OCR: {t_ocr:.2f}s | NER: {t_ner:.2f}s",
    )

    return {"ocr": ocr, "translation": tr, "entities": entities, "warnings": warnings}