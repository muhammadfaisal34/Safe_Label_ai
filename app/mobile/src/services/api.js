import { ALLERGENS } from "../utils/data";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function lookupBarcode(code) {
  if (API_URL) {
    const response = await fetch(
      `${API_URL}/products/${encodeURIComponent(code)}`,
    );
    if (!response.ok) return null;
    const product = await response.json();
    if (!product?.ingredients_text) return null;
    return {
      name: product.product_name || "Unknown product",
      brand: product.brands || "",
      image: product.image_front_small_url,
      text: product.ingredients_text,
      lang: product.lang || "en",
      source: "barcode",
    };
  }
  const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,image_front_small_url,ingredients_text,lang`;
  const response = await fetch(url);
  const payload = await response.json();
  if (payload.status !== 1 || !payload.product?.ingredients_text) return null;
  const product = payload.product;
  return {
    name: product.product_name || "Unknown product",
    brand: product.brands || "",
    image: product.image_front_small_url,
    text: product.ingredients_text,
    lang: product.lang || "en",
    source: "barcode",
  };
}

export async function ocrImage(uri) {
  if (API_URL) {
    const form = new FormData();
    form.append("file", { uri, name: "label.jpg", type: "image/jpeg" });
    const response = await fetch(`${API_URL}/ocr`, {
      method: "POST",
      body: form,
    });
    const result = await response.json();
    return {
      name: "Scanned label",
      brand: "",
      image: uri,
      text: result.text,
      lang: result.lang,
      source: "ocr",
    };
  }
  await wait(900);
  return {
    name: "Scanned label",
    brand: "",
    image: uri,
    text: "Zutaten: Weizenmehl, Zucker, Erdnüsse, Magermilchpulver, Sojalecithin, Salz. Kann Spuren von Haselnüssen enthalten.",
    lang: "de",
    source: "ocr",
  };
}

const TRACE = /(spuren|traces?|may contain|kann|peut contenir|puede contener)/i;
export async function analyze(product, profile) {
  if (API_URL) {
    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: product.text, lang: product.lang, profile }),
    });
    return {
      id: String(Date.now()),
      date: Date.now(),
      product,
      ...(await response.json()),
    };
  }
  await wait(600);
  const parts = product.text
    .split(/[,;.:()\[\]]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const findings = [];
  parts.forEach((part) => {
    const low = ` ${part.toLowerCase()} `;
    const trace = TRACE.test(low);
    ALLERGENS.forEach((a) => {
      const hit = a.terms.find((term) => low.includes(term));
      if (hit)
        findings.push({
          ingredient: part,
          allergen: a.id,
          trace,
          confidence: trace ? 0.62 : hit.length > 4 ? 0.94 : 0.78,
          reason: trace
            ? `Label warns of traces; "${hit}" maps to ${a.label}.`
            : `"${hit}" is a known name for ${a.label}.`,
        });
    });
  });
  const mine = findings.filter((finding) => profile.includes(finding.allergen));
  return {
    id: String(Date.now()),
    date: Date.now(),
    product,
    ingredients: parts,
    findings,
    mine,
    verdict: mine.some((finding) => !finding.trace)
      ? "danger"
      : mine.length
        ? "caution"
        : "none",
  };
}
