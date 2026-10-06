try:
    from app.backend.ai.allergen_detection.allergens import ALLERGEN_TERMS
    from app.backend.ai.ner.service import analyze_text, get_nlp
except (ModuleNotFoundError, ImportError):
    from ai.allergen_detection.allergens import ALLERGEN_TERMS
    from ai.ner.service import analyze_text, get_nlp

__all__ = ["ALLERGEN_TERMS", "get_nlp", "analyze_text"]


