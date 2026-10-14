import { useState, useMemo, useEffect, useCallback, useRef, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Search,
  RotateCw,
  X,
  CreditCard,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingCart,
  Download,
  AlertCircle,
  Filter,
  Copy,
  Check,
  TrendingUp,
  User,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { PATHS } from '../../routes/paths';
import {
  getPosTransactions,
  toPosErrorMessage,
  type PosTransactionListItem,
  type PosSaleType,
  type PosPaymentMethod,
} from '../../services/posService';
import { formatApiDate, formatRelativeTime } from '../../lib/dateUtils';
import { PosTransactionDetailsModal } from './PosTransactionDetailsModal';
import { Toast, type ToastType } from '../ui/Toast';

export const PosTransactionsScreen: FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filters State
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSaleType, setSelectedSaleType] = useState<'all' | PosSaleType>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'all' | PosPaymentMethod>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Data & Status State
  const [transactions, setTransactions] = useState<PosTransactionListItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Details Modal State
  const [selectedTxIdForDetails, setSelectedTxIdForDetails] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type?: ToastType } | null>(null);

  // Copied ID Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Track in-flight request token to avoid race conditions
  const requestIdRef = useRef<number>(0);

  // Debounce customer search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Validate dates
  useEffect(() => {
    if (fromDate && toDate && fromDate > toDate) {
      setDateError('تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية');
    } else {
      setDateError(null);
    }
  }, [fromDate, toDate]);

  // Reset pagination to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedSaleType, selectedPaymentMethod, fromDate, toDate, pageSize]);

  // Fetch transactions from the backend
  const fetchTransactions = useCallback(async () => {
    if (dateError) return;

    const currentReqId = ++requestIdRef.current;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const fromFormatted = fromDate ? `${fromDate}T00:00:00Z` : undefined;
      const toFormatted = toDate ? `${toDate}T23:59:59Z` : undefined;

      const result = await getPosTransactions({
        pageNumber: currentPage,
        pageSize,
        saleType: selectedSaleType !== 'all' ? selectedSaleType : undefined,
        paymentMethod: selectedPaymentMethod !== 'all' ? selectedPaymentMethod : undefined,
        search: debouncedSearch || undefined,
        fromDate: fromFormatted,
        toDate: toFormatted,
      });

      // Ignore if a newer request was dispatched
      if (currentReqId !== requestIdRef.current) return;

      setTransactions(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages ?? Math.max(1, Math.ceil(result.totalCount / pageSize)));
    } catch (err) {
      if (currentReqId !== requestIdRef.current) return;
      console.error('[PosTransactionsScreen] Failed to fetch transactions:', err);
      setErrorMessage(
        toPosErrorMessage(err, 'حدث خطأ أثناء تحميل معاملات نقطة البيع. يرجى المحاولة مرة أخرى.')
      );
    } finally {
      if (currentReqId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPage, pageSize, selectedSaleType, selectedPaymentMethod, debouncedSearch, fromDate, toDate, dateError]);

  // Load on filter/page changes
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Auto-refresh when POS checkout succeeds anywhere in the application
  useEffect(() => {
    const handlePosCreated = () => {
      fetchTransactions();
      setToast({
        message: 'تم تسجيل معاملة كاشير جديدة وتحديث القائمة تلقائياً ⚡',
        type: 'success',
      });
    };

    window.addEventListener('watheq:pos-transaction-created', handlePosCreated);
    return () => {
      window.removeEventListener('watheq:pos-transaction-created', handlePosCreated);
    };
  }, [fetchTransactions]);

  // Copy transaction ID to clipboard
  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open details modal
  const handleViewDetails = (id: string) => {
    setSelectedTxIdForDetails(id);
    setIsDetailsModalOpen(true);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedSaleType('all');
    setSelectedPaymentMethod('all');
    setFromDate('');
    setToDate('');
    setDateError(null);
    setCurrentPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    debouncedSearch ||
      selectedSaleType !== 'all' ||
      selectedPaymentMethod !== 'all' ||
      fromDate ||
      toDate
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch) count++;
    if (selectedSaleType !== 'all') count++;
    if (selectedPaymentMethod !== 'all') count++;
    if (fromDate || toDate) count++;
    return count;
  }, [debouncedSearch, selectedSaleType, selectedPaymentMethod, fromDate, toDate]);

  // KPI Calculations on current loaded items
  const stats = useMemo(() => {
    const totalAmount = transactions.reduce((acc, it) => acc + (it.totalAmount || 0), 0);
    const cashCount = transactions.filter((it) => it.transactionType === 'Cash').length;
    const debtCount = transactions.filter((it) => it.transactionType === 'Debt').length;

    return {
      totalAmount,
      cashCount,
      debtCount,
    };
  }, [transactions]);

  // Export to CSV
  const handleExportCsv = () => {
    if (transactions.length === 0) {
      setToast({ message: 'لا توجد بيانات لتصديرها.', type: 'error' });
      return;
    }

    const headers = [
      'معرف المعاملة',
      'اسم العميل',
      'نوع المعاملة',
      'طريقة الدفع',
      'المبلغ الإجمالي',
      'عدد الأصناف',
      'التاريخ والوقت',
    ];

    const rows = transactions.map((t) => [
      t.id,
      t.customerName || t.guestCustomerName || 'عميل غير مسجل',
      t.transactionType === 'Debt' ? 'آجل' : 'نقدي',
      t.paymentMethod === 'Cash'
        ? 'نقدي'
        : t.paymentMethod === 'BankTransfer'
        ? 'تحويل بنكي'
        : 'غير محدد',
      t.totalAmount.toFixed(2),
      t.itemsCount,
      formatApiDate(t.createdAt, true),
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join(
        '\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pos-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="min-h-screen bg-[#f4f7fb] dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-cairo antialiased flex"
      dir="rtl"
    >
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Details Modal */}
      <PosTransactionDetailsModal
        transactionId={selectedTxIdForDetails}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="pos-transactions"
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        {/* Top Header */}
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          hideSearch
          title="معاملات نقطة البيع"
        />

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Header Row: Title, Breadcrumbs & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <span
                  onClick={() => navigate(PATHS.DASHBOARD)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                >
                  لوحة القيادة
                </span>
                <span>/</span>
                <span
                  onClick={() => navigate(PATHS.POS)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                >
                  نقطة البيع
                </span>
                <span>/</span>
                <span className="text-slate-600 dark:text-slate-300 font-bold">معاملات الكاشير</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold font-cairo text-[#0c2444] dark:text-blue-400 tracking-tight flex items-center gap-2.5">
                <span>معاملات نقطة البيع</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  سجل مباشر ⚡
                </span>
              </h1>
              <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                عرض ومتابعة عمليات البيع النقدية والآجلة.
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
              <button
                type="button"
                onClick={() => navigate(PATHS.POS)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                title="فتح شاشة نقطة البيع (الكاشير)"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>شاشة الكاشير ⚡</span>
              </button>

              <button
                type="button"
                onClick={fetchTransactions}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700 rounded-xl text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50"
                title="تحديث البيانات من الخادم"
              >
                <RotateCw className={`w-4 h-4 text-slate-500 dark:text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={transactions.length === 0}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700 rounded-xl text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50"
                title="تصدير كملف CSV"
              >
                <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">تصدير CSV</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Matching Count */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">
                  إجمالي المعاملات المطابقة
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {totalCount.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  معاملة مسجلة بالسيرفر
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
            </div>

            {/* Total Sales of Loaded Page */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">
                  مبيعات الصفحة الحالية
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  ₪ {stats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  إجمالي {transactions.length} معاملة معروضة
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Cash Transactions Count */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">
                  معاملات نقدية (كاش)
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {stats.cashCount}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                  مدفوعة فوري
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
            </div>

            {/* Debt Transactions Count */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">
                  معاملات آجلة (دين)
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {stats.debtCount}
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
                  مضافة لحسابات العملاء
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filters & Search Control Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  البحث وفلاتر المعاملات
                </h3>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
                    {activeFiltersCount} نشط
                  </span>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إعادة ضبط الفلاتر</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Customer Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="ابحث باسم العميل..."
                  className="w-full pr-9 pl-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Transaction Type Filter */}
              <div>
                <select
                  value={selectedSaleType}
                  onChange={(e) => setSelectedSaleType(e.target.value as 'all' | PosSaleType)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold cursor-pointer"
                >
                  <option value="all">نوع المعاملة: الكل</option>
                  <option value="Cash">نقدي</option>
                  <option value="Debt">آجل (دين)</option>
                </select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value as 'all' | PosPaymentMethod)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold cursor-pointer"
                >
                  <option value="all">طريقة الدفع: الكل</option>
                  <option value="Cash">نقدي</option>
                  <option value="BankTransfer">تحويل بنكي</option>
                  <option value="None">غير محدد</option>
                </select>
              </div>

              {/* Date Range Inputs */}
              <div className="flex items-center gap-1.5">
                <div className="flex-1 relative">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-2.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    title="من تاريخ"
                  />
                </div>
                <span className="text-slate-400 text-xs">إلى</span>
                <div className="flex-1 relative">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-2.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    title="إلى تاريخ"
                  />
                </div>
              </div>
            </div>

            {dateError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{dateError}</span>
              </p>
            )}
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <div>
                  <p className="font-bold text-sm">{errorMessage}</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                    تعذر جلب المعاملات من الخادم. يرجى التأكد من الاتصال وإعادة المحاولة.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={fetchTransactions}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* Transactions Table Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-bold border-b border-slate-200/80 dark:border-slate-700 select-none">
                  <tr>
                    <th className="py-3.5 px-4">معرف المعاملة</th>
                    <th className="py-3.5 px-4">اسم العميل</th>
                    <th className="py-3.5 px-4">نوع المعاملة</th>
                    <th className="py-3.5 px-4">طريقة الدفع</th>
                    <th className="py-3.5 px-4 text-center">الأصناف</th>
                    <th className="py-3.5 px-4 text-left">المبلغ الإجمالي</th>
                    <th className="py-3.5 px-4">التاريخ والوقت</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Loading State: Skeletons */}
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="animate-pulse">
                        <td className="py-4 px-4">
                          <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-md" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded-md" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-md" />
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="h-5 w-8 bg-slate-200 dark:bg-slate-700 rounded-md mx-auto" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-md ml-auto" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded-md" />
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto" />
                        </td>
                      </tr>
                    ))}

                  {/* Empty State */}
                  {!isLoading && transactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-16 px-4 text-center">
                        <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-3">
                          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-700/60 text-slate-400 flex items-center justify-center">
                            <Receipt className="w-8 h-8" />
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                              {hasActiveFilters
                                ? 'لا توجد معاملات مطابقة للفلاتر المحددة.'
                                : 'لم يتم تسجيل أي معاملات نقطة بيع بعد.'}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {hasActiveFilters
                                ? 'جرب تغيير معايير البحث أو مسح الفلاتر المحددة لعرض كافة النتائج.'
                                : 'ابدأ بعمليات البيع المباشرة وسجل الفواتير لتظهر تلقائياً في هذا السجل.'}
                            </p>
                          </div>

                          <div className="pt-2">
                            {hasActiveFilters ? (
                              <button
                                type="button"
                                onClick={handleClearFilters}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                                <span>مسح الفلاتر</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => navigate(PATHS.POS)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                <span>فتح شاشة الكاشير الآن</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Transactions Data Rows */}
                  {!isLoading &&
                    transactions.map((t) => {
                      const displayCustomerName =
                        t.customerName || t.guestCustomerName || 'عميل غير مسجل';
                      const isGuest = !t.customerName && Boolean(t.guestCustomerName);

                      return (
                        <tr
                          key={t.id}
                          onClick={() => handleViewDetails(t.id)}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        >
                          {/* Transaction ID */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
                                {t.id}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyId(t.id, e)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-all cursor-pointer p-1"
                                title="نسخ المعرف"
                              >
                                {copiedId === t.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Customer Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                                <User className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 dark:text-white truncate block text-xs sm:text-sm">
                                  {displayCustomerName}
                                </span>
                                {isGuest ? (
                                  <span className="text-[10px] text-amber-500 font-medium">زبون عابر</span>
                                ) : t.customerId ? (
                                  <span className="text-[10px] text-slate-400">عميل مسجل #{t.customerId}</span>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          {/* Transaction Type */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {t.transactionType === 'Debt' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>آجل</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Banknote className="w-3.5 h-3.5" />
                                <span>نقدي</span>
                              </span>
                            )}
                          </td>

                          {/* Payment Method */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                            {t.paymentMethod === 'Cash' && (
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                نقدي
                              </span>
                            )}
                            {t.paymentMethod === 'BankTransfer' && (
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                تحويل بنكي
                              </span>
                            )}
                            {t.paymentMethod === 'None' && (
                              <span className="text-slate-400">
                                غير محدد
                              </span>
                            )}
                          </td>

                          {/* Items Count */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">
                              {t.itemsCount || 0}
                            </span>
                          </td>

                          {/* Total Amount */}
                          <td className="py-3.5 px-4 text-left font-mono font-extrabold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                            ₪ {t.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Date and Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {formatApiDate(t.createdAt, true) || '—'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {formatRelativeTime(t.createdAt)}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleViewDetails(t.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold transition-colors cursor-pointer"
                              title="عرض تفاصيل المعاملة"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>التفاصيل</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Server-Side Pagination Footer */}
            <div className="p-4 border-t border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  عرض{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {transactions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                  </strong>{' '}
                  إلى{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {Math.min(currentPage * pageSize, totalCount)}
                  </strong>{' '}
                  من إجمالي{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {totalCount.toLocaleString()}
                  </strong>{' '}
                  معاملة
                </span>

                <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-700 pr-3">
                  <span>لكل صفحة:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || isLoading}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {currentPage} / {totalPages || 1}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || isLoading}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PosTransactionsScreen;
