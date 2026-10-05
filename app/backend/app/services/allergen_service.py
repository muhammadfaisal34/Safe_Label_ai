from .nlp_service import ALLERGEN_TERMS


def list_allergens() -> list[dict[str, object]]:
    return [{"id": key, "terms": list(terms)} for key, terms in ALLERGEN_TERMS.items()]
