# Allergen category -> words/phrases that indicate it (EU 14 allergens).
# Matching is case-insensitive. Add more terms and languages as you test.
ALLERGEN_TERMS: dict[str, list[str]] = {
    "milk": ["milk", "whey", "casein", "caseinate", "lactose", "butter",
             "cream", "cheese", "yoghurt", "yogurt", "milk powder"],
    "eggs": ["egg", "eggs", "albumin", "egg white", "egg yolk", "mayonnaise"],
    "peanuts": ["peanut", "peanuts", "groundnut", "groundnuts"],
    "tree_nuts": ["almond", "almonds", "hazelnut", "hazelnuts", "walnut",
                  "walnuts", "cashew", "cashews", "pistachio", "pistachios",
                  "pecan", "pecans", "brazil nut", "macadamia", "tree nuts"],
    "gluten": ["wheat", "rye", "barley", "oats", "spelt", "gluten",
               "wheat flour", "semolina", "malt"],
    "soy": ["soy", "soya", "soybean", "soybeans", "soy lecithin", "tofu"],
    "fish": ["fish", "anchovy", "anchovies", "cod", "salmon", "tuna"],
    "crustaceans": ["crustaceans", "shrimp", "prawn", "prawns", "crab", "lobster"],
    "molluscs": ["molluscs", "mollusks", "squid", "mussels", "oyster", "oysters"],
    "sesame": ["sesame", "sesame seeds", "tahini"],
    "mustard": ["mustard"],
    "celery": ["celery", "celeriac"],
    "lupin": ["lupin", "lupine"],
    "sulphites": ["sulphites", "sulfites", "sulphur dioxide", "sulfur dioxide"],
}

# Synonyms and other languages (added to the same categories).
ALLERGEN_TERMS["milk"] += [
    "skimmed milk", "milk solids", "milk protein", "buttermilk", "ghee",
    "curd", "paneer", "lactalbumin", "lactoglobulin", "whey powder",
    "milch", "magermilch", "magermilchpulver", "molke", "lait",
    "lactosérum", "leche", "suero de leche", "latte", "siero di latte", "süt",
]
ALLERGEN_TERMS["eggs"] += [
    "ei", "eier", "eigelb", "oeuf", "oeufs", "huevo", "huevos", "uovo", "uova",
]
ALLERGEN_TERMS["peanuts"] += [
    "erdnuss", "erdnüsse", "erdnüssen", "cacahuète", "cacahuètes",
    "cacahuete", "arachidi",
]
ALLERGEN_TERMS["tree_nuts"] += [
    "haselnuss", "haselnüsse", "haselnüssen", "noisette", "noisettes",
    "avellana", "nocciola",
]
ALLERGEN_TERMS["gluten"] += [
    "weizen", "weizenmehl", "gerste", "roggen", "blé", "farine de blé",
    "trigo", "frumento",
]

TRACE_PHRASES = [
    "may contain", "traces of", "produced in a facility", "made on equipment",
    # other languages
    "kann spuren von", "spuren von", "peut contenir", "traces de",
    "puede contener", "trazas de", "può contenere", "tracce di",
]


def build_patterns() -> list[dict]:
    return [
        {"label": "ALLERGEN", "pattern": term, "id": category}
        for category, terms in ALLERGEN_TERMS.items()
        for term in terms
    ]