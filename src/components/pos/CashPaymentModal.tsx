import { useState, useEffect, type FC, type FormEvent } from 'react';
import { X, Banknote, CheckCircle, ArrowDownCircle, Percent } from 'lucide-react';

interface CashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDue: number;
  customerName: string;
  onConfirm: (receivedAmount: number, changeAmount: number, discount: number) => void;
}

export const CashPaymentModal: FC<CashPaymentModalProps> = ({
  isOpen,
  onClose,
  totalDue,
  customerName,
  onConfirm,
}) => {
  const [receivedStr, setReceivedStr] = useState<string>('');
  const [discountStr, setDiscountStr] = useState<string>('0');

  useEffect(() => {
    if (isOpen) {
      setReceivedStr(String(totalDue));
      setDiscountStr('0');
    }
  }, [isOpen, totalDue]);

  if (!isOpen) return null;

  const discount = Math.max(0, parseFloat(discountStr) || 0);
  const netDue = Math.max(0, totalDue - discount);
  const received = parseFloat(receivedStr) || 0;
  const change = Math.max(0, received - netDue);
  const remaining = Math.max(0, netDue - received);

  const presets = [
    { label: 'المبلغ بالضبط', val: netDue },
    { label: '20 ₪', val: 20 },
    { label: '50 ₪', val: 50 },
    { label: '100 ₪', val: 100 },
    { label: '200 ₪', val: 200 },
  ];

  const handleFinalize = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (received < netDue) {
      // Allow partial or prompt
      if (!confirm(`المبلغ المستلم (₪${received}) أقل من المطلوب (₪${netDue}). هل تريد المتابعة؟`)) {
        return;
      }
    }
    onConfirm(received, change, discount);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-emerald-500/30">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-lg">سداد نقدي مباشر</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold">
                  F9
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">العميل: {customerName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleFinalize} className="p-5 sm:p-6 space-y-5">
          {/* Total Due Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-inner">
            <div>
              <span className="text-xs text-slate-400 font-medium block">
                المجموع المطلوب للتحصيل
              </span>
              <span className="text-3xl font-black font-mono text-emerald-400">
                ₪{netDue.toFixed(2)}
              </span>
            </div>
            {discount > 0 && (
              <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20">
                خصم: ₪{discount.toFixed(2)}
              </span>
            )}
          </div>

          {/* Amount Received Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
              <span>المبلغ المستلم نقدياً من الزبون (₪) *</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                value={receivedStr}
                onChange={(e) => setReceivedStr(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/20 text-slate-900 dark:text-white text-2xl font-black font-mono focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 outline-hidden"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFinalize();
                  }
                }}
              />
              <span className="absolute left-4 top-3.5 text-base text-emerald-600 font-bold">₪</span>
            </div>
          </div>

          {/* Quick Palestinian Banknotes Presets */}
          <div className="flex flex-wrap items-center gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setReceivedStr(String(preset.val))}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                  received === preset.val
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Optional Discount Row */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-amber-500" />
              <span>خصم إضافي (شيكل):</span>
            </span>
            <div className="w-28 relative">
              <input
                type="number"
                step="0.5"
                min="0"
                value={discountStr}
                onChange={(e) => setDiscountStr(e.target.value)}
                placeholder="0"
                className="w-full pl-6 pr-2 py-1 text-xs text-left font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <span className="absolute left-2 top-1 text-[11px] text-slate-400">₪</span>
            </div>
          </div>

          {/* Change to Customer Display Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                الباقي للزبون (الفكة / الصرافة)
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                يُرجع للزبون فور استلام النقدية
              </span>
            </div>
            <div className="text-left">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono ${
                  change > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                ₪{change.toFixed(2)}
              </span>
            </div>
          </div>

          {remaining > 0 && received > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold text-center">
              تنبيه: المبلغ المدفوع غير مكتمل، المتبقي: ₪{remaining.toFixed(2)}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              إلغاء (Esc)
            </button>
            <button
              type="submit"
              className="px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <CheckCircle className="w-5 h-5" />
              <span>تأكيد السداد وطباعة الفاتورة (Enter)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
