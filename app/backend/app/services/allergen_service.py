try:
    from app.backend.ai.allergen_detection.allergens import list_allergens
except (ModuleNotFoundError, ImportError):
    from ai.allergen_detection.allergens import list_allergens

__all__ = ["list_allergens"]


