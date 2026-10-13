import re

FOOD_WORDS = {
    # Grains & flours
    "flour", "wheat", "grain", "grains", "oat", "oats", "barley", "rye", "rice",
    "corn", "maize", "semolina", "spelt", "millet", "quinoa", "bran", "malt",
    "weizen", "mehl", "farine", "harina", "blé", "trigo", "avena",
    # Sugars & sweeteners
    "sugar", "glucose", "fructose", "sucrose", "dextrose", "syrup", "honey",
    "caramel", "molasses", "sweetener", "maltitol", "sorbitol", "xylitol",
    "zucker", "sucre", "azúcar", "zucchero",
    # Fats & oils
    "oil", "fats", "fat", "butter", "shortening", "margarine", "lard", "ghee",
    "cocoa butter", "palm oil", "sunflower", "sunflower oil", "canola", "canola oil",
    "coconut oil", "olive oil", "soybean oil", "vegetable oil", "rapeseed",
    "öl", "huile", "aceite", "olio", "beurre", "mantequilla",
    # Dairy & eggs
    "milk", "dairy", "cream", "cheese", "whey", "casein", "caseinate", "lactose",
    "yogurt", "buttermilk", "egg", "eggs", "albumin", "yolk", "egg white",
    "milch", "lait", "leche", "latte", "oeuf", "oeufs", "eier", "huevo", "uovo",
    # Protein & legumes
    "soy", "soya", "soybean", "tofu", "edamame", "protein", "isolate", "concentrate",
    "pea", "peas", "bean", "beans", "lentils", "chickpea", "gluten",
    # Nuts & seeds
    "peanut", "peanuts", "almond", "almonds", "hazelnut", "hazelnuts", "walnut",
    "walnuts", "cashew", "cashews", "pistachio", "pistachios", "pecan", "pecans",
    "macadamia", "brazil nut", "sesame", "sesame seeds", "sunflower seeds", "chia",
    "flaxseed", "poppy", "nuss", "nüsse", "noix", "amande", "noisette", "cacahuete",
    # Meat & seafood
    "chicken", "beef", "pork", "lamb", "meat", "fish", "tuna", "salmon", "cod",
    "anchovy", "shrimp", "prawn", "crab", "lobster", "shellfish", "gelatin", "gelatine",
    # Additives, leaveners & seasonings
    "salt", "water", "yeast", "vinegar", "cocoa", "cacao", "chocolate", "vanilla",
    "flavor", "flavour", "flavoring", "flavouring", "flavours", "flavors",
    "extract", "powder", "starch", "modified starch", "cornstarch", "potato starch",
    "acid", "citric acid", "ascorbic acid", "lactic acid", "acetic acid",
    "baking soda", "baking powder", "sodium bicarbonate", "ammonium bicarbonate",
    "lecithin", "soy lecithin", "sunflower lecithin", "emulsifier", "emulsifiers",
    "stabilizer", "stabilizers", "thickener", "thickeners", "preservative", "preservatives",
    "pectin", "gum", "xanthan gum", "guar gum", "arabic gum", "cellulose",
    "color", "colour", "coloring", "colouring", "paprika", "turmeric", "carotene",
    "spice", "spices", "herb", "herbs", "pepper", "cinnamon", "garlic", "onion",
    "seasoning", "potatoes", "potato", "tomato", "chili", "mustard",
    "salz", "sel", "sal", "sale", "wasser", "eau", "agua", "acqua",
}

INGREDIENT_HEADER_PATTERN = re.compile(
    r"""(?ix)
    (?:^|\n|[\.\;]\s*|\b)
    (
        ingredients?|
        ingr[eé]dients?|
        ingredientes?|
        ingredienti|
        ingredi[eë]nten?|
        ingredienser|
        zutaten|
        inhaltsstoffe|
        sk[łl]adniki|
        sk[łl]ad|
        состав|
        склад|
        i[çc]indekiler|
        i[çc]erik|
        المكونات|
        composition
    )\b\s*(?:[/:\\&]|\band\b|\bet\b|\bund\b)?\s*(?:
        ingredients?|
        ingr[eé]dients?|
        ingredientes?|
        ingredienti|
        ingredi[eë]nten?|
        ingredienser|
        zutaten|
        inhaltsstoffe|
        sk[łl]adniki|
        sk[łl]ad|
        состав|
        склад|
        i[çc]indekiler|
        i[çc]erik|
        المكونات|
        composition
    )?\s*[:\-–—\.]*\s*
    """
)

