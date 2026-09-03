/**
 * Single source of truth for where the auth token lives in localStorage.
 *
 * Previously AuthContext.tsx used the key 'watheq_auth_token' while
 * httpClient.ts / authService.ts used 'auth_token'. That meant a
 * successful login wrote the token under one key while the app's auth
 * state (and the HTTP client's Authorization header) read from the
 * other — so isAuthenticated was never actually true after login, and
 * ProtectedRoute-style checks were impossible to build correctly.
 *
 * Everything that needs to read/write/clear the token should go
 * through these helpers instead of touching localStorage directly.
 */

export const TOKEN_STORAGE_KEY = 'auth_token';

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
