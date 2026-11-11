import { useState, type FC, type FormEvent } from 'react';
import { X, AlertCircle, PackagePlus, Check, Loader2 } from 'lucide-react';
import type { Product } from '../../types/inventory';
import { toProductErrorMessage } from '../../services/productService';
import { CategorySelect } from '../inventory/CategorySelect';
import { UnitSelect } from '../inventory/UnitSelect';

interface QuickAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  barcode: string;
  onConfirm: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void> | void;
}

type FieldKey = 'name' | 'category' | 'unit' | 'salePrice' | 'costPrice' | 'initialStock' | 'minAlertThreshold';

const QuickAddProductModalContent: FC<Omit<QuickAddProductModalProps, 'isOpen'>> = ({
  onClose,
  barcode,
  onConfirm,
}) => {
  const [name, setName] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [initialStock, setInitialStock] = useState('20');
  const [minAlertThreshold, setMinAlertThreshold] = useState('5');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('حبة');
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<FieldKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = () => {
    if (error) setError(null);
    if (errorField) setErrorField(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      setError('يرجى إدخال اسم الصنف.');
      setErrorField('name');
      return;
    }
    if (!category.trim()) {
      setError('يرجى اختيار تصنيف الصنف.');
      setErrorField('category');
      return;
    }
    if (!unit.trim()) {
      setError('يرجى اختيار وحدة قياس الصنف.');
      setErrorField('unit');
      return;
    }

    const price = parseFloat(salePrice);
    if (salePrice.trim() === '' || isNaN(price) || price < 0) {
      setError('يرجى إدخال سعر بيع صحيح (رقم موجب أو صفر).');
      setErrorField('salePrice');
      return;
    }

    const cost = parseFloat(costPrice);
    if (costPrice.trim() === '' || isNaN(cost) || cost < 0) {
      setError('يرجى إدخال سعر تكلفة صحيح (رقم موجب أو صفر).');
      setErrorField('costPrice');
      return;
    }

    const stock = parseInt(initialStock, 10);
    if (initialStock.trim() === '' || isNaN(stock) || stock < 0) {
      setError('يرجى إدخال رصيد افتتاحي صحيح (0 أو أكثر).');
      setErrorField('initialStock');
      return;
    }

    const minAlert = parseInt(minAlertThreshold, 10);
    if (minAlertThreshold.trim() === '' || isNaN(minAlert) || minAlert < 0) {
      setError('حد التنبيه بالنفاد يجب أن يكون 0 أو أكثر.');
      setErrorField('minAlertThreshold');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setErrorField(null);
    try {
      await onConfirm({
        barcode: barcode.trim(),
        name: name.trim(),
        category: category.trim(),
        unit: unit.trim(),
        salePrice: price,
        costPrice: cost,
        stock,
        minAlertThreshold: minAlert,
      });
      onClose();
    } catch (err: unknown) {
      console.error('[QuickAddProductModal] Create product error:', err);
      setError(toProductErrorMessage(err, 'تعذر حفظ الصنف في قاعدة بيانات المخزون.'));
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
      <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-md w-full overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <PackagePlus className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  إضافة صنف جديد
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  إدخال سريع
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                الباركود:{' '}
                <span className="font-jakarta tabular-nums font-bold text-slate-800 dark:text-slate-200">
                  {barcode}
                </span>
              </p>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 font-semibold"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            هذا الباركود غير مسجل في المخزون. أدخل بيانات الصنف ليتم حفظه وإضافته مباشرة إلى الفاتورة.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم الصنف *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError();
              }}
              placeholder="مثال: عصير طبيعي 1 لتر"
              className={`w-full px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 outline-hidden ${
                errorField === 'name'
                  ? 'border-rose-400 dark:border-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:border-emerald-600'
              }`}
              autoFocus
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CategorySelect
              value={category}
              onChange={(val) => {
                setCategory(val);
                clearError();
              }}
              error={errorField === 'category' ? error ?? undefined : undefined}
              label="تصنيف الصنف *"
              placeholder="اختر تصنيف..."
            />

            <UnitSelect
              value={unit}
              onChange={(val) => {
                setUnit(val);
                clearError();
              }}
              error={errorField === 'unit' ? error ?? undefined : undefined}
              label="وحدة الصنف *"
              placeholder="اختر وحدة..."
            />
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                سعر البيع (₪) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={salePrice}
                  onChange={(e) => {
                    setSalePrice(e.target.value);
                    clearError();
                  }}
                  placeholder="0.00"
                  dir="ltr"
                  className={`w-full pl-8 pr-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold font-jakarta tabular-nums focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 outline-hidden text-left ${
                    errorField === 'salePrice'
                      ? 'border-rose-400 dark:border-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-600'
                  }`}
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₪</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                سعر التكلفة (₪) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => {
                    setCostPrice(e.target.value);
                    clearError();
                  }}
                  placeholder="0.00"
                  dir="ltr"
                  className={`w-full pl-8 pr-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold font-jakarta tabular-nums focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 outline-hidden text-left ${
                    errorField === 'costPrice'
                      ? 'border-rose-400 dark:border-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-600'
                  }`}
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₪</span>
              </div>
            </div>
          </div>

          {/* Quantities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                الرصيد الافتتاحي {unit ? `(${unit})` : ''} *
              </label>
              <input
                type="number"
                min="0"
                value={initialStock}
                onChange={(e) => {
                  setInitialStock(e.target.value);
                  clearError();
                }}
                dir="ltr"
                className={`w-full px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold font-jakarta tabular-nums focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 outline-hidden text-left ${
                  errorField === 'initialStock'
                    ? 'border-rose-400 dark:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                حد التنبيه بالنفاد *
              </label>
              <input
                type="number"
                min="0"
                value={minAlertThreshold}
                onChange={(e) => {
                  setMinAlertThreshold(e.target.value);
                  clearError();
                }}
                dir="ltr"
                className={`w-full px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold font-jakarta tabular-nums focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 outline-hidden text-left ${
                  errorField === 'minAlertThreshold'
                    ? 'border-rose-400 dark:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-600'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="h-9 px-4 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-75 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>حفظ وإضافة للسلة</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const QuickAddProductModal: FC<QuickAddProductModalProps> = ({ isOpen, ...props }) => {
  if (!isOpen) return null;
  return <QuickAddProductModalContent key={props.barcode} {...props} />;
};