STOP_SECTION_PATTERN = re.compile(
    r"""(?ix)
    (?:^|\n|[\.\;]\s*)\b(
        nutrition\s+(?:facts|information|info|values?)|
        nutritional\s+(?:information|info|values?)|
        valeur(?:s)?\s+nutritive(?:s)?|
        valeurs\s+nutritionnelles|
        n[aä]hrwert(?:e|en|sdeklaration)?|
        informaci[oó]n\s+nutricional|
        valori\s+nutrizionali|
        informa[çc][aã]o\s+nutricional|
        per\s+100\s*(?:g|ml)|
        pour\s+100\s*(?:g|ml)|
        pro\s+100\s*(?:g|ml)|
        serving\s+size|
        taille\s+de\s+portion|
        portie|
        store\s+in\s+(?:a\s+)?(?:cool|dry)|
        store\s+in\b|
        store\s+(?:below|at|between|away|refrigerated)|
        keep\s+(?:in\s+)?(?:a\s+)?(?:cool|dry)|
        keep\s+refrigerated|
        keep\s+frozen|
        storage\b|
        conserver\s+(?:au\s+frais|dans\s+un\s+endroit)|
        [aà]\s+conserver|
        k[uü]hl\s+(?:und\s+trocken\s+)?lagern|
        conservar\s+en\s+lugar|
        once\s+opened|
        best\s+before|
        best\s+if\s+used\s+by|
        use\s+by|
        expiry(?:\s+date)?|
        exp(?:\s+date|\s*\.)\s*:?|
        bb(?:d)?\s*:|
        guaranteed\s+fresh|
        [aà]\s+consommer\s+de\s+pr[eé]f[eé]rence|
        mindestens\s+haltbar\s+bis|
        consumir\s+preferentemente|
        da\s+consumarsi\s+preferibilmente|
        manufactured\s+(?:by|for)|
        produced\s+(?:by|in|for)|
        made\s+in|
        distributed\s+by|
        packed\s+(?:by|for)|
        imported\s+by|
        product\s+of|
        fabriqu[eé]\s+(?:par|en|au)|
        hergestellt\s+(?:von|in)|
        producido\s+por|
        prodotto\s+da|
        distribu[eé]\s+par|
        net\s+wt|
        net\s+weight|
        net\s+volume|
        poids\s+net|
        peso\s+neto|
        nettogewicht|
        cont(?:\.|\s+)net(?:\.|\s+)|
        directions(?:\s+for\s+use)?\s*:|
        how\s+to\s+(?:prepare|use)|
        instructions\s*:|
        preparation\s*:|
        mode\s+d['’]emploi|
        zubereitung\s*:|
        serving\s+suggestion|
        consumer\s+(?:care|service)|
        customer\s+(?:service|care)|
        questions\s+or\s+comments|
        service\s+consommateur|
        kundenservice|
        contact\s*:|
        batch(?:\s+no|\s+number)?\s*:|
        lot(?:\s+no|\s+number)?\s*:|
        choking\s+hazard|
        recycle(?:\s+me)?|
        please\s+recycle|
        www\.|\bhttps?://
    )\b
    """
)

ALLERGEN_ADVISORY_PREFIX = re.compile(
    r"""(?ix)
    ^(?:
        contains|
        may\s+contain|
        allergy\s+advice|
        allergens?|
        allergen\s+information|
        traces?\s+of|
        peut\s+contenir|
        contient|
        kann\s+spuren\s+(?:von\s+)?enthalten|
        enth[aä]lt|
        puede\s+contener|
        contiene|
        pu[oò]\s+contenere|
        kan\s+sporen\s+bevatten|
        zawiera|
        mo[zż]e\s+zawiera[cć]
    )\b\s*[:\-–—\.]*\s*
    """
)


