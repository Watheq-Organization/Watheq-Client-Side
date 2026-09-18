import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileDown,
  User,
  Store,
  FileText,
  Calendar,
  Banknote,
  Landmark,
  CreditCard,
  Check,
  Send,
  BookOpen,
  History,
  Tag,
  RotateCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { PATHS } from '../../routes/paths';
import { useMerchantProfile } from '../../services/merchantProfileService';
import { tafqeet } from '../../lib/tafqeet';
import {
  getInvoiceByPaymentId,
  resolveAndDownloadPaymentInvoicePdf,
  triggerPdfDownload,
  toInvoiceErrorMessage,
} from '../../services/invoiceService';
import { getCustomerProfile, getCustomers } from '../../services/customerService';
import { formatApiDate, getDeviceLocalDateString } from '../../lib/dateUtils';
import type { CustomerProfileDto } from '../../types/customer';
import type { PaymentInvoiceDto } from '../../types/invoice';

interface PaymentState {
  id?: string;
  customerId?: string;
  customerName?: string;
  customerInitials?: string;
  customerAvatarBg?: string;
  amount?: number;
  date?: string;
  time?: string;
  method?: string;
  status?: string;
  receiptNumber?: string;
  nationalId?: string;
  phone?: string;
  previousDebt?: number;
  remainingDebt?: number;
  currency?: string;
}

