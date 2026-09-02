import { useState } from 'react';
import type { FC } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  BellRing,
  Tv2,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '../../routes/paths';
import { LogoutModal } from './LogoutModal';
import { logoutUser } from '../../services/authService';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Sidebar: FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  activeTab = 'dashboard',
  onTabChange,
}) => {
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'لوحة القيادة', icon: LayoutDashboard, path: PATHS.DASHBOARD },
    { id: 'customers', label: 'العملاء', icon: Users, path: PATHS.CUSTOMERS },
    { id: 'add-debt', label: 'إضافة دين', icon: CreditCard },
    { id: 'reports', label: 'التقارير', icon: BarChart3 },
    { id: 'reminder-settings', label: 'إعدادات التذكيرات', icon: BellRing },
    { id: 'subscriptions', label: 'الاشتراكات', icon: Tv2 },
  ];

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    await logoutUser();
    setIsLoggingOut(false);
    setIsLogoutModalOpen(false);
    navigate(PATHS.LOGIN, { replace: true });
  };


  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-72 bg-[#051838] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'
        }`}
        dir="rtl"
      >
        {/* Top Header & Logo */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo Emblem */}
              <div className="relative w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center p-1.5 border border-white/15 shadow-inner">
                <img
                  src="/logo-hd.png"
                  alt="وثّق"
                  className="w-full h-full object-contain drop-shadow"
                />
              </div>

              {/* Brand Text */}
              <div className="flex flex-col">
                <span className="text-xl font-bold font-tajawal text-white tracking-tight leading-tight">
                  وثَّـق
                </span>
                <span className="text-xs text-blue-200/70 font-medium">
                  بوابة التاجر
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="إغلاق القائمة"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="mt-10 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (onTabChange) onTabChange(item.id);
                    if (item.path) navigate(item.path);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-right ${
                    isActive
                      ? 'bg-[#183462] text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/6'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Settings & Logout */}
        <div className="p-6 border-t border-white/10 space-y-1.5">
          <button
            type="button"
            onClick={() => {
              if (onTabChange) onTabChange('settings');
              if (onClose) onClose();
            }}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-right cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#183462] text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/6'
            }`}
          >
            <Settings className="w-5 h-5 text-slate-400" />
            <span>الإعدادات</span>
          </button>

          <button
            type="button"
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 text-right cursor-pointer"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-300" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />
    </>
  );
};

