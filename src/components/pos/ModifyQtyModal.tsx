import { useState, useEffect, type FC, type FormEvent } from 'react';
import { X, Hash, Plus, Minus, Check } from 'lucide-react';
import type { CartItem } from '../../types/inventory';

interface ModifyQtyModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItem: CartItem | null;
  onConfirm: (quantity: number) => void;
}

export const ModifyQtyModal: FC<ModifyQtyModalProps> = ({
  isOpen,
  onClose,
  cartItem,
  onConfirm,
}) => {
  const [qty, setQty] = useState<string>('1');

  useEffect(() => {
    if (cartItem) {
      setQty(String(cartItem.quantity));
    }
  }, [cartItem, isOpen]);

  if (!isOpen || !cartItem) return null;

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(qty, 10);
    if (!isNaN(val) && val > 0) {
      onConfirm(val);
      onClose();
    }
  };

  const handleAdjust = (delta: number) => {
    const current = parseInt(qty, 10) || 1;
    const next = Math.max(1, current + delta);
    setQty(String(next));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
            <div className="text-right">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                تعديل كمية الصنف بالسلة
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-600 text-white rounded font-bold">
                F2
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-base">
              {cartItem.product.name}
            </h4>
            <span className="text-xs text-slate-400">
              سعر الوحدة: ₪{cartItem.unitPrice.toFixed(2)} | المخزون المتوفر: {cartItem.product.stock}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleAdjust(-1)}
              className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center transition-all"
            >
              <Minus className="w-5 h-5" />
            </button>

            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-24 text-center py-2.5 rounded-2xl border-2 border-purple-500 bg-purple-50/20 text-2xl font-black font-mono text-slate-900 dark:text-white outline-hidden"
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
              className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:bg-slate-100"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
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
