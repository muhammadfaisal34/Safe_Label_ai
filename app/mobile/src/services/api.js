import Constants from "expo-constants";
import { Platform } from "react-native";
import { ALLERGENS } from "../utils/data";
import { File } from "expo-file-system";

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // On iOS Simulator or Android Emulator, use local loopback defaults
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }

  const isSimulator = Constants.isDevice === false;
  if (Platform.OS === "ios" && isSimulator) {
    return "http://127.0.0.1:8000";
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    "";

  // Regex to extract valid 4-octet IPv4 (e.g., "192.168.1.50" from "192.168.1.50:8081")
  const match = hostUri.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
  if (match && match[1]) {
    const ip = match[1];
    if (ip !== "127.0.0.1") {
      return `http://${ip}:8000`;
    }
  }

  return "http://127.0.0.1:8000";
};

export const API_URL = getBaseUrl();
console.log("SafeLabel Mobile resolved API_URL:", API_URL);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function safeFetch(path, options = {}) {
  const urlsToTry = [
    API_URL,
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://10.0.2.2:8000",
  ];
  const uniqueUrls = [...new Set(urlsToTry.filter(Boolean))];

  const isFormData = options.isFormData || options.body instanceof FormData;
  const defaultHeaders = isFormData
    ? {}
    : { "Content-Type": "application/json" };
  const reqHeaders = { ...defaultHeaders, ...(options.headers || {}) };

  let lastError = null;
  for (const baseUrl of uniqueUrls) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: reqHeaders,
      });
      return response;
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    `Unable to connect to backend at ${API_URL}. Please ensure your FastAPI server is running with: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`,
  );
}

export async function loginApi(email, password) {
  const response = await safeFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((e) => e.msg || e.message).join(", ")
          : "Login failed";
    throw new Error(errorMsg);
  }
  return data;
}

export async function registerApi(email, password, name) {
  const response = await safeFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, display_name: name }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((e) => e.msg || e.message).join(", ")
          : "Registration failed";
    throw new Error(errorMsg);
  }
  return data;
}

export async function verify2FAApi(email, code) {
  const response = await safeFetch("/auth/verify-2fa", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((e) => e.msg || e.message).join(", ")
          : "Verification failed";
    throw new Error(errorMsg);
  }
  return data;
}

export async function resend2FAApi(email) {
  const response = await safeFetch("/auth/resend-2fa", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((e) => e.msg || e.message).join(", ")
          : "Failed to resend code";
    throw new Error(errorMsg);
  }
  return data;
}

export async function fetchCurrentUserApi(token) {
  const response = await safeFetch("/users/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch user profile");
  }
  return data;
}

export async function updateCurrentUserApi(token, displayName) {
  const response = await safeFetch("/users/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ display_name: displayName }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to update profile");
  }
  return data;
}

const INGREDIENT_HEADER_REGEX = /^(?:ingredients?|ingr[eé]dients?|ingredientes?|ingredienti|zutaten|sk[łl]adniki|состав|composition)\b\s*[:\-–—\.]*\s*/i;
const STOP_SECTION_REGEX = /(?:^|\n|[\.;]\s*)\b(?:nutrition\s+(?:facts|information|info|values?)|nutritional\s+info|valeurs?\s+nutritionnelles?|n[aä]hrwerte?|store\s+in|keep\s+refrigerated|best\s+before|mindestens\s+haltbar|manufactured\s+by|produced\s+by|distributed\s+by|net\s+wt|net\s+weight|directions\s*:|batch\s*:|lot\s*:)\b/i;
const ALLERGEN_PREFIX_REGEX = /^(?:allergen\s+information|allergy\s+advice|allergens?|contains|may\s+contain|traces?\s+of|peut\s+contenir|contient|kann\s+spuren|enth[aä]lt|puede\s+contener|contiene)\b\s*[:\-–—\.]*\s*/i;
const NON_LATIN_REGEX = /[\u0400-\u052F\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0900-\u0DFF\u0E00-\u0E7F\u0E80-\u0EFF\u1000-\u109F\u1780-\u17FF\u3040-\u30FF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF]/;
const JUNK_PHRASE_REGEX = /\b(?:in\s+bold\s+text|allergens?\s+in\s+bold|see\s+ingredients\s+in\s+bold|for\s+allergens\s*,?\s*see\s+ingredients|bold\s+text|underlined\s+text)\b[\.\:\,\s]*/gi;

export function cleanIngredientsText(rawText) {
  if (!rawText || typeof rawText !== "string") return "";
  let text = rawText.trim();
  text = text.replace(INGREDIENT_HEADER_REGEX, "");
  text = text.replace(JUNK_PHRASE_REGEX, "");

  // If text contains non-latin script (Thai, Arabic, Urdu, CJK, etc.), extract English portion
  const nlMatch = text.match(NON_LATIN_REGEX);
  if (nlMatch && nlMatch.index !== undefined) {
    const prefix = text.slice(0, nlMatch.index).trim();
    const latinWords = prefix.match(/[a-zA-Z]{2,}/g) || [];
    if (latinWords.length >= 3) {
      text = prefix;
    } else {
      const allMatches = [...text.matchAll(new RegExp(NON_LATIN_REGEX.source, "g"))];
      if (allMatches.length > 0) {
        const lastMatch = allMatches[allMatches.length - 1];
        const suffix = text.slice(lastMatch.index + lastMatch[0].length).trim();
        const suffixWords = suffix.match(/[a-zA-Z]{2,}/g) || [];
        if (suffixWords.length >= 3) {
          text = suffix;
        }
      }
    }
  }

  const stopMatch = text.match(STOP_SECTION_REGEX);
  if (stopMatch && stopMatch.index !== undefined) {
    text = text.slice(0, stopMatch.index);
  }

  // Remove any remaining non-latin script characters
  text = text.replace(new RegExp(NON_LATIN_REGEX.source, "g"), "").replace(/\s+/g, " ").trim();
  return text.replace(/^[.,;:\s]+|[.,;:\s]+$/g, "").trim();
}

