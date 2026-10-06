from fastapi.concurrency import run_in_threadpool

from .client import get_translator
from .detect import is_english


def _translate(text: str):
    # No source_lang, so DeepL auto-detects any supported language.
    return get_translator().translate_text(
        text, target_lang="EN-US", preserve_formatting=True
    )


async def to_english(text: str) -> dict:
    original = text
    clean = text.strip()
    base = {"original": original, "text": clean, "source_lang": None,
            "translated": False, "error": None}

    if not clean:
        return base
    if is_english(clean):
        return {**base, "source_lang": "EN"}

    try:
        result = await run_in_threadpool(_translate, clean)
    except Exception:
        # Never fail silently: keep the original and flag it.
        return {**base, "error": "translation_failed"}

    return {**base, "text": result.text,
            "source_lang": result.detected_source_lang, "translated": True}