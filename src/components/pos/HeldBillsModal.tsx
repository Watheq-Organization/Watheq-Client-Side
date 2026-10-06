import type { FC } from 'react';
import { X, Clock, Play, Trash2, ShoppingBag } from 'lucide-react';
import type { HeldBill } from '../../types/inventory';

interface HeldBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldBills: HeldBill[];
  onResume: (billId: string) => void;
  onDelete: (billId: string) => void;
}

export const HeldBillsModal: FC<HeldBillsModalProps> = ({
  isOpen,
  onClose,
  heldBills,
  onResume,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  الفواتير المعلقة في الانتظار
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500 text-white font-bold">
                  F5
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إجمالي المعلق: {heldBills.length} طلبات جاهزة للاستئناف
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Held Bills */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {heldBills.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                لا توجد فواتير معلقة حالياً
              </p>
              <p className="text-xs text-slate-400 mt-1">
                يمكنك تعليق أي فاتورة نشطة بالضغط على زر (F4) أو زر تعليق الفاتورة
              </p>
            </div>
          ) : (
            heldBills.map((bill, idx) => (
              <div
                key={bill.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-amber-400/80 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        طلب #{idx + 1} - {bill.customer.name}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {bill.heldAt}
                      </span>
                    </div>
                    {bill.note && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                        ملاحظة: {bill.note}
                      </p>
                    )}
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      ₪{bill.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items summary */}
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                  <span>
                    {bill.items.length} أصناف (
                    {bill.items
                      .slice(0, 2)
                      .map((i) => i.product.name)
                      .join('، ')}
                    {bill.items.length > 2 ? '...' : ''})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDelete(bill.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="حذف الفاتورة المعلقة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onResume(bill.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>استرجاع للشاشة</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            إغلاق (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
