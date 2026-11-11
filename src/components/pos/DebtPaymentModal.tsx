import { useState, type FC, type FormEvent } from 'react';
import {
  X,
  CreditCard,
  UserCheck,
  Send,
  AlertTriangle,
  AlertCircle,
  Receipt,
  CheckCircle2,
  Phone,
  Loader2,
} from 'lucide-react';
import type { CartItem } from '../../types/inventory';
import { CurrencySelector } from '../common/CurrencySelector';
import { type CurrencyCode, getCurrencyConfig, getCurrencyId } from '../../utils/currency';
import { getDeviceLocalDateString } from '../../lib/dateUtils';
import { toCreateDebtErrorMessage } from '../../services/debtService';
import { toPosErrorMessage } from '../../services/posService';

interface DebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDue: number;
  customer: {
    id?: string;
    name: string;
    phone?: string;
    totalDebt?: number;
  };
  cartItems: CartItem[];
  onSelectCustomer: () => void;
  onConfirm: (
    dueDate: string,
    invoiceNotes: string,
    notifyCustomerViaBot: boolean,
    currencyCode?: CurrencyCode,
    currencyId?: number
  ) => Promise<void> | void;
}

const DebtPaymentModalContent: FC<Omit<DebtPaymentModalProps, 'isOpen'>> = ({
  onClose,
  totalDue,
  customer,
  cartItems,
  onSelectCustomer,
  onConfirm,
}) => {
  const [dueDate, setDueDate] = useState(() => getDeviceLocalDateString());
  const [notifyCustomerViaBot, setNotifyCustomerViaBot] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('ILS');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencyConfig = getCurrencyConfig(selectedCurrency);
  const isGeneralCustomer = !customer.id || customer.name === 'زبون نقدي عام';
  const previousDebt = customer.totalDebt || 0;
  const newDebtTotal = previousDebt + totalDue;
  const todayLocal = getDeviceLocalDateString();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isGeneralCustomer) {
      setError('يجب اختيار عميل مسجل لتسجيل الفاتورة كدين على ذمته.');
      return;
    }
    if (!dueDate.trim()) {
      setError('يرجى تحديد تاريخ استحقاق السداد.');
      return;
    }
    if (dueDate.trim() < todayLocal) {
      setError('تاريخ موعد السداد لا يمكن أن يكون في الماضي؛ يرجى اختيار تاريخ اليوم أو تاريخاً مستقبلياً.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const invoiceNotes = cartItems.map((item) => `${item.product.name} × ${item.quantity}`).join(' | ');
      await onConfirm(
        dueDate,
        invoiceNotes,
        notifyCustomerViaBot,
        selectedCurrency,
        getCurrencyId(selectedCurrency)
      );
      onClose();
    } catch (err) {
      const debtMsg = toCreateDebtErrorMessage(err);
      const posMsg = toPosErrorMessage(err);
      setError(
        debtMsg && debtMsg !== 'تعذر تسجيل الدين. يرجى المحاولة مرة أخرى.'
          ? debtMsg
          : posMsg
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  تسجيل بيع آجل (دين)
                </h3>
                <kbd className="text-[10px] font-jakarta font-semibold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700">
                  F10
                </kbd>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                قيد الفاتورة في ذمة العميل وإصدار سند دين
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {isGeneralCustomer ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    لا يمكن تسجيل دين على &quot;زبون نقدي عام&quot;
                  </h4>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300/90 mt-1 leading-relaxed">
                    يرجى اختيار عميل مسجل أو إضافة عميل جديد لربط الفاتورة بملفه المالي.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onSelectCustomer}
                className="w-full h-9 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>اختيار أو إضافة عميل مسجل (F1)</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    العميل المعتمد
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {customer.name}
                  </span>
                  {customer.phone && (
                    <span className="text-[11px] text-slate-500 font-jakarta tabular-nums inline-flex items-center gap-1 mt-0.5" dir="ltr">
                      <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {customer.phone}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onSelectCustomer}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer shrink-0"
                >
                  تغيير العميل
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/60 text-center">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10.5px] text-slate-400 block">الدين السابق</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 font-jakarta tabular-nums" dir="ltr">
                    ₪{previousDebt.toFixed(2)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60">
                  <span className="text-[10.5px] text-rose-600 dark:text-rose-400 block">+ الفاتورة الحالية</span>
                  <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 font-jakarta tabular-nums" dir="ltr">
                    {currencyConfig.symbol}{totalDue.toFixed(2)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#09152B] dark:bg-slate-950 text-white border border-slate-800">
                  <span className="text-[10.5px] text-slate-400 block">= الإجمالي التقديري</span>
                  <span className="text-xs sm:text-sm font-bold font-jakarta tabular-nums text-emerald-400" dir="ltr">
                    {selectedCurrency === 'ILS'
                      ? `₪${newDebtTotal.toFixed(2)}`
                      : `${currencyConfig.symbol}${totalDue.toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Currency Selection */}
          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                عملة تسجيل الدين
              </label>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {currencyConfig.labelArFull} ({currencyConfig.symbol})
              </span>
            </div>
            <CurrencySelector
              value={selectedCurrency}
              onChange={(cur) => setSelectedCurrency(cur)}
              size="sm"
              variant="pills"
            />
          </div>

          {/* Cart Items Preview */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              <span>محتويات الفاتورة الآجلة ({cartItems.length} أصناف):</span>
            </span>
            <div className="max-h-28 overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 border border-slate-200/80 dark:border-slate-800 text-xs divide-y divide-slate-200/60 dark:divide-slate-800">
              {cartItems.map((item) => (
                <div key={item.product.id} className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-slate-700 dark:text-slate-300 truncate">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="font-jakarta tabular-nums font-bold text-slate-900 dark:text-white shrink-0" dir="ltr">
                    {currencyConfig.symbol}{item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Telegram/WhatsApp Notification Option */}
          <label className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Send className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  إرسال إشعار توثيق للعميل
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  يرسل تفاصيل الأصناف والمبلغ للعميل لتوثيق السند
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifyCustomerViaBot}
              onChange={(e) => setNotifyCustomerViaBot(e.target.checked)}
              className="w-4 h-4 accent-[#09152B] dark:accent-emerald-500 rounded cursor-pointer shrink-0"
            />
          </label>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              تاريخ موعد السداد *
            </label>
            <input
              type="date"
              min={todayLocal}
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                setError(null);
              }}
              required
              dir="ltr"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-jakarta tabular-nums outline-hidden focus:border-slate-400 dark:focus:border-slate-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="h-10 px-4 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isGeneralCustomer || isSubmitting}
              className={`h-10 px-5 rounded-lg text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors ${
                isGeneralCustomer || isSubmitting
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-70'
                  : 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل الدين...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تسجيل الدين وإصدار السند</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DebtPaymentModal: FC<DebtPaymentModalProps> = ({ isOpen, ...props }) => {
  if (!isOpen) return null;
  return <DebtPaymentModalContent {...props} />;
};
