import { useCallback, useEffect, useState } from 'react';
import type { FC } from 'react';
import { CreditCard, Users, Banknote } from 'lucide-react';
import { getDashboardSummary, toDashboardSummaryErrorMessage } from '../../services/dashboardService';
import type { DashboardSummary } from '../../types/dashboard';

export const StatCards: FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSummary = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    getDashboardSummary()
      .then((data) => {
        setSummary(data);
      })
      .catch((err) => {
        // Real error state per the API integration rules: never fall back
        // to demo/fake numbers when the request fails.
        setSummary(null);
        setLoadError(toDashboardSummaryErrorMessage(err));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Real values from GET /api/Dashboard/summary (DashboardSummaryDto). No
  // demo fallback numbers: while loading we show '...', and on failure we
  // show '—' (summary stays null) instead of a fake 0.
  //
  // "إجمالي الديون المستحقة" (Total Outstanding Debts) must read
  // `remainingAmount` — "total amount still outstanding" per the DTO
  // comment in types/dashboard.ts — NOT `totalDebt`, which is "total
  // value of all debts EVER created" (a running gross total). That's
  // exactly why this card only ever went up on a new debt and never came
  // down on a payment: `totalDebt` doesn't decrease when a debt gets paid
  // off, only `remainingAmount` does. The backend was already sending the
  // right number in `remainingAmount` the whole time — this card was just
  // reading the wrong field of the response.
  const hasData = !isLoading && !loadError && summary !== null;
  const outstandingDebt = summary?.remainingAmount ?? 0;
  const activeCustomers = summary?.customersCount ?? 0;
  const totalCollections = summary?.collectedAmount ?? 0;

  const formatValue = (value: number) => {
    if (isLoading) return '...';
    if (!hasData) return '—';
    return Number(value).toLocaleString('ar-SA');
  };

  return (
    <div dir="rtl">
      {loadError && (
        <div className="mb-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={loadSummary}
            className="shrink-0 text-xs font-bold underline hover:no-underline cursor-pointer"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. إجمالي الديون المستحقة (Total Outstanding Debts) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-[#edf5ff] flex items-center justify-center text-[#2563eb]">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-5 text-right">
            <p className="text-slate-500 text-sm font-medium">إجمالي الديون المستحقة</p>
            <div className="mt-1 flex items-baseline gap-1.5 justify-start">
              <span className="text-3xl font-bold font-tajawal text-slate-900 tracking-tight">
                {formatValue(outstandingDebt)}
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
          </div>

          <div className="mt-5 text-right">
            <p className="text-slate-500 text-sm font-medium">العملاء النشطين</p>
            <div className="mt-1 flex items-baseline gap-1.5 justify-start">
              <span className="text-3xl font-bold font-tajawal text-slate-900 tracking-tight">
                {formatValue(activeCustomers)}
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
                {formatValue(totalCollections)}
              </span>
              <span className="text-sm font-semibold text-slate-400 font-cairo">ر.س</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
