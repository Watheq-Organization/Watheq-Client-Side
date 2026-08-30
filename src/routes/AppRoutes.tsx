import type { FC } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PATHS } from './paths';
import { SplashPage } from '../pages/SplashPage';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';
import { VerifyOtpPage } from '../pages/VerifyOtpPage.tsx';
import { DashboardPage } from '../pages/DashboardPage.tsx';
import { AboutPage } from '../pages/AboutPage.tsx';
import { HelpCenterPage } from '../pages/HelpCenterPage.tsx';
import { ContactPage } from '../pages/ContactPage.tsx';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicyPage.tsx';

import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { VerifyResetOtpPage } from '../pages/VerifyResetOtpPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { LogoutPage } from '../pages/LogoutPage';

export const AppRoutes: FC = () => {
  return (
    <Routes>
      <Route path={PATHS.HOME} element={<Navigate to={PATHS.SPLASH} replace />} />
      <Route path={PATHS.SPLASH} element={<SplashPage />} />
      <Route path={PATHS.REGISTER} element={<RegisterPage />} />
      <Route path={PATHS.LOGIN} element={<LoginPage />} />
      <Route path={PATHS.VERIFY_OTP} element={<VerifyOtpPage />} />
      <Route path={PATHS.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      <Route path={PATHS.VERIFY_RESET_OTP} element={<VerifyResetOtpPage />} />
      <Route path={PATHS.RESET_PASSWORD} element={<ResetPasswordPage />} />
      <Route path={PATHS.DASHBOARD} element={<DashboardPage />} />
      <Route path={PATHS.ABOUT} element={<AboutPage />} />
      <Route path={PATHS.HELP} element={<HelpCenterPage />} />
      <Route path={PATHS.CONTACT} element={<ContactPage />} />
      <Route path={PATHS.PRIVACY_POLICY} element={<PrivacyPolicyPage />} />
      <Route path={PATHS.LOGOUT} element={<LogoutPage />} />

      {/* Catch-all: redirect unknown paths home rather than inventing a 404 page design */}
      <Route path="*" element={<Navigate to={PATHS.HOME} replace />} />
    </Routes>
  );
};




export default AppRoutes;
