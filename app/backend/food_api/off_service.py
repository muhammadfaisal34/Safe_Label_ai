"""
Open Food Facts service for Safe Label AI.
Place at: backend/app/services/off_service.py  (create the services/ folder if needed)
Requires: pip install httpx
"""
import time
import httpx
 
BASE_URL = "https://world.openfoodfacts.org/api/v2/product"
# For testing use staging: "https://world.openfoodfacts.net/api/v2/product"
HEADERS = {"User-Agent": "SafeLabelAI/1.0 (your-email@example.com)"}  # change this
FIELDS = ",".join([
    "code", "product_name", "brands", "ingredients_text",
    "allergens_tags", "traces_tags", "additives_tags",
    "nutriscore_grade", "nova_group", "image_front_url",
])
 
CACHE_TTL = 60 * 60 * 24
_CACHE: dict[str, tuple[float, dict | None]] = {}  # replace with DB/Redis later
 
 
class OFFError(Exception):
    pass
 
 
async def get_product(barcode: str) -> dict | None:
    barcode = barcode.strip()
    if not barcode.isdigit():
        raise ValueError("Barcode must contain digits only")
 
    cached = _CACHE.get(barcode)
    if cached and time.time() - cached[0] < CACHE_TTL:
        return cached[1]
 
    try:
        async with httpx.AsyncClient(timeout=10, headers=HEADERS) as client:
            r = await client.get(f"{BASE_URL}/{barcode}.json", params={"fields": FIELDS})
        if r.status_code == 404:
            product = None
        else:
            r.raise_for_status()
            data = r.json()
            product = data["product"] if data.get("status") == 1 else None
    except httpx.HTTPError as e:
        raise OFFError(f"Open Food Facts request failed: {e}") from e
 
    _CACHE[barcode] = (time.time(), product)
    return product
 
 
def check_safety(product: dict, user_allergens: list[str]) -> dict:
    wanted = {f"en:{a.strip().lower()}" for a in user_allergens if a.strip()}
    contains = set(product.get("allergens_tags", [])) & wanted
    traces = set(product.get("traces_tags", [])) & wanted
    has_data = bool(product.get("ingredients_text") or product.get("allergens_tags"))
 
    if contains:
        status = "unsafe"
    elif traces:
        status = "caution"
    elif not has_data:
        status = "unknown"  # never say "safe" when data is missing
    else:
        status = "no_match_found"
 
    return {
        "status": status,
        "contains": sorted(a.removeprefix("en:") for a in contains),
        "may_contain": sorted(a.removeprefix("en:") for a in traces),
        "data_complete": has_data,
    }
 
 
async def analyze_barcode(barcode: str, user_allergens: list[str]) -> dict:
    product = await get_product(barcode)
    if product is None:
        return {
            "found": False,
            "barcode": barcode,
            "message": "Product not in database. Check the physical label.",
        }
    return {
        "found": True,
        "barcode": barcode,
        "name": product.get("product_name"),
        "brand": product.get("brands"),
        "image": product.get("image_front_url"),
        "ingredients_text": product.get("ingredients_text"),  # pass to your ai/ NER module
        "nutriscore": product.get("nutriscore_grade"),
        "nova_group": product.get("nova_group"),
        "safety": check_safety(product, user_allergens),
        "source": "Open Food Facts (ODbL)",
    }
 