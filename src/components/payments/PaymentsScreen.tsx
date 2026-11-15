import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Banknote,
  Landmark,
  Plus,
  Download,
  ChevronDown,
  RotateCcw,
  MoreHorizontal,
  CheckCircle2,
  Check,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  Share2,
  RotateCw,
  AlertCircle,
  Receipt,
  Search,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { PATHS } from '../../routes/paths';
import { InstantSalesLogView } from './InstantSalesLogView';
import { getCustomers } from '../../services/customerService';
import { getPaymentHistory } from '../../services/paymentService';
import {
  getCollectionsReport,
  formatPaymentMethod,
  toReportErrorMessage,
} from '../../services/reportService';
import type { Customer } from '../../types/customer';
import type { CollectionItem } from '../../types/report';
import {
  type CurrencyCode,
  formatCurrency,
  getCurrencyConfig,
  getCurrencyId,
  groupTotalsByCurrency,
  normalizeCurrencyCode,
  ALL_CURRENCY_CODES,
  CURRENCY_BADGE_STYLES,
} from '../../utils/currency';

interface PaymentRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerInitials: string;
  customerAvatarBg: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  time: string;
  method: 'تحويل بنكي' | 'نقداً' | 'مدى' | 'بطاقة ائتمان' | string;
  status: 'تم التحقق' | 'قيد الانتظار' | string;
  receiptNumber?: string;
}

