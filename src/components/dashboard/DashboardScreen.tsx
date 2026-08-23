import { useState } from 'react';
import type { FC } from 'react';
import { Calendar } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { StatCards } from './StatCards';
import { OverduePaymentsTable } from './OverduePaymentsTable';
import { RecentActivities } from './RecentActivities';

export const DashboardScreen: FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div
      className="min-h-screen bg-[#f4f7fb] text-slate-800 font-cairo antialiased flex"
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
        />

        {/* Dashboard Body Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Welcome & Date Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-right">
              <h1 className="text-2xl sm:text-3xl font-bold font-tajawal text-slate-900 tracking-tight">
                لوحة القيادة
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500 font-cairo">
                مرحباً بك محمد، إليك ملخص العمليات اليوم.
              </p>
            </div>

            {/* Date Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold font-tajawal text-slate-600 shadow-2xs self-start sm:self-auto">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>١٥ أكتوبر ٢٠٢٣</span>
            </div>
          </div>

          {/* Metric / Stat Cards (3 Top Cards) */}
          <StatCards />

          {/* Bottom Grid: Overdue Payments (wider) + Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Overdue Payments Table (takes 7 or 8 cols on desktop) */}
            <div className="lg:col-span-8 flex flex-col">
              <OverduePaymentsTable searchQuery={searchQuery} />
            </div>

            {/* Recent Activities Feed (takes 4 or 5 cols on desktop) */}
            <div className="lg:col-span-4 flex flex-col">
              <RecentActivities />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
