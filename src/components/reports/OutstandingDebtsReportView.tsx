import { useState, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import {
  FileSpreadsheet,
  Download,
  RotateCw,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  TrendingDown,
  Coins,
  ReceiptText,
} from 'lucide-react';
import {
  getOutstandingDebtsReport,
  exportOutstandingDebtsReportCsv,
  printOutstandingDebtsReportHtml,
  toReportErrorMessage,
} from '../../services/reportService';
import type {
  OutstandingDebtsReportResponse,
} from '../../types/report';
import {
  formatCurrency,
  getCurrencyConfig,
  CURRENCY_BADGE_STYLES,
  ALL_CURRENCY_CODES,
  type CurrencyCode,
} from '../../utils/currency';

export const OutstandingDebtsReportView: FC = () => {
  // Filters & State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [isOverdue, setIsOverdue] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('DueDate');
  const [sortDirection, setSortDirection] = useState<'Ascending' | 'Descending'>('Ascending');

  // Pagination
  const [pageNumber, setPageNumber] = useState<number>(1);
  const pageSize = 20;

  // Data & Status
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [report, setReport] = useState<OutstandingDebtsReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const triggerRefresh = () => {
    setIsLoading(true);
    setRefreshCounter((c) => c + 1);
  };

  // Trigger fetch when parameters change
  useEffect(() => {
    let isMounted = true;

    getOutstandingDebtsReport({
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      isOverdue: isOverdue ? true : undefined,
      sortBy,
      sortDirection,
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
        console.error('Failed to load outstanding debts:', err);
        setError(toReportErrorMessage(err));
        setReport(null);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pageNumber, isOverdue, sortBy, sortDirection, statusFilter, refreshCounter, searchQuery]);

  // Filter items by selected currency
  const filteredItems = useMemo(() => {
    let list = report?.details?.items ?? [];
    if (selectedCurrency !== 'all') {
      list = list.filter((item) => (item.currencyCode || 'ILS') === selectedCurrency);
    }
    return list;
  }, [report, selectedCurrency]);

  // Actions
  const handleExportCsv = () => {
    const itemsToExport = filteredItems.length > 0 ? filteredItems : (report?.details?.items ?? []);
    if (itemsToExport.length === 0) {
      showToast('لا توجد بيانات لتصديرها');
      return;
    }
    exportOutstandingDebtsReportCsv(
      itemsToExport,
      `تقرير_الديون_المستحقة_${new Date().toISOString().split('T')[0]}.csv`
    );
    showToast('تم تصدير التقرير كملف CSV بنجاح');
  };

  const handlePrintPdf = () => {
    if (!report || !report.hasData) {
      showToast('لا توجد بيانات لطباعتها');
      return;
    }
    printOutstandingDebtsReportHtml(report);
    showToast('جاري تجهيز ملف الطباعة...');
  };

  // Sub-components
  const renderKPIs = () => {
    if (!report?.summary || report.summary.length === 0) {
      return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-6 text-center text-slate-500 dark:text-slate-400 font-cairo">
          لا توجد ديون مستحقة مسجلة.
        </div>
      );
    }

    const visibleSummary =
      selectedCurrency !== 'all'
        ? report.summary.filter((s) => s.currencyCode === selectedCurrency)
        : report.summary;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleSummary.map((s) => {
          const cfg = getCurrencyConfig(s.currencyCode);
          return (
            <div
              key={s.currencyCode}
              className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/40">
                  <Coins className="w-5 h-5" />
                </div>
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold font-jakarta tabular-nums ${CURRENCY_BADGE_STYLES[s.currencyCode as CurrencyCode] || 'bg-slate-100 text-slate-700'}`}>
                  {cfg.symbol} {s.currencyCode}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-cairo mb-1">
                إجمالي المبلغ المتبقي ({cfg.labelAr})
              </p>
              <div className="flex items-baseline gap-1.5" dir="ltr">
                <span className="text-2xl font-black font-jakarta tabular-nums text-[#09152B] dark:text-[#F8FAFC]">
                  {formatCurrency(s.totalOutstandingAmount, s.currencyCode)}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">المتأخرات</p>
                  <p className="text-sm font-bold text-rose-600 font-jakarta tabular-nums" dir="ltr">
                    {formatCurrency(s.totalOverdueAmount, s.currencyCode)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">عدد الديون / العملاء</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-jakarta tabular-nums">
                    {s.totalOutstandingDebtsCount} / {s.totalCustomersWithOutstandingDebts}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const totalPages = report?.details?.totalCount
    ? Math.ceil(report.details.totalCount / pageSize)
    : 1;

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#051838] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-cairo text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            الديون المستحقة
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo mt-1">
            متابعة ذمم العملاء والديون غير المسددة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={triggerRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            تصدير CSV
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#09152B] dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            طباعة تقرير
          </button>
        </div>
      </div>

      {/* KPIs */}
      {renderKPIs()}

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 rounded-xl p-4 flex items-center gap-3 font-cairo">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B0F19]/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث باسم العميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && triggerRefresh()}
                className="pl-3 pr-9 py-2 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPageNumber(1);
              }}
              className="px-3 py-2 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">جميع الحالات</option>
              <option value="Unpaid">غير مسدد</option>
              <option value="PartiallyPaid">مسدد جزئياً</option>
              <option value="Overdue">متأخر</option>
            </select>

            {/* Overdue Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOverdue}
                onChange={(e) => {
                  setIsOverdue(e.target.checked);
                  setPageNumber(1);
                }}
                className="w-4 h-4 text-rose-600 rounded border-slate-300 dark:border-slate-700 focus:ring-rose-500"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">الديون المتأخرة فقط</span>
            </label>

            {/* Currency Filter Tabs */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedCurrency('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCurrency === 'all'
                    ? 'bg-[#09152B] dark:bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                كافة العملات
              </button>
              {ALL_CURRENCY_CODES.map((code) => {
                const cfg = getCurrencyConfig(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setSelectedCurrency(code)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      selectedCurrency === code
                        ? 'bg-[#09152B] dark:bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{cfg.symbol}</span>
                    <span>{cfg.labelAr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sorting */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPageNumber(1);
              }}
              className="px-3 py-2 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="DueDate">تاريخ الاستحقاق</option>
              <option value="CreatedAt">تاريخ الإنشاء</option>
              <option value="RemainingAmount">المبلغ المتبقي</option>
              <option value="CustomerName">اسم العميل</option>
              <option value="DaysOverdue">أيام التأخير</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSortDirection(prev => prev === 'Ascending' ? 'Descending' : 'Ascending');
                setPageNumber(1);
              }}
              className="p-2 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={sortDirection === 'Ascending' ? 'تصاعدي' : 'تنازلي'}
            >
              <TrendingDown className={`w-4 h-4 transition-transform ${sortDirection === 'Ascending' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0B0F19]/40 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs">
                <th className="px-6 py-4">رقم الدين</th>
                <th className="px-6 py-4">العميل</th>
                <th className="px-6 py-4">المبلغ الأصلي</th>
                <th className="px-6 py-4">المتبقي</th>
                <th className="px-6 py-4 text-center">تاريخ الاستحقاق</th>
                <th className="px-6 py-4 text-center">التأخير</th>
                <th className="px-6 py-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RotateCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    جاري تحميل البيانات...
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.debtId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-jakarta tabular-nums font-bold text-[#09152B] dark:text-[#F8FAFC]">
                      #{item.debtId}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{item.customerName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-jakarta tabular-nums">{item.customerPhone}</p>
                    </td>
                    <td className="px-6 py-4 font-jakarta tabular-nums font-semibold text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <span>{formatCurrency(item.amount, item.currencyCode)}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-jakarta tabular-nums ${CURRENCY_BADGE_STYLES[item.currencyCode as CurrencyCode] || ''}`}>
                          {item.currencyCode}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-jakarta tabular-nums font-black text-[#09152B] dark:text-[#F8FAFC]">
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <span>{formatCurrency(item.remainingAmount, item.currencyCode)}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-jakarta tabular-nums ${CURRENCY_BADGE_STYLES[item.currencyCode as CurrencyCode] || ''}`}>
                          {item.currencyCode}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-jakarta tabular-nums text-slate-600 dark:text-slate-400">
                      {item.dueDate ? item.dueDate.split('T')[0] : '—'}
                    </td>
                    <td className="px-6 py-4 text-center font-jakarta tabular-nums">
                      {item.daysOverdue > 0 ? (
                        <span className="text-rose-600 font-bold">{item.daysOverdue} يوم</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.daysOverdue > 0 || item.status === 'Overdue' ? (
                        <span className="inline-block px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-md text-xs font-bold border border-rose-200 dark:border-rose-800">
                          متأخر
                        </span>
                      ) : item.status === 'PartiallyPaid' ? (
                        <span className="inline-block px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-md text-xs font-bold border border-amber-200 dark:border-amber-800">
                          مسدد جزئياً
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-bold border border-slate-200/80 dark:border-slate-800">
                          غير مسدد
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <ReceiptText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="font-bold text-slate-600 dark:text-slate-400">لا توجد ديون مستحقة</p>
                    <p className="text-xs text-slate-400 mt-1">
                      لم يتم العثور على أي ديون تطابق معايير البحث الحالية.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#0B0F19]/30">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 font-jakarta tabular-nums">
              إجمالي النتائج: <span className="font-bold">{report?.details?.totalCount || 0}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                disabled={pageNumber === 1 || isLoading}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold font-jakarta tabular-nums text-[#09152B] dark:text-[#F8FAFC] min-w-[3rem] text-center">
                {pageNumber} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
                disabled={pageNumber === totalPages || isLoading}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
