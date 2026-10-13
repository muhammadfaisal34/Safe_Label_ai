import re
import time

from .model import get_nlp

try:
    from app.backend.ai.ocr.extractor import extract_ingredients_text, extract_english_portion, split_into_ingredients
except (ModuleNotFoundError, ImportError):
    try:
        from ..ocr.extractor import extract_ingredients_text, extract_english_portion, split_into_ingredients
    except (ModuleNotFoundError, ImportError):
        from ai.ocr.extractor import extract_ingredients_text, extract_english_portion, split_into_ingredients


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
    t0 = time.perf_counter()
    print(f"  \033[93m[>>] [NER ENGINE] Running entity extraction ({len(text)} chars)...\033[0m", flush=True)
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

    elapsed = time.perf_counter() - t0
    time_fmt = f"{elapsed:.2f}s" if elapsed >= 1.0 else f"{elapsed * 1000:.0f}ms"
    allergens = [a["category"] for a in found.values()]
    print(
        f"  \033[92m[OK] [NER ENGINE] Completed in {time_fmt} | Allergens: {len(allergens)} {allergens} | E-numbers: {sorted(e_numbers)}\033[0m",
        flush=True,
    )
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

    t0 = time.perf_counter()
    preview = (text[:45] + "...") if len(text) > 45 else text
    preview_clean = preview.replace("\n", " ")
    print(f"  \033[93m[>>] [NER ENGINE] Running spaCy model on {len(text)} chars (\"{preview_clean}\")...\033[0m", flush=True)

    eng = extract_english_portion(text)
    if eng:
        text = eng

    ing_text = extract_ingredients_text(text) or text
    clean_text = " ".join(ing_text.split())
    doc = get_nlp()(clean_text)

    ingredients = split_into_ingredients(ing_text)
    if not ingredients:
        ingredients = [i.strip() for i in re.split(r"[,;\n]+", ing_text) if i.strip() and not re.search(r"[\u0600-\u06FF]", i) and re.search(r"[A-Za-z]", i)]


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

    elapsed = time.perf_counter() - t0
    time_fmt = f"{elapsed:.2f}s" if elapsed >= 1.0 else f"{elapsed * 1000:.0f}ms"
    detected_cats = list({f["allergen"] for f in findings if f.get("allergen")})
    user_hits = list({f["allergen"] for f in mine if f.get("allergen")})
    print(
        f"  \033[92m[OK] [NER ENGINE] Completed in {time_fmt} | Findings: {len(findings)} {detected_cats} | User Alerts: {user_hits} | Verdict: {verdict.upper()}\033[0m",
        flush=True,
    )

    return {
        "ingredients": ingredients,
        "findings": findings,
        "mine": mine,
        "verdict": verdict,
        "entities": entities,
        "ingredients_text": ing_text,
    }