import { useState, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banknote,
  Search,
  Download,
  FileText,
  RotateCw,
  ArrowRight,
  TrendingUp,
  Receipt,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  getCollectionsReport,
  exportCollectionsReportCsv,
  printCollectionsReportHtml,
  formatPaymentMethod,
} from '../../services/reportService';
import type { CollectionsReportResponse, CollectionItem } from '../../types/report';

type QuickRange = 'all' | 'today' | 'week' | 'month' | 'custom';

interface CollectionsReportViewProps {
  onBackToOverview?: () => void;
  onShowToast?: (msg: string) => void;
}

export const CollectionsReportView: FC<CollectionsReportViewProps> = ({
  onBackToOverview,
  onShowToast,
}) => {
  const navigate = useNavigate();

  // Filter States
  const [quickRange, setQuickRange] = useState<QuickRange>('month');
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // 1st day of current month
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'نقداً' | 'تحويل بنكي' | 'بطاقة / محفظة'>('all');

  // Pagination & Loading States
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<CollectionsReportResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const notify = (msg: string) => {
    if (onShowToast) {
      onShowToast(msg);
    }
  };

  // Quick range helper
  const handleQuickRangeChange = (range: QuickRange) => {
    setQuickRange(range);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (range === 'all') {
      setFromDate('');
      setToDate('');
    } else if (range === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (range === 'week') {
      const pastWeek = new Date();
      pastWeek.setDate(today.getDate() - 7);
      setFromDate(pastWeek.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (range === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(startOfMonth.toISOString().split('T')[0]);
      setToDate(todayStr);
    }
    setPageNumber(1);
  };

  // Fetch report from API
  const fetchReport = async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const params = {
        fromDate: fromDate ? `${fromDate}T00:00:00Z` : undefined,
        toDate: toDate ? `${toDate}T23:59:59Z` : undefined,
        pageNumber,
        pageSize,
      };

      const result = await getCollectionsReport(params);
      setReportData(result);
    } catch (err) {
      console.error('Failed to load collections report:', err);
      setFetchError('تعذر جلب البيانات من خادم التحصيلات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [fromDate, toDate, pageNumber, pageSize]);

  // Client-side search and method filter
  const displayedItems = useMemo(() => {
    if (!reportData) return [];
    let list = reportData.items;

    if (methodFilter !== 'all') {
      list = list.filter((item) => formatPaymentMethod(item.paymentMethod) === methodFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.customerName.toLowerCase().includes(q) ||
          String(item.receiptNumber || '').toLowerCase().includes(q) ||
          String(item.id).toLowerCase().includes(q)
      );
    }

    return list;
  }, [reportData, searchQuery, methodFilter]);

  // Derived KPI metrics
  const kpiMetrics = useMemo(() => {
    const totalCollected = reportData?.totalCollected ?? displayedItems.reduce((s, i) => s + i.amount, 0);
    const totalCount = reportData?.totalRecords ?? displayedItems.length;
    const avgAmount = totalCount > 0 ? Math.round(totalCollected / totalCount) : 0;
    const maxAmount = displayedItems.reduce((max, i) => (i.amount > max ? i.amount : max), 0);

    return {
      totalCollected,
      totalCount,
      avgAmount,
      maxAmount,
    };
  }, [reportData, displayedItems]);

  const handleExportCsv = () => {
    if (!reportData || reportData.items.length === 0) {
      notify('لا توجد بيانات متاحة للتصدير');
      return;
    }
    exportCollectionsReportCsv(
      displayedItems.length > 0 ? displayedItems : reportData.items,
      `تقرير_التحصيلات_${fromDate || 'كافة'}_${toDate || 'الفترات'}.csv`
    );
    notify('تم تصدير تقرير التحصيلات بنجاح كملف CSV');
  };

  const handlePrintPdf = () => {
    if (!reportData || reportData.items.length === 0) {
      notify('لا توجد بيانات متاحة للطباعة');
      return;
    }
    const label = fromDate && toDate ? `من ${fromDate} إلى ${toDate}` : 'كافة الفترات';
    printCollectionsReportHtml(
      {
        ...reportData,
        items: displayedItems.length > 0 ? displayedItems : reportData.items,
        totalCollected: kpiMetrics.totalCollected,
        totalRecords: displayedItems.length,
      },
      label
    );
    notify('جاري إعداد تقرير التحصيلات للطباعة والتصدير...');
  };

  const handleViewReceipt = (item: CollectionItem) => {
    const paymentId = item.paymentId || item.id;
    navigate(`/payments/${paymentId}/receipt`, {
      state: {
        payment: {
          id: paymentId,
          receiptNumber: item.receiptNumber || `REC-${paymentId}`,
          amount: item.amount,
          date: item.date,
          customerName: item.customerName,
          method: formatPaymentMethod(item.paymentMethod),
          status: item.status || 'تم التحقق',
        },
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              type="button"
              onClick={onBackToOverview}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 dark:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors cursor-pointer"
              title="العودة للنظرة العامة"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-cairo text-slate-900 dark:text-white">
                تقرير التحصيلات المالية (Collections Report)
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                متصل بـ API التحصيلات
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-cairo">
              رصد وتتبع تدفقات المبالغ المسددة، سندات القبض الإلكترونية، والتحويلات المالية
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchReport}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="تصدير كملف Excel / CSV"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>تصدير CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#051838] hover:bg-[#0c2b5e] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-98"
          >
            <Download className="w-4 h-4 text-white" />
            <span>تصدير / طباعة PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: إجمالي المبالغ المحصلة */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-cairo">إجمالي التحصيلات للفترة</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-cairo text-[#047857]">
              {kpiMetrics.totalCollected.toLocaleString('en-US')}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">شيكل</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>مدفوعات مؤكدة في الخزينة</span>
          </div>
        </div>

        {/* Card 2: عدد عمليات السداد */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-cairo">عدد سندات التحصيل</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-cairo text-slate-900 dark:text-white">
              {kpiMetrics.totalCount.toLocaleString('en-US')}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">سند</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-blue-600 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>سندات قبض إلكترونية</span>
          </div>
        </div>

        {/* Card 3: متوسط السند */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-cairo">متوسط قيمة السند</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-cairo text-purple-700">
              {kpiMetrics.avgAmount.toLocaleString('en-US')}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">شيكل / عملية</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            معدل سداد الفواتير
          </div>
        </div>

        {/* Card 4: أعلى عملية تحصيل */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-cairo">أعلى عملية تحصيل</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-cairo text-amber-700">
              {kpiMetrics.maxAmount.toLocaleString('en-US')}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">شيكل</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            أكبر دفعة مسددة في الفترة
          </div>
        </div>
      </div>

      {/* Filter and Date Selection Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Date Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2">نطاق التقرير:</span>
            {(
              [
                { id: 'month', label: 'هذا الشهر' },
                { id: 'week', label: 'آخر 7 أيام' },
                { id: 'today', label: 'اليوم' },
                { id: 'all', label: 'كافة الفترات' },
                { id: 'custom', label: 'تاريخ مخصص' },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleQuickRangeChange(chip.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  quickRange === chip.id
                    ? 'bg-[#051838] dark:bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">طريقة الدفع:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#051838] dark:focus:ring-blue-500/20"
            >
              <option value="all">كافة الطرق</option>
              <option value="نقداً">نقداً</option>
              <option value="تحويل بنكي">تحويل بنكي</option>
              <option value="بطاقة / محفظة">بطاقة / محفظة</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers & Search Input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم العميل أو رقم السند..."
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#051838] dark:focus:ring-blue-500/20"
            />
          </div>

          {/* From Date */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">من:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setQuickRange('custom');
              }}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#051838] dark:focus:ring-blue-500/20"
            />
          </div>

          {/* To Date */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">إلى:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setQuickRange('custom');
              }}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#051838] dark:focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Error Notice if any */}
      {fetchError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-amber-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={fetchReport}
            className="font-bold underline hover:no-underline cursor-pointer"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Collections Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold font-cairo text-slate-900 dark:text-white">
              سجل عمليات التحصيل المباشرة
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({displayedItems.length} عملية مطابقة)
            </span>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-[#051838] dark:text-white" />
              <span>جاري التحديث...</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 font-medium text-xs bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-3.5">رقم السند</th>
                <th className="px-6 py-3.5">اسم العميل</th>
                <th className="px-6 py-3.5">المبلغ المحصل</th>
                <th className="px-6 py-3.5">تاريخ السداد</th>
                <th className="px-6 py-3.5">طريقة الدفع</th>
                <th className="px-6 py-3.5">الحالة</th>
                <th className="px-6 py-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RotateCw className="w-6 h-6 animate-spin text-[#051838] dark:text-white" />
                      <span className="text-xs">جاري تحميل سجلات التحصيل من الخادم...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600 dark:text-slate-400">لا توجد عمليات تحصيل مطابقة</p>
                      <p className="text-xs text-slate-400">
                        جرّب تعديل نطاق التاريخ أو إزالة فلتر البحث لعرض المزيد من النتائج.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors group">
                    {/* Receipt Number */}
                    <td className="px-6 py-4 font-mono font-bold text-xs text-[#051838] dark:text-white">
                      {item.receiptNumber || item.id}
                    </td>

                    {/* Customer Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                          {item.customerName.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.customerName}</span>
                      </div>
                    </td>

                    {/* Collected Amount */}
                    <td className="px-6 py-4 font-bold font-cairo text-[#047857]">
                      {item.amount.toLocaleString('en-US')} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">₪</span>
                    </td>

                    {/* Payment Date */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                      {item.date}
                    </td>

                    {/* Payment Method */}
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {formatPaymentMethod(item.paymentMethod)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{item.status || 'مكتمل'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleViewReceipt(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#051838] dark:text-white bg-slate-100 dark:bg-slate-700 hover:bg-[#051838] hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="عرض سند القبض الإلكتروني"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>عرض السند</span>
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
            عرض {displayedItems.length} من إجمالي {reportData?.totalRecords || displayedItems.length} سجل
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
              صفحة {pageNumber}
            </span>

            <button
              type="button"
              onClick={() => setPageNumber((p) => p + 1)}
              disabled={displayedItems.length < pageSize || isLoading}
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

export default CollectionsReportView;
