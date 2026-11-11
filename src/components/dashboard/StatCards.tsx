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
  const hasCurrencyOverdueBreakdown =
    currencySummaries.length > 0 &&
    currencySummaries.every((c) => c.overdueAmount !== undefined);

  const collectionRate =
    scopedTotalDebt > 0
      ? Math.min(100, Math.max(0, Math.round((scopedCollected / scopedTotalDebt) * 100)))
      : 0;

  const scopedOverdue: number | null = activeCurrencyItem
    ? (activeCurrencyItem.overdueAmount ?? (!isMultiCurrency ? summary?.overdueAmount ?? 0 : null))
    : summary?.overdueAmount ?? 0;

  const hasOverdueAlert = showSingleCurrencyMetrics
    ? (scopedOverdue ?? 0) > 0
    : hasCurrencyOverdueBreakdown
      ? currencySummaries.some((c) => (c.overdueAmount ?? 0) > 0)
      : (summary?.overdueAmount ?? 0) > 0;

  const activeCustomers = summary?.customersCount ?? 0;

  const overdueShareOfRemaining =
    showSingleCurrencyMetrics &&
    scopedRemaining > 0 &&
    scopedOverdue !== null &&
    scopedOverdue > 0
      ? Math.min(100, Math.round((scopedOverdue / scopedRemaining) * 100))
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
      <div className="rounded-xl border border-slate-300/90 dark:border-slate-700 bg-white dark:bg-[#111827] shadow-xs overflow-hidden">
        {/* Optional Multi-Currency Scope Bar */}
        {!isLoading && isMultiCurrency && (
          <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              ملخص الحسابات متعددة العملات
            </span>

            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedCurrency('ALL')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  effectiveCurrency === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-[#09152B] dark:text-white shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-[#09152B] dark:hover:text-white'
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
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-700 text-[#09152B] dark:text-white shadow-2xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-[#09152B] dark:hover:text-white'
                    }`}
                  >
                    <span>{cfg.labelAr}</span>
                    <span className="font-jakarta opacity-85">{cfg.symbol}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 1px Hairline Divided 4-Column Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-800">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="bg-white dark:bg-[#111827] p-5 space-y-3">
                <div className="h-3.5 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-7 w-32 bg-slate-200/70 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800/70 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-800">
            {/* 1. الذمم القائمة (المستحقة) */}
            <div className="bg-white dark:bg-[#111827] p-5 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
                  الديون القائمة (المستحق)
                </span>
                <CreditCard className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
              </div>

              {showSingleCurrencyMetrics ? (
                <div className="text-right">
                  <div className="inline-flex items-baseline gap-1.5" dir="ltr">
                    <span className="text-[28px] sm:text-[30px] font-extrabold text-[#09152B] dark:text-white tracking-tight tabular-nums font-jakarta">
                      {summary ? formatAmount(scopedRemaining) : '—'}
                    </span>
                    <span className="text-base font-bold text-slate-600 dark:text-slate-300 font-jakarta">
                      {scopedCurrencyCfg.symbol}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                    من أصل{' '}
                    <span className="font-bold text-[#09152B] dark:text-slate-100 font-jakarta" dir="ltr">
                      {formatAmount(scopedTotalDebt)} {scopedCurrencyCfg.symbol}
                    </span>{' '}
                    إجمالي المسجل
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currencySummaries.map((item) => {
                    const cfg = getCurrencyConfig(item.currencyCode);
                    return (
                      <div
                        key={item.currencyCode}
                        className="flex items-baseline justify-between gap-2"
                      >
                        <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                          {cfg.labelAr}
                        </span>
                        <div className="inline-flex items-baseline gap-1 font-jakarta tabular-nums" dir="ltr">
                          <span className="text-[17px] font-extrabold text-[#09152B] dark:text-white">
                            {formatAmount(item.remainingAmount)}
                          </span>
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
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
                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
                  إجمالي التحصيلات
                </span>
                <Banknote className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              </div>

              {showSingleCurrencyMetrics ? (
                <div className="text-right">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="inline-flex items-baseline gap-1.5" dir="ltr">
                      <span className="text-[28px] sm:text-[30px] font-extrabold text-emerald-700 dark:text-emerald-400 tracking-tight tabular-nums font-jakarta">
                        {summary ? formatAmount(scopedCollected) : '—'}
                      </span>
                      <span className="text-base font-bold text-emerald-700/85 dark:text-emerald-300 font-jakarta">
                        {scopedCurrencyCfg.symbol}
                      </span>
                    </div>

                    {scopedTotalDebt > 0 && (
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md tabular-nums">
                        {collectionRate}% محصّل
                      </span>
                    )}
                  </div>

                  {/* Thin progress track */}
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-500"
                      style={{ width: `${collectionRate}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {currencySummaries.map((item) => {
                    const cfg = getCurrencyConfig(item.currencyCode);
                    return (
                      <div
                        key={item.currencyCode}
                        className="flex items-baseline justify-between gap-2"
                      >
                        <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                          {cfg.labelAr}
                        </span>
                        <div className="inline-flex items-baseline gap-1 font-jakarta tabular-nums" dir="ltr">
                          <span className="text-[17px] font-extrabold text-emerald-700 dark:text-emerald-400">
                            {formatAmount(item.collectedAmount)}
                          </span>
                          <span className="text-sm font-bold text-emerald-700/80 dark:text-emerald-400/90">
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
                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
                  المبالغ المتأخرة
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {!showSingleCurrencyMetrics && hasCurrencyOverdueBreakdown && hasOverdueAlert && (
                    <button
                      type="button"
                      onClick={() => navigate(PATHS.OVERDUE_DEBTS_REPORT)}
                      className="text-xs text-[#09152B] hover:underline dark:text-slate-200 font-bold inline-flex items-center gap-0.5 cursor-pointer transition-colors"
                    >
                      <span>التقرير</span>
                      <ArrowUpLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 ${
                      hasOverdueAlert
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  />
                </div>
              </div>

              {showSingleCurrencyMetrics ? (
                <div className="text-right">
                  <div className="inline-flex items-baseline gap-1.5" dir="ltr">
                    <span
                      className={`text-[28px] sm:text-[30px] font-extrabold tracking-tight tabular-nums font-jakarta ${
                        (scopedOverdue ?? 0) > 0
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-[#09152B] dark:text-white'
                      }`}
                    >
                      {summary && scopedOverdue !== null ? formatAmount(scopedOverdue) : '—'}
                    </span>
                    <span className="text-base font-bold text-slate-600 dark:text-slate-300 font-jakarta">
                      {scopedCurrencyCfg.symbol}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                    {scopedOverdue === null ? (
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">
                        تعذر تفصيل المتأخرات لهذه العملة
                      </span>
                    ) : scopedOverdue > 0 ? (
                      <span className="text-rose-700 dark:text-rose-400 font-semibold tabular-nums">
                        {overdueShareOfRemaining !== null
                          ? `${overdueShareOfRemaining}% من الديون القائمة`
                          : 'ذمم تجاوزت موعد الاستحقاق'}
                      </span>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        لا توجد مبالغ متأخرة
                      </span>
                    )}

                    {(scopedOverdue ?? 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => navigate(PATHS.OVERDUE_DEBTS_REPORT)}
                        className="text-[#09152B] hover:underline dark:text-slate-200 font-bold inline-flex items-center gap-0.5 cursor-pointer shrink-0 transition-colors"
                      >
                        <span>التقرير</span>
                        <ArrowUpLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : hasCurrencyOverdueBreakdown ? (
                <div className="space-y-2">
                  {currencySummaries.map((item) => {
                    const cfg = getCurrencyConfig(item.currencyCode);
                    const amt = item.overdueAmount ?? 0;
                    return (
                      <div
                        key={item.currencyCode}
                        className="flex items-baseline justify-between gap-2"
                      >
                        <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                          {cfg.labelAr}
                        </span>
                        <div className="inline-flex items-baseline gap-1 font-jakarta tabular-nums" dir="ltr">
                          <span
                            className={`text-[17px] font-extrabold ${
                              amt > 0
                                ? 'text-rose-700 dark:text-rose-400'
                                : 'text-[#09152B] dark:text-slate-200'
                            }`}
                          >
                            {formatAmount(amt)}
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              amt > 0
                                ? 'text-rose-700/80 dark:text-rose-400/90'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {cfg.symbol}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-right">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-[28px] sm:text-[30px] font-extrabold tracking-tight tabular-nums font-jakarta ${
                        hasOverdueAlert
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-[#09152B] dark:text-white'
                      }`}
                    >
                      {summary ? formatAmount(summary.overdueAmount) : '—'}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      مجمع بكل العملات
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      راجع تفصيل العملات بالتقرير
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(PATHS.OVERDUE_DEBTS_REPORT)}
                      className="text-[#09152B] hover:underline dark:text-slate-200 font-bold inline-flex items-center gap-0.5 cursor-pointer shrink-0 transition-colors"
                    >
                      <span>التقرير</span>
                      <ArrowUpLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. العملاء المسجلين */}
            <div className="bg-white dark:bg-[#111827] p-5 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
                  العملاء المسجّلون
                </span>
                <Users className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
              </div>

              <div className="text-right">
                <div className="flex items-baseline gap-2">
                  <span className="text-[28px] sm:text-[30px] font-extrabold text-[#09152B] dark:text-white tracking-tight tabular-nums font-jakarta">
                    {summary ? activeCustomers.toLocaleString('en-US') : '—'}
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    حساب عميل
                  </span>
                </div>

                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    إجمالي السجل النشط
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(PATHS.CUSTOMERS)}
                    className="text-[#09152B] hover:underline dark:text-slate-200 font-bold inline-flex items-center gap-0.5 cursor-pointer shrink-0 transition-colors"
                  >
                    <span>إدارة العملاء</span>
                    <ArrowUpLeft className="w-3.5 h-3.5" />
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
