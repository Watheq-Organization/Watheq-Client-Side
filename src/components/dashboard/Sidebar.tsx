import { useState } from 'react';
import type { FC } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  X,
  Banknote,
  RefreshCw,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PATHS } from '../../routes/paths';
import { LogoutModal } from './LogoutModal';
import { logoutUser } from '../../services/authService';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  tag?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'العمليات اليومية',
    items: [
      { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, path: PATHS.DASHBOARD },
      { id: 'pos', label: 'نقطة البيع (الكاشير)', icon: ShoppingCart, path: PATHS.POS, tag: 'POS' },
      { id: 'customers', label: 'العملاء', icon: Users, path: PATHS.CUSTOMERS },
      { id: 'add-debt', label: 'إضافة دين', icon: CreditCard, path: PATHS.DEBT_NEW },
      { id: 'cash-sale', label: 'مبيعات نقدية', icon: Banknote, path: PATHS.CASH_SALE },
    ],
  },
  {
    title: 'المخزون والمالية',
    items: [
      { id: 'inventory', label: 'المخزون والأصناف', icon: Package, path: PATHS.INVENTORY },
      { id: 'payments', label: 'سجل المدفوعات', icon: Receipt, path: PATHS.PAYMENTS },
      { id: 'mizan', label: 'مطابقة المبيعات (ميزان)', icon: RefreshCw, path: PATHS.MIZAN },
      { id: 'reports', label: 'التقارير', icon: BarChart3, path: PATHS.REPORTS },
    ],
  },
];

export const Sidebar: FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  activeTab = 'dashboard',
  onTabChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isSettingsActive = activeTab === 'settings' || location.pathname === PATHS.SETTINGS;

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
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300 print:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container (w-72 preserved for compatibility with lg:mr-72 layout offset) */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-72 bg-[#09152B] dark:bg-[#070D18] text-slate-200 flex flex-col border-l border-slate-800/70 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'
        } print:hidden`}
        dir="rtl"
      >
        {/* Top Brand Lockup */}
        <div className="px-5 h-16 flex items-center justify-between border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] p-1.5 flex items-center justify-center shrink-0">
              <img
                src="/logo-hd.png"
                alt="وثّق"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-[17px] font-bold font-cairo text-white tracking-tight leading-tight">
                وثَّـق
              </span>
              <span className="text-[11px] text-slate-400 font-medium truncate">
                إدارة الذمم والمبيعات
              </span>
            </div>
          </div>

          {/* Mobile Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400/80 tracking-wide font-cairo">
                {group.title}
              </div>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    !isSettingsActive &&
                    (location.pathname === item.path || activeTab === item.id);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (onTabChange) onTabChange(item.id);
                        if (item.path) navigate(item.path);
                        if (onClose) onClose();
                      }}
                      className={`group relative w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors duration-150 text-right cursor-pointer ${
                        isActive
                          ? 'bg-white/[0.09] text-white font-semibold'
                          : 'text-slate-300/85 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {isActive && (
                        <span
                          className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full bg-emerald-400"
                          aria-hidden="true"
                        />
                      )}

                      <span className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-[18px] h-[18px] shrink-0 transition-colors duration-150 ${
                            isActive
                              ? 'text-emerald-400'
                              : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>

                      {item.tag && (
                        <span
                          className={`text-[10px] font-jakarta font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                            isActive
                              ? 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10'
                              : 'text-slate-400 border-white/10 bg-white/[0.03]'
                          }`}
                        >
                          {item.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Utility Section: Settings & Logout */}
        <div className="p-3.5 border-t border-white/[0.07] space-y-0.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onTabChange) onTabChange('settings');
              navigate(PATHS.SETTINGS);
              if (onClose) onClose();
            }}
            className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors duration-150 text-right cursor-pointer ${
              isSettingsActive
                ? 'bg-white/[0.09] text-white font-semibold'
                : 'text-slate-300/85 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {isSettingsActive && (
              <span
                className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full bg-emerald-400"
                aria-hidden="true"
              />
            )}
            <Settings
              className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                isSettingsActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
              }`}
            />
            <span>الإعدادات</span>
          </button>

          <button
            type="button"
            onClick={handleLogoutClick}
            className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-slate-300/85 hover:text-rose-300 hover:bg-rose-500/10 transition-colors duration-150 text-right cursor-pointer"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0 text-slate-400 group-hover:text-rose-400 transition-colors" />
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
