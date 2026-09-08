import { API_BASE_URL } from '../config/env';
import {
  getStoredToken,
  getStoredRefreshToken,
  setStoredTokens,
  clearAllTokens,
} from '../lib/authToken';

/**
 * The project had no existing Axios instance, fetch wrapper, or API client
 * of any kind (confirmed by searching the codebase for axios/fetch/apiClient
 * before writing this). This is the smallest client needed to satisfy:
 *   "API calls must NOT be written directly inside JSX/page components."
 *
 * Uses the native fetch API (no new dependency added) and centralizes the
 * base URL via src/config/env.ts.
 */

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// Endpoints that must never trigger the silent-refresh-and-retry flow below,
// so a 401 from one of them is always surfaced as-is:
//  - refresh-token: it IS the refresh call; retrying it would loop forever.
//  - logout: the user is already ending the session, refreshing first would
//    just re-authenticate them right before logging out.
const AUTH_REFRESH_EXEMPT_PATHS = ['/auth/refresh-token', '/auth/logout'];

/**
 * POST /api/Auth/refresh-token
 *
 * Direct fetch (bypasses `request()` below) so this can be called from
 * inside the 401 handler without recursion. Sends the previous access
 * token + refresh token, and — per the documented Refresh Token Rotation —
 * stores whatever NEW pair comes back, since the old refresh token is
 * invalidated by the backend as soon as it's used once.
 */
async function performTokenRefresh(): Promise<string | null> {
  const accessToken = getStoredToken();
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ accessToken, refreshToken }),
    });

    if (!response.ok) {
      clearAllTokens();
      return null;
    }

    const data = (await response.json().catch(() => null)) as
      | { accessToken?: string; refreshToken?: string }
      | null;

    if (!data?.accessToken) {
      clearAllTokens();
      return null;
    }

    setStoredTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    // Network failure while refreshing: don't wipe the session over a
    // transient connectivity blip, just let this attempt fail.
    return null;
  }
}

// Ensures concurrent 401s (e.g. several requests in flight when the token
// expires) trigger only ONE refresh call instead of a stampede — every
// caller awaits the same in-flight promise.
let inFlightRefresh: Promise<string | null> | null = null;

function refreshAccessTokenOnce(): Promise<string | null> {
  if (!inFlightRefresh) {
    inFlightRefresh = performTokenRefresh().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

async function request<TResponse>(
  path: string,
  options: RequestInit = {},
  _isRetry = false
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path}`;
  const token = getStoredToken();

  // FormData (multipart/form-data, used by file-upload endpoints like
  // registerPayment) must NOT get a manually-set Content-Type: the browser
  // has to compute the multipart boundary itself. JSON requests keep the
  // explicit header exactly as before.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('TIMEOUT', 408, { message: 'انتهت مهلة انتظار الخادم.' });
    }
    // Network-level failure (offline, CORS, DNS, server unreachable, etc.)
    throw new ApiError('NETWORK_ERROR', 0, null);
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    // Silent refresh-and-retry: only for a genuinely authenticated request
    // (we actually sent a token) that came back 401, wasn't already a
    // retry, and isn't one of the auth endpoints above.
    if (
      response.status === 401 &&
      !_isRetry &&
      token &&
      !AUTH_REFRESH_EXEMPT_PATHS.includes(path)
    ) {
      const newToken = await refreshAccessTokenOnce();
      if (newToken) {
        return request<TResponse>(path, options, true);
      }
    }

    // Diagnostic only — doesn't change any behavior, just makes the real
    // server response visible in the console so a failing request can be
    // debugged without digging through the Network tab by hand. This is
    // the single place every API call funnels through, so it covers every
    // endpoint, not just createDebt.
    // eslint-disable-next-line no-console
    console.error(`[httpClient] ${options.method ?? 'GET'} ${url} -> ${response.status}`, {
      status: response.status,
      allowHeader: response.headers.get('allow'),
      contentType,
      body,
    });

    throw new ApiError(`HTTP_${response.status}`, response.status, body);
  }

  return body as TResponse;
}

export const httpClient = {
  post: <TResponse>(path: string, data?: unknown) =>
    request<TResponse>(path, {
      method: 'POST',
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    }),
  /** POST with a FormData body (multipart/form-data) — for endpoints that
   * accept a file upload (e.g. registerPayment's optional receiptImage).
   * Never JSON.stringify's the body and never sets Content-Type manually;
   * see the isFormData branch in request() above. */
  postForm: <TResponse>(path: string, formData: FormData) =>
    request<TResponse>(path, { method: 'POST', body: formData }),
  put: <TResponse>(path: string, data: unknown) =>
    request<TResponse>(path, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  get: <TResponse>(path: string) => request<TResponse>(path, { method: 'GET' }),
  delete: <TResponse>(path: string) => request<TResponse>(path, { method: 'DELETE' }),
};
