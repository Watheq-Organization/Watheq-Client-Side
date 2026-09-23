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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<OverdueDebtsReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to compute quick dates
  const handleQuickPeriodChange = (period: QuickPeriod) => {
    setQuickPeriod(period);
    setValidationError(null);
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

  // Fetch from API
  const fetchReport = async () => {
    // Client-side date validation as specified: fromDate <= toDate
    if (fromDate && toDate && fromDate > toDate) {
      setValidationError('تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية.');
      return;
    }
    setValidationError(null);
    setIsLoading(true);
    setError(null);

    try {
      const data = await getOverdueDebtsReport({
        fromDate: fromDate ? fromDate : undefined,
        toDate: toDate ? toDate : undefined,
        pageNumber,
        pageSize,
      });
      setReport(data);
    } catch (err: any) {
      console.error('[OverdueDebtsReportView] Error fetching report:', err);
      setError(toReportErrorMessage(err));
      setReport({
        hasData: false,
        message: 'تعذر جلب تقرير الديون المتأخرة من الخادم.',
        summary: [],
        chart: [],
        details: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [fromDate, toDate, pageNumber, pageSize]);

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
      return d.toLocaleDateString('ar-SA', {
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
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#051838] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 border border-white/10">
          <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold font-cairo text-slate-900 dark:text-white tracking-tight">
              تقرير الديون والذمم المتأخرة
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              مباشر من الخادم
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 font-cairo">
            متابعة دقيقة لمستحقات الديون المتأخرة، عدد أيام التأخير، ومبالغ الذمم المتبقية لكل عميل
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchReport}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-600 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="تحديث التقرير"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-600 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="تصدير كملف CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>تصدير CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#051838] hover:bg-[#0c2b5e] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-98"
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
            <Coins className="w-4 h-4 text-rose-600" />
            <span>ملخص الديون المتأخرة حسب العملة</span>
          </h3>
          {report?.summary && report.summary.length > 1 && (
            <span className="text-xs text-slate-400 font-medium">
              يتم عرض ملخص مستقل لكل عملة بشكل منفصل
            </span>
          )}
        </div>

        {report?.summary && report.summary.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.summary.map((sumItem) => (
              <div
                key={sumItem.currencyCode}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 shadow-xs p-5 hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-2 h-full bg-rose-500" />
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    عملة {sumItem.currencyCode}
                  </span>
                </div>

                <div className="mt-4 text-right">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">إجمالي المبالغ المتأخرة</div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-bold font-cairo text-rose-600 tracking-tight">
                      {sumItem.totalOverdueAmount.toLocaleString('en-US')}
                    </span>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {sumItem.currencyCode}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      <strong className="text-slate-900 dark:text-white font-bold">{sumItem.numberOfOverdueDebts}</strong> ديون متأخرة
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>
                      <strong className="text-slate-900 dark:text-white font-bold">{sumItem.numberOfCustomersWithOverdueDebts}</strong> عملاء
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Coins className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">لا توجد ديون متأخرة مسجلة في هذا النطاق</h4>
            <p className="text-xs text-slate-400 mt-1">
              جميع الديون مستوفاة أو غير متأخرة خلال الفترة المحددة.
            </p>
          </div>
        )}
      </div>

      {/* Date Filters & Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Quick Period Buttons */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-x-auto">
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
                  ? 'bg-white dark:bg-slate-800 text-[#051838] dark:text-white font-bold shadow-xs'
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
            <span className="text-slate-500 dark:text-slate-400 font-medium">من:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setQuickPeriod('custom');
                setPageNumber(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#051838] dark:focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">إلى:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setQuickPeriod('custom');
                setPageNumber(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#051838] dark:focus:ring-blue-500"
            />
          </div>

          {/* Currency Filter if multi-currency */}
          {availableCurrencies.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">العملة:</span>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#051838] dark:focus:ring-blue-500"
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
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Chart Section: مبالغ الديون المتأخرة حسب تاريخ الاستحقاق */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-cairo text-slate-900 dark:text-white">
              توزيع الديون المتأخرة زمنياً
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              بيانات الرسم البياني المستلمة مباشرة من حقل Chart في الـ API
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>المبالغ المتأخرة</span>
          </div>
        </div>

        {!report?.chart || report.chart.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-slate-50/6 dark:bg-slate-800/60 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <Clock className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-cairo">
              لا توجد نقاط بيانية كافية لعرض الرسم البياني خلال هذه الفترة
            </p>
            <p className="text-xs text-slate-400 mt-1 font-cairo">
              عند تجاوز موعد استحقاق أي دين في هذا النطاق، سيتم تمثيله هنا بيانياً تلقائياً.
            </p>
          </div>
        ) : (
          <div className="relative pt-4 pb-2">
            <div className="flex">
              <div className="flex-1 relative h-56 sm:h-64 border-r border-slate-200/80">
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
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-cairo py-1 px-2.5 rounded-md whitespace-nowrap shadow-lg z-20 pointer-events-none">
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
                      className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex-1 text-center truncate"
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
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-cairo shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">تنبيه من خادم البيانات</p>
              <p className="text-xs text-amber-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchReport}
            className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      )}

      {/* Details Table: تفاصيل كل دين متأخر مع Pagination */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-cairo text-slate-900 dark:text-white flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <span>جدول تفاصيل الديون المتأخرة (Details)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#051838] dark:focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 font-medium text-xs bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4">رقم الدين</th>
                <th className="px-6 py-4">اسم العميل</th>
                <th className="px-6 py-4">المبلغ الأصلي</th>
                <th className="px-6 py-4">المبلغ المتأخر</th>
                <th className="px-6 py-4">العملة</th>
                <th className="px-6 py-4">تاريخ الاستحقاق</th>
                <th className="px-6 py-4">أيام التأخير</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RotateCw className="w-6 h-6 animate-spin text-rose-600" />
                      <span className="text-xs font-cairo">جاري تحميل بيانات الديون المتأخرة...</span>
                    </div>
                  </td>
                </tr>
              ) : report && (!report.hasData || allItems.length === 0) ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2.5 max-w-md mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                        <Clock className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm font-cairo">
                        {report.message || 'لا توجد بيانات كافية لعرض التقرير خلال الفترة المحددة.'}
                      </p>
                      <p className="text-xs text-slate-400 font-cairo text-center leading-relaxed">
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
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors group"
                  >
                    {/* Debt ID */}
                    <td className="px-6 py-4 font-mono font-bold text-xs text-[#051838] dark:text-white">
                      #{item.debtId}
                    </td>

                    {/* Customer Name */}
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
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
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                      {item.originalAmount.toLocaleString('en-US')}
                    </td>

                    {/* Remaining Amount */}
                    <td className="px-6 py-4 font-bold font-cairo text-rose-600">
                      {item.remainingAmount.toLocaleString('en-US')}
                    </td>

                    {/* Currency Code */}
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {item.currencyCode}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                      {formatDate(item.dueDate)}
                    </td>

                    {/* Days Overdue (From backend directly, never recalculated client-side) */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        <span>{item.daysOverdue} يوم</span>
                      </span>
                    </td>

                    {/* Status Badge (From backend) */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#051838] dark:text-white bg-slate-100 dark:bg-slate-700 hover:bg-[#051838] hover:text-white rounded-lg transition-colors cursor-pointer"
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
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            عرض {filteredItems.length} من إجمالي {totalCount} دين متأخر
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="px-2 font-semibold text-slate-700 dark:text-slate-300">
              صفحة {pageNumber} من {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPageNumber((p) => p + 1)}
              disabled={pageNumber >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
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
