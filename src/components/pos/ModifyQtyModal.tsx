import { useState, type FC, type FormEvent } from 'react';
import { X, Hash, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import type { CartItem } from '../../types/inventory';

interface ModifyQtyModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItem: CartItem | null;
  onConfirm: (quantity: number) => void;
}

const ModifyQtyModalContent: FC<{
  onClose: () => void;
  cartItem: CartItem;
  onConfirm: (quantity: number) => void;
}> = ({ onClose, cartItem, onConfirm }) => {
  const [qty, setQty] = useState<string>(() => String(cartItem.quantity));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(qty, 10);
    if (!qty.trim() || isNaN(val) || val <= 0) {
      setError('يرجى إدخال كمية صحيحة أكبر من صفر.');
      return;
    }
    onConfirm(val);
    onClose();
  };

  const handleAdjust = (delta: number) => {
    const current = parseInt(qty, 10) || 1;
    const next = Math.max(1, current + delta);
    setQty(String(next));
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-sm w-full overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 text-center">
        <div className="px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 text-right">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                تعديل الكمية
              </h3>
              <kbd className="text-[10px] font-jakarta font-semibold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700">
                F2
              </kbd>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              {cartItem.product.name}
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-jakarta tabular-nums mt-0.5 block">
              سعر الوحدة: ₪{cartItem.unitPrice.toFixed(2)} · المخزون المتوفر: {cartItem.product.stock}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleAdjust(-1)}
              className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center transition-colors cursor-pointer"
              aria-label="إنقاص الكمية"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => {
                setQty(e.target.value);
                setError(null);
              }}
              dir="ltr"
              className={`w-24 text-center py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 text-2xl font-bold font-jakarta tabular-nums text-slate-900 dark:text-white outline-hidden ${
                error
                  ? 'border-rose-400 dark:border-rose-500'
                  : 'border-slate-300 dark:border-slate-700 focus:border-[#09152B] dark:focus:border-slate-400'
              }`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />

            <button
              type="button"
              onClick={() => handleAdjust(1)}
              className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center transition-colors cursor-pointer"
              aria-label="زيادة الكمية"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 inline-flex items-center gap-1 justify-center">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="h-9 px-5 rounded-lg bg-[#09152B] hover:bg-[#12264B] dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>تأكيد الكمية (Enter)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ModifyQtyModal: FC<ModifyQtyModalProps> = ({ isOpen, cartItem, ...props }) => {
  if (!isOpen || !cartItem) return null;
  return <ModifyQtyModalContent cartItem={cartItem} {...props} />;
};
