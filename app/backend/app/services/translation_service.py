try:
    from app.backend.ai.translation.detect import detect_language, is_english
    from app.backend.ai.translation.service import to_english
except (ModuleNotFoundError, ImportError):
    from ai.translation.detect import detect_language, is_english
    from ai.translation.service import to_english

translate = to_english

__all__ = ["to_english", "translate", "is_english", "detect_language"]




