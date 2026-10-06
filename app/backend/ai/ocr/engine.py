import os
import shutil
import pytesseract

TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
]


def init_tesseract() -> bool:
    if shutil.which("tesseract"):
        return True
    for path in TESSERACT_PATHS:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            return True
    return False


init_tesseract()

_engines = {}


def get_engine(lang: str = "en"):
    """Create and return configured OCR engine configuration."""
    if "type" not in _engines:
        try:
            from paddleocr import PaddleOCR
            _engines["paddle"] = PaddleOCR(
                lang=lang,
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
                enable_mkldnn=False,
            )
            _engines["type"] = "paddle"
        except ImportError:
            _engines["type"] = "tesseract"
    return _engines