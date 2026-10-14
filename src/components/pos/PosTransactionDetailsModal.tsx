import { useState, useEffect, useCallback, type FC } from 'react';
import {
  X,
  Printer,
  Share2,
  AlertCircle,
  RotateCw,
  Copy,
  Check,
  User,
  Calendar,
  CreditCard,
  Banknote,
  Package,
  Receipt,
} from 'lucide-react';
import {
  getPosTransactionDetails,
  toPosErrorMessage,
  type PosTransactionDetails,
} from '../../services/posService';
import { formatApiDate } from '../../lib/dateUtils';

interface PosTransactionDetailsModalProps {
  transactionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const PosTransactionDetailsModal: FC<PosTransactionDetailsModalProps> = ({
  transactionId,
  isOpen,
  onClose,
  currencySymbol = '₪',
}) => {
  const [details, setDetails] = useState<PosTransactionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const fetchDetails = useCallback(async (id: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getPosTransactionDetails(id);
      setDetails(data);
    } catch (err) {
      setErrorMessage(toPosErrorMessage(err, 'تعذر تحميل تفاصيل المعاملة. يرجى المحاولة مرة أخرى.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && transactionId) {
      fetchDetails(transactionId);
    } else {
      setDetails(null);
      setErrorMessage(null);
      setCopiedId(false);
    }
  }, [isOpen, transactionId, fetchDetails]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (!transactionId) return;
    navigator.clipboard.writeText(transactionId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!details) return;
    const customerDisplay =
      details.customerName || details.guestCustomerName || 'عميل غير مسجل';
    const typeLabel = details.transactionType === 'Debt' ? 'آجل' : 'نقدي';

    let text = `🧾 *تفاصيل معاملة نقطة البيع*\n`;
    text += `رقم المعاملة: ${details.id}\n`;
    text += `العميل: ${customerDisplay}\n`;
    text += `نوع البيع: ${typeLabel}\n`;
    text += `التاريخ: ${formatApiDate(details.createdAt, true)}\n`;
    text += `-----------------------\n`;

    if (details.items && details.items.length > 0) {
      details.items.forEach((item) => {
        text += `• ${item.productName} (x${item.quantity}) = ${currencySymbol} ${item.subTotal.toFixed(2)}\n`;
      });
      text += `-----------------------\n`;
    }

    text += `*المجموع الإجمالي: ${currencySymbol} ${details.totalAmount.toFixed(2)}*\n\n`;
    text += `شكراً لتعاملكم معنا ✨`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const customerName =
    details?.customerName || details?.guestCustomerName || 'عميل غير مسجل';
  const isGuestCustomer = !details?.customerName && Boolean(details?.guestCustomerName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn print:p-0 print:bg-white print:static"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] print:max-w-none print:shadow-none print:border-none print:w-full">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  تفاصيل معاملة نقطة البيع
                </h3>
                {transactionId && (
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1">
                    {transactionId}
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="نسخ المعرف"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                عرض تفاصيل المواد وطريقة الدفع ومجموع العملية
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <RotateCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                جاري جلب تفاصيل المعاملة من الخادم...
              </p>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex flex-col items-center justify-center text-center gap-3 py-8">
              <AlertCircle className="w-10 h-10 text-rose-500" />
              <div className="space-y-1">
                <p className="font-bold text-sm">{errorMessage}</p>
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  تأكد من اتصالك بالإنترنت وصلاحية معرف المعاملة.
                </p>
              </div>
              {transactionId && (
                <button
                  type="button"
                  onClick={() => fetchDetails(transactionId)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>إعادة المحاولة</span>
                </button>
              )}
            </div>
          )}

          {!isLoading && !errorMessage && details && (
            <>
              {/* Top Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Sale Type */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">نوع المعاملة</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    {details.transactionType === 'Debt' ? (
                      <>
                        <CreditCard className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          آجل (دين)
                        </span>
                      </>
                    ) : (
                      <>
                        <Banknote className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          نقدي
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">طريقة الدفع</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    {details.paymentMethod === 'Cash' && (
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        💵 نقدي
                      </span>
                    )}
                    {details.paymentMethod === 'BankTransfer' && (
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        🏦 تحويل بنكي
                      </span>
                    )}
                    {details.paymentMethod === 'None' && (
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        غير محدد
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">العميل</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white truncate" title={customerName}>
                      {customerName}
                    </span>
                    {isGuestCustomer && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-500 font-bold">
                        عابر
                      </span>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">التاريخ والوقت</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {formatApiDate(details.createdAt, true) || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span>المنتجات المشتراة</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px]">
                      {details.items?.length || 0}
                    </span>
                  </h4>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">المنتج</th>
                          <th className="py-2.5 px-3 text-center">الكمية</th>
                          <th className="py-2.5 px-3 text-left">سعر الوحدة</th>
                          <th className="py-2.5 px-3 text-left">المجموع</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {details.items && details.items.length > 0 ? (
                          details.items.map((item, idx) => (
                            <tr
                              key={`${item.productId}-${idx}`}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                  {item.productName}
                                </div>
                                {item.barcode && (
                                  <div className="text-[10px] font-mono text-slate-400">
                                    {item.barcode}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300 font-mono">
                                {item.quantity}
                              </td>
                              <td className="py-2.5 px-3 text-left font-mono text-slate-600 dark:text-slate-400">
                                {currencySymbol} {item.unitPrice.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-left font-mono font-black text-slate-900 dark:text-white">
                                {currencySymbol} {item.subTotal.toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400">
                              لا تتوفر أصناف مسجلة لهذه المعاملة
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Total Financial Summary Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-l from-slate-900 to-[#123663] text-white flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-xs text-slate-300 block">المبلغ الإجمالي للمعاملة</span>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    {details.transactionType === 'Debt' ? 'مضاف إلى رصيد دين العميل' : 'مدفوع ومسجل في الصندوق'}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                    {currencySymbol} {details.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !details}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isLoading || !details}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#123663] hover:bg-[#0c2444] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
