import re
from functools import lru_cache

import spacy

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


@lru_cache(maxsize=1)
def get_nlp():
    nlp = spacy.blank("en")
    ruler = nlp.add_pipe("entity_ruler", name="ner", config={"phrase_matcher_attr": "LOWER"})
    ruler.add_patterns([
        {"label": "ALLERGEN", "pattern": term, "id": allergen}
        for allergen, terms in ALLERGEN_TERMS.items()
        for term in terms
    ] + [
        {"label": "ALLERGEN", "pattern": f"{term}s", "id": allergen}
        for allergen, terms in ALLERGEN_TERMS.items()
        for term in terms
        if not term.endswith("s")
    ])
    return nlp


def analyze_text(text: str, profile: list[str]) -> dict:
    ingredients = [part.strip() for part in re.split(r"[,;.:()\[\]]+", text) if part.strip()]
    doc = get_nlp()(text)
    entities = [
        {
            "text": entity.text,
            "label": entity.label_,
            "allergen": entity.ent_id_ or None,
            "start": entity.start_char,
            "end": entity.end_char,
        }
        for entity in doc.ents
    ]
    findings = []
    for entity in doc.ents:
        allergen = entity.ent_id_
        ingredient = next((part for part in ingredients if entity.text.lower() in part.lower()), entity.text)
        lowered = ingredient.lower()
        trace = bool(TRACE_PATTERN.search(lowered))
        findings.append({
            "ingredient": ingredient,
            "allergen": allergen,
            "trace": trace,
            "confidence": 0.62 if trace else 0.94,
            "reason": f"spaCy NER identified {entity.text} as {allergen}.",
        })
    mine = [finding for finding in findings if finding["allergen"] in profile]
    verdict = "danger" if any(not finding["trace"] for finding in mine) else "caution" if mine else "none"
    return {"ingredients": ingredients, "findings": findings, "mine": mine, "verdict": verdict, "entities": entities}
