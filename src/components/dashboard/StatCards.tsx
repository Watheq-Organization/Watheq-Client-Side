import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { CreditCard, Users, Banknote, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { getDashboardSummary } from '../../services/dashboardService';
import type { DashboardSummary } from '../../types/dashboard';

export const StatCards: FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getDashboardSummary()
      .then((data) => {
        if (isMounted && data) {
          setSummary(data);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Real values from GET /api/Dashboard/summary (DashboardSummaryDto).
  // No demo fallback numbers: while loading we show '...', and if the
  // request fails (summary stays null) we show 0 rather than fake data.
  const outstandingDebt = summary?.totalDebt ?? 0;
  const activeCustomers = summary?.customersCount ?? 0;
  const totalCollections = summary?.collectedAmount ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5" dir="rtl">
      {/* 1. إجمالي الديون المستحقة (Total Outstanding Debts) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-[#edf5ff] flex items-center justify-center text-[#2563eb]">
            <CreditCard className="w-6 h-6" />
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ffeaec] text-[#e11d48] text-xs font-bold font-tajawal">
            <span>- ١٢%</span>
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-5 text-right">
          <p className="text-slate-500 text-sm font-medium">إجمالي الديون المستحقة</p>
          <div className="mt-1 flex items-baseline gap-1.5 justify-start">
            <span className="text-3xl font-bold font-tajawal text-slate-900 tracking-tight">
              {isLoading ? '...' : Number(outstandingDebt).toLocaleString('ar-SA')}
            </span>
            <span className="text-sm font-semibold text-slate-400 font-cairo">ر.س</span>
          </div>
        </div>
      </div>

      {/* 2. العملاء النشطين (Active Customers) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-[#22c55e] flex items-center justify-center text-white shadow-xs">
            <Users className="w-6 h-6" />
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e8fbf0] text-[#16a34a] text-xs font-bold font-tajawal">
            <span>+ ٥</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-5 text-right">
          <p className="text-slate-500 text-sm font-medium">العملاء النشطين</p>
          <div className="mt-1 flex items-baseline gap-1.5 justify-start">
            <span className="text-3xl font-bold font-tajawal text-slate-900 tracking-tight">
              {isLoading ? '...' : Number(activeCustomers).toLocaleString('ar-SA')}
            </span>
            <span className="text-sm font-semibold text-slate-400 font-cairo">عميل</span>
          </div>
        </div>
      </div>

      {/* 3. إجمالي التحصيلات (Total Collections) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-[#edf2f7] flex items-center justify-center text-slate-600">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        <div className="mt-5 text-right">
          <p className="text-slate-500 text-sm font-medium">إجمالي التحصيلات</p>
          <div className="mt-1 flex items-baseline gap-1.5 justify-start">
            <span className="text-3xl font-bold font-tajawal text-slate-900 tracking-tight">
              {isLoading ? '...' : Number(totalCollections).toLocaleString('ar-SA')}
            </span>
            <span className="text-sm font-semibold text-slate-400 font-cairo">ر.س</span>
          </div>
        </div>
      </div>
    </div>
  );
};

