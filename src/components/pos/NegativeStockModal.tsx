import type { FC } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import type { Product } from '../../types/inventory';

interface NegativeStockModalProps {
  pendingItem: { product: Product; quantity: number } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const NegativeStockModal: FC<NegativeStockModalProps> = ({
  pendingItem,
  onConfirm,
  onCancel,
}) => {
  if (!pendingItem) return null;

  const { product, quantity } = pendingItem;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-amber-500/60 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 animate-bounce" />
        </div>

        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
            تنبيه: نفاد رصيد المخزون المسجل!
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
            الصنف: <span className="text-amber-600 dark:text-amber-400 font-bold">{product.name}</span>
          </p>
          <div className="my-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300">
            الرصيد الحالي بالمحل: <span className="font-mono font-bold">{product.stock}</span> وحدة
            <br />
            الكمية المطلوبة: <span className="font-mono font-bold">+{quantity}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
            المخزون المسجل صفر، هل تريد إتمام البيع بالسالب؟
          </p>
        </div>

        <div className="flex items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            إلغاء الصنف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>نعم، بع بالسالب</span>
          </button>
        </div>
      </div>
    </div>
  );
};
