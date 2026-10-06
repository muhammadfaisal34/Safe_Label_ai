from typing import Any
from fastapi import APIRouter, File, HTTPException, UploadFile

from ..core.config import settings
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
async def analyze(request: AnalyzeRequest) -> dict:
    return {**analyze_text(request.text, request.profile), "lang": request.lang}
