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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  الفواتير المعلقة
                </h3>
                <kbd className="text-[10px] font-jakarta font-semibold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700">
                  F5
                </kbd>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                إجمالي المعلق: {heldBills.length} طلبات جاهزة للاستئناف
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
          {heldBills.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2.5 opacity-30" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                لا توجد فواتير معلقة حالياً
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                يمكنك تعليق أي فاتورة نشطة بالضغط على (F4) أو زر تعليق الفاتورة.
              </p>
            </div>
          ) : (
            heldBills.map((bill, idx) => (
              <div
                key={bill.id}
                className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        طلب #{idx + 1} · {bill.customer.name}
                      </span>
                      <span className="text-[11px] font-jakarta tabular-nums px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {bill.heldAt}
                      </span>
                    </div>
                    {bill.note && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium">
                        ملاحظة: {bill.note}
                      </p>
                    )}
                  </div>
                  <div className="text-left font-jakarta tabular-nums shrink-0" dir="ltr">
                    <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                      ₪{bill.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-200/70 dark:border-slate-800 pt-2.5">
                  <span className="truncate max-w-[230px]">
                    {bill.items.length} أصناف (
                    {bill.items
                      .slice(0, 2)
                      .map((i) => i.product.name)
                      .join('، ')}
                    {bill.items.length > 2 ? '...' : ''})
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDelete(bill.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
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
                      className="h-8 px-3 rounded-lg bg-[#09152B] hover:bg-[#12264B] dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>استرجاع</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
          >
            إغلاق (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
