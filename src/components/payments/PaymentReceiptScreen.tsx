import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileDown,
  User,
  FileText,
  Banknote,
  Landmark,
  CreditCard,
  Check,
  Send,
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
    const currency = rawCurrency === 'ILS' ? 'شيكل' : rawCurrency === 'SAR' ? 'شيكل' : rawCurrency;

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
      showToast(`${errMsg} - جاري تجهيز الطباعة المباشرة...`, 'info');
      setTimeout(() => {
        window.print();
      }, 1500);
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
      className="min-h-screen bg-[#f4f7fb] dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-cairo antialiased flex"
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
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                title="الرجوع لسجل المدفوعات"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold font-cairo text-slate-900 dark:text-white tracking-tight">
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
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      <RotateCw className="w-2.5 h-2.5 animate-spin text-slate-500 dark:text-slate-400" />
                      جاري التحميل...
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 font-cairo">
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
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
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
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-60"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
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
            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden print:border-none print:shadow-none print:rounded-none print:m-0 print:p-0"
          >
            <div className="p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#0c2444] dark:text-blue-400">سند قبض</h2>
                  <p className="text-sm text-slate-500 mt-1 font-mono">الرقم: {paymentData.receiptNumber}</p>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">{merchant.businessName || 'المتجر'}</h3>
                  <p className="text-xs text-slate-500 mt-1">{paymentData.paymentDate}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-6 text-center">
                <span className="text-sm font-medium text-slate-500">المبلغ المقبوض</span>
                <div className="text-3xl sm:text-4xl font-bold text-emerald-600 mt-2 font-mono" dir="ltr">
                  {paymentData.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xl font-cairo text-slate-700 dark:text-slate-300">{paymentData.currency}</span>
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">
                  فقط وقدره {tafqeet(paymentData.amount)} لا غير
                </div>
                <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                  <MethodIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{methodDetails.label}</span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3">
                    <User className="w-4 h-4" />
                    استلمنا من السيد (العميل):
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{paymentData.customerName}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1" dir="ltr">{paymentData.customerPhone}</div>
                </div>
                
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3">
                    <FileText className="w-4 h-4" />
                    البيان وسبب التحصيل:
                  </div>
                  <div className="font-medium text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {serverPayment?.notes || `سداد دفعة مالية لحساب العميل. ${paymentData.invoiceNumber ? `مرتبط بالفاتورة ${paymentData.invoiceNumber}` : ''}`}
                  </div>
                </div>
              </div>

              {/* Accounting Summary */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-center bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">الرصيد السابق</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 font-mono" dir="ltr">
                    {paymentData.previousDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-emerald-600 mb-1">المبلغ المسدد (-)</div>
                  <div className="font-bold text-emerald-600 font-mono" dir="ltr">
                    {paymentData.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-blue-600 mb-1">الرصيد المتبقي</div>
                  <div className="font-bold text-blue-600 font-mono" dir="ltr">
                    {paymentData.remainingDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PaymentReceiptScreen;