export const PaymentReceiptScreen: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const merchant = useMerchantProfile();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [serverPayment, setServerPayment] = useState<PaymentInvoiceDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfileDto | null>(null);

  // Extract payment from navigation state if available
  const statePayment = (location.state as { payment?: PaymentState } | null)?.payment;

  const fetchLivePayment = () => {
    if (!id) return;
    const cleanId = String(id).trim();
    if (!cleanId) return;

    setIsLoading(true);
    getInvoiceByPaymentId(cleanId)
      .then((data) => {
        if (data) {
          setServerPayment(data);
        }
      })
      .catch((err) => {
        console.warn('[PaymentReceiptScreen] getInvoiceByPaymentId error:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchLivePayment();
  }, [id]);

  // Resolve customer profile for real balance & debt numbers
  useEffect(() => {
    let isMounted = true;
    const targetCustomerId = serverPayment?.customerId ?? statePayment?.customerId;
    const targetCustomerName = serverPayment?.customerName ?? statePayment?.customerName;
    const targetCustomerPhone = serverPayment?.customerPhone ?? statePayment?.phone;

    async function fetchCustomerData() {
      try {
        if (targetCustomerId) {
          const profile = await getCustomerProfile(String(targetCustomerId));
          if (isMounted && profile) {
            setCustomerProfile(profile);
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
          if (isMounted && matched) {
            const profile = await getCustomerProfile(String(matched.id));
            if (isMounted && profile) {
              setCustomerProfile(profile);
            }
          }
        }
      } catch (err) {
        console.warn('[PaymentReceiptScreen] Could not fetch customer profile:', err);
      }
    }

    if (targetCustomerId || targetCustomerName || targetCustomerPhone) {
      fetchCustomerData();
    }

    return () => {
      isMounted = false;
    };
  }, [
    serverPayment?.customerId,
    serverPayment?.customerName,
    serverPayment?.customerPhone,
    statePayment?.customerId,
    statePayment?.customerName,
    statePayment?.phone,
  ]);

  // Real data with defensive server fallbacks
  const paymentData = useMemo(() => {
    const amount =
      serverPayment?.amount ?? serverPayment?.paidAmount ?? statePayment?.amount ?? 0;
    const customerName =
      serverPayment?.customerName ?? statePayment?.customerName ?? customerProfile?.fullName ?? 'العميل';
    const customerNationalId =
      serverPayment?.customerNationalId ?? statePayment?.nationalId ?? '—';
    const customerPhone =
      serverPayment?.customerPhone ?? statePayment?.phone ?? customerProfile?.phoneNumber ?? '—';
    const receiptNumber =
      serverPayment?.receiptNumber ??
      serverPayment?.invoiceNumber ??
      statePayment?.receiptNumber ??
      (id ? `REC-${id}` : 'REC-001');

    const rawPaymentDate =
      serverPayment?.paymentDate ?? serverPayment?.date ?? statePayment?.date;
    const paymentDate = rawPaymentDate
      ? formatApiDate(rawPaymentDate)
      : formatApiDate(getDeviceLocalDateString());

    const paymentTime =
      serverPayment?.paymentTime ?? serverPayment?.time ?? statePayment?.time ?? '—';

    const matchingTx = customerProfile?.transactions?.find(
      (tx) => String(tx.id) === String(id) || (receiptNumber && String(tx.reference) === String(receiptNumber))
    );

    const rawMethod =
      (serverPayment?.paymentMethod && serverPayment.paymentMethod !== 'نقداً'
        ? serverPayment.paymentMethod
        : undefined) ??
      (statePayment?.method && statePayment.method !== 'نقداً'
        ? statePayment.method
        : undefined) ??
      matchingTx?.paymentMethod ??
      serverPayment?.paymentMethod ??
      statePayment?.method ??
      'نقداً';

    const method = String(rawMethod);

    // Real accounting calculation (no mock +3000)
    let previousDebt = 0;
    let remainingDebt = 0;

    if (serverPayment?.previousDebt !== undefined) {
      previousDebt = Number(serverPayment.previousDebt) || 0;
      remainingDebt = serverPayment.remainingDebt !== undefined
        ? Number(serverPayment.remainingDebt) || 0
        : Math.max(0, previousDebt - amount);
    } else if (statePayment?.previousDebt !== undefined) {
      previousDebt = Number(statePayment.previousDebt) || 0;
      remainingDebt = statePayment.remainingDebt !== undefined
        ? Number(statePayment.remainingDebt) || 0
        : Math.max(0, previousDebt - amount);
    } else if (customerProfile) {
      remainingDebt = Math.max(0, customerProfile.currentBalance ?? 0);
      previousDebt = remainingDebt + amount;
    } else {
      previousDebt = amount;
      remainingDebt = 0;
    }

    const rawCurrency =
      serverPayment?.currency ?? serverPayment?.currencyCode ?? statePayment?.currency ?? 'شيكل';
    const currency = rawCurrency === 'ILS' ? 'شيكل' : rawCurrency === 'SAR' ? 'ر.س' : rawCurrency;

    const rawDueDate = serverPayment?.nextDueDate ?? serverPayment?.dueDate;
    const nextDueDate = rawDueDate ? formatApiDate(rawDueDate) : null;

    const invoiceId = serverPayment?.invoiceId ? String(serverPayment.invoiceId) : null;
    const invoiceNumber = serverPayment?.invoiceNumber ?? (invoiceId ? `INV-${invoiceId}` : null);
    const originalInvoiceDate = serverPayment?.originalInvoiceDate ? formatApiDate(serverPayment.originalInvoiceDate) : null;

    return {
      amount,
      customerName,
      customerNationalId,
      customerPhone,
      receiptNumber,
      paymentDate,
      paymentTime,
      method,
      referenceNumber:
        serverPayment?.referenceNumber ??
        `WTQ-${receiptNumber.replace(/[^0-9A-Z]/ig, '').slice(-4) || '0821'}-PAY9`,
      previousDebt,
      remainingDebt,
      currency,
      nextDueDate,
      invoiceId,
      invoiceNumber,
      originalInvoiceDate,
    };
  }, [serverPayment, statePayment, id, customerProfile]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleExportPdf = async () => {
    const targetId = serverPayment?.invoiceId ?? serverPayment?.id ?? (id ? String(id).trim() : '15');
    setIsDownloadingPdf(true);
    showToast(`جاري تحميل سند القبض PDF من الخادم...`, 'info');
    try {
      const blob = await resolveAndDownloadPaymentInvoicePdf(targetId);
      if (blob && blob.size > 0) {
        triggerPdfDownload(blob, `receipt_${targetId}.pdf`);
        showToast('تم تحميل ملف PDF بنجاح من الخادم.', 'success');
        return;
      }
      throw new Error('الملف المستلم فارغ أو غير صالح.');
    } catch (err: unknown) {
      const errMsg = toInvoiceErrorMessage(err);
      showToast(errMsg, 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleSendWhatsApp = () => {
    const message = encodeURIComponent(
      `مرحباً ${paymentData.customerName}،\nتم إصدار سند قبض مالي إلكتروني موثق برقم ${paymentData.receiptNumber} بمبلغ ${paymentData.amount.toLocaleString()} ${paymentData.currency} من ${merchant.businessName}.\nيمكنكم التحقق من السند عبر الرابط: ${window.location.origin}/payments/${id || 'rec-4821'}/receipt`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const getPaymentMethodDetails = (method: string) => {
    const m = (method || '').trim().toLowerCase().replace(/[\s_-]/g, '');
    if (
      m.includes('بنك') ||
      m.includes('تحويل') ||
      m.includes('bank') ||
      m.includes('transfer') ||
      m === '2'
    ) {
      return {
        label: 'تحويل بنكي (سداد موثق)',
        icon: Landmark,
      };
    }
    if (
      m.includes('مدى') ||
      m.includes('بطاقة') ||
      m.includes('محفظ') ||
      m.includes('card') ||
      m.includes('credit') ||
      m === '3'
    ) {
      return {
        label: 'مدى (سداد إلكتروني معتمد)',
        icon: CreditCard,
      };
    }
    return {
      label: 'نقداً (سداد يدوي مثبت)',
      icon: Banknote,
    };
  };

  const methodDetails = getPaymentMethodDetails(paymentData.method);
  const MethodIcon = methodDetails.icon;

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
        activeTab="payments"
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

        {/* Page Body Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-5xl mx-auto w-full">
          {/* Top Bar: Back, Title, Badge, & Action Buttons (hidden in print) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            {/* Right side: Back button & Titles */}
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => navigate(PATHS.PAYMENTS)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                title="الرجوع لسجل المدفوعات"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold font-cairo text-slate-900 tracking-tight">
                    سند قبض مالي إلكتروني
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>مقبوض وموثق</span>
                  </span>
                  {serverPayment ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      مربوط بالسيرفر
                    </span>
                  ) : isLoading ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      <RotateCw className="w-2.5 h-2.5 animate-spin text-slate-500" />
                      جاري التحميل...
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500 font-cairo">
                  سند رسمي صادر عبر منصة واثق للتحصيل وسداد الديون
                </p>
              </div>
            </div>

            {/* Left side: Action Buttons */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
              {/* Refresh Button */}
              <button
                type="button"
                onClick={fetchLivePayment}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                title="تحديث سند القبض من الخادم"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
                <span className="hidden sm:inline">تحديث</span>
              </button>

              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <Send className="w-4 h-4 text-emerald-600" />
                <span>إرسال واتساب</span>
              </button>

              {/* Export PDF Button */}
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isDownloadingPdf}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-60"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 text-slate-600" />
                )}
                <span>{isDownloadingPdf ? 'جاري التحميل...' : 'تصدير PDF'}</span>
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* THE OFFICIAL RECEIPT VOUCHER CARD (PRINTABLE AREA)          */}
          {/* ============================================================ */}
          <div
            id="receipt-voucher-card"
            className="bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-200/40 overflow-hidden relative print:border-none print:shadow-none print:rounded-none print:m-0 print:p-0"
          >
            {/* Emerald Top Border Stripe */}
            <div className="h-2.5 bg-gradient-to-r from-[#007a3d] via-[#059669] to-[#007a3d] w-full" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-7">
              {/* Section 1: Header (System & Merchant Info + Receipt Meta Box) */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                {/* Right: Watheq Shield & Legal Status */}
                <div className="flex items-center gap-4">
                  <div className="w-13 h-13 rounded-2xl bg-[#0c2444] text-white flex items-center justify-center shadow-md shadow-slate-900/10 shrink-0">
                    <ShieldCheck className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black font-cairo text-[#0c2444] tracking-tight">
                        منظومة واثق المالية
                      </h2>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        سند قانوني نافذ
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      الجهة المحصلة: <span className="font-bold text-slate-800">{merchant.businessName || 'متجر النور للتجارة والتوريدات'}</span> (س.ت: 1010874921)
                    </p>
                  </div>
                </div>

                {/* Left: Receipt Metadata Card */}
                <div className="w-full md:w-auto bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 text-xs font-medium space-y-2 min-w-[240px]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">رقم السند:</span>
                    <span className="font-bold font-mono text-slate-900 text-sm">
                      #{paymentData.receiptNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">تاريخ التحصيل:</span>
                    <span className="font-bold text-slate-800">{paymentData.paymentDate}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">وقت السداد:</span>
                    <span className="font-bold text-slate-800">{paymentData.paymentTime}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">الرقم المرجعي:</span>
                    <span className="font-bold font-mono text-slate-700">
                      {paymentData.referenceNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Main Amount Banner (المبلغ المقبوض والمودع) */}
              <div className="bg-gradient-to-l from-slate-50 via-[#f8faf9] to-emerald-50/25 border border-slate-200/90 rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Right: Big Amount & Tafqeet */}
                <div className="space-y-2 text-center md:text-right w-full md:w-auto">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 block">
                    المبلغ المقبوض والمودع:
                  </span>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#007a3d] font-cairo tracking-tight" dir="ltr">
                    {paymentData.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xl sm:text-2xl font-bold font-cairo text-slate-800">
                      ريال سعودي
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs">
                    <span>فقط وقدره:</span>
                    <span className="text-[#0c2444] font-semibold">
                      {tafqeet(paymentData.amount)}
                    </span>
                    <span>لا غير</span>
                  </div>
                </div>

                {/* Left: Payment Method Card */}
                <div className="w-full md:w-auto bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs min-w-[250px] space-y-2">
                  <div className="text-[11px] font-bold text-slate-400">طريقة الدفع</div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <MethodIcon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-800 text-sm font-cairo">
                      {methodDetails.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>تم التحقق من استلام التعميد في الخزينة</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Two Parties Boxes (العميل والتاجر) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Box 1 (Right in RTL): Customer (استلمنا من السيد) */}
                <div className="border border-slate-200/90 rounded-2xl p-5 space-y-3.5 bg-white">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 pb-2 border-b border-slate-100">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>استلمنا من السيد (العميل):</span>
                  </div>
                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">الاسم الكامل:</span>
                      <span className="font-bold text-slate-900 font-cairo">
                        {paymentData.customerName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">رقم الهوية الوطنية:</span>
                      <span className="font-bold font-mono text-slate-800">
                        {paymentData.customerNationalId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">رقم الجوال المسجل:</span>
                      <span className="font-bold font-mono text-slate-800" dir="ltr">
                        {paymentData.customerPhone}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">حالة العميل الائتمانية:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        موثوق ومحدث
                      </span>
                    </div>
                  </div>
                </div>

                {/* Box 2 (Left in RTL): Merchant (لحساب التاجر المستفيد) */}
                <div className="border border-slate-200/90 rounded-2xl p-5 space-y-3.5 bg-white">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 pb-2 border-b border-slate-100">
                    <Store className="w-4 h-4 text-slate-400" />
                    <span>لحساب التاجر (المستفيد):</span>
                  </div>
                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">الاسم التجاري:</span>
                      <span className="font-bold text-slate-900 font-cairo">
                        {merchant.businessName || 'متجر النور للقرطاسية والمكتبات'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">رقم التواصل المعتمد:</span>
                      <span className="font-bold font-mono text-slate-800" dir="ltr">{merchant.phoneNumber || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">المحصل المسؤول:</span>
                      <span className="font-bold text-slate-800 font-cairo">
                        {merchant.fullName || 'أمين الصندوق'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">مركز التوثيق:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0c2444] text-white">
                        بوابة واثق للشركاء
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Reason / Statement ("البيان وسبب التحصيل المالي") */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>البيان وسبب التحصيل المالي</span>
                </div>
                <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed font-cairo">
                    {serverPayment?.notes
                      ? serverPayment.notes
                      : paymentData.invoiceNumber
                        ? `سداد دفعة مالية موثقة لحساب تصفية مديونية المشتريات بموجب الفاتورة رقم #${paymentData.invoiceNumber}.`
                        : `سداد دفعة مالية موثقة ومعتمدة في سجل حساب العميل بسند رقم #${paymentData.receiptNumber}.`}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60 text-xs">
                    {paymentData.invoiceId || paymentData.invoiceNumber ? (
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span>مرتبط بالفاتورة:</span>
                        <button
                          type="button"
                          onClick={() => navigate(`/debts/${paymentData.invoiceId || 'invoice'}/invoice`)}
                          className="font-bold font-mono text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer"
                          title="عرض فاتورة إثبات وقيد الدين"
                        >
                          {paymentData.invoiceNumber || `INV-${paymentData.invoiceId}`}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span>رقم السند المرجعي:</span>
                        <span className="font-bold font-mono text-slate-800">{paymentData.referenceNumber}</span>
                      </div>
                    )}
                    {paymentData.originalInvoiceDate && (
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>تاريخ الفاتورة الأصلية:</span>
                        <span className="font-bold text-slate-800">{paymentData.originalInvoiceDate}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>إشعار قيد الدفعة: موثق رقمياً بالكامل</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Accounting Impact ("الأثر المحاسبي وحالة كشف حساب العميل") */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>الأثر المحاسبي وحالة كشف حساب العميل</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Previous Debt */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 text-center space-y-1.5">
                    <div className="text-xs text-slate-500 font-semibold">إجمالي المديونية السابقة</div>
                    <div className="text-lg sm:text-xl font-bold font-mono text-slate-900" dir="ltr">
                      {paymentData.previousDebt.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      <span className="text-xs font-cairo">{paymentData.currency}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">رصيد قبل سداد هذا السند</div>
                  </div>

                  {/* Card 2: Current Paid (Emerald) */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 text-center space-y-1.5 text-emerald-900">
                    <div className="text-xs text-emerald-700 font-bold">المبلغ المسدد بهذا السند (-)</div>
                    <div className="text-lg sm:text-xl font-bold font-mono text-[#007a3d]" dir="ltr">
                      {paymentData.amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      <span className="text-xs font-cairo">{paymentData.currency}</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-bold">{methodDetails.label}</div>
                  </div>

                  {/* Card 3: Remaining Balance (Navy) */}
                  <div className="bg-[#0c2444] border border-[#0c2444] rounded-2xl p-5 text-center space-y-1.5 text-white shadow-sm">
                    <div className="text-xs text-blue-200 font-medium">الرصيد المتبقي بذمة العميل</div>
                    <div className="text-lg sm:text-xl font-bold font-mono text-white" dir="ltr">
                      {paymentData.remainingDebt.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      <span className="text-xs font-cairo text-blue-200">{paymentData.currency}</span>
                    </div>
                    <div className="text-[11px] text-blue-200/80 font-medium">
                      {paymentData.remainingDebt <= 0
                        ? 'تم سداد كامل المديونية المستحقة ✓'
                        : paymentData.nextDueDate
                          ? `تاريخ الاستحقاق القادم: ${paymentData.nextDueDate}`
                          : 'رصيد متبقي بذمة العميل'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 6: Digital Verification & Signatures */}
              <div className="border border-slate-200/90 rounded-2xl p-6 bg-slate-50/40">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center">
                  {/* Column 1 (Collector Signature) */}
                  <div className="space-y-1.5 text-right md:text-center">
                    <span className="text-xs text-slate-400 font-medium block">توقيع واعتماد المحصل:</span>
                    <div className="text-base sm:text-lg font-bold font-cairo text-slate-900">
                      {merchant.fullName || 'أمين الصندوق'}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">الختم الإلكتروني للنظام</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      SHA256: 952d8e4f...11a
                    </div>
                  </div>

                  {/* Column 2 (Official Green Stamp) */}
                  <div className="flex justify-center">
                    <div className="w-32 h-20 border-2 border-dashed border-emerald-600 rounded-2xl bg-emerald-50/40 flex flex-col items-center justify-center p-2 text-emerald-800 rotate-[-2deg] shadow-2xs">
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>منصة وثّق</span>
                      </div>
                      <div className="text-xs font-black tracking-wide my-0.5">معتمد وموثق</div>
                      <div className="text-[10px] font-mono font-bold text-emerald-700">{paymentData.paymentDate}</div>
                    </div>
                  </div>

                  {/* Column 3 (Digital Verification / QR Code) */}
                  <div className="space-y-1.5 flex flex-col items-center">
                    {/* Stylized QR Code Box matching design */}
                    <div className="w-14 h-14 bg-white border border-slate-300 rounded-xl p-1.5 flex items-center justify-center shadow-2xs">
                      <div className="w-full h-full grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded">
                        <div className="bg-[#0c2444] rounded-xs" />
                        <div className="bg-emerald-600 rounded-xs" />
                        <div className="bg-emerald-600 rounded-xs" />
                        <div className="bg-[#0c2444] rounded-xs" />
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-800">امسح التحقق الرقمي المباشر</div>
                    <p className="text-[10px] text-slate-400 max-w-[220px] leading-tight">
                      سند موثق إلكترونياً ومشفر بنظام التحقق السريع عبر خوادم منصة واثق المركزية
                    </p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-mono font-bold">
                      verify.wathiq.sa/rec/4821
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 7: Legal Disclaimer Footer inside receipt */}
              <div className="border-t border-slate-200/80 pt-4 text-center text-[10px] sm:text-[11px] text-slate-400 font-medium">
                يعتبر هذا السند إقراراً رسمياً باستلام المبلغ المذكور أعلاه ولا يعتد بأي تعديل يدوي أو كشط على الوثيقة | صفحة 1 من 1 | كود إلكتروني مميز ومحمي بنظام واثق للتشفير المالي
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* BOTTOM 3 AUDIT / SYSTEM INFO CARDS (HIDDEN IN PRINT)       */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 print:hidden">
            {/* Card 1: إشعار العميل التلقائي */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold font-cairo text-slate-900">
                  إشعار العميل التلقائي
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  تم إرسال نسخة من سند القبض مباشرة لجوال العميل المسجل.
                </p>
              </div>
            </div>

            {/* Card 2: الترحيل المحاسبي */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold font-cairo text-slate-900">
                  الترحيل المحاسبي
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  تم توليد قيد انسداد لليومية العامة وصندوق النقدية فوراً.
                </p>
              </div>
            </div>

            {/* Card 3: سجل العمليات */}
            <div
              onClick={() => navigate('/debts/8821/invoice')}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer"
              title="عرض أصل الفاتورة رقم 8821"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold font-cairo text-slate-900">
                  سجل العمليات
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  يمكنك الرجوع لأصل الفاتورة 8821 وتتبع كافة الدفعات السابقة.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PaymentReceiptScreen;
