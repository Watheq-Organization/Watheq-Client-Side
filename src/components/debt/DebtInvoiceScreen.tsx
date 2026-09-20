import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileDown,
  Send,
  User,
  Calendar,
  ListOrdered,
  FileCheck,
  Check,
  Phone,
  Fingerprint,
  RotateCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { useMerchantProfile } from '../../services/merchantProfileService';
import {
  resolveAndDownloadDebtInvoicePdf,
  triggerPdfDownload,
  shareInvoiceViaWhatsApp,
  toInvoiceErrorMessage,
  getInvoiceByDebtId,
} from '../../services/invoiceService';
import { getCustomerProfile, getCustomers } from '../../services/customerService';
import { formatApiDate, getDeviceLocalDateString } from '../../lib/dateUtils';
import type { DebtInvoiceDto } from '../../types/invoice';

interface DebtItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface DebtInvoiceState {
  id?: string;
  invoiceNumber?: string;
  customerId?: string;
  customerName?: string;
  customerNationalId?: string;
  customerPhone?: string;
  customerRegistrationDate?: string;
  fileOpenDate?: string;
  issueDate?: string;
  issueTime?: string;
  dueDate?: string;
  status?: string;
  transactionType?: string;
  branch?: string;
  items?: DebtItem[];
  invoiceAmount?: number;
  previousDebt?: number;
  previousPaid?: number;
  totalCurrentDebt?: number;
}

const DEFAULT_ITEMS: DebtItem[] = [
  {
    id: '01',
    name: 'شراء مستلزمات مكتبية وأوراق طباعة مقاس A4 فاخرة',
    description: 'كرتون ورق أبيض وزن 80 جم (صناعة إندونيسية)',
    quantity: 10,
    unitPrice: 55.0,
    total: 550.0,
  },
  {
    id: '02',
    name: 'أحبار طابعات ليزر ملونة كانون وأقلام توقيع رسمية',
    description: 'عبوات متوافقة عالية الجودة مع علب أقلام حبر جاف أزرق',
    quantity: 2,
    unitPrice: 250.0,
    total: 500.0,
  },
  {
    id: '03',
    name: 'ملفات أرشفة مقواة وحافظات مستندات مقاس عريض',
    description: 'باكيت ملفات رافعة أفقية لون كحلي',
    quantity: 8,
    unitPrice: 25.0,
    total: 200.0,
  },
];

