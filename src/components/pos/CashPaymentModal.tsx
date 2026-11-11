import { useState, type FC, type FormEvent } from 'react';
import { X, Banknote, CheckCircle2, ArrowDownCircle, Percent, AlertCircle, Loader2 } from 'lucide-react';
import { toPosErrorMessage } from '../../services/posService';

interface CashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDue: number;
  customerName: string;
  onConfirm: (receivedAmount: number, changeAmount: number, discount: number) => Promise<void> | void;
}

const CashPaymentModalContent: FC<Omit<CashPaymentModalProps, 'isOpen'>> = ({
  onClose,
  totalDue,
  customerName,
  onConfirm,
}) => {
  const [receivedStr, setReceivedStr] = useState<string>(() => String(totalDue));
  const [discountStr, setDiscountStr] = useState<string>('0');
  const [error, setError] = useState<string | null>(null);
  const [confirmPartial, setConfirmPartial] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rawDiscount = parseFloat(discountStr);
  const discount = Number.isFinite(rawDiscount) && rawDiscount > 0 ? rawDiscount : 0;
  const netDue = Math.max(0, totalDue - discount);
  const rawReceived = parseFloat(receivedStr);
  const received = Number.isFinite(rawReceived) ? rawReceived : NaN;
  const validReceived = Number.isFinite(received) && received >= 0 ? received : 0;
  const change = Math.max(0, validReceived - netDue);
  const remaining = Math.max(0, netDue - validReceived);

  const presets = [
    { label: 'المبلغ بالضبط', val: netDue },
    { label: '20 ₪', val: 20 },
    { label: '50 ₪', val: 50 },
    { label: '100 ₪', val: 100 },
    { label: '200 ₪', val: 200 },
  ];

  const handleFinalize = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (discountStr.trim() !== '' && (!Number.isFinite(rawDiscount) || rawDiscount < 0)) {
      setError('قيمة الخصم يجب أن تكون رقماً موجباً أو صفراً.');
      return;
    }
    if (discount > totalDue) {
      setError(`لا يمكن أن يتجاوز الخصم إجمالي الفاتورة (₪${totalDue.toFixed(2)}).`);
      return;
    }
    if (receivedStr.trim() === '' || !Number.isFinite(received) || received < 0) {
      setError('يرجى إدخال المبلغ المستلم من الزبون بشكل صحيح.');
      return;
    }

    if (received < netDue && !confirmPartial) {
      setConfirmPartial(true);
      setError(null);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(received, change, discount);
      onClose();
    } catch (err) {
      setError(toPosErrorMessage(err, 'تعذر إتمام السداد النقدي؛ يرجى المحاولة مرة أخرى.'));
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
      <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Banknote className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  سداد نقدي مباشر
                </h3>
                <kbd className="text-[10px] font-jakarta font-semibold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700">
                  F9
                </kbd>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">العميل: {customerName}</p>
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

        <form onSubmit={handleFinalize} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Total Due Bar */}
          <div className="p-4 rounded-xl bg-[#09152B] dark:bg-slate-950 text-white flex items-center justify-between border border-slate-800">
            <div>
              <span className="text-xs text-slate-300 font-medium block">
                المجموع المطلوب للتحصيل
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-jakarta tabular-nums text-emerald-400 mt-0.5 block" dir="ltr">
                ₪{netDue.toFixed(2)}
              </span>
            </div>
            {discount > 0 && (
              <span className="text-xs text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-400/25 tabular-nums">
                خصم: ₪{discount.toFixed(2)}
              </span>
            )}
          </div>

          {/* Received Input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ArrowDownCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>المبلغ المستلم نقدياً من الزبون (₪) *</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                value={receivedStr}
                onChange={(e) => {
                  setReceivedStr(e.target.value);
                  setConfirmPartial(false);
                  setError(null);
                }}
                placeholder="0.00"
                dir="ltr"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-2xl font-bold font-jakarta tabular-nums focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleFinalize();
                  }
                }}
              />
              <span className="absolute left-3.5 top-3 text-base text-slate-400 font-bold">₪</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setReceivedStr(String(preset.val));
                  setConfirmPartial(false);
                  setError(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer tabular-nums ${
                  validReceived === preset.val
                    ? 'bg-[#09152B] dark:bg-slate-100 text-white dark:text-slate-900 border-[#09152B] dark:border-slate-100'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Discount Row */}
          <div className="px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-slate-400" />
              <span>خصم إضافي (شيكل):</span>
            </span>
            <div className="w-28 relative">
              <input
                type="number"
                step="0.5"
                min="0"
                value={discountStr}
                onChange={(e) => {
                  setDiscountStr(e.target.value);
                  setConfirmPartial(false);
                  setError(null);
                }}
                placeholder="0"
                dir="ltr"
                className="w-full pl-6 pr-2.5 py-1.5 text-xs text-left font-bold font-jakarta tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-slate-400 outline-hidden"
              />
              <span className="absolute left-2 top-1.5 text-[11px] text-slate-400">₪</span>
            </div>
          </div>

          {/* Change Display */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                الباقي للزبون (الفكة)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                يُرد للزبون عند الاستلام
              </span>
            </div>
            <span
              className={`text-xl sm:text-2xl font-bold font-jakarta tabular-nums ${
                change > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
              dir="ltr"
            >
              ₪{change.toFixed(2)}
            </span>
          </div>

          {/* Partial Payment Confirmation Prompt (replaces native confirm()) */}
          {remaining > 0 && validReceived >= 0 && Number.isFinite(received) && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                confirmPartial
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                  : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/50 text-amber-800 dark:text-amber-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">
                  تنبيه: المبلغ المدخل أقل من المطلوب بـ ₪{remaining.toFixed(2)}
                </p>
                {confirmPartial && (
                  <p className="text-[11px]">
                    اضغط &quot;تأكيد السداد رغم النقص&quot; أدناه لإتمام العملية، أو قم بتعديل المبلغ المستلم.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="h-10 px-4 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              إلغاء (Esc)
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل البيع...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {confirmPartial ? 'تأكيد السداد رغم النقص' : 'تأكيد السداد وطباعة الفاتورة'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CashPaymentModal: FC<CashPaymentModalProps> = ({ isOpen, ...props }) => {
  if (!isOpen) return null;
  return <CashPaymentModalContent {...props} />;
};
