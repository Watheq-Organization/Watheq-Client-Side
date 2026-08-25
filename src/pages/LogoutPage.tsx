import { useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutModal } from '../components/dashboard/LogoutModal';
import { DashboardScreen } from '../components/dashboard/DashboardScreen';
import { logoutUser } from '../services/authService';
import { PATHS } from '../routes/paths';

export const LogoutPage: FC = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    await logoutUser();
    setIsLoggingOut(false);
    navigate(PATHS.LOGIN, { replace: true });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Dashboard preview (matches screenshot where dashboard is visible behind the modal) */}
      <div className="pointer-events-none filter blur-xs select-none">
        <DashboardScreen />
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={true}
        onClose={handleCancel}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />
    </div>
  );
};
