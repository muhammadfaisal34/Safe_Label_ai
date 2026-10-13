from typing import Any
import time
import jwt
from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from pydantic import BaseModel

from ..core.config import settings
from ..core.database import record_scan
from ..core.security import ALGORITHM
from ..core.terminal_timer import (
    log_banner,
    log_pipeline_finish,
    log_step_done,
    log_step_fail,
    log_step_start,
)
from ..schemas.scans import AnalyzeRequest, AnalyzeResponse, OcrResponse
from ..services.nlp_service import analyze_text
from ..services.ocr_service import extract_text
from ..services.translation_service import is_english, to_english

router = APIRouter(prefix="/scans", tags=["scans"])



@router.post("/ocr", response_model=OcrResponse)
async def ocr(file: UploadFile = File(...)) -> Any:
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Only image uploads are supported")
    file_bytes = await file.read(settings.max_upload_bytes + 1)
    if len(file_bytes) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Image exceeds the upload limit")

    size_kb = len(file_bytes) / 1024.0
    filename = file.filename or "photo.jpg"
    log_banner("Image OCR Scan Request", f"File: {filename} ({size_kb:.1f} KB) | MIME: {file.content_type}")
    t_start = time.perf_counter()

    try:
        result = await extract_text(file_bytes)
        elapsed = time.perf_counter() - t_start
        char_count = len(result.get("text", ""))
        lines_count = len(result.get("lines", []))
        avg_conf = result.get("avg_confidence", 0.0)
        detected_lang = result.get("lang", "en")
        log_pipeline_finish(
            elapsed,
            summary=f"Extracted {lines_count} lines ({char_count} chars) | Lang: '{detected_lang}' | Confidence: {avg_conf:.1%}",
        )
        return result
    except RuntimeError as error:
        elapsed = time.perf_counter() - t_start
        log_step_fail("OCR PIPELINE", elapsed, str(error))
        raise HTTPException(status_code=503, detail=str(error)) from error
    except ValueError as error:
        elapsed = time.perf_counter() - t_start
        log_step_fail("OCR PIPELINE", elapsed, str(error))
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: AnalyzeRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    preview = request.text[:50].replace("\n", " ") + ("..." if len(request.text) > 50 else "")
    profile_str = ", ".join(request.profile) if request.profile else "None"
    log_banner("Text Allergen Analysis", f"Input: {len(request.text)} chars | User Allergens: [{profile_str}] | Text: \"{preview}\"")
    t_start = time.perf_counter()

    input_text = request.text
    if not is_english(input_text):
        try:
            tr = await to_english(input_text)
            if tr.get("text"):
                input_text = tr["text"]
        except Exception:
            pass

    analysis = analyze_text(input_text, request.profile)
    elapsed = time.perf_counter() - t_start


    user_id = request.user_id
    user_email = request.user_email
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
            user_id = user_id or payload.get("sub")
            user_email = user_email or payload.get("email")
        except Exception:
            pass

    # Extract detected allergens
    detected_allergens = [
        f["allergen"] for f in analysis.get("findings", []) if f.get("allergen")
    ]
    verdict = analysis.get("verdict", "safe")

    scan_rec = record_scan(
        product_name=request.product_name,
        barcode=request.barcode,
        extracted_text=request.text,
        language=request.lang,
        source=request.source or "ocr",
        verdict=verdict,
        detected_allergens=detected_allergens,
        user_id=user_id,
        user_email=user_email,
    )

    user_matches = [f["allergen"] for f in analysis.get("mine", []) if f.get("allergen")]
    log_pipeline_finish(
        elapsed,
        summary=f"Verdict: {verdict.upper()} | All Allergens: {detected_allergens} | User Profile Matches: {user_matches}",
    )

    return {
        **analysis,
        "lang": request.lang,
        "scan_id": scan_rec.get("id"),
    }


class DirectScanRequest(BaseModel):
    product_name: str | None = None
    barcode: str | None = None
    extracted_text: str = ""
    language: str = "en"
    source: str = "ocr"
    verdict: str = "safe"
    detected_allergens: list[str] = []
    user_id: str | None = None
    user_email: str | None = None


@router.post("", response_model=dict)
def save_scan(
    req: DirectScanRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    user_id = req.user_id
    user_email = req.user_email
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
            user_id = user_id or payload.get("sub")
            user_email = user_email or payload.get("email")
        except Exception:
            pass

    return record_scan(
        product_name=req.product_name,
        barcode=req.barcode,
        extracted_text=req.extracted_text,
        language=req.language,
        source=req.source,
        verdict=req.verdict,
        detected_allergens=req.detected_allergens,
        user_id=user_id,
        user_email=user_email,
    )
