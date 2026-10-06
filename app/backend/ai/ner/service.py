import re

from .model import get_nlp

CATEGORY_NORM = {
    "peanuts": "peanut",
    "eggs": "egg",
    "tree_nuts": "treenut",
    "crustaceans": "shellfish",
    "molluscs": "mollusc",
    "sulphites": "sulphite",
}


def _norm_cat(cat: str) -> str:
    if not cat:
        return ""
    cat_lower = cat.lower().strip()
    return CATEGORY_NORM.get(cat_lower, cat_lower)


def extract_entities(text: str) -> dict:
    text = " ".join(text.split())  # OCR line breaks -> single spaces
    doc = get_nlp()(text)

    found: dict[str, dict] = {}
    e_numbers = set()

    for ent in doc.ents:
        if ent.label_ == "E_NUMBER":
            digits = ent.text.upper().replace("E", "", 1).strip(" -")
            e_numbers.add(f"E{digits}")
        elif ent.label_ == "ALLERGEN":
            entry = found.setdefault(
                ent.ent_id_,
                {"category": ent.ent_id_, "matched": [], "may_contain": True},
            )
            if ent.text.lower() not in entry["matched"]:
                entry["matched"].append(ent.text.lower())
            if not ent._.is_trace:
                entry["may_contain"] = False

    return {"allergens": list(found.values()), "e_numbers": sorted(e_numbers)}


def merge_results(*results: dict) -> dict:
    merged: dict[str, dict] = {}
    e_numbers: set[str] = set()

    for r in results:
        e_numbers.update(r["e_numbers"])
        for a in r["allergens"]:
            m = merged.setdefault(
                a["category"],
                {"category": a["category"], "matched": [], "may_contain": True},
            )
            for word in a["matched"]:
                if word not in m["matched"]:
                    m["matched"].append(word)
            if not a["may_contain"]:
                m["may_contain"] = False  # a direct mention in either pass wins

    return {"allergens": list(merged.values()), "e_numbers": sorted(e_numbers)}


def analyze_text(text: str, profile: list[str] | None = None) -> dict:
    if profile is None:
        profile = []

    clean_text = " ".join(text.split())
    doc = get_nlp()(clean_text)

    ingredients = [i.strip() for i in re.split(r"[,;\n]+", text) if i.strip()]

    entities = []
    findings = []
    seen_findings = set()

    for ent in doc.ents:
        if ent.label_ == "E_NUMBER":
            entities.append({
                "text": ent.text,
                "label": "E_NUMBER",
                "allergen": None,
                "start": ent.start_char,
                "end": ent.end_char,
            })
        elif ent.label_ == "ALLERGEN":
            raw_cat = ent.ent_id_
            cat = _norm_cat(raw_cat)
            is_trace = bool(getattr(ent._, "is_trace", False))

            entities.append({
                "text": ent.text,
                "label": "ALLERGEN",
                "allergen": cat,
                "start": ent.start_char,
                "end": ent.end_char,
            })

            finding_key = (ent.text.lower(), cat, is_trace)
            if finding_key not in seen_findings:
                seen_findings.add(finding_key)
                findings.append({
                    "ingredient": ent.text,
                    "allergen": cat,
                    "trace": is_trace,
                    "confidence": 0.95,
                    "reason": f"Detected '{ent.text}' matching {cat}",
                })

    norm_profile = {_norm_cat(p) for p in profile if p.strip()}
    expanded_profile = set()
    for p in norm_profile:
        expanded_profile.add(p)
        expanded_profile.add(p + "s")
        if p.endswith("s"):
            expanded_profile.add(p[:-1])

    mine = [
        f for f in findings
        if f["allergen"] in expanded_profile or _norm_cat(f["allergen"]) in expanded_profile
    ]

    if any(not f["trace"] for f in mine):
        verdict = "danger"
    elif any(f["trace"] for f in mine):
        verdict = "warning"
    else:
        verdict = "safe"

    return {
        "ingredients": ingredients,
        "findings": findings,
        "mine": mine,
        "verdict": verdict,
        "entities": entities,
    }