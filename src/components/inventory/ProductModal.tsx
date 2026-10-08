import { useState, useEffect, type FC, type FormEvent } from 'react';
import { X, Camera, Barcode, Package, DollarSign, AlertTriangle, Check, Layers, Loader2 } from 'lucide-react';
import type { Product } from '../../types/inventory';
import { CameraScannerModal } from '../common/CameraScannerModal';
import { createProduct, updateProductApi } from '../../services/productService';
import { ApiError } from '../../api/httpClient';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Called with the fully-formed Product (including server-assigned id).
   * When editing, the Product is re-assembled locally.
   */
  onSave: (product: Product) => void;
  editingProduct?: Product | null;
  existingProducts: Product[];
}

export const ProductModal: FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduct,
  existingProducts,
}) => {
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('عام');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [minAlertThreshold, setMinAlertThreshold] = useState('5');

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setBarcode(editingProduct.barcode);
      setName(editingProduct.name);
      setCategory(editingProduct.category || 'عام');
      setSalePrice(String(editingProduct.salePrice));
      setCostPrice(String(editingProduct.costPrice));
      setStock(String(editingProduct.stock));
      setMinAlertThreshold(String(editingProduct.minAlertThreshold));
    } else {
      setBarcode('');
      setName('');
      setCategory('عام');
      setSalePrice('');
      setCostPrice('');
      setStock('10');
      setMinAlertThreshold('5');
    }
    setErrors({});
    setApiError(null);
    setIsSubmitting(false);
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!barcode.trim()) {
      errs.barcode = 'الباركود مطلوب';
    } else {
      const duplicate = existingProducts.find(
        (p) =>
          p.barcode.trim().toLowerCase() === barcode.trim().toLowerCase() &&
          p.id !== editingProduct?.id
      );
      if (duplicate) {
        errs.barcode = `الباركود مسجل مسبقاً للصنف: (${duplicate.name})`;
      }
    }

    if (!name.trim()) {
      errs.name = 'اسم الصنف مطلوب';
    }

    const sale = parseFloat(salePrice);
    if (isNaN(sale) || sale < 0) {
      errs.salePrice = 'يرجى إدخال سعر بيع صحيح (رقم موجب)';
    }

    const cost = parseFloat(costPrice);
    if (isNaN(cost) || cost < 0) {
      errs.costPrice = 'يرجى إدخال سعر تكلفة صحيح (رقم موجب)';
    }

    const st = parseInt(stock, 10);
    if (!editingProduct && (isNaN(st) || st < 0)) {
      errs.stock = 'الرصيد يجب أن يكون 0 أو أكثر';
    }

    const min = parseInt(minAlertThreshold, 10);
    if (isNaN(min) || min < 0) {
      errs.minAlertThreshold = 'حد التنبيه يجب أن يكون 0 أو أكثر';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setApiError(null);

    // ── Edit mode: update via PUT /api/Products/{id} ───────────────────────
    if (editingProduct) {
      setIsSubmitting(true);
      try {
        // Extract numeric ID if possible, otherwise send string. 
        // Real server returns ints, but locally generated might be 'prod-xxx'.
        const numId = parseInt(editingProduct.id, 10);
        let serverProduct;
        
        if (isNaN(numId)) {
          // Local-only product, bypass API
          serverProduct = {
            id: editingProduct.id,
            name: name.trim(),
            barcode: barcode.trim(),
            salePrice: parseFloat(salePrice),
            costPrice: parseFloat(costPrice) || 0,
            stock: editingProduct.stock,
            minAlertThreshold: parseInt(minAlertThreshold, 10) || 5,
            isActive: editingProduct.isActive ?? true,
            createdAt: editingProduct.createdAt,
            updatedAt: new Date().toISOString(),
          } as Product;
        } else {
          serverProduct = await updateProductApi(numId, {
            id: numId,
            productName: name.trim(),
            barcode: barcode.trim(),
            salePrice: parseFloat(salePrice),
            costPrice: parseFloat(costPrice) || 0,
            minStockAlert: parseInt(minAlertThreshold, 10) || 5,
          });
        }

        const enriched: Product = {
          ...serverProduct,
          category: category.trim() || 'عام',
        };

        onSave(enriched);
        onClose();
      } catch (err) {
        // ── LOCAL FALLBACK FOR 404 or 0 ──────────────────────────────────────
        if (err instanceof ApiError && (err.status === 404 || err.status === 0)) {
          console.warn('PUT /api/Products failed (404/0). Falling back to local update.');
          const updatedProduct: Product = {
            ...editingProduct,
            barcode: barcode.trim(),
            name: name.trim(),
            category: category.trim() || 'عام',
            salePrice: parseFloat(salePrice),
            costPrice: parseFloat(costPrice) || 0,
            minAlertThreshold: parseInt(minAlertThreshold, 10) || 5,
            updatedAt: new Date().toISOString(),
          };
          onSave(updatedProduct);
          onClose();
          return;
        }

        if (err instanceof ApiError) {
          const bodyMsg =
            typeof err.body === 'object' &&
            err.body !== null &&
            'message' in err.body
              ? String((err.body as { message: unknown }).message)
              : null;
          setApiError(
            bodyMsg ||
              (err.status === 401
                ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.'
                : err.status === 400
                ? 'البيانات المدخلة غير صحيحة، تأكد من الباركود والأسعار.'
                : err.status === 0
                ? 'لا يوجد اتصال بالخادم. تحقق من الإنترنت وحاول مجدداً.'
                : `فشل التعديل (خطأ ${err.status}). حاول مجدداً.`)
          );
        } else {
          setApiError('حدث خطأ غير متوقع. حاول مجدداً.');
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ── Create mode: call POST /api/Products ───────────────────────────────
    setIsSubmitting(true);
    try {
      const serverProduct = await createProduct({
        productName: name.trim(),
        barcode: barcode.trim(),
        salePrice: parseFloat(salePrice),
        costPrice: parseFloat(costPrice) || 0,
        minStockAlert: parseInt(minAlertThreshold, 10) || 5,
        quantity: parseInt(stock, 10),
      });

      // Merge local-only fields that the server doesn't know about
      const enriched: Product = {
        ...serverProduct,
        category: category.trim() || 'عام',
      };

      onSave(enriched);
      onClose();
    } catch (err) {
      // ── LOCAL FALLBACK FOR 404 or 0 ──────────────────────────────────────
      // If the API returns 404 or network error (CORS/offline), it means the endpoint isn't deployed yet.
      // We fall back to local creation so the user can still test the UI.
      if (err instanceof ApiError && (err.status === 404 || err.status === 0)) {
        console.warn('POST /api/Products failed (404/0). Falling back to local creation.');
        const localProduct: Product = {
          id: `prod-local-${Date.now()}`,
          barcode: barcode.trim(),
          name: name.trim(),
          category: category.trim() || 'عام',
          salePrice: parseFloat(salePrice),
          costPrice: parseFloat(costPrice) || 0,
          stock: parseInt(stock, 10),
          minAlertThreshold: parseInt(minAlertThreshold, 10) || 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        onSave(localProduct);
        onClose();
        return;
      }

      // Show the API error but keep the modal open so the user can retry
      if (err instanceof ApiError) {
        const bodyMsg =
          typeof err.body === 'object' &&
          err.body !== null &&
          'message' in err.body
            ? String((err.body as { message: unknown }).message)
            : null;
        setApiError(
          bodyMsg ||
            (err.status === 401
              ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.'
              : err.status === 0
              ? 'لا يوجد اتصال بالخادم. تحقق من الإنترنت وحاول مجدداً.'
              : `فشل إنشاء المنتج (خطأ ${err.status}). حاول مجدداً.`)
        );
      } else {
        setApiError('حدث خطأ غير متوقع. حاول مجدداً.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateRandomBarcode = () => {
    const code = '625' + Math.floor(1000000000 + Math.random() * 9000000000);
    setBarcode(code);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        dir="rtl"
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                  {editingProduct ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد للمخزون'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  يرجى ملء بيانات الصنف بدقة لتحديث قاعدة المخزون ونقاط البيع
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-emerald-600" />
                  <span>الباركود الدولي أو المحلي *</span>
                </label>
                <button
                  type="button"
                  onClick={generateRandomBarcode}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                >
                  توليد باركود تلقائي
                </button>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => {
                      setBarcode(e.target.value);
                      if (errors.barcode) setErrors((prev) => ({ ...prev, barcode: '' }));
                    }}
                    placeholder="مثال: 6251001234567"
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-all outline-hidden ${
                      errors.barcode
                        ? 'border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  title="مسح بالكاميرا"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">مسح بالكاميرا</span>
                </button>
              </div>
              {errors.barcode && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{errors.barcode}</span>
                </p>
              )}
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                اسم الصنف بالتفصيل *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="مثال: حليب رغد كامل الدسم 1 لتر"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-all outline-hidden ${
                  errors.name
                    ? 'border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>التصنيف / القسم</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled
                placeholder="عام"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-hidden opacity-60 cursor-not-allowed"
              />
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                إدارة الأقسام والتصنيفات مغلقة حالياً
              </p>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>سعر البيع (₪) *</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={salePrice}
                    onChange={(e) => {
                      setSalePrice(e.target.value);
                      if (errors.salePrice) setErrors((prev) => ({ ...prev, salePrice: '' }));
                    }}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-all outline-hidden ${
                      errors.salePrice
                        ? 'border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₪</span>
                </div>
                {errors.salePrice && (
                  <p className="mt-1 text-xs text-rose-500">{errors.salePrice}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                  <span>سعر التكلفة (₪) *</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={costPrice}
                    onChange={(e) => {
                      setCostPrice(e.target.value);
                      if (errors.costPrice) setErrors((prev) => ({ ...prev, costPrice: '' }));
                    }}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-all outline-hidden ${
                      errors.costPrice
                        ? 'border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₪</span>
                </div>
                {errors.costPrice && (
                  <p className="mt-1 text-xs text-rose-500">{errors.costPrice}</p>
                )}
              </div>
            </div>

            {/* Quantities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  الرصيد الافتتاحي بالمحل (الكمية) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => {
                    setStock(e.target.value);
                    if (errors.stock) setErrors((prev) => ({ ...prev, stock: '' }));
                  }}
                  disabled={!!editingProduct}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-all outline-hidden ${
                    !!editingProduct ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50' : ''
                  } ${
                    errors.stock
                      ? 'border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
                {errors.stock && <p className="mt-1 text-xs text-rose-500">{errors.stock}</p>}
                {editingProduct && (
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    لا يمكن تعديل المخزون من هنا. استخدم شاشة التوريد.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  حد التنبيه بالنفاد 🟡 (الافتراضي 5) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={minAlertThreshold}
                  onChange={(e) => {
                    setMinAlertThreshold(e.target.value);
                    if (errors.minAlertThreshold)
                      setErrors((prev) => ({ ...prev, minAlertThreshold: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-all outline-hidden ${
                    errors.minAlertThreshold
                      ? 'border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
                {errors.minAlertThreshold && (
                  <p className="mt-1 text-xs text-rose-500">{errors.minAlertThreshold}</p>
                )}
              </div>
            </div>

            {/* API Error Banner */}
            {apiError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">{apiError}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editingProduct ? 'حفظ التعديلات' : 'إضافة الصنف للمخزون'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={(scanned) => {
          setBarcode(scanned);
          if (errors.barcode) setErrors((prev) => ({ ...prev, barcode: '' }));
        }}
        title="مسح باركود الصنف الجديد"
      />
    </>
  );
};
