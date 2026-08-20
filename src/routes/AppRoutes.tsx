import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PATHS } from './paths';
import { SplashPage } from '../pages/SplashPage';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { CustomersPage } from '../pages/CustomersPage';
import { DebtsPage } from '../pages/DebtsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public / Auth Routes */}
      <Route path={PATHS.HOME} element={<Navigate to={PATHS.REGISTER} replace />} />
      <Route path={PATHS.SPLASH} element={<SplashPage />} />
      <Route path={PATHS.REGISTER} element={<RegisterPage />} />
      <Route path={PATHS.LOGIN} element={<LoginPage />} />

      {/* Authenticated / Management Routes (With Sidebar Layout) */}
      <Route element={<DashboardLayout />}>
        <Route path={PATHS.DASHBOARD} element={<DashboardPage />} />
        <Route path={PATHS.CUSTOMERS} element={<CustomersPage />} />
        <Route path={PATHS.DEBTS} element={<DebtsPage />} />
        <Route path={PATHS.REPORTS} element={<ReportsPage />} />
        <Route path={PATHS.SETTINGS} element={<SettingsPage />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
