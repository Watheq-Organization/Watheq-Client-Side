import { useState, type FC, type FormEvent } from 'react';
import { X, RotateCcw, ArrowLeft, Check } from 'lucide-react';
import type { Product } from '../../types/inventory';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (productId: string, quantity: number) => Promise<void> | void;
}

export const ReturnModal: FC<ReturnModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !product) return null;

  const quickPresets = [1, 2, 5, 10, 20];
  const newStockTotal = product.stock + (Number(quantity) || 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('يرجى إدخال كمية إرجاع صحيحة (أكبر من صفر)');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(product.id, qty);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء إرجاع المخزون');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                إرجاع مخزون
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إعادة كمية من المنتج إلى المخزون
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-orange-50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/10 gap-4">
            <div>
              <p className="text-xs font-semibold text-orange-800 dark:text-orange-400 mb-1">
                الصنف المحدد للإرجاع:
              </p>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                {product.name}
              </h4>
              <p className="text-xs font-mono text-slate-500 mt-0.5">{product.barcode}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                الرصيد الحالي
              </p>
              <p className="font-mono text-lg font-bold text-slate-800 dark:text-white">
                {product.stock}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                كمية الإرجاع المراد إضافتها للمخزون *
              </label>
            </div>
            <input
              type="number"
              min="1"
              value={quantity || ''}
              onChange={(e) => setQuantity(Number(e.target.value))}
              autoFocus
              className="w-full px-4 py-3 text-center text-xl font-black rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-hidden transition-all"
            />
            
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuantity(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    quantity === preset
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-medium">الرصيد بعد اعتماد الإرجاع:</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-500 dark:text-slate-400">{product.stock}</span>
              <ArrowLeft className="w-4 h-4 text-emerald-500" />
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {newStockTotal} وحدة
              </span>
            </div>
          </div>

          {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white text-sm font-bold shadow-lg shadow-orange-600/20 transition-all flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'جاري الإرجاع...' : 'تأكيد الإرجاع'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
