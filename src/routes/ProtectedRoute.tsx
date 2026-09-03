import type { FC, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PATHS } from './paths';

/**
 * Wraps a route element and only renders it when the user is
 * authenticated (i.e. a token exists — see AuthContext). Otherwise it
 * redirects to /login, passing the attempted location along in router
 * state so LoginPage could optionally send the user back afterwards.
 */
export const ProtectedRoute: FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
