import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { SplashScreen } from '../components/SplashScreen';
import { PATHS } from '../routes/paths';

/**
 * SplashScreen's own visuals/behavior are untouched. This page only wires
 * its completion callback to real router navigation instead of a page
 * reload / local state switch.
 */
export const SplashPage: FC = () => {
  const navigate = useNavigate();
  return <SplashScreen onComplete={() => navigate(PATHS.REGISTER)} />;
};
