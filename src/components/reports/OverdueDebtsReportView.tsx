import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  FileSpreadsheet,
  Download,
  RotateCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
  AlertCircle,
  TrendingDown,
  Clock,
  Users,
  Coins,
  ReceiptText,
} from 'lucide-react';
import {
  getOverdueDebtsReport,
  exportOverdueDebtsReportCsv,
  printOverdueDebtsReportHtml,
  toReportErrorMessage,
} from '../../services/reportService';
import type {
  OverdueDebtsReportResponse,
  OverdueDebtReportItem,
} from '../../types/report';
import {
  formatCurrency,
  getCurrencyConfig,
  CURRENCY_BADGE_STYLES,
  type CurrencyCode,
} from '../../utils/currency';

type QuickPeriod = '30days' | '7days' | 'month' | 'all' | 'custom';

export const OverdueDebtsReportView: FC = () => {
  const navigate = useNavigate();

  // Filters & State
  const [quickPeriod, setQuickPeriod] = useState<QuickPeriod>('30days');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');

  // Pagination
  const [pageNumber, setPageNumber] = useState<number>(1);
  const pageSize = 20;

  // Data & Status
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [report, setReport] = useState<OverdueDebtsReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const validationError = useMemo(() => {
    if (fromDate && toDate && fromDate > toDate) {
      return 'تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية.';
    }
    return null;
  }, [fromDate, toDate]);

  // Helper to compute quick dates
  const handleQuickPeriodChange = (period: QuickPeriod) => {
    setQuickPeriod(period);
    setPageNumber(1);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (period === '30days') {
      // Backend default: omit fromDate & toDate
      setFromDate('');
      setToDate('');
    } else if (period === '7days') {
      const d = new Date();
      d.setDate(today.getDate() - 7);
      setFromDate(d.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (period === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(firstDay.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (period === 'all') {
      setFromDate('2020-01-01');
      setToDate(todayStr);
    }
  };

  const triggerRefresh = () => {
    setIsLoading(true);
    setRefreshCounter((c) => c + 1);
  };

  useEffect(() => {
    if (validationError) return;
    let isMounted = true;

    getOverdueDebtsReport({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      pageNumber,
      pageSize,
    })
      .then((data) => {
        if (!isMounted) return;
        setReport(data);
        setError(null);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error('[OverdueDebtsReportView] Error fetching report:', err);
        setError(toReportErrorMessage(err));
        setReport({
          hasData: false,
          message: 'تعذر جلب تقرير الديون المتأخرة من الخادم.',
          summary: [],
          chart: [],
          details: null,
        });
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fromDate, toDate, pageNumber, pageSize, refreshCounter, validationError]);

  // Extract items safely (details can be null when hasData is false)
  const allItems: OverdueDebtReportItem[] = useMemo(() => {
    return report?.details?.items ?? [];
  }, [report]);

  // Client-side search and currency filter
  const filteredItems = useMemo(() => {
    let list = allItems;

    if (selectedCurrency !== 'all') {
      list = list.filter((i) => i.currencyCode === selectedCurrency);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.customerName.toLowerCase().includes(q) ||
          String(i.debtId).includes(q) ||
          String(i.customerId).includes(q)
      );
    }

    return list;
  }, [allItems, searchQuery, selectedCurrency]);

  // Available currencies from summary
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>();
    report?.summary?.forEach((s) => set.add(s.currencyCode));
    allItems.forEach((i) => set.add(i.currencyCode));
    return Array.from(set);
  }, [report, allItems]);

  // Total pages
  const totalCount = report?.details?.totalCount ?? allItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Max value for chart
  const maxChartVal = useMemo(() => {
    if (!report?.chart || report.chart.length === 0) return 1000;
    const max = Math.max(...report.chart.map((p) => p.amount));
    return max > 0 ? max * 1.2 : 1000;
  }, [report]);

  // Export handlers
  const handleExportCsv = () => {
    if (allItems.length === 0) {
      showToast('لا توجد بيانات ديون متأخرة للتصدير');
      return;
    }
    const itemsToExport = filteredItems.length > 0 ? filteredItems : allItems;
    exportOverdueDebtsReportCsv(
      itemsToExport,
      `تقرير_الديون_المتأخرة_${new Date().toISOString().split('T')[0]}.csv`
    );
    showToast('تم تصدير تقرير الديون المتأخرة بنجاح كملف CSV');
  };

  const handlePrintPdf = () => {
    if (!report || allItems.length === 0) {
      showToast('لا توجد بيانات ديون متأخرة للطباعة');
      return;
    }
    const label = fromDate && toDate ? `من ${fromDate} إلى ${toDate}` : 'آخر 30 يوماً';
    printOverdueDebtsReportHtml(report, label);
    showToast('جاري فتح نافذة طباعة وتصدير التقرير...');
  };

  const formatDate = (dStr: string) => {
    if (!dStr) return '—';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr.split('T')[0];
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dStr.split('T')[0];
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#09152B] dark:bg-[#111827] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 border border-slate-700">
          <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium font-cairo">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black font-cairo text-[#09152B] dark:text-[#F8FAFC] tracking-tight">
              تقرير الديون والذمم المتأخرة
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 font-cairo">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              مباشر من الخادم
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 font-cairo">
            متابعة دقيقة لمستحقات الديون المتأخرة، عدد أيام التأخير، ومبالغ الذمم المتبقية لكل عميل
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={triggerRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            title="تحديث التقرير"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer"
            title="تصدير كملف CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>تصدير CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#09152B] hover:bg-[#0c2b5e] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-98"
          >
            <Download className="w-4 h-4 text-white" />
            <span>تصدير / طباعة PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Cards: Grouped by Currency (Backend rule: Never sum different currencies) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 font-cairo flex items-center gap-2">
            <Coins className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>ملخص الديون المتأخرة حسب العملة</span>
          </h3>
          {report?.summary && report.summary.length > 1 && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium font-cairo">
              يتم عرض ملخص مستقل لكل عملة بشكل منفصل
            </span>
          )}
        </div>

        {report?.summary && report.summary.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.summary.map((sumItem) => (
              <div
                key={sumItem.currencyCode}
                className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/40">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-jakarta tabular-nums ${CURRENCY_BADGE_STYLES[sumItem.currencyCode as CurrencyCode] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    {getCurrencyConfig(sumItem.currencyCode).symbol} {sumItem.currencyCode}
                  </span>
                </div>

                <div className="mt-4 text-right">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 font-cairo">إجمالي المبالغ المتأخرة ({getCurrencyConfig(sumItem.currencyCode).labelAr})</div>
                  <div className="mt-1 flex items-baseline gap-1.5" dir="ltr">
                    <span className="text-2xl sm:text-3xl font-black font-jakarta tabular-nums text-rose-600 dark:text-rose-400 tracking-tight">
                      {formatCurrency(sumItem.totalOverdueAmount, sumItem.currencyCode)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="font-cairo">
                      <strong className="text-[#09152B] dark:text-[#F8FAFC] font-black font-jakarta tabular-nums">{sumItem.numberOfOverdueDebts}</strong> ديون متأخرة
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="font-cairo">
                      <strong className="text-[#09152B] dark:text-[#F8FAFC] font-black font-jakarta tabular-nums">{sumItem.numberOfCustomersWithOverdueDebts}</strong> عملاء
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-200/60 dark:border-emerald-800/40">
              <Coins className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#09152B] dark:text-[#F8FAFC] font-cairo">لا توجد ديون متأخرة مسجلة في هذا النطاق</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-cairo">
              جميع الديون مستوفاة أو غير متأخرة خلال الفترة المحددة.
            </p>
          </div>
        )}
      </div>

      {/* Date Filters & Controls */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Quick Period Buttons */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-[#0B0F19] rounded-xl overflow-x-auto">
          {(
            [
              { id: '30days', label: 'آخر 30 يوماً (الافتراضي)' },
              { id: '7days', label: 'آخر 7 أيام' },
              { id: 'month', label: 'هذا الشهر' },
              { id: 'all', label: 'كافة الفترات' },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleQuickPeriodChange(chip.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                quickPeriod === chip.id && !fromDate && !toDate
                  ? 'bg-white dark:bg-[#111827] text-[#09152B] dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium font-cairo">من:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setQuickPeriod('custom');
                setPageNumber(1);
              }}
              className="bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#09152B] dark:focus:ring-emerald-500 font-jakarta tabular-nums"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium font-cairo">إلى:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setQuickPeriod('custom');
                setPageNumber(1);
              }}
              className="bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#09152B] dark:focus:ring-emerald-500 font-jakarta tabular-nums"
            />
          </div>

          {/* Currency Filter if multi-currency */}
          {availableCurrencies.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium font-cairo">العملة:</span>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#09152B] dark:focus:ring-emerald-500 font-jakarta tabular-nums"
              >
                <option value="all">كافة العملات</option>
                {availableCurrencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Date Validation Alert */}
      {validationError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl p-3 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in font-cairo">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Chart Section: مبالغ الديون المتأخرة حسب تاريخ الاستحقاق */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-cairo text-[#09152B] dark:text-[#F8FAFC]">
              توزيع الديون المتأخرة زمنياً
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-cairo">
              بيانات الرسم البياني المستلمة مباشرة من حقل Chart في الـ API
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-lg border border-rose-200/60 dark:border-rose-800/40">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="font-cairo">المبالغ المتأخرة</span>
          </div>
        </div>

        {!report?.chart || report.chart.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 dark:bg-[#0B0F19]/40 rounded-xl border border-dashed border-slate-200/80 dark:border-slate-800">
            <Clock className="w-10 h-10 text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-cairo">
              لا توجد نقاط بيانية كافية لعرض الرسم البياني خلال هذه الفترة
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-cairo">
              عند تجاوز موعد استحقاق أي دين في هذا النطاق، سيتم تمثيله هنا بيانياً تلقائياً.
            </p>
          </div>
        ) : (
          <div className="relative pt-4 pb-2">
            <div className="flex">
              <div className="flex-1 relative h-56 sm:h-64 border-r border-slate-200/80 dark:border-slate-800">
                <div className="absolute inset-0 pb-8 flex items-end justify-around px-2 sm:px-6">
                  {report.chart.map((point, idx) => {
                    const heightPercent = Math.min(100, (point.amount / maxChartVal) * 100);
                    return (
                      <div
                        key={`od-bar-${point.label}-${point.currencyCode}-${idx}`}
                        className="flex flex-col items-center justify-end h-full flex-1 max-w-[80px]"
                      >
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-5 sm:w-8 bg-rose-500 hover:bg-rose-600 rounded-t-sm transition-all duration-300 relative cursor-pointer shadow-xs group"
                        >
                          {/* Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 left-1/2 -translate-x-1/2 bg-[#09152B] dark:bg-slate-900 text-white text-[11px] font-jakarta tabular-nums py-1 px-2.5 rounded-md whitespace-nowrap shadow-lg z-20 pointer-events-none">
                            {point.amount.toLocaleString('en-US')} {point.currencyCode}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis Labels */}
                <div className="absolute bottom-0 inset-x-0 h-8 flex items-center justify-around px-2 sm:px-6">
                  {report.chart.map((point, idx) => (
                    <span
                      key={`od-lbl-${point.label}-${point.currencyCode}-${idx}`}
                      className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-jakarta tabular-nums flex-1 text-center truncate"
                      title={point.label}
                    >
                      {point.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Server Error Alert */}
      {error && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-cairo shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">تنبيه من خادم البيانات</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={triggerRefresh}
            className="px-3 py-1.5 bg-amber-200 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      )}

      {/* Details Table: تفاصيل كل دين متأخر مع Pagination */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-cairo text-[#09152B] dark:text-[#F8FAFC] flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <span>جدول تفاصيل الديون المتأخرة (Details)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-cairo">
              تفاصيل الديون المتأخرة مع المبلغ الأصلي، المبلغ المتبقي، وأيام التأخير
            </p>
          </div>

          {/* Search inside table */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم العميل أو رقم الدين..."
              className="bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#09152B] dark:focus:ring-emerald-500 font-cairo"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium text-xs bg-slate-50/80 dark:bg-[#0B0F19]/40">
                <th className="px-6 py-4 font-cairo">رقم الدين</th>
                <th className="px-6 py-4 font-cairo">اسم العميل</th>
                <th className="px-6 py-4 font-cairo">المبلغ الأصلي</th>
                <th className="px-6 py-4 font-cairo">المبلغ المتأخر</th>
                <th className="px-6 py-4 font-cairo">العملة</th>
                <th className="px-6 py-4 font-cairo">تاريخ الاستحقاق</th>
                <th className="px-6 py-4 font-cairo">أيام التأخير</th>
                <th className="px-6 py-4 font-cairo">الحالة</th>
                <th className="px-6 py-4 text-center font-cairo">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RotateCw className="w-6 h-6 animate-spin text-rose-600 dark:text-rose-400" />
                      <span className="text-xs font-cairo">جاري تحميل بيانات الديون المتأخرة...</span>
                    </div>
                  </td>
                </tr>
              ) : report && (!report.hasData || allItems.length === 0) ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2.5 max-w-md mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Clock className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm font-cairo">
                        {report.message || 'لا توجد بيانات كافية لعرض التقرير خلال الفترة المحددة.'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo text-center leading-relaxed">
                        لم يتم العثور على أي ديون متجاوزة لموعد استحقاقها في هذا النطاق الزمني.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-cairo">
                      لا توجد نتائج تطابق معايير البحث أو التصفية الحالية.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.debtId}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#0B0F19]/50 transition-colors group"
                  >
                    {/* Debt ID */}
                    <td className="px-6 py-4 font-jakarta tabular-nums font-bold text-xs text-[#09152B] dark:text-[#F8FAFC]">
                      #{item.debtId}
                    </td>

                    {/* Customer Name */}
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 font-cairo">
                      {item.customerId ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/customers/${item.customerId}`)}
                          className="hover:text-blue-600 hover:underline transition-colors text-right cursor-pointer"
                        >
                          {item.customerName}
                        </button>
                      ) : (
                        item.customerName
                      )}
                    </td>

                    {/* Original Amount */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium font-jakarta tabular-nums" dir="ltr">
                      {formatCurrency(item.originalAmount, item.currencyCode)}
                    </td>

                    {/* Remaining Amount */}
                    <td className="px-6 py-4 font-black font-jakarta tabular-nums text-rose-600 dark:text-rose-400" dir="ltr">
                      {formatCurrency(item.remainingAmount, item.currencyCode)}
                    </td>

                    {/* Currency Code */}
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold font-jakarta tabular-nums ${CURRENCY_BADGE_STYLES[item.currencyCode as CurrencyCode] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                        {item.currencyCode}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium font-jakarta tabular-nums">
                      {formatDate(item.dueDate)}
                    </td>

                    {/* Days Overdue (From backend directly, never recalculated client-side) */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                        <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="font-jakarta tabular-nums">{item.daysOverdue}</span>
                        <span className="font-cairo">يوم</span>
                      </span>
                    </td>

                    {/* Status Badge (From backend) */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-100 dark:border-rose-800/40 font-cairo">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>{item.status === 'Overdue' ? 'متأخر' : item.status}</span>
                      </span>
                    </td>

                    {/* Actions: View Debt / Invoice */}
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/debts/${item.debtId}/invoice`, {
                            state: {
                              debt: {
                                id: String(item.debtId),
                                invoiceNumber: `INV-DEBT-${item.debtId}`,
                                customerId: String(item.customerId),
                                customerName: item.customerName,
                                dueDate: item.dueDate,
                                invoiceAmount: item.remainingAmount ?? item.originalAmount,
                              },
                            },
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#09152B] dark:text-[#F8FAFC] bg-slate-100 dark:bg-slate-800 hover:bg-[#09152B] hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer font-cairo"
                        title="عرض الفاتورة وتفاصيل الدين"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>عرض الدين</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B0F19]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-cairo">
          <div>
            عرض <span className="font-jakarta tabular-nums font-bold text-slate-700 dark:text-slate-300">{filteredItems.length}</span> من إجمالي <span className="font-jakarta tabular-nums font-bold text-slate-700 dark:text-slate-300">{totalCount}</span> دين متأخر
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="px-2 font-bold font-jakarta tabular-nums text-[#09152B] dark:text-[#F8FAFC]">
              {pageNumber} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPageNumber((p) => p + 1)}
              disabled={pageNumber >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverdueDebtsReportView;
