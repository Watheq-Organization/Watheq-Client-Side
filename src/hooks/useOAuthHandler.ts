import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { PATHS } from '../routes/paths';

/**
 * Hook to automatically handle incoming OAuth redirect parameters (such as from Google login).
 *
 * Checks URL search parameters for:
 * - token / accessToken / access_token / jwt / jwtToken
 * - refreshToken / refresh_token
 * - error / error_description
 */
export function useOAuthHandler() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token =
      searchParams.get('token') ||
      searchParams.get('accessToken') ||
      searchParams.get('access_token') ||
      searchParams.get('jwtToken') ||
      searchParams.get('jwt');

    const refreshToken =
      searchParams.get('refreshToken') ||
      searchParams.get('refresh_token');

    const error = searchParams.get('error') || searchParams.get('error_description');

    if (token) {
      // Store token and authenticate
      login(token, refreshToken || undefined);

      // Clean up the URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // Redirect to dashboard
      navigate(PATHS.DASHBOARD, { replace: true });
    } else if (error) {
      // Clean up the URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      let friendlyMsg = 'فشل تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.';
      if (error === 'external_login_failed') {
        friendlyMsg = 'تعذر إكمال تسجيل الدخول بواسطة Google. يرجى المحاولة لاحقاً.';
      } else if (error === 'access_denied') {
        friendlyMsg = 'تم إلغاء عملية تسجيل الدخول بواسطة Google.';
      }

      navigate(PATHS.LOGIN, {
        replace: true,
        state: { error: friendlyMsg },
      });
    }
  }, [location, login, navigate]);
}
