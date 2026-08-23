import type { FC } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PATHS } from './paths';
import { SplashPage } from '../pages/SplashPage';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';

/**
 * Real route configuration, replacing the previous stale/broken scaffold
 * that imported nonexistent ../pages/*, ../layouts/*, and ./paths modules
 * and was never wired into main.tsx.
 *
 * Only routes with an actual page in this project are defined. There is
 * no Dashboard (or any other authenticated page) anywhere in this repo,
 * so no Dashboard route, protected route, or route guard is invented
 * here — per project instructions. When a real authenticated page exists,
 * wrap it in a route guard that reads `useAuth().isAuthenticated`.
 */
export const AppRoutes: FC = () => {
  return (
    <Routes>
      <Route path={PATHS.HOME} element={<Navigate to={PATHS.SPLASH} replace />} />
      <Route path={PATHS.SPLASH} element={<SplashPage />} />
      <Route path={PATHS.REGISTER} element={<RegisterPage />} />
      <Route path={PATHS.LOGIN} element={<LoginPage />} />

      {/* Catch-all: redirect unknown paths home rather than inventing a 404 page design */}
      <Route path="*" element={<Navigate to={PATHS.HOME} replace />} />
    </Routes>
  );
};

export default AppRoutes;
