import { useState, type FC, type FormEvent } from 'react';
import { X, PlusCircle, ArrowLeft, Truck, DollarSign, FileText, Check } from 'lucide-react';
import type { Product, RestockPayload } from '../../types/inventory';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (productId: string, payload: RestockPayload) => void;
}

export const RestockModal: FC<RestockModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState<number>(24);
  const [newCostPrice, setNewCostPrice] = useState<string>('');
  const [supplierNote, setSupplierNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const quickPresets = [6, 12, 24, 48, 100];
  const newStockTotal = product.stock + (Number(quantity) || 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('يرجى إدخال كمية توريد صحيحة (أكبر من صفر)');
      return;
    }

    const cost = newCostPrice.trim() !== '' ? parseFloat(newCostPrice) : undefined;
    if (cost !== undefined && (isNaN(cost) || cost < 0)) {
      setError('يرجى إدخال سعر تكلفة صحيح');
      return;
    }

    onConfirm(product.id, {
      quantity: qty,
      costPrice: cost,
      supplierNote: supplierNote.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                توريد كميات جديدة للمخزن
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تسجيل بضاعة واردة من الموردين وتحديث رصيد الصنف
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

        {/* Product Summary Card */}
        <div className="p-5 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100/60 dark:border-blue-900/40">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold block mb-0.5">
                {product.barcode}
              </span>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{product.name}</h4>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                التصنيف: {product.category}
              </span>
            </div>
            <div className="text-left">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">الرصيد الحالي</span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                {product.stock} <span className="text-xs font-normal">وحدة</span>
              </span>
            </div>
          </div>
        </div>

        {/* Restock Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Incoming Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>الكمية الموردة الجديدة (وحدة/حبة) *</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity || ''}
              onChange={(e) => {
                setQuantity(Math.max(1, parseInt(e.target.value, 10) || 0));
                setError(null);
              }}
              placeholder="مثال: 24"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-base font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden"
              autoFocus
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-400">إضافات سريعة:</span>
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuantity(preset)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                    quantity === preset
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* New Cost Price (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-slate-500" />
              <span>سعر التكلفة الجديد (اختياري - التكلفة الحالية: ₪{product.costPrice})</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                value={newCostPrice}
                onChange={(e) => setNewCostPrice(e.target.value)}
                placeholder={`اتركه فارغاً للإبقاء على ₪${product.costPrice}`}
                className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden"
              />
              <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₪</span>
            </div>
          </div>

          {/* Supplier Note / Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>ملاحظة المورد أو رقم الفاتورة الواردة</span>
            </label>
            <input
              type="text"
              value={supplierNote}
              onChange={(e) => setSupplierNote(e.target.value)}
              placeholder="مثال: فاتورة شركة الصفا رقم #9842"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden"
            />
          </div>

          {/* Stock Projection preview */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-medium">الرصيد بعد اعتماد التوريد:</span>
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

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Check className="w-4 h-4" />
              <span>تأكيد التوريد وإيداع المخزون</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
