import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShoppingCart, RotateCw, Banknote } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { StatCards } from './StatCards';
import { OverduePaymentsTable } from './OverduePaymentsTable';
import { RecentActivities } from './RecentActivities';
import { useMerchantProfile } from '../../services/merchantProfileService';
import { formatApiDate, getDeviceLocalDateString } from '../../lib/dateUtils';
import { PATHS } from '../../routes/paths';

export const DashboardScreen: FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const merchantProfile = useMerchantProfile();

  const currentDateDisplay = useMemo(() => {
    return formatApiDate(getDeviceLocalDateString());
  }, []);

  const handleRefreshAll = () => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 550);
  };

  return (
    <div
      className="min-h-screen bg-[#F5F6F8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-cairo antialiased flex"
      dir="rtl"
    >
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content Area (Offset by sidebar width on desktop in RTL) */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        {/* Top Header */}
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="ابحث في الذمم المتأخرة بالاسم أو الهاتف..."
        />

        {/* Dashboard Body Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto w-full space-y-5 flex-1">
          {/* Workspace Header & Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>{merchantProfile.businessName || 'متجر وثّق'}</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span className="tabular-nums">{currentDateDisplay}</span>
              </div>
              <h1 className="mt-1 text-xl sm:text-2xl font-bold font-cairo text-slate-900 dark:text-white tracking-tight">
                لوحة التحكم
              </h1>
            </div>

            {/* Restrained Merchant Action Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshAll}
                className="w-9 h-9 rounded-lg bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="تحديث بيانات لوحة التحكم"
                aria-label="تحديث البيانات"
              >
                <RotateCw
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-slate-800 dark:text-slate-200' : ''}`}
                />
              </button>

              <button
                type="button"
                onClick={() => navigate(PATHS.POS)}
                className="h-9 px-3.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>الكاشير</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(PATHS.CASH_SALE)}
                className="h-9 px-3.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Banknote className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>بيع نقدي</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(PATHS.DEBT_NEW)}
                className="h-9 px-4 rounded-lg bg-[#09152B] hover:bg-[#12264B] dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة دين</span>
              </button>
            </div>
          </div>

          {/* Unified Financial Ledger Strip */}
          <StatCards refreshTrigger={refreshTrigger} />

          {/* Bottom Asymmetric Ledger & Activity Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8">
              <OverduePaymentsTable
                searchQuery={searchQuery}
                refreshTrigger={refreshTrigger}
              />
            </div>

            <div className="lg:col-span-4">
              <RecentActivities refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
