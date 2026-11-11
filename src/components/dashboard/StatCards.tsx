import { useCallback, useEffect, useState, useMemo } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Users,
  Banknote,
  AlertTriangle,
  ArrowUpLeft,
  RotateCw,
} from 'lucide-react';
import { getDashboardSummary, toDashboardSummaryErrorMessage } from '../../services/dashboardService';
import type { DashboardSummary } from '../../types/dashboard';
import { getCurrencyConfig } from '../../utils/currency';
import { PATHS } from '../../routes/paths';

interface StatCardsProps {
  refreshTrigger?: number;
}

export const StatCards: FC<StatCardsProps> = ({ refreshTrigger = 0 }) => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');

  const fetchSummary = useCallback((isMountedCheck?: () => boolean) => {
    getDashboardSummary()
      .then((data) => {
        if (isMountedCheck && !isMountedCheck()) return;
        setSummary(data);
        setLoadError(null);
      })
      .catch((err) => {
        if (isMountedCheck && !isMountedCheck()) return;
        setSummary(null);
        setLoadError(toDashboardSummaryErrorMessage(err));
      })
      .finally(() => {
        if (isMountedCheck && !isMountedCheck()) return;
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchSummary(() => isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchSummary, refreshTrigger]);

  const handleRetry = () => {
    setIsLoading(true);
    setLoadError(null);
    fetchSummary();
  };

  const currencySummaries = useMemo(() => {
    return summary?.summaryByCurrency ?? [];
  }, [summary]);

  const isMultiCurrency = currencySummaries.length > 1;

  // Derived active currency selection (avoids cascading setState in effects)
  const effectiveCurrency =
    selectedCurrency !== 'ALL' &&
    currencySummaries.some((c) => c.currencyCode === selectedCurrency)
      ? selectedCurrency
      : 'ALL';

  const activeCurrencyItem = useMemo(() => {
    if (currencySummaries.length === 1) {
      return currencySummaries[0];
    }
    if (effectiveCurrency !== 'ALL') {
      return currencySummaries.find((c) => c.currencyCode === effectiveCurrency) ?? null;
    }
    return null;
  }, [currencySummaries, effectiveCurrency]);

  const formatAmount = (val: number) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: val % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: 2,
    });
  };

  // Single-currency metrics (either merchant uses 1 currency or user scoped to 1 currency)
  const scopedTotalDebt = activeCurrencyItem
    ? activeCurrencyItem.totalDebt
    : summary?.totalDebt ?? 0;
  const scopedRemaining = activeCurrencyItem
    ? activeCurrencyItem.remainingAmount
    : summary?.remainingAmount ?? 0;
  const scopedCollected = activeCurrencyItem
    ? activeCurrencyItem.collectedAmount
    : summary?.collectedAmount ?? 0;
  const scopedCurrencyCfg = activeCurrencyItem
    ? getCurrencyConfig(activeCurrencyItem.currencyCode)
    : getCurrencyConfig('ILS');

  const showSingleCurrencyMetrics = !isMultiCurrency || activeCurrencyItem !== null;

  const collectionRate =
    scopedTotalDebt > 0
      ? Math.min(100, Math.max(0, Math.round((scopedCollected / scopedTotalDebt) * 100)))
      : 0;

  const overdueAmount = summary?.overdueAmount ?? 0;
  const activeCustomers = summary?.customersCount ?? 0;

  const overdueShareOfRemaining =
    !isMultiCurrency && scopedRemaining > 0 && overdueAmount > 0
      ? Math.min(100, Math.round((overdueAmount / scopedRemaining) * 100))
      : null;

  return (
    <section aria-label="المؤشرات المالية" dir="rtl" className="space-y-3">
      {loadError && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs sm:text-sm px-4 py-3 flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-rose-900/40 border border-rose-200 dark:border-rose-700 hover:bg-rose-50 cursor-pointer transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      )}

      {/* Unified Architectural Ledger Card */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        {/* Optional Multi-Currency Scope Bar */}
        {!isLoading && isMultiCurrency && (
          <div className="px-5 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
              ملخص الحسابات متعددة العملات
            </span>

            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70">
              <button
                type="button"
                onClick={() => setSelectedCurrency('ALL')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  effectiveCurrency === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                الكل
              </button>
              {currencySummaries.map((item) => {
                const cfg = getCurrencyConfig(item.currencyCode);
                const isSelected = effectiveCurrency === item.currencyCode;
                return (
                  <button
                    key={item.currencyCode}
                    type="button"
                    onClick={() => setSelectedCurrency(item.currencyCode)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>{cfg.labelAr}</span>
                    <span className="font-jakarta opacity-75">{cfg.symbol}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 1px Hairline Divided 4-Column Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-slate-200/80 dark:bg-slate-800">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="bg-white dark:bg-[#111827] p-5 space-y-3">
                <div className="h-3.5 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-7 w-32 bg-slate-200/70 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800/70 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-slate-200/80 dark:bg-slate-800">
            {/* 1. الذمم القائمة (المستحقة) */}
            <div className="bg-white dark:bg-[#111827] p-5 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  الديون القائمة (المستحق)
                </span>
                <CreditCard className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              </div>

              {showSingleCurrencyMetrics ? (
                <div className="text-right">
                  <div className="inline-flex items-baseline gap-1.5" dir="ltr">
                    <span className="text-2xl sm:text-[26px] font-bold text-slate-900 dark:text-white tracking-tight tabular-nums font-jakarta">
                      {summary ? formatAmount(scopedRemaining) : '—'}
                    </span>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      {scopedCurrencyCfg.symbol}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-slate-500 dark:text-slate-400 tabular-nums">
                    من أصل{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300" dir="ltr">
                      {formatAmount(scopedTotalDebt)} {scopedCurrencyCfg.symbol}
                    </span>{' '}
                    إجمالي المسجل
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {currencySummaries.map((item) => {
                    const cfg = getCurrencyConfig(item.currencyCode);
                    return (
                      <div
                        key={item.currencyCode}
                        className="flex items-baseline justify-between gap-2 text-sm"
                      >
                        <span className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
                          {cfg.labelAr}
                        </span>
                        <div className="inline-flex items-baseline gap-1 font-jakarta tabular-nums" dir="ltr">
                          <span className="text-base font-bold text-slate-900 dark:text-white">
                            {formatAmount(item.remainingAmount)}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {cfg.symbol}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. إجمالي التحصيلات ونسبة السداد */}
            <div className="bg-white dark:bg-[#111827] p-5 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  إجمالي التحصيلات
                </span>
                <Banknote className="w-4 h-4 text-emerald-600/80 dark:text-emerald-400/80 shrink-0" />
              </div>

              {showSingleCurrencyMetrics ? (
                <div className="text-right">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="inline-flex items-baseline gap-1.5" dir="ltr">
                      <span className="text-2xl sm:text-[26px] font-bold text-slate-900 dark:text-white tracking-tight tabular-nums font-jakarta">
                        {summary ? formatAmount(scopedCollected) : '—'}
                      </span>
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        {scopedCurrencyCfg.symbol}
                      </span>
                    </div>

                    {scopedTotalDebt > 0 && (
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded tabular-nums">
                        {collectionRate}% محصّل
                      </span>
                    )}
                  </div>

                  {/* Thin progress track */}
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-500"
                      style={{ width: `${collectionRate}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {currencySummaries.map((item) => {
                    const cfg = getCurrencyConfig(item.currencyCode);
                    return (
                      <div
                        key={item.currencyCode}
                        className="flex items-baseline justify-between gap-2 text-sm"
                      >
                        <span className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
                          {cfg.labelAr}
                        </span>
                        <div className="inline-flex items-baseline gap-1 font-jakarta tabular-nums" dir="ltr">
                          <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                            {formatAmount(item.collectedAmount)}
                          </span>
                          <span className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-400/80">
                            {cfg.symbol}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. المتأخرات عن السداد */}
            <div className="bg-white dark:bg-[#111827] p-5 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  المبالغ المتأخرة
                </span>
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 ${
                    overdueAmount > 0
                      ? 'text-rose-500 dark:text-rose-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
              </div>

              <div className="text-right">
                <div className="inline-flex items-baseline gap-1.5" dir="ltr">
                  <span
                    className={`text-2xl sm:text-[26px] font-bold tracking-tight tabular-nums font-jakarta ${
                      overdueAmount > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {summary ? formatAmount(overdueAmount) : '—'}
                  </span>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    ₪
                  </span>
                </div>

                <div className="mt-1.5 flex items-center justify-between gap-2 text-[11.5px]">
                  {overdueAmount > 0 ? (
                    <span className="text-rose-600/90 dark:text-rose-400/90 font-medium tabular-nums">
                      {overdueShareOfRemaining !== null
                        ? `${overdueShareOfRemaining}% من الديون القائمة`
                        : 'ذمم تجاوزت موعد الاستحقاق'}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      لا توجد مبالغ متأخرة
                    </span>
                  )}

                  {overdueAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => navigate(PATHS.OVERDUE_DEBTS_REPORT)}
                      className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-semibold inline-flex items-center gap-0.5 cursor-pointer shrink-0 transition-colors"
                    >
                      <span>التقرير</span>
                      <ArrowUpLeft className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 4. العملاء المسجلين */}
            <div className="bg-white dark:bg-[#111827] p-5 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  العملاء المسجّلون
                </span>
                <Users className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              </div>

              <div className="text-right">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-[26px] font-bold text-slate-900 dark:text-white tracking-tight tabular-nums font-jakarta">
                    {summary ? activeCustomers.toLocaleString('en-US') : '—'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    حساب عميل
                  </span>
                </div>

                <div className="mt-1.5 flex items-center justify-between gap-2 text-[11.5px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    إجمالي السجل النشط
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(PATHS.CUSTOMERS)}
                    className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold inline-flex items-center gap-0.5 cursor-pointer shrink-0 transition-colors"
                  >
                    <span>إدارة العملاء</span>
                    <ArrowUpLeft className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
