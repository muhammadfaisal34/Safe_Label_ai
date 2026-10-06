import os
from dotenv import load_dotenv

load_dotenv()

try:
    import deepl
    _HAS_DEEPL = True
except ImportError:
    _HAS_DEEPL = False

_translator = None


def get_translator():
    global _translator
    if not _HAS_DEEPL:
        raise RuntimeError("deepl library is not installed")
    if _translator is None:
        key = os.getenv("DEEPL_API_KEY")
        if not key:
            raise RuntimeError("DEEPL_API_KEY is not set")
        _translator = deepl.Translator(key)
    return _translator