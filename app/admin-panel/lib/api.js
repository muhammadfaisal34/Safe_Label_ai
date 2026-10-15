const DEFAULT_FALLBACK_URL = 'https://safelabel-api-g6cnaah8ardsfpfs.uaenorth-01.azurewebsites.net';

let cachedRuntimeUrl = null;

if (typeof window !== 'undefined') {
  // Eagerly fetch dynamic runtime config from server (reads Azure App Service env vars)
  fetch('/api/config', { cache: 'no-store' })
    .then((res) => res.json())
    .then((data) => {
      if (data?.apiUrl) {
        cachedRuntimeUrl = data.apiUrl.trim().replace(/\/$/, '');
      }
    })
    .catch(() => {});
}

export function getApiBase() {
  if (typeof window !== 'undefined') {
    const isProduction = window.location.hostname.includes('azurewebsites.net');
    const saved = window.localStorage.getItem('safelabel_api_url');

    // Clean stale localhost / ngrok entries in production
    if (saved) {
      const clean = saved.trim().replace(/\/$/, '');
      if (isProduction && (clean.includes('localhost') || clean.includes('ngrok'))) {
        window.localStorage.removeItem('safelabel_api_url');
      } else {
        return clean;
      }
    }

    // 1. Injected by RootLayout server-side from Azure App Service environment variable
    if (window.__BACKEND_API_URL__) {
      return window.__BACKEND_API_URL__.trim().replace(/\/$/, '');
    }

    // 2. Fetched from /api/config endpoint
    if (cachedRuntimeUrl) {
      return cachedRuntimeUrl;
    }
  }

  // 3. Server-side or build-time fallback
  return (
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_FALLBACK_URL
  ).trim().replace(/\/$/, '');
}

export function setApiBase(url) {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      window.localStorage.setItem('safelabel_api_url', url.trim().replace(/\/$/, ''));
      cachedRuntimeUrl = url.trim().replace(/\/$/, '');
    } else {
      window.localStorage.removeItem('safelabel_api_url');
      cachedRuntimeUrl = null;
    }
  }
}

async function request(path, options = {}) {
  const token = typeof window === 'undefined' ? null : window.localStorage.getItem('safelabel_token');
  const apiBase = getApiBase();
  let response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    throw new Error(`Unable to connect to backend server at ${apiBase}. Please make sure the FastAPI server is running.`);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = typeof payload.detail === 'string'
      ? payload.detail
      : Array.isArray(payload.detail)
        ? payload.detail.map((e) => e.msg || e.message).join(', ')
        : 'Request failed';
    throw new Error(errorMsg);
  }
  return payload;
}

export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser() {
  return request('/users/me');
}

export function getAdminStats() {
  return request('/admin/stats');
}

export function getAdminUsers() {
  return request('/admin/users');
}

export function createAdminUser(data) {
  return request('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteAdminUser(id) {
  return request(`/admin/users/${id}`, {
    method: 'DELETE',
  });
}

export function getAdminProducts() {
  return request('/admin/products');
}

export function createAdminProduct(data) {
  return request('/admin/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteAdminProduct(id) {
  return request(`/admin/products/${id}`, {
    method: 'DELETE',
  });
}

export function getAdminScans() {
  return request('/admin/scans');
}

export function createAdminScan(data) {
  return request('/admin/scans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteAdminScan(id) {
  return request(`/admin/scans/${id}`, {
    method: 'DELETE',
  });
}

export function clearAdminScans() {
  return request('/admin/scans', {
    method: 'DELETE',
  });
}

export function seedAdminScans() {
  return request('/admin/scans/seed', {
    method: 'POST',
  });
}

export function getAdminAllergens() {
  return request('/admin/allergens');
}

export function createAdminAllergen(data) {
  return request('/admin/allergens', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteAdminAllergen(id) {
  return request(`/admin/allergens/${id}`, {
    method: 'DELETE',
  });
}

export function getAdminReports(params = {}) {
  const query = new URLSearchParams();
  if (params.days) query.set('days', params.days);
  if (params.verdict && params.verdict !== 'all') query.set('verdict', params.verdict);
  if (params.source && params.source !== 'all') query.set('source', params.source);
  const qStr = query.toString();
  return request(`/admin/reports${qStr ? `?${qStr}` : ''}`);
}

export function getAdminLogs() {
  return request('/admin/logs');
}

export function getAdminSettings() {
  return request('/admin/settings');
}

export function updateAdminSettings(data) {
  return request('/admin/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
