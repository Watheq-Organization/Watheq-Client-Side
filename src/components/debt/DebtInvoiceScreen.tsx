import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  FileDown,
  Send,
  User,
  Calendar,
  Check,
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
      serverInvoice?.invoiceNumber ?? navState?.invoiceNumber ?? (id ? `INV-DEBT-${id}` : 'غير متوفر');
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
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                title="الرجوع"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold font-cairo text-slate-900 dark:text-white tracking-tight">
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
                <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 font-cairo">
                  العميل: <span className="font-bold text-slate-700 dark:text-slate-300">{invoiceData.customerName}</span> • تاريخ التحرير: {invoiceData.issueDate}
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
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
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
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-60"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                )}
                <span>{isDownloadingPdf ? 'جاري التحميل...' : 'تحميل كـ PDF'}</span>
              </button>
            </div>
          </div>

          {/* Top Protected Document Notification Banner */}
          <div className="bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs print:hidden">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-bold font-cairo text-slate-900 dark:text-white">
                  مستند إلكتروني محمي ومشفر ومسجل في سجلات منصة وثّق
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
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
            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden print:border-none print:shadow-none print:rounded-none print:m-0 print:p-0"
          >
            <div className="p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#0c2444] dark:text-blue-400">فاتورة قيد مديونية</h2>
                  <p className="text-sm text-slate-500 mt-1 font-mono">الرقم: {invoiceData.invoiceNumber}</p>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">{merchant.businessName || 'المتجر'}</h3>
                  <p className="text-xs text-slate-500 mt-1">{invoiceData.issueDate}</p>
                </div>
              </div>

              {/* Parties and Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3">
                    <User className="w-4 h-4" />
                    المطلوب من السيد (العميل):
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{invoiceData.customerName}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1" dir="ltr">{invoiceData.customerPhone}</div>
                </div>
                
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    شروط وموعد الاستحقاق:
                  </div>
                  <div className="font-bold text-rose-600">
                    أقصى موعد للسداد: {invoiceData.dueDate}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">فاتورة آجل (قيد مديونية)</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-right text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">البيان</th>
                      <th className="py-3 px-4 text-center">الكمية</th>
                      <th className="py-3 px-4 text-center">سعر الوحدة</th>
                      <th className="py-3 px-4 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {invoiceData.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                        <td className="py-3 px-4 text-center text-slate-400 font-mono">{item.id}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                        <td className="py-3 px-4 text-center font-mono" dir="ltr">{item.unitPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-left font-mono font-bold" dir="ltr">{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Accounting Impact */}
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="space-y-3 w-full md:w-1/2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">قيمة الفاتورة الحالية:</span>
                      <span className="font-bold font-mono" dir="ltr">{invoiceData.invoiceAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">ديون سابقة:</span>
                      <span className="font-bold font-mono" dir="ltr">{invoiceData.previousDebt.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">مدفوعات سابقة (-):</span>
                      <span className="font-bold font-mono text-emerald-600" dir="ltr">{invoiceData.previousPaid.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-1/2 text-center md:text-left border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-700 pt-4 md:pt-0 md:pr-6">
                    <span className="text-sm font-medium text-slate-500 block mb-2">إجمالي المديونية المطلوبة الآن</span>
                    <div className="text-3xl sm:text-4xl font-bold text-rose-600 font-mono" dir="ltr">
                      {invoiceData.totalCurrentDebt.toFixed(2)} <span className="text-xl font-cairo text-slate-700 dark:text-slate-300">{invoiceData.currency}</span>
                    </div>
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

export default DebtInvoiceScreen;
