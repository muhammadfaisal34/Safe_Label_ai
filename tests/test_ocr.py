import asyncio

from app.backend.app.services.ocr_service import extract_text


def test_empty_ocr_upload_is_rejected():
    try:
        asyncio.run(extract_text(b""))
    except ValueError:
        return
    raise AssertionError("empty OCR uploads must be rejected")
