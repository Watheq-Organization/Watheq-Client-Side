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
  Clock,
  Check,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  Share2,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { PATHS } from '../../routes/paths';
import { getCustomers } from '../../services/customerService';
import type { Customer } from '../../types/customer';

interface PaymentRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerInitials: string;
  customerAvatarBg: string;
  amount: number;
  date: string;
  time: string;
  method: 'تحويل بنكي' | 'نقداً' | 'مدى' | 'بطاقة ائتمان';
  status: 'تم التحقق' | 'قيد الانتظار';
  receiptNumber?: string;
}

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-1',
    customerId: '1',
    customerName: 'محمد العتيبي',
    customerInitials: 'مح',
    customerAvatarBg: 'bg-indigo-100 text-indigo-700',
    amount: 4500.0,
    date: '2023-10-24',
    time: '10:30 ص',
    method: 'تحويل بنكي',
    status: 'تم التحقق',
    receiptNumber: 'REC-98214',
  },
  {
    id: 'pay-2',
    customerId: '2',
    customerName: 'سارة الشمري',
    customerInitials: 'سش',
    customerAvatarBg: 'bg-purple-100 text-purple-700',
    amount: 1250.0,
    date: '2023-10-24',
    time: '09:15 ص',
    method: 'نقداً',
    status: 'قيد الانتظار',
    receiptNumber: 'REC-98215',
  },
  {
    id: 'pay-3',
    customerId: '3',
    customerName: 'فهد الدوسري',
    customerInitials: 'فه',
    customerAvatarBg: 'bg-blue-100 text-blue-700',
    amount: 12000.0,
    date: '2023-10-23',
    time: '04:45 م',
    method: 'مدى',
    status: 'تم التحقق',
    receiptNumber: 'REC-98210',
  },
  {
    id: 'pay-4',
    customerId: '4',
    customerName: 'عبدالله القحطاني',
    customerInitials: 'عق',
    customerAvatarBg: 'bg-emerald-100 text-emerald-700',
    amount: 3200.0,
    date: '2023-10-22',
    time: '01:20 م',
    method: 'تحويل بنكي',
    status: 'تم التحقق',
    receiptNumber: 'REC-98198',
  },
  {
    id: 'pay-5',
    customerId: '5',
    customerName: 'ريم المطيري',
    customerInitials: 'رم',
    customerAvatarBg: 'bg-rose-100 text-rose-700',
    amount: 850.0,
    date: '2023-10-21',
    time: '11:10 ص',
    method: 'نقداً',
    status: 'تم التحقق',
    receiptNumber: 'REC-98180',
  },
  {
    id: 'pay-6',
    customerId: '6',
    customerName: 'خالد السعد',
    customerInitials: 'خس',
    customerAvatarBg: 'bg-amber-100 text-amber-700',
    amount: 6700.0,
    date: '2023-10-20',
    time: '03:40 م',
    method: 'بطاقة ائتمان',
    status: 'قيد الانتظار',
    receiptNumber: 'REC-98172',
  },
];

