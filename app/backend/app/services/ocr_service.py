try:
    from app.backend.ai.ocr.service import extract_text
except (ModuleNotFoundError, ImportError):
    from ai.ocr.service import extract_text

__all__ = ["extract_text"]