def extract_ingredients_text(raw_text: str) -> str:
    """Extract ONLY the ingredients section from raw OCR text, stripping

    headers, marketing claims, storage instructions, nutrition tables, etc.
    """
    if not raw_text or not raw_text.strip():
        return ""

    text = raw_text.strip()
    if ARABIC_URDU_RE.search(text):
        eng = extract_english_portion(text)
        if eng:
            text = eng

    # 1. Search for explicit ingredient header
    match = INGREDIENT_HEADER_PATTERN.search(text)
    if match:
        candidate = text[match.end():].strip()
        stop_match = STOP_SECTION_PATTERN.search(candidate)
        if stop_match:
            candidate = candidate[:stop_match.start()].strip()
        candidate = JUNK_PHRASES_RE.sub("", candidate).rstrip(" .;,\n\r\t")
        if candidate:
            if ARABIC_URDU_RE.search(candidate):
                cand_eng = extract_english_portion(candidate)
                if cand_eng:
                    return cand_eng
                candidate = ARABIC_URDU_RE.sub("", candidate).strip(" -•,;:")
            return candidate

    # 2. Line-by-line heuristic extraction if header was not found
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    selected_lines = []
    in_ingredients = False

    for line in lines:
        if STOP_SECTION_PATTERN.search(line):
            if in_ingredients:
                break
            continue

        lower = line.lower()
        words = set(re.findall(r"\b[a-z]{3,}\b", lower))
        food_matches = words.intersection(FOOD_WORDS)
        comma_count = line.count(",") + line.count(";")
        has_e_num = bool(re.search(r"\bE[\s-]?\d{3,4}\b", line, re.I))
        is_allergen = bool(ALLERGEN_ADVISORY_PREFIX.search(line))

        if (len(food_matches) >= 2 and comma_count >= 1) or (food_matches and has_e_num) or comma_count >= 2:
            in_ingredients = True
            selected_lines.append(line)
        elif in_ingredients:
            if comma_count >= 1 or food_matches or is_allergen or (selected_lines and selected_lines[-1].endswith((",", ";"))):
                selected_lines.append(line)
            else:
                break

    if selected_lines:
        return " ".join(selected_lines).strip()

    # 3. Fallback: If raw text itself is already a comma-delimited food list
    words = set(re.findall(r"\b[a-z]{3,}\b", text.lower()))
    if words.intersection(FOOD_WORDS) and (text.count(",") >= 1 or text.count(";") >= 1):
        return text

    return ""


NON_LATIN_SCRIPT_RE = re.compile(
    r"[\u0400-\u052F\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF"
    r"\u0900-\u0DFF\u0E00-\u0E7F\u0E80-\u0EFF\u1000-\u109F\u1780-\u17FF\u3040-\u30FF\u31F0-\u31FF"
    r"\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF]"
)
ARABIC_URDU_RE = NON_LATIN_SCRIPT_RE

FOREIGN_HEADER_PATTERN = re.compile(
    r"""(?ix)
    (?:^|\n|[\.\;]\s*|\b)(?:
        ingr[eé]dients?|
        ingredientes?|
        ingredienti|
        ingredi[eë]nten?|
        ingredienser|
        zutaten|
        inhaltsstoffe|
        sk[łl]adniki|
        sk[łl]ad|
        состав|
        склад|
        i[çc]indekiler|
        i[çc]erik|
        المكونات|
        ส่วนประกอบ(?:\s*ที่สำคัญ)?|
        composition
    )\b\s*[:\-–—\.]*\s*
    """
)

JUNK_PHRASES_RE = re.compile(
    r"""(?ix)
    \b(?:
        in\s+bold\s+text|
        allergens?\s+in\s+bold|
        see\s+ingredients\s+in\s+bold|
        for\s+allergens\s*,?\s*see\s+ingredients|
        bold\s+text|
        underlined\s+text
    )\b[\.\:\,\s]*
    """
)

ENGLISH_FOOD_MARKERS = {
    "flour", "wheat", "grain", "grains", "oat", "oats", "barley", "rice", "corn",
    "sugar", "glucose", "fructose", "syrup", "honey", "oil", "fat", "fats", "butter",
    "milk", "dairy", "cream", "cheese", "whey", "egg", "eggs", "yolk", "soy", "soya",
    "protein", "peanut", "peanuts", "almond", "almonds", "nut", "nuts", "salt", "water",
    "yeast", "cocoa", "chocolate", "vanilla", "vanillin", "flavor", "flavour", "flavoring",
    "flavors", "flavours", "starch", "acid", "citric acid", "baking powder", "lecithin",
    "emulsifier", "emulsifiers", "preservative", "preservatives", "contains", "may contain",
    "traces", "allergen", "allergens", "raisins", "coconut", "leavening"
}


