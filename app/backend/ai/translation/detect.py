try:
    from langdetect import DetectorFactory, detect_langs
    DetectorFactory.seed = 0  # make results repeatable
    _HAS_LANGDETECT = True
except ImportError:
    _HAS_LANGDETECT = False


def is_english(text: str, threshold: float = 0.90) -> bool:
    """True only when we are confident. When unsure, translate anyway."""
    if not _HAS_LANGDETECT or len(text.strip()) < 20:
        return False
    try:
        best = detect_langs(text)[0]
    except Exception:
        return False
    return best.lang == "en" and best.prob >= threshold


def detect_language(text: str) -> str:
    """Detect language of text. Returns ISO code (e.g. 'en', 'de', 'fr', 'es', 'ur')."""
    clean = text.strip()
    if not _HAS_LANGDETECT or not clean or len(clean) < 3:
        return "en"
    try:
        langs = detect_langs(clean)
        if langs:
            return langs[0].lang.lower()
    except Exception:
        pass
    return "en"
