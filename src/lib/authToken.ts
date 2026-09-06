/**
 * Single source of truth for where the auth tokens live in localStorage.
 *
 * Previously AuthContext.tsx used the key 'watheq_auth_token' while
 * httpClient.ts / authService.ts used 'auth_token'. That meant a
 * successful login wrote the token under one key while the app's auth
 * state (and the HTTP client's Authorization header) read from the
 * other — so isAuthenticated was never actually true after login, and
 * ProtectedRoute-style checks were impossible to build correctly.
 *
 * Everything that needs to read/write/clear the tokens should go
 * through these helpers instead of touching localStorage directly.
 */

export const TOKEN_STORAGE_KEY = 'auth_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

/**
 * Fired on `window` whenever both tokens are cleared (explicit logout, or
 * the silent refresh flow in httpClient.ts giving up after a failed
 * refresh attempt). AuthContext listens for this so its React state
 * (isAuthenticated) stays in sync even when the tokens are cleared from
 * outside a component — e.g. from the httpClient 401/refresh interceptor,
 * which has no access to the React tree.
 */
export const AUTH_LOGOUT_EVENT = 'watheq:auth-logout';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function setStoredRefreshToken(refreshToken: string): void {
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

export function clearStoredRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

/** Persists a fresh access/refresh token pair (login, register, or refresh-token). */
export function setStoredTokens(accessToken: string, refreshToken?: string | null): void {
  setStoredToken(accessToken);
  if (refreshToken) setStoredRefreshToken(refreshToken);
}

/**
 * Clears both tokens and notifies the rest of the app (AuthContext) that
 * the session ended, regardless of which code path triggered it (manual
 * logout button, or an automatic refresh-token failure).
 */
export function clearAllTokens(): void {
  clearStoredToken();
  clearStoredRefreshToken();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
  }
}
