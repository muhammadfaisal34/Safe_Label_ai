try:
    from app.backend.ai.translation.service import to_english
except (ModuleNotFoundError, ImportError):
    from ai.translation.service import to_english

translate = to_english

__all__ = ["to_english", "translate"]