export const PaymentsScreen: FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'debts' | 'instant'>('debts');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Real Payments Data from Server
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState({
    totalCollected: 0,
    totalCount: 0,
    averagePayment: 0,
  });

  // Customer picker modal for "تسجيل تحصيل جديد"
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active dropdown action row
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load Real Payments from Server
  useEffect(() => {
    let isMounted = true;
    getPaymentHistory({
      paymentMethod: selectedMethod !== 'all' ? selectedMethod : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      currencyId: selectedCurrency !== 'all' ? getCurrencyId(selectedCurrency) : undefined,
      currencyCode: selectedCurrency !== 'all' ? selectedCurrency : undefined,
      fromDate: fromDate ? `${fromDate}T00:00:00Z` : undefined,
      toDate: toDate ? `${toDate}T23:59:59Z` : undefined,
    })
      .then(async (historyRes) => {
        if (!isMounted) return;
        if (historyRes.fromApi && !historyRes.error && historyRes.items.length > 0) {
          const mapped: PaymentRecord[] = historyRes.items.map((item) => {
            const name = item.customerName || 'عميل';
            const initials = name.trim().slice(0, 2) || 'عم';
            const curr = normalizeCurrencyCode(item.currency || item.currencyCode || item.currencyId);
            return {
              id: String(item.id || item.paymentId || Math.random()),
              customerId: String(item.customerId || ''),
              customerName: name,
              customerInitials: initials,
              customerAvatarBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
              amount: item.amount,
              currency: curr,
              date: item.paymentDate || item.date || '—',
              time: '—',
              method: formatPaymentMethod(item.paymentMethod || item.method),
              status: item.status || 'تم التحقق',
              receiptNumber: item.receiptNumber,
            };
          });

          setPayments(mapped);
          setSummaryStats({
            totalCollected: historyRes.totalAmount,
            totalCount: historyRes.totalCount,
            averagePayment:
              historyRes.totalCount > 0
                ? Math.round(historyRes.totalAmount / historyRes.totalCount)
                : 0,
          });
          setServerError(null);
          setIsLoadingPayments(false);
          return;
        }

        // Fallback to collections report if getPaymentHistory returns no items or had an error
        const res = await getCollectionsReport({
          currencyId: selectedCurrency !== 'all' ? getCurrencyId(selectedCurrency) : undefined,
          fromDate: fromDate ? `${fromDate}T00:00:00Z` : undefined,
          toDate: toDate ? `${toDate}T23:59:59Z` : undefined,
        });

        if (!isMounted) return;

        const mapped: PaymentRecord[] = res.items.map((item: CollectionItem) => {
          const initials = item.customerName.trim().slice(0, 2) || 'عم';
          const curr = normalizeCurrencyCode(item.currency);
          return {
            id: String(item.id || item.paymentId),
            customerId: String(item.customerId || ''),
            customerName: item.customerName,
            customerInitials: initials,
            customerAvatarBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
            amount: item.amount,
            currency: curr,
            date: item.date,
            time: '—',
            method: formatPaymentMethod(item.paymentMethod),
            status: item.status || 'تم التحقق',
            receiptNumber: item.receiptNumber,
          };
        });

        setPayments(mapped);
        setSummaryStats({
          totalCollected: res.totalCollected,
          totalCount: res.totalRecords,
          averagePayment:
            res.totalRecords > 0 ? Math.round(res.totalCollected / res.totalRecords) : 0,
        });
        setServerError(null);
        setIsLoadingPayments(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setServerError(toReportErrorMessage(err));
        setPayments([]);
        setIsLoadingPayments(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fromDate, toDate, selectedMethod, selectedStatus, selectedCurrency, refreshTrigger]);

  const handleManualRefresh = () => {
    setIsLoadingPayments(true);
    setServerError(null);
    setRefreshTrigger((t) => t + 1);
  };

  useEffect(() => {
    if (!isNewPaymentModalOpen || customersList.length > 0) return;
    let isMounted = true;
    getCustomers()
      .then((data) => {
        if (!isMounted) return;
        setCustomersList(
          data.map((dto) => ({
            id: dto.id,
            name: dto.fullName || 'عميل بدون اسم',
            type: 'individual',
            typeLabel: 'عميل أفراد',
            nationalOrCrId: dto.nationalId || '',
            totalDebt: dto.totalDebt || 0,
            status: dto.status as Customer['status'],
            statusLabel: 'نشط',
            avatarLetter: (dto.fullName || 'ع').charAt(0),
            avatarBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
            phone: dto.phoneNumber,
          }))
        );
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingCustomers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isNewPaymentModalOpen, customersList.length]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetFilters = () => {
    setSelectedMethod('all');
    setSelectedStatus('all');
    setSelectedCurrency('all');
    setFromDate('');
    setToDate('');
    setSearchQuery('');
    setCurrentPage(1);
    showToast('تمت إعادة ضبط خيارات التصفية.');
  };

  const handleExportData = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['الاسم,المبلغ,التاريخ,الوقت,طريقة الدفع,الحالة,رقم الإيصال']
        .concat(
          filteredPayments.map(
            (p) =>
              `"${p.customerName}",${p.amount},"${p.date}","${p.time}","${p.method}","${p.status}","${p.receiptNumber ?? ''}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'watheq_payments_log.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير سجل المدفوعات بنجاح.');
  };

  // Group totals by currency for accounting compliance
  const currencyGroupTotals = useMemo(() => {
    return groupTotalsByCurrency(
      payments.map((p) => ({ amount: p.amount, type: 'payment', currencyCode: p.currency }))
    );
  }, [payments]);

  const activeCurrenciesInPayments = useMemo(() => {
    return ALL_CURRENCY_CODES.filter(
      (code) => (currencyGroupTotals[code]?.paymentCount ?? 0) > 0
    );
  }, [currencyGroupTotals]);

  // Filtered Payments from real server data
  const filteredPayments = payments.filter((payment) => {
    // Currency filter
    if (selectedCurrency !== 'all' && payment.currency !== selectedCurrency) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = payment.customerName.toLowerCase().includes(q);
      const matchAmount = payment.amount.toString().includes(q);
      const matchReceipt = payment.receiptNumber?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchAmount && !matchReceipt) return false;
    }

    // Method filter
    if (selectedMethod !== 'all' && payment.method !== selectedMethod) {
      return false;
    }

    // Status filter
    if (selectedStatus !== 'all' && payment.status !== selectedStatus) {
      return false;
    }

    // Date range filter
    if (fromDate && payment.date < fromDate) {
      return false;
    }
    if (toDate && payment.date > toDate) {
      return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getMethodIcon = (method: PaymentRecord['method']) => {
    switch (method) {
      case 'تحويل بنكي':
        return <Landmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'نقداً':
        return <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'مدى':
      case 'بطاقة ائتمان':
      case 'بطاقة / محفظة':
        return <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <CreditCard className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredCustomerList = useMemo(() => {
    if (!customerSearch.trim()) return customersList;
    const q = customerSearch.toLowerCase().trim();
    return customersList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.nationalOrCrId && c.nationalOrCrId.includes(q))
    );
  }, [customersList, customerSearch]);

  return (
    <div
      className="min-h-screen bg-[#F5F6F8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-cairo antialiased flex"
      dir="rtl"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#09152B] dark:bg-slate-800 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in border border-slate-700/50">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="payments"
      />

      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Payments Body Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          {/* Top Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-right">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-cairo text-[#09152B] dark:text-white tracking-tight">
                سجل المدفوعات والتحصيلات
              </h1>
              <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 font-cairo">
                تتبع وإدارة جميع التحصيلات المالية وسندات القبض بدقة وشفافية محاسبية.
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* New Debt Collection Button */}
              <button
                type="button"
                onClick={() => setIsNewPaymentModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#007a3d] hover:bg-[#006633] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-[0.99] cursor-pointer"
              >
                <Banknote className="w-4 h-4" />
                <span>تسجيل تحصيل ديون</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(PATHS.CASH_SALE)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#09152B] hover:bg-[#060e1d] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-[0.99] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل بيع نقدي فوري</span>
              </button>

              {/* Export Data Button */}
              <button
                type="button"
                onClick={handleExportData}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-[0.99] cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>تصدير البيانات</span>
              </button>
            </div>
          </div>

          {/* Server Error Alert Banner */}
          {serverError && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-cairo shadow-xs">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="font-bold text-sm">تنبيه من خادم البيانات</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">{serverError}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {serverError.includes('تسجيل الدخول') || serverError.includes('401') ? (
                  <button
                    type="button"
                    onClick={() => navigate(PATHS.LOGIN)}
                    className="px-3 py-1.5 bg-[#09152B] hover:bg-[#060e1d] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    تسجيل الدخول الآن
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    className="px-3 py-1.5 bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>إعادة المحاولة</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Modern Segmented Control Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 rounded-2xl w-fit shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('debts')}
              className={`relative px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer select-none ${
                activeTab === 'debts'
                  ? 'bg-[#09152B] dark:bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <Receipt className={`w-4 h-4 ${activeTab === 'debts' ? 'text-white' : 'text-slate-400'}`} />
              <span>سندات القبض (تسديد الديون)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('instant')}
              className={`relative px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer select-none ${
                activeTab === 'instant'
                  ? 'bg-[#09152B] dark:bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <Banknote className={`w-4 h-4 ${activeTab === 'instant' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>سجل المبيعات النقدية المباشرة</span>
            </button>
          </div>

          {activeTab === 'debts' ? (
            <div className="space-y-6 animate-fade-in">
              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Card 1: إجمالي المحصل */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-slate-400 font-bold">إجمالي المحصل</span>
                  </div>
                  <div className="mt-4 text-right">
                    {selectedCurrency !== 'all' ? (
                      <div className="flex items-baseline gap-1.5 justify-start">
                        <span className="text-2xl sm:text-3xl font-extrabold font-jakarta tabular-nums text-[#09152B] dark:text-white tracking-tight">
                          {currencyGroupTotals[selectedCurrency as CurrencyCode]?.totalPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                        </span>
                        <span className="text-xs text-slate-400 font-bold font-cairo">
                          {getCurrencyConfig(selectedCurrency).symbol} ({getCurrencyConfig(selectedCurrency).labelAr})
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1.5 justify-start">
                          {activeCurrenciesInPayments.length > 0 ? (
                            activeCurrenciesInPayments.map((code) => (
                              <span
                                key={code}
                                className={`px-2 py-0.5 rounded-lg text-xs font-bold font-jakarta tabular-nums border ${CURRENCY_BADGE_STYLES[code].bg} ${CURRENCY_BADGE_STYLES[code].text} ${CURRENCY_BADGE_STYLES[code].border}`}
                              >
                                {formatCurrency(currencyGroupTotals[code].totalPayments, code)}
                              </span>
                            ))
                          ) : (
                            <span className="text-2xl font-bold font-jakarta tabular-nums text-[#09152B] dark:text-white">
                              0.00 ₪
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>من واقع العمليات المحاسبية المعتمدة</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: عدد عمليات التحصيل */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-slate-400 font-bold">عدد العمليات</span>
                  </div>
                  <div className="mt-4 text-right">
                    <span className="text-2xl sm:text-3xl font-extrabold font-jakarta tabular-nums text-[#09152B] dark:text-white tracking-tight">
                      {summaryStats.totalCount.toLocaleString('en-US')}
                    </span>
                    <span className="text-xs text-slate-400 font-bold mr-1.5 font-cairo">سند قبض</span>
                  </div>
                </div>

                {/* Card 3: متوسط قيمة العملية */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-slate-400 font-bold">متوسط قيمة السند</span>
                  </div>
                  <div className="mt-4 text-right">
                    <div className="flex items-baseline gap-1.5 justify-start">
                      <span className="text-2xl sm:text-3xl font-extrabold font-jakarta tabular-nums text-[#09152B] dark:text-white tracking-tight">
                        {summaryStats.averagePayment.toLocaleString('en-US')}
                      </span>
                      <span className="text-xs text-slate-400 font-bold font-cairo">
                        {selectedCurrency !== 'all' ? getCurrencyConfig(selectedCurrency).labelAr : 'شيكل'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 4: تحديث البيانات */}
                <div
                  onClick={handleManualRefresh}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-xs group"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-[#09152B] group-hover:text-white flex items-center justify-center mb-1.5 transition-colors">
                    <RotateCw className={`w-4 h-4 ${isLoadingPayments ? 'animate-spin' : ''}`} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-cairo">
                    تحديث البيانات الآن
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 font-cairo">
                    مزامنة فورية مع السيرفر
                  </span>
                </div>
              </div>

              {/* Filter Bar: تصفية حسب */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">
                    تصفية حسب:
                  </span>

                  {/* Method Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedMethod}
                      onChange={(e) => {
                        setSelectedMethod(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 pr-4 pl-8 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                    >
                      <option value="all">جميع طرق الدفع</option>
                      <option value="تحويل بنكي">تحويل بنكي</option>
                      <option value="نقداً">نقداً</option>
                      <option value="مدى">مدى</option>
                      <option value="بطاقة ائتمان">بطاقة ائتمان</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Currency Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedCurrency}
                      onChange={(e) => {
                        setSelectedCurrency(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 pr-4 pl-8 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                    >
                      <option value="all">جميع العملات</option>
                      <option value="ILS">₪ شيكل (ILS)</option>
                      <option value="USD">$ دولار (USD)</option>
                      <option value="JOD">د.أ دينار (JOD)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Status Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 pr-4 pl-8 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                    >
                      <option value="all">جميع الحالات</option>
                      <option value="تم التحقق">تم التحقق</option>
                      <option value="قيد الانتظار">قيد الانتظار</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Date Range Inputs */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center">
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => {
                          setFromDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none font-jakarta tabular-nums cursor-pointer"
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">إلى</span>
                    <div className="relative flex items-center">
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => {
                          setToDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none font-jakarta tabular-nums cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Reset Filters Button */}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#09152B] dark:hover:text-white transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط</span>
                </button>
              </div>

              {/* Payments Table Card */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs bg-slate-50 dark:bg-slate-900/60">
                        <th className="px-6 py-4">اسم العميل</th>
                        <th className="px-6 py-4">المبلغ والعملة</th>
                        <th className="px-6 py-4">التاريخ</th>
                        <th className="px-6 py-4">طريقة الدفع</th>
                        <th className="px-6 py-4">الحالة</th>
                        <th className="px-6 py-4 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {isLoadingPayments ? (
                        <tr>
                          <td colSpan={6} className="py-14 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                              <RotateCw className="w-6 h-6 animate-spin text-[#09152B] dark:text-white" />
                              <span className="text-xs font-cairo">جاري تحميل سندات القبض من السيرفر...</span>
                            </div>
                          </td>
                        </tr>
                      ) : serverError ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                            <div className="flex flex-col items-center gap-2.5 max-w-md mx-auto p-4">
                              <AlertCircle className="w-8 h-8 text-amber-500" />
                              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm font-cairo">
                                تعذر تحميل سندات القبض من السيرفر
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo text-center leading-relaxed">
                                {serverError}
                              </p>
                              {serverError.includes('تسجيل الدخول') || serverError.includes('401') ? (
                                <button
                                  type="button"
                                  onClick={() => navigate(PATHS.LOGIN)}
                                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#09152B] text-white rounded-xl text-xs font-bold hover:bg-[#060e1d] transition-colors cursor-pointer"
                                >
                                  الانتقال لتسجيل الدخول
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleManualRefresh}
                                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                >
                                  <RotateCw className="w-3.5 h-3.5" />
                                  <span>إعادة المحاولة</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : paginatedPayments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-14 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-2.5 max-w-sm mx-auto">
                              <Receipt className="w-8 h-8 text-slate-300" />
                              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm font-cairo">
                                لا توجد سندات قبض مسجلة على الخادم
                              </p>
                              <p className="text-xs text-slate-400 font-cairo text-center leading-relaxed">
                                لم يتم العثور على أي عمليات تحصيل مالية مسجلة حالياً. يمكنك تسجيل أول تحصيل جديد عبر الزر أدناه.
                              </p>
                              <button
                                type="button"
                                onClick={() => setIsNewPaymentModalOpen(true)}
                                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#007a3d] hover:bg-[#006633] rounded-xl shadow-xs transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>تسجيل تحصيل جديد</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedPayments.map((payment) => (
                          <tr
                            key={payment.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group relative"
                          >
                            {/* Customer Info */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs font-cairo shadow-2xs ${payment.customerAvatarBg}`}
                                >
                                  {payment.customerInitials}
                                </div>
                                <span className="font-bold text-[#09152B] dark:text-blue-400 text-sm font-cairo">
                                  {payment.customerName}
                                </span>
                              </div>
                            </td>

                            {/* Amount & Currency Badge */}
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-base font-jakarta tabular-nums" dir="ltr">
                              <div className="flex items-center gap-2 justify-end">
                                <span>
                                  {payment.amount.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-xs font-bold rounded-lg font-jakarta tabular-nums border ${
                                    CURRENCY_BADGE_STYLES[payment.currency].bg
                                  } ${
                                    CURRENCY_BADGE_STYLES[payment.currency].text
                                  } ${
                                    CURRENCY_BADGE_STYLES[payment.currency].border
                                  }`}
                                >
                                  {payment.currency}
                                </span>
                              </div>
                            </td>

                            {/* Date & Time */}
                            <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 font-semibold font-jakarta tabular-nums">
                              <div className="space-y-0.5">
                                <p>{payment.date}</p>
                                <p className="text-[11px] text-slate-400">{payment.time}</p>
                              </div>
                            </td>

                            {/* Payment Method */}
                            <td className="px-6 py-4">
                              <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                                {getMethodIcon(payment.method)}
                                <span>{payment.method}</span>
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className="px-6 py-4">
                              {payment.status === 'تم التحقق' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>تم التحقق</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  <span>قيد الانتظار</span>
                                </span>
                              )}
                            </td>

                            {/* Actions 3 Dots */}
                            <td className="px-6 py-4 text-center relative">
                              <div className="relative inline-block">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveMenuId(activeMenuId === payment.id ? null : payment.id)
                                  }
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  aria-label="قائمة الإجراءات"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {/* Dropdown Action Menu */}
                                {activeMenuId === payment.id && (
                                  <div
                                    className="absolute left-0 mt-1 w-44 bg-white dark:bg-[#111827] rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 text-right text-xs animate-fade-in"
                                    dir="rtl"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        navigate(`/payments/${payment.id}/receipt`, {
                                          state: { payment },
                                        });
                                      }}
                                      className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer font-bold"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                                      <span>عرض سند القبض</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        if (payment.customerId) {
                                          navigate(`/customers/${payment.customerId}`);
                                        } else {
                                          navigate(PATHS.CUSTOMERS);
                                        }
                                      }}
                                      className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer font-bold"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                                      <span>ملف العميل</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        const receiptUrl = `${window.location.origin}/payments/${payment.id}/receipt`;
                                        if (navigator.clipboard) {
                                          navigator.clipboard.writeText(receiptUrl);
                                        }
                                        showToast('تم نسخ رابط السند للمشاركة.');
                                      }}
                                      className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer font-bold"
                                    >
                                      <Share2 className="w-3.5 h-3.5 text-slate-400" />
                                      <span>مشاركة السند</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold font-jakarta tabular-nums">
                    عرض {filteredPayments.length === 0 ? 0 : paginatedPayments.length} من أصل {filteredPayments.length} عملية تحصيل
                  </span>

                  {/* Numbered Pagination */}
                  <div className="flex items-center gap-1.5" dir="ltr">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-xl font-bold text-xs transition-colors cursor-pointer font-jakarta tabular-nums ${
                          currentPage === page
                            ? 'bg-[#09152B] dark:bg-blue-600 text-white shadow-xs'
                            : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <InstantSalesLogView />
            </div>
          )}
        </main>
      </div>

      {/* Quick Customer Picker Modal for "تسجيل تحصيل جديد" */}
      {isNewPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold font-cairo text-[#09152B] dark:text-white">
                  تسجيل تحصيل جديد
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  اختر العميل المراد تسجيل دفعة مالية له
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input in modal */}
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="البحث باسم العميل أو رقم الهاتف..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-[#09152B] dark:focus:border-blue-500 font-semibold"
              />
            </div>

            {/* Customer List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {isLoadingCustomers ? (
                <div className="py-8 text-center text-xs text-slate-400 font-bold">جاري تحميل العملاء...</div>
              ) : filteredCustomerList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-bold">لا يوجد عملاء متاحين</div>
              ) : (
                filteredCustomerList.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => {
                      setIsNewPaymentModalOpen(false);
                      navigate(`/customers/${cust.id}/payments/new`);
                    }}
                    className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs font-cairo">
                        {cust.avatarLetter}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600">
                          {cust.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-jakarta tabular-nums font-medium">{cust.phone || 'بدون هاتف'}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 bg-[#007a3d] hover:bg-[#006633] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      تسجيل دفعة
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsNewPaymentModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsScreen;