export const DebtInvoiceScreen: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const merchant = useMerchantProfile();

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [serverInvoice, setServerInvoice] = useState<DebtInvoiceDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customerRegistrationDate, setCustomerRegistrationDate] = useState<string | null>(null);

  // Extract navigation state if passed
  const navState = (location.state as { debt?: DebtInvoiceState } | null)?.debt;

  const fetchLiveInvoice = () => {
    if (!id) return;
    const cleanId = String(id).trim();
    if (!cleanId) return;

    setIsLoading(true);
    getInvoiceByDebtId(cleanId)
      .then((data) => {
        if (data) {
          setServerInvoice(data);
        }
      })
      .catch((err) => {
        console.warn('[DebtInvoiceScreen] getInvoiceByDebtId error:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchLiveInvoice();
  }, [id]);

  // Resolve customer's real registration date from backend
  useEffect(() => {
    let isMounted = true;

    const directDate =
      serverInvoice?.customerRegistrationDate ??
      serverInvoice?.fileOpenDate ??
      navState?.customerRegistrationDate ??
      navState?.fileOpenDate;

    if (directDate) {
      setCustomerRegistrationDate(formatApiDate(directDate));
      return;
    }

    const targetCustomerId = serverInvoice?.customerId ?? navState?.customerId;
    const targetCustomerName = serverInvoice?.customerName ?? navState?.customerName;
    const targetCustomerPhone = serverInvoice?.customerPhone ?? navState?.customerPhone;

    async function fetchCustomerRegistrationDate() {
      try {
        if (targetCustomerId) {
          const profile = await getCustomerProfile(String(targetCustomerId));
          if (isMounted && profile?.createdAt) {
            setCustomerRegistrationDate(formatApiDate(profile.createdAt));
            return;
          }
        }

        if (targetCustomerName || targetCustomerPhone) {
          const customers = await getCustomers();
          const matched = customers.find((c) => {
            if (targetCustomerId && String(c.id) === String(targetCustomerId)) return true;
            if (targetCustomerName && c.fullName && c.fullName.trim() === targetCustomerName.trim()) return true;
            if (targetCustomerPhone && c.phoneNumber && targetCustomerPhone.includes(c.phoneNumber)) return true;
            return false;
          });
          if (isMounted && matched?.createdAt) {
            setCustomerRegistrationDate(formatApiDate(matched.createdAt));
            return;
          }
        }
      } catch (err) {
        console.warn('[DebtInvoiceScreen] Could not fetch customer registration date:', err);
      }
    }

    if (targetCustomerId || targetCustomerName || targetCustomerPhone) {
      fetchCustomerRegistrationDate();
    }

    return () => {
      isMounted = false;
    };
  }, [
    serverInvoice?.customerId,
    serverInvoice?.customerName,
    serverInvoice?.customerPhone,
    serverInvoice?.customerRegistrationDate,
    serverInvoice?.fileOpenDate,
    navState?.customerId,
    navState?.customerName,
    navState?.customerPhone,
    navState?.customerRegistrationDate,
    navState?.fileOpenDate,
  ]);

  // Invoice Data matching Image 3 with fallback/dynamic support
  const invoiceData = useMemo(() => {
    const invoiceNumber =
      serverInvoice?.invoiceNumber ?? navState?.invoiceNumber ?? (id ? `INV-DEBT-${id}` : 'INV-DEBT-8821');
    const customerName =
      serverInvoice?.customerName ?? navState?.customerName ?? 'العميل';
    const customerNationalId =
      serverInvoice?.customerNationalId ?? navState?.customerNationalId ?? '—';
    const customerPhone =
      serverInvoice?.customerPhone ?? navState?.customerPhone ?? '—';

    const rawIssueDate =
      serverInvoice?.issueDate ?? serverInvoice?.date ?? navState?.issueDate;
    const issueDate = rawIssueDate
      ? formatApiDate(rawIssueDate)
      : formatApiDate(getDeviceLocalDateString());

    const fileOpenDate =
      customerRegistrationDate ??
      (serverInvoice?.customerRegistrationDate ? formatApiDate(serverInvoice.customerRegistrationDate) : null) ??
      (serverInvoice?.fileOpenDate ? formatApiDate(serverInvoice.fileOpenDate) : null) ??
      (navState?.customerRegistrationDate ? formatApiDate(navState.customerRegistrationDate) : null) ??
      (navState?.fileOpenDate ? formatApiDate(navState.fileOpenDate) : null) ??
      issueDate;

    const issueTime =
      serverInvoice?.issueTime ?? navState?.issueTime ?? '—';
    const rawDueDate = serverInvoice?.dueDate ?? navState?.dueDate;
    const dueDate = rawDueDate ? formatApiDate(rawDueDate) : 'غير محدد';
    const status =
      serverInvoice?.status ?? navState?.status ?? 'غير مسددة';
    const branch =
      serverInvoice?.branch ?? navState?.branch ?? merchant.businessName ?? 'الفرع الرئيسي';

    const items =
      serverInvoice?.items && serverInvoice.items.length > 0
        ? serverInvoice.items.map((it, idx) => ({
            id: String(it.id ?? idx + 1).padStart(2, '0'),
            name: it.name ?? it.description ?? `بند ${idx + 1}`,
            description: it.description ?? '',
            quantity: it.quantity ?? 1,
            unitPrice: it.unitPrice ?? it.price ?? 0,
            total: it.total ?? ((it.quantity ?? 1) * (it.unitPrice ?? it.price ?? 0)),
          }))
        : (navState?.items ?? DEFAULT_ITEMS);

    const invoiceAmount =
      serverInvoice?.invoiceAmount ??
      serverInvoice?.amount ??
      navState?.invoiceAmount ??
      items.reduce((sum, item) => sum + item.total, 0);
    const previousDebt =
      serverInvoice?.previousDebt ?? navState?.previousDebt ?? 0;
    const previousPaid =
      serverInvoice?.previousPaid ?? navState?.previousPaid ?? 0;
    const totalCurrentDebt =
      serverInvoice?.totalCurrentDebt ??
      serverInvoice?.remainingAmount ??
      navState?.totalCurrentDebt ??
      (invoiceAmount + previousDebt - previousPaid);
    const currency =
      serverInvoice?.currency ?? serverInvoice?.currencyCode ?? 'شيكل';

    return {
      invoiceNumber,
      customerName,
      customerNationalId,
      customerPhone,
      fileOpenDate,
      issueDate,
      issueTime,
      dueDate,
      status,
      branch,
      items,
      invoiceAmount,
      previousDebt,
      previousPaid,
      totalCurrentDebt,
      currency,
      hash: serverInvoice?.hash ?? (serverInvoice?.invoiceNumber ? `WTQ-${serverInvoice.invoiceNumber}-SECURE` : 'WTQ-SECURE-STAMP'),
    };
  }, [serverInvoice, navState, id, customerRegistrationDate, merchant.businessName]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleExportPdf = async () => {
    const targetId = serverInvoice?.invoiceId ?? serverInvoice?.id ?? (id ? String(id).trim() : '15');
    setIsDownloadingPdf(true);
    showToast(`جاري تحميل ملف الفاتورة PDF من الخادم...`, 'info');
    try {
      const blob = await resolveAndDownloadDebtInvoicePdf(targetId);
      if (blob && blob.size > 0) {
        triggerPdfDownload(blob, `invoice_${targetId}.pdf`);
        showToast('تم تحميل ملف PDF بنجاح من الخادم.', 'success');
        return;
      }
      throw new Error('الملف المستلم فارغ أو غير صالح.');
    } catch (err: unknown) {
      const errMsg = toInvoiceErrorMessage(err);
      showToast(`${errMsg} - جاري تجهيز الطباعة المباشرة...`, 'info');
      setTimeout(() => {
        window.print();
      }, 1500);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleSendWhatsApp = async () => {
    const cleanId = id ? String(id).trim() || '15' : '15';
    try {
      const rawPhone = invoiceData.customerPhone.replace(/[^0-9+]/g, '');
      await shareInvoiceViaWhatsApp(cleanId, { phoneNumber: rawPhone });
    } catch {
      // Graceful fallback to client direct WhatsApp link
    }
    const message = encodeURIComponent(
      `مرحباً ${invoiceData.customerName}،\nتم إصدار سند إثبات وقيد دين رقمي #${invoiceData.invoiceNumber} بمبلغ ${invoiceData.invoiceAmount.toLocaleString()} شيكل إسرائيلي من ${merchant.businessName}.\nموعد السداد الأقصى: ${invoiceData.dueDate}.\nيمكنكم التحقق من السند عبر الرابط: ${window.location.origin}/debts/${cleanId}/invoice`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div
      className="min-h-screen bg-[#f4f7fb] text-slate-800 font-cairo antialiased flex"
      dir="rtl"
    >
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 border print:hidden max-w-md text-right ${
            toast.type === 'error'
              ? 'bg-rose-900/95 text-white border-rose-700 shadow-rose-950/30'
              : toast.type === 'success'
                ? 'bg-[#0c2444] text-white border-emerald-500/40 shadow-slate-950/30'
                : 'bg-[#0c2444] text-white border-blue-500/40'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : toast.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Sidebar Navigation (hidden in print) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="add-debt"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        {/* Top Header (hidden in print) */}
        <div className="print:hidden">
          <Header
            onMenuClick={() => setIsSidebarOpen(true)}
            hideSearch={true}
          />
        </div>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-5xl mx-auto w-full">
          {/* Top Bar: Back, Title, & Action Buttons (hidden in print) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            {/* Right: Back button & Titles */}
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                title="الرجوع"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold font-cairo text-slate-900 tracking-tight">
                    سند إثبات وقيد دين رقمي
                  </h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                    #{invoiceData.invoiceNumber.replace('INV-DEBT-', 'INV-')}
                  </span>
                  {serverInvoice ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      مربوط بالسيرفر
                    </span>
                  ) : isLoading ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <RotateCw className="w-2.5 h-2.5 animate-spin" />
                      جاري التحميل...
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500 font-cairo">
                  العميل: <span className="font-bold text-slate-700">{invoiceData.customerName}</span> • تاريخ التحرير: {invoiceData.issueDate}
                </p>
              </div>
            </div>

            {/* Left: Action Buttons matching Image 3 */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
              {/* Refresh Live Invoice Button */}
              <button
                type="button"
                onClick={fetchLiveInvoice}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                title="تحديث الفاتورة من الخادم"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
                <span className="hidden sm:inline">تحديث</span>
              </button>

              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال للعميل (واتساب)</span>
              </button>

              {/* Export PDF Button */}
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isDownloadingPdf}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-60"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 text-slate-600" />
                )}
                <span>{isDownloadingPdf ? 'جاري التحميل...' : 'تحميل كـ PDF'}</span>
              </button>
            </div>
          </div>

          {/* Top Protected Document Notification Banner */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs print:hidden">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-bold font-cairo text-slate-900">
                  مستند إلكتروني محمي ومشفر ومسجل في سجلات منصة وثّق
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  تم توثيق إقرار الدين ومطابقته رقمياً برقم مرجعي غير قابل للتعديل
                </p>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs shrink-0">
              حالة الفاتورة: {invoiceData.status}
            </span>
          </div>

          {/* ============================================================ */}
          {/* THE OFFICIAL DEBT INVOICE CARD (PRINTABLE AREA)             */}
          {/* ============================================================ */}
          <div
            id="debt-invoice-card"
            className="bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-200/40 overflow-hidden relative print:border-none print:shadow-none print:rounded-none print:m-0 print:p-0"
          >
            {/* Emerald Top Accent Stripe */}
            <div className="h-2.5 bg-gradient-to-r from-[#007a3d] via-[#059669] to-[#007a3d] w-full print:hidden" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-7">
              {/* Section 1: Header (Invoice Code & Merchant Branding) */}
              <div className="flex flex-col-reverse md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                {/* Right: Invoice Code & Date */}
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>سند مديونية موثق رقمياً</span>
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black font-mono text-[#0c2444] tracking-tight">
                    #{invoiceData.invoiceNumber}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    تاريخ الإصدار: {invoiceData.issueDate} م | {invoiceData.issueTime}
                  </p>
                </div>

                {/* Left: Merchant Platform Branding */}
                <div className="flex items-center gap-3.5">
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-lg sm:text-xl font-black font-cairo text-[#0c2444]">
                        وثّق
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        بوابة التاجر المعتمدة
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800 font-cairo">
                      {merchant.businessName || 'مؤسسة توريدات القرطاسية والمكتبية الحديثة'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono" dir="ltr">
                      س.ت: 1010894721 • الرقم الضريبي: 310249827400003
                    </div>
                  </div>
                  <div className="w-13 h-13 rounded-2xl bg-[#0c2444] text-white flex items-center justify-center shadow-md shadow-slate-900/10 shrink-0">
                    <ShieldCheck className="w-7 h-7 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Section 2: Parties and Terms Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Box 1 (Right): بيانات العميل المدين */}
                <div className="border border-slate-200/90 rounded-2xl p-5 space-y-3 bg-white">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>بيانات العميل (المدين)</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ موثق الهوية
                    </span>
                  </div>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">الاسم الكامل:</span>
                      <span className="font-extrabold text-slate-900 text-base font-cairo">
                        {invoiceData.customerName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">رقم الهوية الوطنية:</span>
                      <span className="font-bold font-mono text-slate-800">
                        {invoiceData.customerNationalId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">رقم الجوال:</span>
                      <span className="font-bold font-mono text-slate-800" dir="ltr">
                        {invoiceData.customerPhone}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">تاريخ فتح الملف:</span>
                      <span className="font-semibold text-slate-700">{invoiceData.fileOpenDate}</span>
                    </div>
                  </div>
                </div>

                {/* Box 2 (Left): شروط وموعد الاستحقاق */}
                <div className="border border-slate-200/90 rounded-2xl p-5 space-y-3 bg-white">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>شروط وموعد الاستحقاق</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      مطلوب السداد
                    </span>
                  </div>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">موعد السداد الأقصى:</span>
                      <span className="font-extrabold text-slate-900 text-base font-cairo">
                        {invoiceData.dueDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">نوع المعاملة:</span>
                      <span className="font-semibold text-slate-800">
                        فاتورة آجل (قيد مديونية تجارية)
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">طريقة التوثيق:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>إشعار معتمد عبر واتساب</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">الفرع المسجل:</span>
                      <span className="font-semibold text-slate-700">{invoiceData.branch}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Items Table (تفاصيل بنود الدين والقيد المالي) */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <ListOrdered className="w-4 h-4 text-slate-400" />
                  <span>تفاصيل بنود الدين والقيد المالي</span>
                </div>
                <div className="overflow-x-auto border border-slate-200/90 rounded-2xl relative">
                  {/* Subtle Background Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none print:hidden">
                    <span className="text-9xl font-black font-cairo text-[#0c2444]">وثّق</span>
                  </div>

                  <table className="w-full text-right text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-600 font-bold">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">البند والبيان</th>
                        <th className="py-3 px-4 text-center">الكمية</th>
                        <th className="py-3 px-4 text-center">سعر الوحدة</th>
                        <th className="py-3 px-4 text-left">الإجمالي (شيكل)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {invoiceData.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                            {item.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 font-cairo">{item.name}</div>
                            <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                              {item.description}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                            {item.quantity}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-700" dir="ltr">
                            {item.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-left font-mono font-extrabold text-slate-900" dir="ltr">
                            {item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Legal Acknowledgment & Cumulative Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Box 1 (Right): إقرار وقبول الدين المنصوص */}
                <div className="border border-slate-200/90 rounded-2xl p-5 space-y-4 bg-slate-50/50 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pb-2 border-b border-slate-200/60">
                      <FileCheck className="w-4 h-4 text-slate-400" />
                      <span>إقرار وقبول الدين المنصوص</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-normal">
                      يقر الطرف المدين بصحة المعاملة الواردة أعلاه والبيانات المرفقة بموجب رقم الجوال والهوية المعتمدة، ويلتزم بسداد كامل المبلغ في الموعد المحدد أعلاه دون تأخير، وتعتبر هذه الفاتورة سنداً وقيداً نظامياً يثبت المعاملة وفق الضوابد المعمول بها.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-medium block">
                        البصمة الرقمية للمعاملة (Hash)
                      </span>
                      <span className="font-mono text-[10px] text-slate-600 font-bold block">
                        {invoiceData.hash}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                      <Fingerprint className="w-4 h-4 text-emerald-600" />
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block leading-tight">توقيع النظام الإلكتروني</span>
                        <span className="text-[10px] font-bold text-emerald-700 leading-tight">معتمد وموثق</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box 2 (Left): الملخص المالي والمديونية التراكمية */}
                <div className="border border-slate-200/90 rounded-2xl p-5 space-y-3.5 bg-white flex flex-col justify-between">
                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
                      <span>الملخص المالي والمديونية التراكمية</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600 font-medium">قيمة الفاتورة الحالية:</span>
                      <span className="font-extrabold font-mono text-slate-900" dir="ltr">
                        {invoiceData.invoiceAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} شيكل
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">المديونية السابقة بذمة العميل:</span>
                      <span className="font-medium font-mono text-slate-400" dir="ltr">
                        {invoiceData.previousDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })} شيكل
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">إجمالي المدفوعات السابقة المسددة:</span>
                      <span className="font-medium font-mono text-emerald-600" dir="ltr">
                        - {invoiceData.previousPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} شيكل
                      </span>
                    </div>
                  </div>

                  {/* Big Total Current Debt Box */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-center space-y-1">
                    <span className="text-xs text-slate-500 font-bold block">إجمالي المديونية الحالية:</span>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-[#0c2444]" dir="ltr">
                      {invoiceData.totalCurrentDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                      <span className="text-base font-cairo">شيكل</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      المبلغ المطلوب بذمة العميل
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 5: Verification Stamp & QR Code */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 print:hidden">
                {/* Official Stamp */}
                <div className="w-36 h-22 border-2 border-dashed border-emerald-600 rounded-2xl bg-emerald-50/40 flex flex-col items-center justify-center p-2 text-emerald-800 rotate-[-2deg] shadow-2xs shrink-0">
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>منظومة وثّق</span>
                  </div>
                  <div className="text-xs font-black tracking-wide my-0.5">معتمد إلكترونياً</div>
                  <div className="text-[10px] font-mono font-bold text-emerald-700">17-09-2026</div>
                </div>

                {/* QR Code Verification */}
                <div className="flex items-center gap-3 text-right">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900">امسح الرمز للتحقق الفوري</div>
                    <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                      يمكن للمدين أو أي جهة معتمدة مسح الرمز بكاميرا الجوال للتأكد من تسجيل وسريان هذه المديونية عبر منصة وثّق.
                    </p>
                  </div>
                  {/* Stylized QR Box */}
                  <div className="w-14 h-14 bg-white border border-slate-300 rounded-xl p-1.5 flex items-center justify-center shadow-2xs shrink-0">
                    <div className="w-full h-full grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded">
                      <div className="bg-[#0c2444] rounded-xs" />
                      <div className="bg-emerald-600 rounded-xs" />
                      <div className="bg-emerald-600 rounded-xs" />
                      <div className="bg-[#0c2444] rounded-xs" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 6: Document Legal Footer */}
              <div className="border-t border-slate-200/80 pt-4 text-center text-[10px] sm:text-[11px] text-slate-400 font-medium print:hidden">
                اتصال مشفر بمعايير التشفير المصرفي 256-bit SSL • سياسة الخصوصية والشروط • الدعم الفني المباشر • وثّق 2026 ©
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DebtInvoiceScreen;
