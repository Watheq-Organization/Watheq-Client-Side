import { useCallback, useEffect, useState } from 'react';
import type { FC } from 'react';
import { CreditCard, Users, Banknote } from 'lucide-react';
import { getDashboardSummary, toDashboardSummaryErrorMessage } from '../../services/dashboardService';
import type { DashboardSummary } from '../../types/dashboard';
import { getCurrencyConfig } from '../../utils/currency';

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

  const hasData = !isLoading && !loadError && summary !== null;
  const outstandingDebt = summary?.remainingAmount ?? 0;
  const activeCustomers = summary?.customersCount ?? 0;
  const totalCollections = summary?.collectedAmount ?? 0;

  const currencySummaries = summary?.summaryByCurrency ?? [];
  const hasMultiCurrency = currencySummaries.length > 1;
  const hasCurrencyBreakdown = currencySummaries.length > 0;

  const formatValue = (value: number) => {
    if (isLoading) return '...';
    if (!hasData) return '—';
    return Number(value).toLocaleString('en-US');
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-[#edf5ff] flex items-center justify-center text-[#2563eb]">
              <CreditCard className="w-6 h-6" />
            </div>
            {hasMultiCurrency && (
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                متعدد العملات
              </span>
            )}
          </div>

          <div className="mt-5 text-right">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">إجمالي الديون المستحقة</p>
            {isLoading ? (
              <div className="mt-2 text-2xl font-bold font-cairo text-slate-400 animate-pulse">...</div>
            ) : hasCurrencyBreakdown ? (
              <div className="mt-2 flex flex-wrap gap-2 justify-start items-center">
                {currencySummaries.map((item) => {
                  const cfg = getCurrencyConfig(item.currencyCode);
                  return (
                    <div
                      key={item.currencyCode}
                      className="flex items-baseline gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 shadow-2xs"
                    >
                      <span className="text-lg sm:text-xl font-bold font-cairo text-slate-900 dark:text-white">
                        {item.remainingAmount.toLocaleString('en-US')}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-cairo">
                        {cfg.symbol} ({cfg.labelAr})
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-1 flex items-baseline gap-1.5 justify-start">
                <span className="text-3xl font-bold font-cairo text-slate-900 dark:text-white tracking-tight">
                  {formatValue(outstandingDebt)}
                </span>
                <span className="text-xl font-bold text-slate-400 font-cairo mr-1">₪</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. العملاء النشطين (Active Customers) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-[#22c55e] flex items-center justify-center text-white shadow-xs">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-5 text-right">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">العملاء النشطين</p>
            <div className="mt-1 flex items-baseline gap-1.5 justify-start">
              <span className="text-3xl font-bold font-cairo text-slate-900 dark:text-white tracking-tight">
                {formatValue(activeCustomers)}
              </span>
              <span className="text-sm font-semibold text-slate-400 font-cairo">عميل</span>
            </div>
          </div>
        </div>

        {/* 3. إجمالي التحصيلات (Total Collections) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-[#edf2f7] flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Banknote className="w-6 h-6" />
            </div>
            {hasMultiCurrency && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-1 rounded-lg">
                حسب العملة
              </span>
            )}
          </div>

          <div className="mt-5 text-right">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">إجمالي التحصيلات</p>
            {isLoading ? (
              <div className="mt-2 text-2xl font-bold font-cairo text-slate-400 animate-pulse">...</div>
            ) : hasCurrencyBreakdown ? (
              <div className="mt-2 flex flex-wrap gap-2 justify-start items-center">
                {currencySummaries.map((item) => {
                  const cfg = getCurrencyConfig(item.currencyCode);
                  return (
                    <div
                      key={item.currencyCode}
                      className="flex items-baseline gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 shadow-2xs"
                    >
                      <span className="text-lg sm:text-xl font-bold font-cairo text-emerald-700 dark:text-emerald-300">
                        {item.collectedAmount.toLocaleString('en-US')}
                      </span>
                      <span className="text-xs font-bold text-emerald-600/80 dark:text-emerald-400 font-cairo">
                        {cfg.symbol} ({cfg.labelAr})
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-1 flex items-baseline gap-1.5 justify-start">
                <span className="text-3xl font-bold font-cairo text-slate-900 dark:text-white tracking-tight">
                  {formatValue(totalCollections)}
                </span>
                <span className="text-xl font-bold text-slate-400 font-cairo mr-1">₪</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