export const PaymentsScreen: FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('2023-01-01');
  const [toDate, setToDate] = useState<string>('2023-12-31');

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
  const ITEMS_PER_PAGE = 3;

  useEffect(() => {
    setIsLoadingCustomers(true);
    getCustomers()
      .then((data) => {
        setCustomersList(
          data.map((dto) => ({
            id: dto.id,
            name: dto.fullName || 'عميل بدون اسم',
            type: 'individual',
            typeLabel: 'عميل أفراد',
            nationalOrCrId: dto.nationalId || '',
            totalDebt: dto.totalDebt || 0,
            status: dto.status as any,
            statusLabel: 'نشط',
            avatarLetter: (dto.fullName || 'ع').charAt(0),
            avatarBg: 'bg-blue-100 text-blue-700',
            phone: dto.phoneNumber,
          }))
        );
      })
      .catch(() => { })
      .finally(() => setIsLoadingCustomers(false));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetFilters = () => {
    setSelectedMethod('all');
    setSelectedStatus('all');
    setFromDate('2023-01-01');
    setToDate('2023-12-31');
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

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return INITIAL_PAYMENTS.filter((payment) => {
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
  }, [searchQuery, selectedMethod, selectedStatus, fromDate, toDate]);

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getMethodIcon = (method: PaymentRecord['method']) => {
    switch (method) {
      case 'تحويل بنكي':
        return <Landmark className="w-4 h-4 text-slate-500" />;
      case 'نقداً':
        return <Banknote className="w-4 h-4 text-slate-500" />;
      case 'مدى':
      case 'بطاقة ائتمان':
        return <CreditCard className="w-4 h-4 text-slate-500" />;
      default:
        return <Banknote className="w-4 h-4 text-slate-500" />;
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
      className="min-h-screen bg-[#f4f7fb] text-slate-800 font-cairo antialiased flex"
      dir="rtl"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#051838] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 border border-white/10">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="payments"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        {/* Top Header */}
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="البحث في العمليات..."
        />

        {/* Payments Body Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Top Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-right">
              <h1 className="text-2xl sm:text-3xl font-bold font-tajawal text-slate-900 tracking-tight">
                سجل المدفوعات
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500 font-cairo">
                تتبع وإدارة جميع التحصيلات المالية من العملاء بدقة.
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Green New Payment Button */}
              <button
                type="button"
                onClick={() => setIsNewPaymentModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#007a3d] hover:bg-[#006633] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <Banknote className="w-4 h-4" />
                <span>تسجيل تحصيل جديد</span>
              </button>

              {/* Export Data Button */}
              <button
                type="button"
                onClick={handleExportData}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>تصدير البيانات</span>
              </button>
            </div>
          </div>

          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: إجمالي المحصل (أكتوبر) */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-xs text-slate-400 font-medium">إجمالي المحصل (أكتوبر)</span>
              </div>
              <div className="mt-4 text-right">
                <div className="flex items-baseline gap-1.5 justify-start">
                  <span className="text-2xl sm:text-3xl font-bold font-tajawal text-[#051838] tracking-tight">
                    145,280
                  </span>
                  <span className="text-xs text-slate-400 font-medium font-cairo">ريال</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <span>↗ +12%</span>
                </div>
              </div>
            </div>

            {/* Card 2: عمليات تم التحقق منها */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-xs text-slate-400 font-medium">عمليات تم التحقق منها</span>
              </div>
              <div className="mt-4 text-right">
                <span className="text-2xl sm:text-3xl font-bold font-tajawal text-[#051838] tracking-tight">
                  342
                </span>
              </div>
            </div>

            {/* Card 3: عمليات في انتظار التأكيد */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-xs text-slate-400 font-medium">عمليات في انتظار التأكيد</span>
              </div>
              <div className="mt-4 text-right">
                <span className="text-2xl sm:text-3xl font-bold font-tajawal text-[#051838] tracking-tight">
                  18
                </span>
              </div>
            </div>

            {/* Card 4: أضف ملخصاً جديداً (Dashed) */}
            <div
              onClick={() => showToast('ميزة إضافة ملخصات مخصصة ستتوفر في التحديث القادم.')}
              className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 hover:bg-slate-50/80 hover:border-slate-300 p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 group-hover:text-slate-700 flex items-center justify-center mb-1.5 transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
                أضف ملخصاً جديداً
              </span>
            </div>
          </div>

          {/* Filter Bar: تصفية حسب */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-500 font-bold whitespace-nowrap">
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
                  className="appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2 pr-4 pl-8 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
                >
                  <option value="all">جميع طرق الدفع</option>
                  <option value="تحويل بنكي">تحويل بنكي</option>
                  <option value="نقداً">نقداً</option>
                  <option value="مدى">مدى</option>
                  <option value="بطاقة ائتمان">بطاقة ائتمان</option>
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
                  className="appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2 pr-4 pl-8 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
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
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-hidden font-sans cursor-pointer"
                  />
                </div>
                <span className="text-xs text-slate-400 font-medium">إلى</span>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-hidden font-sans cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Reset Filters Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#051838] transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>
          </div>

          {/* Payments Table Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium text-xs bg-slate-50/60">
                    <th className="px-6 py-4">اسم العميل</th>
                    <th className="px-6 py-4">المبلغ (ر.س)</th>
                    <th className="px-6 py-4">التاريخ</th>
                    <th className="px-6 py-4">طريقة الدفع</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                        لا توجد عمليات تحصيل مطابقة لخيارات التصفية.
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-slate-50/70 transition-colors group relative"
                      >
                        {/* Customer Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs font-tajawal shadow-2xs ${payment.customerAvatarBg}`}
                            >
                              {payment.customerInitials}
                            </div>
                            <span className="font-bold text-[#0c2444] text-sm font-tajawal">
                              {payment.customerName}
                            </span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4 font-bold font-tajawal text-slate-900 text-base" dir="ltr">
                          {payment.amount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        {/* Date & Time */}
                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                          <div className="space-y-0.5">
                            <p>{payment.date}</p>
                            <p className="text-[11px] text-slate-400">{payment.time}</p>
                          </div>
                        </td>

                        {/* Payment Method */}
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                            {getMethodIcon(payment.method)}
                            <span>{payment.method}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          {payment.status === 'تم التحقق' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>تم التحقق</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
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
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Action Menu */}
                            {activeMenuId === payment.id && (
                              <div
                                className="absolute left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 text-right text-xs animate-in fade-in zoom-in-95 duration-150"
                                dir="rtl"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    showToast(`رقم الإيصال: ${payment.receiptNumber}`);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  <span>عرض سند القبض</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    navigate(PATHS.CUSTOMERS);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                                  <span>ملف العميل</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    showToast('تم نسخ رابط السند للمشاركة.');
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
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
            <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">
                عرض {filteredPayments.length === 0 ? 0 : paginatedPayments.length} من أصل {filteredPayments.length} عملية تحصيل
              </span>

              {/* Numbered Pagination matching design */}
              <div className="flex items-center gap-1.5" dir="ltr">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#051838] text-white shadow-xs'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Floating Activity Banner */}
          <div className="pt-2 pb-6 flex justify-center">
            <div className="bg-[#0c2444] text-white rounded-2xl px-6 py-3.5 shadow-xl flex items-center justify-between gap-6 w-full max-w-lg">
              {/* Right Side: Verified Today */}
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-xs sm:text-sm font-semibold">
                  تم التحقق من 4 عمليات اليوم
                </span>
              </div>

              {/* Separator */}
              <div className="w-px h-5 bg-white/20" />

              {/* Left Side: Pending Tasks */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-200/80 font-medium">تحتاج إلى مراجعة:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white">
                  12 مهمة
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Quick Customer Picker Modal for "تسجيل تحصيل جديد" */}
      {isNewPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold font-tajawal text-slate-900">
                  تسجيل تحصيل جديد
                </h3>
                <p className="text-xs text-slate-500">
                  اختر العميل المراد تسجيل دفعة مالية له
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input in modal */}
            <div>
              <input
                type="text"
                placeholder="البحث باسم العميل أو رقم الهاتف..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-hidden focus:border-[#051838]"
              />
            </div>

            {/* Customer List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {isLoadingCustomers ? (
                <div className="py-8 text-center text-xs text-slate-400">جاري تحميل العملاء...</div>
              ) : filteredCustomerList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">لا يوجد عملاء متاحين</div>
              ) : (
                filteredCustomerList.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => {
                      setIsNewPaymentModalOpen(false);
                      navigate(`/customers/${cust.id}/payments/new`);
                    }}
                    className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#edf5ff] text-[#2563eb] flex items-center justify-center font-bold text-xs font-tajawal">
                        {cust.avatarLetter}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                          {cust.name}
                        </p>
                        <p className="text-[11px] text-slate-400">{cust.phone || 'بدون هاتف'}</p>
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

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsNewPaymentModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
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
