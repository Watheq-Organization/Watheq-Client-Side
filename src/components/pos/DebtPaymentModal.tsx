import { useState, type FC, type FormEvent } from 'react';
import {
  X,
  CreditCard,
  UserCheck,
  Send,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  Phone,
} from 'lucide-react';
import type { CartItem } from '../../types/inventory';

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
  onConfirm: (notes: string) => void;
}

export const DebtPaymentModal: FC<DebtPaymentModalProps> = ({
  isOpen,
  onClose,
  totalDue,
  customer,
  cartItems,
  onSelectCustomer,
  onConfirm,
}) => {
  const [debtNotes, setDebtNotes] = useState('');
  const [notifyCustomerViaBot, setNotifyCustomerViaBot] = useState(true);

  if (!isOpen) return null;

  const isGeneralCustomer = !customer.id || customer.name === 'زبون نقدي عام';
  const previousDebt = customer.totalDebt || 0;
  const newDebtTotal = previousDebt + totalDue;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isGeneralCustomer) {
      return;
    }
    onConfirm(debtNotes);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-rose-500/30">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-rose-50 dark:bg-rose-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-lg">
                  تسجيل بيع آجل (دين)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold">
                  F10
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تسجيل الفاتورة في ذمة العميل مع إشعار بوت وثّق
              </p>
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Customer Verification Check */}
          {isGeneralCustomer ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    لا يمكن تسجيل دين على &quot;زبون نقدي عام&quot;!
                  </h4>
                  <p className="text-xs text-amber-700/80 dark:text-amber-400 mt-1">
                    يرجى اختيار عميل مسجل في وثّق أو إنشاء حساب عميل جديد لربط الفاتورة بملفه
                    المالي.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onSelectCustomer}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>اختيار أو إضافة عميل مسجل (F1)</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    العميل المعتمد:
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {customer.name}
                  </span>
                  {customer.phone && (
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-500" />
                      {customer.phone}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onSelectCustomer}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  تغيير العميل
                </button>
              </div>

              {/* Debt Balance Calculation Ledger */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">الدين السابق</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    ₪{previousDebt.toFixed(2)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                  <span className="text-[10px] text-rose-600 block">+ الفاتورة الحالية</span>
                  <span className="text-sm font-black text-rose-600">
                    ₪{totalDue.toFixed(2)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 text-white">
                  <span className="text-[10px] text-slate-400 block">= إجمالي الدين</span>
                  <span className="text-sm font-black font-mono text-emerald-400">
                    ₪{newDebtTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Itemized summary snippet */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" />
              <span>محتويات الفاتورة الآجلة ({cartItems.length} أصناف):</span>
            </span>
            <div className="max-h-28 overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2 border border-slate-100 dark:border-slate-800 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              {cartItems.map((item) => (
                <div key={item.product.id} className="py-1 flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₪{item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Bot Verification Checkbox */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-900 dark:text-blue-300 block">
                  إرسال إشعار توثيق عبر بوت واتساب/تيليجرام
                </span>
                <span className="text-[11px] text-blue-700/70 dark:text-blue-400">
                  يرسل تفاصيل الأصناف والدين الجديد ليؤكدها الزبون
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifyCustomerViaBot}
              onChange={(e) => setNotifyCustomerViaBot(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ملاحظة على الدين / موعد السداد المقترح (اختياري)
            </label>
            <input
              type="text"
              value={debtNotes}
              onChange={(e) => setDebtNotes(e.target.value)}
              placeholder="مثال: وعد بالسداد يوم الخميس القادم"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:border-rose-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isGeneralCustomer}
              className={`px-7 py-3 rounded-2xl text-white text-sm font-black shadow-lg flex items-center gap-2 transition-all ${
                isGeneralCustomer
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>تسجيل الدين وإصدار السند</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
