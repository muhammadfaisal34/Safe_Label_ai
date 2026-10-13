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

    # 1. Search for explicit ingredient header
    match = INGREDIENT_HEADER_PATTERN.search(text)
    if match:
        candidate = text[match.end():].strip()
        stop_match = STOP_SECTION_PATTERN.search(candidate)
        if stop_match:
            candidate = candidate[:stop_match.start()].strip()
        candidate = candidate.rstrip(" .;,\n\r\t")
        if candidate:
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


def split_into_ingredients(text: str) -> list[str]:
    """Split extracted ingredient text into clean, individual ingredient items,

    respecting parentheses and separating allergen advisory statements.
    """
    if not text or not text.strip():
        return []

    cleaned = INGREDIENT_HEADER_PATTERN.sub("", text).strip()
    # Ensure allergen advisories start on new item boundary
    cleaned = re.sub(
        r"[\.\n]\s*(?=(?:may\s+contain|contains?|allergy\s+advice|allergens?|traces?\s+of|peut\s+contenir|contient|kann\s+spuren|puede\s+contener)\b)",
        "; ",
        cleaned,
        flags=re.I,
    )

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
        # Strip leading bullet points, dashes, asterisks
        it = re.sub(r"^[•\-\*\s]+", "", it)
        # Strip allergen advisory prefix like 'May contain:' or 'Contains:'
        it = ALLERGEN_ADVISORY_PREFIX.sub("", it)
        it = it.strip(" .,;:\t\n\r")
        if it and len(it) > 1 and not it.isnumeric():
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
