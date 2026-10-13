import asyncio
import sys
from pathlib import Path
_root = Path(__file__).resolve().parents[2]
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from app.backend.ai.ocr import extract_text

if __name__ == "__main__":
    try:
        with open("label.jpg", "rb") as f:
            out = asyncio.run(extract_text(f.read(), "en"))
        print(out["text"])
        print(out["avg_confidence"], out["low_confidence"])
    except FileNotFoundError:
        print("label.jpg not found for OCR test.")