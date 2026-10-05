import httpx


async def lookup_barcode(code: str) -> dict | None:
    url = f"https://world.openfoodfacts.org/api/v2/product/{code}.json"
    fields = "product_name,brands,image_front_small_url,ingredients_text,lang"
    headers = {"User-Agent": "SafeLabelAI/1.0 (https://github.com/safelabel-ai)"}
    async with httpx.AsyncClient(timeout=10, headers=headers) as client:
        response = await client.get(url, params={"fields": fields})
        response.raise_for_status()
    payload = response.json()
    if payload.get("status") != 1:
        return None
    product = payload.get("product", {})
    if not product.get("ingredients_text"):
        return None
    return product
