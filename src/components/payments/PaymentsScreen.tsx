import { useState, useMemo, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Filter,
  Loader2,
  AlertCircle,
  CreditCard,
  Banknote,
  Wallet,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Receipt,
  TrendingUp,
  Menu,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { getCustomers, getCustomerProfile } from '../../services/customerService';
import { getDashboardSummary } from '../../services/dashboardService';
import { PATHS } from '../../routes/paths';

/* ─────────────────────────────────────────────────────────── */
/* Types                                                        */
/* ─────────────────────────────────────────────────────────── */

type PaymentStatus = 'verified' | 'pending' | 'all';
type PaymentMethodFilter = 'all' | 'cash' | 'bank_transfer' | 'credit_card';

interface PaymentRecord {
  id: string;
  customerName: string;
  customerInitials: string;
  customerColor: string;
  amount: number;
  date: string; // ISO string
  paymentMethod: 'cash' | 'bank_transfer' | 'credit_card';
  status: 'verified' | 'pending';
  receiptNumber?: string;
}

/* ─────────────────────────────────────────────────────────── */
/* Helpers                                                      */
/* ─────────────────────────────────────────────────────────── */

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return parts[0]?.[0] ?? '؟';
}

const AVATAR_COLORS = [
  'bg-[#0f3460]',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-600',
  'bg-teal-600',
  'bg-orange-500',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function formatAmount(n: number): string {
  return n.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function methodLabel(m: PaymentRecord['paymentMethod']): string {
  if (m === 'cash') return 'نقداً';
  if (m === 'bank_transfer') return 'تحويل بنكي';
  return 'مدى';
}

function MethodIcon({ method }: { method: PaymentRecord['paymentMethod'] }) {
  if (method === 'cash') return <Banknote className="w-4 h-4 text-emerald-600" />;
  if (method === 'bank_transfer') return <CreditCard className="w-4 h-4 text-blue-600" />;
  return <Wallet className="w-4 h-4 text-violet-600" />;
}

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/* ─────────────────────────────────────────────────────────── */
/* Stat Card                                                    */
/* ─────────────────────────────────────────────────────────── */

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: FC<StatCardProps> = ({ label, value, sub, icon, iconBg, trend, trendUp }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col gap-3 min-w-0">
    <div className="flex items-start justify-between gap-2">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      {trend && (
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
          }`}
        >
          {trendUp ? '▲' : '▼'} {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-2xl font-extrabold text-slate-900 font-tajawal leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-500 font-tajawal mt-0.5">{sub}</p>}
      <p className="text-xs font-medium text-slate-500 font-tajawal mt-1">{label}</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────── */
/* Add Customer Stat Card (placeholder)                         */
/* ─────────────────────────────────────────────────────────── */

const AddStatCard: FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-xs p-5 flex flex-col items-center justify-center gap-2 min-h-[120px] hover:border-[#0f284e] hover:bg-slate-50 transition-all duration-200 group cursor-pointer min-w-0"
  >
    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-[#0f284e]/10 flex items-center justify-center transition-colors">
      <Plus className="w-5 h-5 text-slate-400 group-hover:text-[#0f284e] transition-colors" />
    </div>
    <span className="text-xs font-semibold text-slate-400 group-hover:text-[#0f284e] font-tajawal transition-colors">
      أضف ملخصاً جديداً
    </span>
  </button>
);

/* ─────────────────────────────────────────────────────────── */
/* ITEMS PER PAGE                                              */
/* ─────────────────────────────────────────────────────────── */

const PAGE_SIZE = 10;

/* ─────────────────────────────────────────────────────────── */
/* Main Screen                                                  */
/* ─────────────────────────────────────────────────────────── */

export const PaymentsScreen: FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /* ── Data ── */
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── Summary stats ── */
  const [totalCollected, setTotalCollected] = useState<number>(0);
  const [verifiedCount, setVerifiedCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);

  /* ── Filters ── */
  const today = new Date();
  const firstOfYear = new Date(today.getFullYear(), 0, 1);
  const [dateFrom, setDateFrom] = useState(toDateInput(firstOfYear));
  const [dateTo, setDateTo] = useState(toDateInput(today));
  const [statusFilter, setStatusFilter] = useState<PaymentStatus>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethodFilter>('all');

  /* ── Pagination ── */
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Toast ── */
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  /* ─────────────────────────────────────────────────────── */
  /* Load Data — derive payment records from customer profiles */
  /* ─────────────────────────────────────────────────────── */

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // Fetch all customers
      const customers = await getCustomers();

      // Fetch profiles for up to 30 customers concurrently
      const top = customers.slice(0, 30);
      const profiles = await Promise.all(
        top.map((c) => getCustomerProfile(c.id).catch(() => null))
      );

      // Also fetch dashboard summary for collected amount
      const summary = await getDashboardSummary().catch(() => null);
      if (summary) setTotalCollected(summary.collectedAmount);

      const records: PaymentRecord[] = [];

      profiles.forEach((profile, idx) => {
        if (!profile || !profile.transactions) return;
        const customer = top[idx];

        profile.transactions.forEach((tx, txIdx) => {
          const typeStr = String(tx.type ?? '').toLowerCase();
          const isPayment =
            typeStr.includes('pay') ||
            typeStr.includes('دفعة') ||
            typeStr.includes('سداد') ||
            typeStr === 'payment';

          if (!isPayment) return;

          // Derive method from paymentMethod field
          let method: PaymentRecord['paymentMethod'] = 'cash';
          const mStr = String(tx.paymentMethod ?? '').toLowerCase();
          if (mStr.includes('bank') || mStr.includes('transfer') || mStr === '2') {
            method = 'bank_transfer';
          } else if (
            mStr.includes('credit') ||
            mStr.includes('card') ||
            mStr.includes('wallet') ||
            mStr.includes('مدى') ||
            mStr === '3'
          ) {
            method = 'credit_card';
          }

          // Derive status
          const statusStr = String(tx.status ?? '').toLowerCase();
          const status: PaymentRecord['status'] =
            statusStr.includes('pending') || statusStr.includes('انتظار') ? 'pending' : 'verified';

          const customerId = String(customer.id ?? idx);
          records.push({
            id: `pay-${customerId}-${txIdx}`,
            customerName: customer.fullName || 'عميل',
            customerInitials: getInitials(customer.fullName || 'عميل'),
            customerColor: getAvatarColor(customerId),
            amount: Number(tx.amount) || 0,
            date: tx.date ?? new Date().toISOString(),
            paymentMethod: method,
            status,
            receiptNumber: tx.reference || undefined,
          });
        });
      });

      // Sort newest first
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setPayments(records);
      setVerifiedCount(records.filter((r) => r.status === 'verified').length);
      setPendingCount(records.filter((r) => r.status === 'pending').length);
    } catch (err) {
      console.error('[PaymentsScreen] load error:', err);
      setLoadError('تعذر تحميل سجل المدفوعات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  /* ─────────────────────────────────────────────────────── */
  /* Filtering & Pagination                                    */
  /* ─────────────────────────────────────────────────────── */

  const filteredPayments = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom).getTime() : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null;

    return payments.filter((p) => {
      const pTime = new Date(p.date).getTime();
      if (from && pTime < from) return false;
      if (to && pTime > to) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) return false;
      return true;
    });
  }, [payments, dateFrom, dateTo, statusFilter, methodFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedPayments = filteredPayments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetFilters = () => {
    setDateFrom(toDateInput(firstOfYear));
    setDateTo(toDateInput(today));
    setStatusFilter('all');
    setMethodFilter('all');
    setCurrentPage(1);
  };

  /* ─────────────────────────────────────────────────────── */
  /* CSV Export                                               */
  /* ─────────────────────────────────────────────────────── */

  const handleExport = () => {
    if (filteredPayments.length === 0) {
      showToast('لا توجد بيانات للتصدير.');
      return;
    }
    const rows = [
      ['اسم العميل', 'المبلغ (ر.س)', 'التاريخ', 'طريقة الدفع', 'الحالة', 'رقم الإيصال'],
      ...filteredPayments.map((p) => [
        p.customerName,
        p.amount.toFixed(2),
        formatDate(p.date),
        methodLabel(p.paymentMethod),
        p.status === 'verified' ? 'تم التحقق' : 'في انتظار التأكيد',
        p.receiptNumber ?? '',
      ]),
    ];
    const csv = '\uFEFF' + rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'سجل_المدفوعات.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير البيانات بنجاح.');
  };

  /* ─────────────────────────────────────────────────────── */
  /* Pagination helpers                                       */
  /* ─────────────────────────────────────────────────────── */

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 3) return [1, 2, 3, 4, 5];
    if (safePage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [safePage - 2, safePage - 1, safePage, safePage + 1, safePage + 2];
  }, [totalPages, safePage]);

  /* ─────────────────────────────────────────────────────── */
  /* Render                                                   */
  /* ─────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="payments"
      />

      {/* Main Content */}
      <div className="flex-1 lg:mr-72 flex flex-col min-w-0">
        {/* Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto w-full">

          {/* ── Page Title + Actions ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 font-tajawal">
                سجل المدفوعات
              </h1>
              <p className="text-sm text-slate-500 font-tajawal mt-1">
                تتبع وإدارة جميع التحصيلات المالية من العملاء بدقة.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-xs font-tajawal"
              >
                <Download className="w-4 h-4" />
                تصدير البيانات
              </button>
              <button
                type="button"
                onClick={() => navigate(PATHS.CUSTOMERS)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f284e] text-white text-sm font-semibold hover:bg-[#1a3a6b] active:scale-95 transition-all duration-200 shadow-sm font-tajawal"
              >
                <Plus className="w-4 h-4" />
                تسجيل تحصيل جديد
              </button>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <AddStatCard onClick={() => navigate(PATHS.CUSTOMERS)} />

            <StatCard
              label="إجمالي المحصّل (أكتوبر)"
              value={`${formatAmount(totalCollected)} ر.س`}
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              iconBg="bg-[#0f284e]"
              trend="+12%"
              trendUp
            />

            <StatCard
              label="عمليات تم التحقق منها"
              value={verifiedCount}
              icon={<CheckCircle2 className="w-5 h-5 text-white" />}
              iconBg="bg-emerald-500"
            />

            <StatCard
              label="عمليات في انتظار التأكيد"
              value={pendingCount}
              icon={<Clock className="w-5 h-5 text-white" />}
              iconBg="bg-rose-400"
            />
          </div>

          {/* ── Filters Bar ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter label */}
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 font-tajawal ml-auto sm:ml-0">
                <Filter className="w-4 h-4" />
                <span>تصفية حسب:</span>
              </div>

              {/* Method Filter */}
              <div className="relative">
                <select
                  id="method-filter"
                  value={methodFilter}
                  onChange={(e) => { setMethodFilter(e.target.value as PaymentMethodFilter); setCurrentPage(1); }}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f284e]/20 focus:border-[#0f284e] cursor-pointer font-tajawal min-w-[140px]"
                >
                  <option value="all">جميع طرق الدفع</option>
                  <option value="cash">نقداً</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="credit_card">مدى</option>
                </select>
                <ChevronLeft className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-[-90deg]" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as PaymentStatus); setCurrentPage(1); }}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f284e]/20 focus:border-[#0f284e] cursor-pointer font-tajawal min-w-[140px]"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="verified">تم التحقق</option>
                  <option value="pending">في الانتظار</option>
                </select>
                <ChevronLeft className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-[-90deg]" />
              </div>

              {/* Date From */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="date"
                  id="date-from"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none font-tajawal"
                />
              </div>

              <span className="text-slate-400 text-sm font-tajawal">إلى</span>

              {/* Date To */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="date"
                  id="date-to"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none font-tajawal"
                />
              </div>

              {/* Reset */}
              <button
                type="button"
                id="reset-filters-btn"
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-all duration-200 font-tajawal"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>إعادة ضبط</span>
              </button>
            </div>
          </div>

          {/* ── Table Card ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">

            {/* Error */}
            {loadError && (
              <div className="m-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center justify-between gap-3 font-tajawal">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loadError}</span>
                </div>
                <button
                  type="button"
                  onClick={loadPayments}
                  className="underline text-xs font-bold hover:no-underline cursor-pointer"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            {/* Loading */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-[#0f284e]" />
                <span className="text-sm font-medium font-tajawal">جاري تحميل سجل المدفوعات...</span>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 font-tajawal">اسم العميل</th>
                        <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 font-tajawal text-center">المبلغ (ر.س)</th>
                        <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 font-tajawal text-center">التاريخ</th>
                        <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 font-tajawal text-center">طريقة الدفع</th>
                        <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 font-tajawal text-center">الحالة</th>
                        <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 font-tajawal text-left">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pagedPayments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center">
                            <div className="flex flex-col items-center gap-3 text-slate-400">
                              <Receipt className="w-10 h-10 opacity-30" />
                              <p className="text-sm font-semibold font-tajawal">
                                لا توجد عمليات تحصيل تطابق الفلاتر المحددة
                              </p>
                              <button
                                type="button"
                                onClick={resetFilters}
                                className="text-xs text-[#0f284e] font-bold underline underline-offset-2 hover:no-underline font-tajawal"
                              >
                                إعادة ضبط الفلاتر
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pagedPayments.map((p) => (
                          <tr
                            key={p.id}
                            className="hover:bg-slate-50/60 transition-colors duration-150 group"
                          >
                            {/* Customer Name */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-full ${p.customerColor} flex items-center justify-center shrink-0`}
                                >
                                  <span className="text-xs font-bold text-white font-tajawal">
                                    {p.customerInitials}
                                  </span>
                                </div>
                                <span className="text-sm font-bold text-slate-800 font-tajawal">
                                  {p.customerName}
                                </span>
                              </div>
                            </td>

                            {/* Amount */}
                            <td className="py-4 px-4 text-center">
                              <span className="text-sm font-extrabold text-slate-900 font-tajawal tabular-nums">
                                {formatAmount(p.amount)}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="py-4 px-4 text-center">
                              <span className="text-sm text-slate-600 font-tajawal whitespace-nowrap">
                                {formatDate(p.date)}
                              </span>
                            </td>

                            {/* Payment Method */}
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 font-tajawal whitespace-nowrap">
                                <MethodIcon method={p.paymentMethod} />
                                {methodLabel(p.paymentMethod)}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4 text-center">
                              {p.status === 'verified' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 font-tajawal">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  تم التحقق
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700 font-tajawal">
                                  <Clock className="w-3.5 h-3.5" />
                                  في الانتظار
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-left">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150 opacity-0 group-hover:opacity-100"
                                aria-label="خيارات"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── Pagination ── */}
                {filteredPayments.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-500 font-tajawal order-2 sm:order-1">
                      عرض{' '}
                      <span className="font-bold text-slate-700">
                        {Math.min((safePage - 1) * PAGE_SIZE + 1, filteredPayments.length)}–
                        {Math.min(safePage * PAGE_SIZE, filteredPayments.length)}
                      </span>{' '}
                      من أصل{' '}
                      <span className="font-bold text-slate-700">{filteredPayments.length}</span>{' '}
                      عملية تحصيل
                    </p>

                    <div className="flex items-center gap-1 order-1 sm:order-2">
                      {/* Prev */}
                      <button
                        type="button"
                        id="prev-page-btn"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="p-2 rounded-lg text-slate-500 hover:text-[#0f284e] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {pageNumbers.map((n) => (
                        <button
                          key={n}
                          type="button"
                          id={`page-btn-${n}`}
                          onClick={() => setCurrentPage(n)}
                          className={`w-8 h-8 rounded-lg text-sm font-bold transition-all duration-150 font-tajawal ${
                            n === safePage
                              ? 'bg-[#0f284e] text-white shadow-sm'
                              : 'text-slate-500 hover:text-[#0f284e] hover:bg-slate-100'
                          }`}
                        >
                          {n.toLocaleString('ar-SA')}
                        </button>
                      ))}

                      {/* Next */}
                      <button
                        type="button"
                        id="next-page-btn"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        className="p-2 rounded-lg text-slate-500 hover:text-[#0f284e] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-[#0f284e] text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold font-tajawal animate-fade-in-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
};
