import { useState, useEffect } from 'react';
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

export const OutstandingDebtsReportView: FC = () => {
  // Filters & State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('DueDate');
  const [sortDirection, setSortDirection] = useState<'Ascending' | 'Descending'>('Ascending');

  // Pagination
  const [pageNumber, setPageNumber] = useState<number>(1);
  const pageSize = 20;

  // Data & Status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<OutstandingDebtsReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch from API
  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getOutstandingDebtsReport({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        isOverdue: isOverdue ? true : undefined,
        sortBy,
        sortDirection,
        pageNumber,
        pageSize,
      });
      setReport(data);
    } catch (err) {
      console.error('Failed to load outstanding debts:', err);
      setError(toReportErrorMessage(err));
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger fetch when parameters change
  useEffect(() => {
    fetchReport();
  }, [pageNumber, isOverdue, sortBy, sortDirection, statusFilter]);

  // Actions
  const handleExportCsv = () => {
    if (!report?.details?.items || report.details.items.length === 0) {
      showToast('لا توجد بيانات لتصديرها');
      return;
    }
    exportOutstandingDebtsReportCsv(
      report.details.items,
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 text-center text-slate-500 font-cairo">
          لا توجد ديون مستحقة مسجلة.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {report.summary.map((s) => (
          <div
            key={s.currencyCode}
            className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-1 h-full bg-[#051838]" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase">
                {s.currencyCode}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 font-medium font-cairo mb-1">
              إجمالي المبلغ المتبقي
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-cairo text-[#051838]">
                {s.totalOutstandingAmount.toLocaleString('ar-SA')}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-slate-400 font-medium">المتأخرات</p>
                <p className="text-sm font-bold text-rose-600">
                  {s.totalOverdueAmount.toLocaleString('ar-SA')}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">عدد الديون / العملاء</p>
                <p className="text-sm font-bold text-slate-700">
                  {s.totalOutstandingDebtsCount} / {s.totalCustomersWithOutstandingDebts}
                </p>
              </div>
            </div>
          </div>
        ))}
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
          <h1 className="text-2xl sm:text-3xl font-bold font-cairo text-slate-900 tracking-tight flex items-center gap-2">
            الديون المستحقة
          </h1>
          <p className="text-sm text-slate-500 font-cairo mt-1">
            متابعة ذمم العملاء والديون غير المسددة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchReport}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            تصدير CSV
          </button>
          <button
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#051838] text-white rounded-xl text-sm font-bold hover:bg-[#0c2b5e] transition-colors"
          >
            <Download className="w-4 h-4" />
            طباعة تقرير
          </button>
        </div>
      </div>

      {/* KPIs */}
      {renderKPIs()}

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-4 flex items-center gap-3 font-cairo">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث باسم العميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchReport()}
                className="pl-3 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#051838] w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPageNumber(1);
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#051838]"
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
                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
              />
              <span className="text-sm font-medium text-slate-700">الديون المتأخرة فقط</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sorting */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPageNumber(1);
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#051838]"
            >
              <option value="DueDate">تاريخ الاستحقاق</option>
              <option value="CreatedAt">تاريخ الإنشاء</option>
              <option value="RemainingAmount">المبلغ المتبقي</option>
              <option value="CustomerName">اسم العميل</option>
              <option value="DaysOverdue">أيام التأخير</option>
            </select>
            
            <button
              onClick={() => {
                setSortDirection(prev => prev === 'Ascending' ? 'Descending' : 'Ascending');
                setPageNumber(1);
              }}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
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
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                <th className="px-6 py-4">رقم الدين</th>
                <th className="px-6 py-4">العميل</th>
                <th className="px-6 py-4">المبلغ الأصلي</th>
                <th className="px-6 py-4">المتبقي</th>
                <th className="px-6 py-4 text-center">تاريخ الاستحقاق</th>
                <th className="px-6 py-4 text-center">التأخير</th>
                <th className="px-6 py-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RotateCw className="w-6 h-6 animate-spin mx-auto text-[#051838] mb-2" />
                    جاري تحميل البيانات...
                  </td>
                </tr>
              ) : report?.details?.items && report.details.items.length > 0 ? (
                report.details.items.map((item) => (
                  <tr key={item.debtId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#051838]">
                      #{item.debtId}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{item.customerName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.customerPhone}</p>
                    </td>
                    <td className="px-6 py-4 font-cairo font-semibold text-slate-600">
                      {item.amount.toLocaleString('ar-SA')} <span className="text-xs">{item.currencyCode}</span>
                    </td>
                    <td className="px-6 py-4 font-cairo font-bold text-[#051838]">
                      {item.remainingAmount.toLocaleString('ar-SA')} <span className="text-xs">{item.currencyCode}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-cairo text-slate-600">
                      {item.dueDate ? item.dueDate.split('T')[0] : '—'}
                    </td>
                    <td className="px-6 py-4 text-center font-cairo">
                      {item.daysOverdue > 0 ? (
                        <span className="text-rose-600 font-bold">{item.daysOverdue} يوم</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.daysOverdue > 0 || item.status === 'Overdue' ? (
                        <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md text-xs font-bold border border-rose-200">
                          متأخر
                        </span>
                      ) : item.status === 'PartiallyPaid' ? (
                        <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-bold border border-amber-200">
                          مسدد جزئياً
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold border border-slate-200">
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
                    <p className="font-bold text-slate-600">لا توجد ديون مستحقة</p>
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
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              إجمالي النتائج: <span className="font-bold">{report?.details?.totalCount || 0}</span>
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                disabled={pageNumber === 1 || isLoading}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <span className="text-sm font-bold font-cairo text-[#051838] min-w-[3rem] text-center">
                {pageNumber} / {totalPages}
              </span>
              
              <button
                onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
                disabled={pageNumber === totalPages || isLoading}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
