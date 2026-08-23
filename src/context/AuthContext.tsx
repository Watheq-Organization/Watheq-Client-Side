import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './authContextInstance';
import type { AuthContextValue } from './authContextInstance';

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

const TOKEN_STORAGE_KEY = 'watheq_auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY)
  );

  const login = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
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
