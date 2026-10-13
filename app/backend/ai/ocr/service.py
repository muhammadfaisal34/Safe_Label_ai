import base64
import io
import os
import time
from fastapi.concurrency import run_in_threadpool
import numpy as np
from PIL import Image, UnidentifiedImageError
import pytesseract
import requests

try:
    from app.backend.ai.translation.detect import detect_language
except (ModuleNotFoundError, ImportError):
    from ..translation.detect import detect_language

from .engine import get_engine
from .extractor import extract_ingredients_from_ocr
from .preprocess import bytes_to_pil_image, pil_to_bgr_array
from dotenv import load_dotenv

load_dotenv()

LOW_CONFIDENCE_THRESHOLD = 0.60
PROVIDER = os.getenv("OCR_PROVIDER", "auto").lower()
GOOGLE_VISION_KEY = os.getenv("GOOGLE_VISION_API_KEY", "")


def _ocr_google(img: Image.Image) -> tuple[list[dict], str]:
    """Extract text lines using Google Cloud Vision REST API (Fast, offloaded to cloud)."""
    api_key = os.getenv("GOOGLE_VISION_API_KEY", GOOGLE_VISION_KEY)
    if not api_key:
        raise ValueError("GOOGLE_VISION_API_KEY is not set in environment")

    # Encode PIL Image to JPEG base64
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    b64_content = base64.b64encode(buf.getvalue()).decode("utf-8")

    url = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
    payload = {
        "requests": [
            {
                "image": {"content": b64_content},
                "features": [{"type": "TEXT_DETECTION"}],
            }
        ]
    }

    res = requests.post(url, json=payload, timeout=8)
    if res.status_code != 200:
        raise ValueError(f"Google Vision API request failed ({res.status_code}): {res.text}")

    data = res.json()
    responses = data.get("responses", [{}])[0]
    full_ann = responses.get("fullTextAnnotation")
    text_anns = responses.get("textAnnotations", [])

    if not full_ann and not text_anns:
        return [], "Google Cloud Vision"

    lines = []
    full_text = text_anns[0].get("description", "") if text_anns else full_ann.get("text", "")
    for line in full_text.splitlines():
        clean = line.strip()
        if clean:
            lines.append({"text": clean, "confidence": 0.95})

    return lines, "Google Cloud Vision"


def _ocr_paddle(img: Image.Image, lang: str) -> tuple[list[dict], str]:
    """Local fallback OCR inference using PaddleOCR or Tesseract."""
    engines = get_engine(lang)
    lines = []
    engine_name = "PaddleOCR"

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
        engine_name = "Tesseract (Fallback)"
        print(f"  \033[93m[>>] [OCR ENGINE] Switching to Tesseract fallback...\033[0m", flush=True)
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

    return lines, engine_name


def _ocr_ocrspace(img: Image.Image, lang: str = "en") -> tuple[list[dict], str]:
    """Extract text lines using OCR.space Cloud API (Free, 0% CPU, no billing required)."""
    api_key = os.getenv("OCR_SPACE_API_KEY", "helloworld")

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    buf.seek(0)

    lang_map = {
        "en": "eng", "es": "spa", "fr": "fre", "de": "ger",
        "it": "ita", "ar": "ara", "ur": "urd", "zh": "chs", "ja": "jpn"
    }
    ocr_lang = lang_map.get(lang.lower(), "eng")

    payload = {
        "apikey": api_key,
        "language": ocr_lang,
        "OCREngine": "2",
        "isOverlayRequired": "false",
    }

    files = {"file": ("label.jpg", buf, "image/jpeg")}
    res = requests.post("https://api.ocr.space/parse/image", data=payload, files=files, timeout=15)
    if res.status_code != 200:
        raise ValueError(f"OCR.space request failed ({res.status_code}): {res.text}")

    data = res.json()
    if data.get("IsErroredOnProcessing"):
        error_msg = data.get("ErrorMessage", ["Unknown error"])
        if isinstance(error_msg, list):
            error_msg = error_msg[0]
        raise ValueError(f"OCR.space error: {error_msg}")

    parsed_results = data.get("ParsedResults", [])
    if not parsed_results:
        return [], "OCR.space Cloud"

    parsed_text = parsed_results[0].get("ParsedText", "")
    lines = []
    for line in parsed_text.splitlines():
        clean = line.strip()
        if clean:
            lines.append({"text": clean, "confidence": 0.95})

    return lines, "OCR.space Cloud"


def _recognize(img: Image.Image, lang: str) -> dict:
    t0 = time.perf_counter()
    w, h = img.size
    print(f"  \033[93m[>>] [OCR ENGINE] Starting inference (Image: {w}x{h} px, Lang: '{lang}')...\033[0m", flush=True)

    provider = os.getenv("OCR_PROVIDER", PROVIDER).lower()

    if provider in ("ocrspace", "ocr.space"):
        try:
            lines, engine_name = _ocr_ocrspace(img, lang)
        except Exception as e:
            print(f"  \033[93m[OCR] OCR.space failed ({e}), falling back to local OCR\033[0m", flush=True)
            lines, engine_name = _ocr_paddle(img, lang)
    elif provider == "google":
        try:
            lines, engine_name = _ocr_google(img)
        except Exception as e:
            print(f"  \033[93m[OCR] Google Vision failed ({e}), falling back to local OCR\033[0m", flush=True)
            lines, engine_name = _ocr_paddle(img, lang)
    elif provider == "paddle":
        lines, engine_name = _ocr_paddle(img, lang)
    elif provider == "auto":
        try:
            lines, engine_name = _ocr_ocrspace(img, lang)
        except Exception as e1:
            try:
                lines, engine_name = _ocr_google(img)
            except Exception as e2:
                print(f"  \033[93m[OCR] Cloud APIs failed ({e1} | {e2}), falling back to local OCR\033[0m", flush=True)
                lines, engine_name = _ocr_paddle(img, lang)
    else:
        raise ValueError(f"Unknown OCR_PROVIDER: {provider}")

    extracted_text = "\n".join(l["text"] for l in lines)
    detected_lang = detect_language(extracted_text) if extracted_text else lang

    result = extract_ingredients_from_ocr(lines, extracted_text, lang=detected_lang)
    result["lang"] = detected_lang

    elapsed = time.perf_counter() - t0
    avg_conf = result.get("avg_confidence", 0.0)
    print(
        f"  \033[92m[OK] [OCR ENGINE] Completed in {elapsed:.2f}s | Engine: {engine_name} | Lines: {len(lines)} | Chars: {len(extracted_text)} | Lang: '{detected_lang}' | Conf: {avg_conf:.1%}\033[0m",
        flush=True,
    )
    return result


async def extract_text(file_bytes: bytes, lang: str = "en") -> dict:
    if not file_bytes:
        raise ValueError("The uploaded image is empty")
    t0 = time.perf_counter()
    size_kb = len(file_bytes) / 1024.0
    print(f"  \033[93m[>>] [OCR] Loading & decoding image data ({size_kb:.1f} KB)...\033[0m", flush=True)
    try:
        img = await run_in_threadpool(bytes_to_pil_image, file_bytes)
    except (UnidentifiedImageError, OSError) as error:
        print(f"  \033[91m[X] [OCR] Image decoding failed after {time.perf_counter() - t0:.2f}s: {error}\033[0m", flush=True)
        raise ValueError("The uploaded file is not a readable image") from error
    return await run_in_threadpool(_recognize, img, lang)