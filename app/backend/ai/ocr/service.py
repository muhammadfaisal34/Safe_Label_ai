from fastapi.concurrency import run_in_threadpool
import numpy as np
from PIL import Image, UnidentifiedImageError
import pytesseract

try:
    from app.backend.ai.translation.detect import detect_language
except (ModuleNotFoundError, ImportError):
    from ..translation.detect import detect_language

from .engine import get_engine
from .preprocess import bytes_to_pil_image, pil_to_bgr_array

LOW_CONFIDENCE_THRESHOLD = 0.60


def _recognize(img: Image.Image, lang: str) -> dict:
    engines = get_engine(lang)
    lines = []

    if engines.get("type") == "paddle":
        arr = pil_to_bgr_array(img)
        paddle_engine = engines["paddle"]
        try:
            result = paddle_engine.predict(arr) if hasattr(paddle_engine, "predict") else paddle_engine.ocr(arr)
        except Exception:
            try:
                result = paddle_engine.ocr(arr)
            except Exception:
                result = None

        if result:
            for page in result:
                if isinstance(page, dict):
                    rec_texts = page.get("rec_texts", [])
                    rec_scores = page.get("rec_scores", [])
                    for text, score in zip(rec_texts, rec_scores):
                        if text and str(text).strip():
                            lines.append({"text": str(text).strip(), "confidence": round(float(score), 3)})
                elif isinstance(page, list):
                    for line_box in page:
                        if line_box and len(line_box) >= 2 and isinstance(line_box[1], (list, tuple)):
                            text, score = line_box[1][0], line_box[1][1]
                            if text and str(text).strip():
                                lines.append({"text": str(text).strip(), "confidence": round(float(score), 3)})
    
    # Fallback to Tesseract if Paddle returned no lines or is not used
    if not lines:
        try:
            tess_lang = "eng" if lang in ["en", ""] else lang
            data = pytesseract.image_to_data(img, lang=tess_lang, output_type=pytesseract.Output.DICT)
            n_boxes = len(data.get("text", []))
            line_dict = {}
            for i in range(n_boxes):
                text = str(data["text"][i]).strip()
                conf = float(data["conf"][i])
                if text and conf > 0:
                    line_num = data["line_num"][i]
                    block_num = data["block_num"][i]
                    key = (block_num, line_num)
                    line_dict.setdefault(key, []).append((text, conf))

            for (block, line), words in line_dict.items():
                line_text = " ".join(w[0] for w in words)
                avg_conf = sum(w[1] for w in words) / len(words) / 100.0
                lines.append({"text": line_text, "confidence": round(avg_conf, 3)})
        except Exception:
            raw_text = pytesseract.image_to_string(img)
            for line in raw_text.splitlines():
                if line.strip():
                    lines.append({"text": line.strip(), "confidence": 0.85})

    extracted_text = "\n".join(l["text"] for l in lines)
    detected_lang = detect_language(extracted_text) if extracted_text else lang

    avg = sum(l["confidence"] for l in lines) / len(lines) if lines else 0.0
    return {
        "text": extracted_text,
        "lang": detected_lang,
        "lines": lines,
        "avg_confidence": round(avg, 3),
        "low_confidence": avg < LOW_CONFIDENCE_THRESHOLD or not lines,
    }


async def extract_text(file_bytes: bytes, lang: str = "en") -> dict:
    if not file_bytes:
        raise ValueError("The uploaded image is empty")
    try:
        img = await run_in_threadpool(bytes_to_pil_image, file_bytes)
    except (UnidentifiedImageError, OSError) as error:
        raise ValueError("The uploaded file is not a readable image") from error
    return await run_in_threadpool(_recognize, img, lang)