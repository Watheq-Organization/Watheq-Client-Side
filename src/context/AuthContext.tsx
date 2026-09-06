import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './authContextInstance';
import type { AuthContextValue } from './authContextInstance';
import { getStoredToken, setStoredTokens, clearAllTokens, AUTH_LOGOUT_EVENT } from '../lib/authToken';

/**
 * The project had no existing auth state (no Redux, no Context, no auth
 * hook, no token helper — confirmed by searching the codebase). This is
 * the smallest authentication state architecture needed to support a
 * functional Login page and to keep it ready for a real token once the
 * login API is confirmed (see services/authService.ts).
 *
 * Token storage: localStorage is used here as the smallest reasonable
 * default in the absence of an existing convention or a confirmed backend
 * session strategy. This should be revisited once the real login API
 * contract (and any backend guidance on token storage) is confirmed.
 */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  const login = useCallback((newToken: string, newRefreshToken?: string) => {
    setStoredTokens(newToken, newRefreshToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    clearAllTokens();
    setToken(null);
  }, []);

  // Keeps isAuthenticated in sync when tokens are cleared from OUTSIDE a
  // component — e.g. httpClient's silent-refresh flow giving up after a
  // failed refresh (expired/revoked refresh token). Without this, a
  // component that isn't the one calling logout() would keep thinking the
  // user is still authenticated until its next remount.
  useEffect(() => {
    const handleExternalLogout = () => setToken(null);
    window.addEventListener(AUTH_LOGOUT_EVENT, handleExternalLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleExternalLogout);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
