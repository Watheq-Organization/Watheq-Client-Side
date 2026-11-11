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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            تنبيه نفاد رصيد المخزون
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
            الصنف:{' '}
            <span className="text-amber-700 dark:text-amber-400 font-bold">{product.name}</span>
          </p>
          <div className="my-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div>
              الرصيد المسجل حالياً:{' '}
              <span className="font-jakarta tabular-nums font-bold">{product.stock}</span>{' '}
              {product.unit || 'وحدة'}
            </div>
            <div>
              الكمية المطلوبة:{' '}
              <span className="font-jakarta tabular-nums font-bold">+{quantity}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            الكمية تتجاوز المخزون المتوفر، هل تريد المتابعة وإضافتها بالسالب؟
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            إلغاء الصنف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 px-4 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>نعم، إضافة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
