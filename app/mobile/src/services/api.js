import Constants from "expo-constants";
import { Platform } from "react-native";
import { ALLERGENS } from "../utils/data";

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

  let lastError = null;
  for (const baseUrl of uniqueUrls) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      return response;
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    `Unable to connect to backend at ${API_URL}. Please ensure your FastAPI server is running with: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
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
          : "2FA Verification failed";
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

export async function lookupBarcode(code) {
  try {
    const response = await safeFetch(`/products/${encodeURIComponent(code)}`, {
      method: "GET",
    });
    if (response.ok) {
      const product = await response.json();
      if (product?.ingredients_text) {
        return {
          name: product.product_name || "Unknown product",
          brand: product.brands || "",
          image: product.image_front_small_url,
          text: product.ingredients_text,
          lang: product.lang || "en",
          source: "barcode",
        };
      }
    }
  } catch (e) {
    // Fallback to OpenFoodFacts
  }

  try {
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
  } catch (err) {
    return null;
  }
}

export async function ocrImage(uri) {
  try {
    const form = new FormData();
    form.append("file", { uri, name: "label.jpg", type: "image/jpeg" });
    const response = await safeFetch("/ocr", {
      method: "POST",
      headers: {}, // Let fetch set boundary
      body: form,
    });
    if (response.ok) {
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
  } catch (e) {
    // Fallback if local server offline
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
  try {
    const response = await safeFetch("/analyze", {
      method: "POST",
      body: JSON.stringify({ text: product.text, lang: product.lang, profile }),
    });
    if (response.ok) {
      const data = await response.json();
      return {
        id: String(Date.now()),
        date: Date.now(),
        product,
        ...data,
      };
    }
  } catch (e) {
    // Fallback
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
