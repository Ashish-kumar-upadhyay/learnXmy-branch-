export const ACCESS_TOKEN_KEY = "learnx_accessToken";
export const REFRESH_TOKEN_KEY = "learnx_refreshToken";

const raw = import.meta.env.VITE_API_BASE_URL?.trim();
if (!raw) {
  throw new Error("VITE_API_BASE_URL is missing. Set it in Frontend/.env.");
}
/** Backend origin only — no hardcoded hosts; configure via env. */
export const API_BASE = raw.replace(/\/$/, "");

export function setTokens(tokens: { accessToken: string; refreshToken: string }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/** Readable message from `api()` error payload (string, or `{ message, errors }`). */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const e = error as { message?: unknown; errors?: unknown };
    if (Array.isArray(e.errors) && e.errors.length > 0) {
      return e.errors.map((x) => String(x)).join("; ");
    }
    if (typeof e.message === "string" && e.message.trim()) return e.message;
  }
  return fallback;
}

import { apiCache } from "./cache";

export function clearApiCache() {
  apiCache.clear();
}

export async function api<T>(
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    accessToken?: string; 
    _retryAfterRefresh?: boolean; 
    useCache?: boolean; 
    cacheTTL?: number 
  } = {}
): Promise<{ status: number; data?: T; message?: string; error?: unknown }> {
  const url = `${API_BASE}${path}`;
  const accessToken = options.accessToken;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  // Check cache for GET requests
  if (options.useCache !== false && (!options.method || options.method === 'GET')) {
    const { accessToken, _retryAfterRefresh, useCache, cacheTTL, ...optionsForCache } = options;
    const cacheKey = apiCache.generateKey(url, optionsForCache);
    const cachedData = apiCache.get<T>(cacheKey);
    if (cachedData) {
      return { status: 200, data: cachedData };
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // If token expired/invalid, try refresh once and retry request.
  if (res.status === 401 && !options._retryAfterRefresh) {
    const rt = getRefreshToken();
    if (rt) {
      try {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        });
        const refreshText = await refreshRes.text();
        let refreshJson: any = null;
        try {
          refreshJson = refreshText ? JSON.parse(refreshText) : null;
        } catch {
          refreshJson = null;
        }

        const payload = refreshJson?.data;
        if (refreshRes.ok && payload?.accessToken && payload?.refreshToken) {
          setTokens({ accessToken: payload.accessToken, refreshToken: payload.refreshToken });
          return await api<T>(path, {
            ...options,
            accessToken: payload.accessToken,
            _retryAfterRefresh: true,
          });
        }
      } catch {
        // ignore and fall through to normal error handling below
      }
    }
  }

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  // Backend format: { success: boolean, message, data, errors }
  if (json && typeof json === "object" && "success" in json && "data" in json) {
    if (!res.ok || json.success === false) {
      return { status: res.status, error: json.errors ?? json.message ?? json };
    }
    return {
      status: res.status,
      data: json.data as T,
      message: typeof json.message === "string" ? json.message : undefined,
    };
  }

  if (!res.ok) return { status: res.status, error: json };
  const msg =
    json && typeof json === "object" && "message" in json && typeof (json as { message?: unknown }).message === "string"
      ? (json as { message: string }).message
      : undefined;

  // Cache successful GET responses
  if (options.useCache !== false && (!options.method || options.method === 'GET') && res.ok) {
    const { accessToken, _retryAfterRefresh, useCache, cacheTTL, ...optionsForCache } = options;
    const cacheKey = apiCache.generateKey(url, optionsForCache);
    apiCache.set(cacheKey, json as T, cacheTTL);
  }

  return { status: res.status, data: json as T, message: msg };
}

