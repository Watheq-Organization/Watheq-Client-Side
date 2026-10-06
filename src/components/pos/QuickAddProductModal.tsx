import { useState, useEffect, type FC, type FormEvent } from 'react';
import { X, AlertCircle, Sparkles, Check } from 'lucide-react';
import type { Product } from '../../types/inventory';

interface QuickAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  barcode: string;
  onConfirm: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const QuickAddProductModal: FC<QuickAddProductModalProps> = ({
  isOpen,
  onClose,
  barcode,
  onConfirm,
}) => {
  const [name, setName] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [initialStock, setInitialStock] = useState('20');
  const [category, setCategory] = useState('عام');
  const [costPrice, setCostPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSalePrice('');
      setInitialStock('20');
      setCostPrice('');
      setCategory('عام');
      setError(null);
    }
  }, [isOpen, barcode]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى كتابة اسم الصنف');
      return;
    }

    const price = parseFloat(salePrice);
    if (isNaN(price) || price <= 0) {
      setError('يرجى إدخال سعر بيع صحيح أكبر من صفر');
      return;
    }

    const stock = parseInt(initialStock, 10);
    if (isNaN(stock) || stock < 0) {
      setError('يرجى إدخال رصيد صحيح');
      return;
    }

    const cost = parseFloat(costPrice) || Math.round(price * 0.75 * 10) / 10;

    onConfirm({
      barcode: barcode.trim(),
      name: name.trim(),
      category: category.trim() || 'عام',
      salePrice: price,
      costPrice: cost,
      stock,
      minAlertThreshold: 5,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border-2 border-emerald-500/40">
        {/* Header with high-speed indicator */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/70 dark:bg-emerald-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  صنف جديد غير مسجل!
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white animate-pulse">
                  إضافة سريعة ⚡
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                الباركود:{' '}
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {barcode}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Field Minimalist Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            أدخل 3 بيانات سريعة ليتم حفظ الصنف فوراً في المخزون وإضافته لسلة البيع دون توقف الكاشير:
          </p>

          {/* 1. Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              اسم الصنف *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="مثال: شيبس بطاطا مستورد"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
              autoFocus
            />
          </div>

          {/* 2. Sale Price */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              سعر البيع للزبون (₪) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={salePrice}
                onChange={(e) => {
                  setSalePrice(e.target.value);
                  setError(null);
                }}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-base font-black focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
              />
              <span className="absolute left-3 top-2.5 text-xs text-emerald-600 font-bold">₪</span>
            </div>
          </div>

          {/* 3. Initial Stock */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              الرصيد الافتتاحي بالمحل (حبة/وحدة) *
            </label>
            <input
              type="number"
              min="0"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              تخطي
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Check className="w-4 h-4" />
              <span>حفظ وإضافة للسلة فوراً (Enter)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