export function splitIntoIngredientList(text) {
  if (!text) return [];
  const cleaned = cleanIngredientsText(text);
  const items = [];
  let current = "";
  let depth = 0;
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char === "(" || char === "[" || char === "{") {
      depth++;
      current += char;
    } else if (char === ")" || char === "]" || char === "}") {
      depth = Math.max(0, depth - 1);
      current += char;
    } else if ((char === "," || char === ";" || char === "\n" || char === "•") && depth === 0) {
      const it = current.trim();
      if (it) items.push(it);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) items.push(current.trim());

  return items
    .map((it) => it.replace(/^[•\-\*\s]+/, "").replace(ALLERGEN_PREFIX_REGEX, "").replace(JUNK_PHRASE_REGEX, "").replace(/^[.,;:\s]+|[.,;:\s]+$/g, "").trim())
    .filter((it) => {
      if (!it || it.length <= 1 || !isNaN(Number(it))) return false;
      if (NON_LATIN_REGEX.test(it)) return false;
      if (!/[a-zA-Z]/.test(it)) return false;
      return true;
    });
}

export async function lookupBarcode(code) {
  try {
    const response = await safeFetch(`/products/${encodeURIComponent(code)}`, {
      method: "GET",
    });
    if (response.ok) {
      const product = await response.json();
      if (product?.ingredients_text) {
        const cleanText = cleanIngredientsText(product.ingredients_text);
        const ingredients = product.ingredients && product.ingredients.length > 0
          ? product.ingredients.filter(it => !NON_LATIN_REGEX.test(it) && /[a-zA-Z]/.test(it))
          : splitIntoIngredientList(cleanText);
        return {
          name: product.product_name || "Unknown product",
          brand: product.brands || "",
          image: product.image_front_small_url,
          text: cleanText,
          ingredients,
          raw_text: cleanText,
          lang: "en",
          source: "barcode",
        };
      }
    }
  } catch (e) {
    // Fallback to OpenFoodFacts
  }

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,image_front_small_url,ingredients_text,ingredients_text_en,lang`;
    const response = await fetch(url);
    const payload = await response.json();
    if (payload.status !== 1) return null;
    const product = payload.product;
    const rawIng = product?.ingredients_text_en || product?.ingredients_text;
    if (!rawIng) return null;
    const cleanText = cleanIngredientsText(rawIng);
    const ingredients = splitIntoIngredientList(cleanText);
    return {
      name: product.product_name || "Unknown product",
      brand: product.brands || "",
      image: product.image_front_small_url,
      text: cleanText,
      ingredients,
      raw_text: cleanText,
      lang: "en",
      source: "barcode",
    };
  } catch (err) {
    return null;
  }
}

export async function ocrImage(uri) {
  try {
    const form = new FormData();
    form.append("file", new File(uri));

    const response = await safeFetch("/ocr", {
      method: "POST",
      isFormData: true,
      body: form,
    });
    if (response.ok) {
      const result = await response.json();
      if (result?.text && result.text.trim()) {
        const cleanText = cleanIngredientsText(result.text.trim());
        const ingredients = result.ingredients && result.ingredients.length > 0
          ? result.ingredients
          : splitIntoIngredientList(cleanText);
        return {
          name: "Scanned label",
          brand: "",
          image: uri,
          text: cleanText,
          ingredients,
          raw_text: result.raw_text,
          lang: result.lang || "en",
          source: "ocr",
        };
      }
    }
  } catch (e) {
    console.warn("OCR API call error:", e.message);
  }
  console.warn("OCR returned no usable text, try again.");
  return null;
}


const TRACE = /(spuren|traces?|may contain|kann|peut contenir|puede contener)/i;
export async function analyze(product, profile, token = null, user = null) {
  try {
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const body = {
      text: product.text,
      lang: product.lang || "en",
      profile: profile || [],
      product_name: product.name,
      barcode: product.barcode,
      source: product.source || "ocr",
      user_id: user?.id,
      user_email: user?.email,
    };
    const response = await safeFetch("/analyze", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (response.ok) {
      const data = await response.json();
      console.log("ANALYZE from backend:", JSON.stringify(data));
      return {
        id: data.scan_id || String(Date.now()),
        date: Date.now(),
        product,
        ...data,
      };
    }
    console.warn("ANALYZE non-ok status:", response.status);
  } catch (e) {
    console.warn("ANALYZE error, using local fallback:", e.message);
  }

  await wait(600);
  const parts = product.ingredients && product.ingredients.length > 0
    ? product.ingredients
    : splitIntoIngredientList(product.text);
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
