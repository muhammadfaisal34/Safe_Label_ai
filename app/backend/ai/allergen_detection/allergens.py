import re

TRACE_PATTERN = re.compile(r"spuren|traces?|may contain|kann|peut contenir|puede contener", re.I)

ALLERGEN_TERMS = {
    "peanut": ("peanut", "groundnut", "arachis", "erdnuss", "cacahuete"),
    "treenut": ("almond", "hazelnut", "walnut", "cashew", "pistachio", "haselnuss"),
    "milk": ("milk", "whey", "casein", "lactose", "butter", "cream", "cheese", "milch"),
    "egg": ("egg", "albumin", "ovalbumin", "lysozyme", "eier"),
    "wheat": ("wheat", "gluten", "semolina", "spelt", "weizen", "trigo"),
    "soy": ("soy", "soya", "soja", "lecithin", "edamame", "tofu"),
    "fish": ("fish", "anchovy", "cod", "salmon", "tuna", "fisch"),
    "shellfish": ("shrimp", "prawn", "crab", "lobster", "garnele"),
    "sesame": ("sesame", "tahini", "sesam"),
    "mustard": ("mustard", "senf", "moutarde"),
}


def list_allergens() -> list[dict[str, object]]:
    return [{"id": key, "terms": list(terms)} for key, terms in ALLERGEN_TERMS.items()]
