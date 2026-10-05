from io import BytesIO
from pathlib import Path
import shutil

from PIL import Image, UnidentifiedImageError
import pytesseract

if not shutil.which("tesseract"):
    windows_tesseract = Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
    if windows_tesseract.exists():
        pytesseract.pytesseract.tesseract_cmd = str(windows_tesseract)


async def extract_text(file_bytes: bytes) -> dict[str, str]:
    if not file_bytes:
        raise ValueError("The uploaded image is empty")
    try:
        image = Image.open(BytesIO(file_bytes))
        text = pytesseract.image_to_string(image).strip()
    except (UnidentifiedImageError, OSError) as error:
        raise ValueError("The uploaded file is not a readable image") from error
    except pytesseract.TesseractNotFoundError as error:
        raise RuntimeError("Tesseract OCR is not installed on the server") from error
    return {"text": text, "lang": "en"}
