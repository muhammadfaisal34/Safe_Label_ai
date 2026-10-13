from typing import Any
import jwt
from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from pydantic import BaseModel

from ..core.config import settings
from ..core.database import record_scan
from ..core.security import ALGORITHM
from ..schemas.scans import AnalyzeRequest, AnalyzeResponse, OcrResponse
from ..services.nlp_service import analyze_text
from ..services.ocr_service import extract_text

router = APIRouter(prefix="/scans", tags=["scans"])


@router.post("/ocr", response_model=OcrResponse)
async def ocr(file: UploadFile = File(...)) -> Any:
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Only image uploads are supported")
    file_bytes = await file.read(settings.max_upload_bytes + 1)
    if len(file_bytes) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Image exceeds the upload limit")
    try:
        return await extract_text(file_bytes)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: AnalyzeRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    analysis = analyze_text(request.text, request.profile)

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
