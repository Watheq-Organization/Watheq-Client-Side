import { useState, type FC, type FormEvent, useEffect } from 'react';
import { X, SlidersHorizontal, Check } from 'lucide-react';
import type { Product } from '../../types/inventory';

interface AdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (productId: string, actualStock: number) => Promise<void> | void;
}

export const AdjustModal: FC<AdjustModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirm,
}) => {
  const [actualStock, setActualStock] = useState<number | string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (product && isOpen) {
      setActualStock(product.stock);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const qty = Number(actualStock);
    if (isNaN(qty) || qty < 0 || actualStock === '') {
      setError('يرجى إدخال كمية صحيحة (صفر أو أكثر)');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(product.id, qty);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء تعديل المخزون');
    } finally {
      setIsSubmitting(false);
    }
  };

  const diff = Number(actualStock) - product.stock;
  const isPositive = diff > 0;
  const isNegative = diff < 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                تسوية المخزون (الجرد)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تعديل رصيد المنتج ليتطابق مع الواقع
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-400 mb-1">
                الصنف المحدد للتسوية:
              </p>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                {product.name}
              </h4>
              <p className="text-xs font-mono text-slate-500 mt-0.5">{product.barcode}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                الرصيد الدفتري الحالي
              </p>
              <p className="font-mono text-lg font-bold text-slate-800 dark:text-white">
                {product.stock}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                الرصيد الفعلي (على أرض الواقع) *
              </label>
            </div>
            <input
              type="number"
              min="0"
              value={actualStock}
              onChange={(e) => setActualStock(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-lg text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
              autoFocus
            />
            {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              الفرق في المخزون (العجز/الزيادة):
            </span>
            <div className={`font-mono font-black text-sm px-2 py-1 rounded-md ${
              isPositive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
              isNegative ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
              'bg-slate-500/10 text-slate-600 dark:text-slate-400'
            }`}>
              {isPositive ? '+' : ''}{!isNaN(diff) ? diff : 0}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isNaN(Number(actualStock)) || Number(actualStock) < 0 || actualStock === ''}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="animate-pulse">جاري الحفظ...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>تأكيد التسوية</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