def has_english_content(s: str) -> bool:
    if not s or not s.strip():
        return False
    lower = s.lower()
    words = set(re.findall(r"\b[a-z]{3,}\b", lower))
    if words.intersection(ENGLISH_FOOD_MARKERS):
        return True
    latin_words = re.findall(r"\b[A-Za-z]{3,}\b", s)
    return len(latin_words) >= 4


def extract_english_portion(text: str, product_name: str = "") -> str | None:
    """If text contains bilingual/multilingual ingredients (e.g. English + Thai / Urdu / French):
    Extract and return ONLY the English portion if English text is present.
    Returns None if no meaningful English ingredient text exists.
    """
    if not text or not text.strip():
        return None

    cleaned = JUNK_PHRASES_RE.sub("", text).strip()
    if product_name and len(product_name) > 3:
        cleaned = re.sub(re.escape(product_name) + r"\s*$", "", cleaned, flags=re.I).strip()

    # 1. Explicit English header 'Ingredients:'
    eng_hdr = re.search(r"(?i)(?:^|\n|[\.\;]\s*|\b)ingredients?\s*[:\-–—\.]*\s*", cleaned)
    if eng_hdr:
        after_hdr = cleaned[eng_hdr.end():].strip()
        stops = []
        f_hdr = FOREIGN_HEADER_PATTERN.search(after_hdr)
        if f_hdr:
            stops.append(f_hdr.start())
        sp = STOP_SECTION_PATTERN.search(after_hdr)
        if sp:
            stops.append(sp.start())
        nl = NON_LATIN_SCRIPT_RE.search(after_hdr)
        if nl:
            stops.append(nl.start())
        cand = after_hdr[:min(stops)].strip(" .,;:\t\n\r") if stops else after_hdr.strip(" .,;:\t\n\r")
        if has_english_content(cand):
            return cand

    # 2. Non-latin script present (Thai, Urdu, Arabic, Chinese, Cyrillic, etc.)
    if NON_LATIN_SCRIPT_RE.search(cleaned):
        # Case A: English before first non-latin script block (e.g. Danisa cookies)
        first_nl = NON_LATIN_SCRIPT_RE.search(cleaned)
        prefix = cleaned[:first_nl.start()].strip(" .,;:\t\n\r")
        sp = STOP_SECTION_PATTERN.search(prefix)
        if sp:
            prefix = prefix[:sp.start()].strip(" .,;:\t\n\r")
        if has_english_content(prefix):
            return prefix

        # Case B: English after last non-latin block
        all_nl = list(NON_LATIN_SCRIPT_RE.finditer(cleaned))
        suffix = cleaned[all_nl[-1].end():].strip(" .,;:\t\n\r")
        sp = STOP_SECTION_PATTERN.search(suffix)
        if sp:
            suffix = suffix[:sp.start()].strip(" .,;:\t\n\r")
        if has_english_content(suffix):
            return suffix

        # Case C: Interspersed lines/chunks
        lines = [l.strip() for l in cleaned.splitlines() if l.strip()]
        eng_lines = []
        for line in lines:
            if not NON_LATIN_SCRIPT_RE.search(line):
                if has_english_content(line):
                    eng_lines.append(line)
            else:
                chunks = NON_LATIN_SCRIPT_RE.split(line)
                for c in chunks:
                    c_clean = c.strip(" .,;:\t\n\r-•")
                    if has_english_content(c_clean):
                        eng_lines.append(c_clean)
        if eng_lines:
            combined = " ".join(eng_lines).strip()
            if has_english_content(combined):
                return combined
        return None

    # 3. Bilingual with European languages (e.g. English followed by Ingrédients: / Zutaten:)
    f_hdr = FOREIGN_HEADER_PATTERN.search(cleaned)
    if f_hdr:
        cand = cleaned[:f_hdr.start()].strip(" .,;:\t\n\r")
        if has_english_content(cand):
            return cand
        after_foreign = cleaned[f_hdr.end():]
        eng_hdr = re.search(r"(?i)(?:^|\n|[\.\;]\s*|\b)ingredients?\s*[:\-–—\.]*\s*", after_foreign)
        if eng_hdr:
            cand_after = after_foreign[eng_hdr.end():].strip(" .,;:\t\n\r")
            if has_english_content(cand_after):
                return cand_after

    # 4. Pure Latin text: Check if it has meaningful English content
    if has_english_content(cleaned):
        return cleaned

    return None


def split_into_ingredients(text: str) -> list[str]:
    """Split extracted ingredient text into clean, individual ingredient items,
    respecting parentheses and separating allergen advisory statements.
    """
    if not text or not text.strip():
        return []

    cleaned = INGREDIENT_HEADER_PATTERN.sub("", text).strip()
    cleaned = JUNK_PHRASES_RE.sub("", cleaned).strip()
    # Ensure allergen advisories start on new item boundary
    cleaned = re.sub(
        r"[\.\n]\s*(?=(?:allergen\s+information|allergy\s+advice|allergens?|contains|may\s+contain|traces?\s+of|peut\s+contenir|contient|kann\s+spuren|puede\s+contener)\b)",
        "; ",
        cleaned,
        flags=re.I,
    )
    # Also separate periods followed by uppercase ingredient names
    cleaned = re.sub(r"\.\s+(?=[A-Z][a-z])", "; ", cleaned)

    # Unwrap OCR line wraps before splitting
    lines = cleaned.splitlines()
    merged_lines = []
    for line in lines:
        l_str = line.strip()
        if not l_str:
            continue
        if merged_lines and not merged_lines[-1].endswith((".", ";", ":", "•", "—", "-")):
            merged_lines[-1] = merged_lines[-1] + " " + l_str
        else:
            merged_lines.append(l_str)
    single_stream = " ".join(merged_lines)

    items = []
    current = []
    depth = 0

    for char in single_stream:
        if char in "([{":
            depth += 1
            current.append(char)
        elif char in ")]}":
            depth = max(0, depth - 1)
            current.append(char)
        elif (char in ",;\n•") and depth == 0:
            item = "".join(current).strip()
            if item:
                items.append(item)
            current = []
        else:
            current.append(char)

    if current:
        item = "".join(current).strip()
        if item:
            items.append(item)

    result = []
    for it in items:
        it = re.sub(r"^[•\-\*\s]+", "", it)
        # Strip allergen advisory prefix like 'May contain:' or 'Contains:'
        it = ALLERGEN_ADVISORY_PREFIX.sub("", it)
        it = JUNK_PHRASES_RE.sub("", it).strip(" .,;:\t\n\r")
        if not it or len(it) <= 1 or it.isnumeric():
            continue
        # Only return English ingredients (no non-Latin script, must contain Latin letters)
        if NON_LATIN_SCRIPT_RE.search(it) or not re.search(r"[A-Za-z]", it):
            continue
        result.append(it)

    return result


def extract_ingredients_from_ocr(lines: list[dict], raw_text: str, lang: str = "en") -> dict:
    """Process OCR raw lines and raw text to return ONLY the ingredients list."""
    ing_text = extract_ingredients_text(raw_text)
    ing_list = split_into_ingredients(ing_text)

    # Filter lines to only those matching the ingredient text
    ing_lines = []
    if ing_text:
        lower_ing = ing_text.lower()
        for l in lines:
            txt = l.get("text", "").strip()
            if not txt:
                continue
            cleaned_line = INGREDIENT_HEADER_PATTERN.sub("", txt).strip().lower()
            if cleaned_line and (cleaned_line in lower_ing or any(part in lower_ing for part in cleaned_line.split(",") if len(part) > 3)):
                ing_lines.append(l)

    selected_lines = ing_lines if ing_lines else lines
    avg_conf = (
        sum(l["confidence"] for l in selected_lines) / len(selected_lines)
        if selected_lines
        else 0.0
    )

    return {
        "text": ing_text,
        "ingredients": ing_list,
        "raw_text": raw_text,
        "lines": selected_lines,
        "avg_confidence": round(avg_conf, 3),
        "low_confidence": not ing_text or avg_conf < 0.60 or not selected_lines,
    }
