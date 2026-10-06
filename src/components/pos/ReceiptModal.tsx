import { useState, type FC } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  MessageCircle,
  Send,
  QrCode,
} from 'lucide-react';
import type { CompletedSale } from '../../types/inventory';

interface ReceiptModalProps {
  sale: CompletedSale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: FC<ReceiptModalProps> = ({ sale, isOpen, onClose }) => {
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPaymentMethodLabel = () => {
    if (sale.paymentMethod === 'cash') return 'نقدي (Cash)';
    if (sale.paymentMethod === 'debt') return 'آجل / ذمم (Debt)';
    if (sale.paymentMethod === 'bank') return 'تحويل بنكي / PalPay';
    return sale.paymentMethod;
  };

  // WhatsApp Digital Receipt Message
  const shareViaWhatsApp = () => {
    const text = `🧾 *فاتورة مبيعات وثّق*
رقم الفاتورة: ${sale.invoiceNumber}
الزبون: ${sale.customerName}
التاريخ: ${new Date(sale.date).toLocaleString('ar-EG')}
طريقة الدفع: ${getPaymentMethodLabel()}
-----------------------
${sale.items.map((i) => `• ${i.product.name} (x${i.quantity}): ₪${i.subtotal.toFixed(2)}`).join('\n')}
-----------------------
*المجموع النهائي: ₪${sale.total.toFixed(2)}*
${sale.paymentMethod === 'debt' ? `الرصيد الإجمالي للدين: ₪${(sale.newDebt || sale.total).toFixed(2)}` : ''}

شكراً لتعاملكم معنا ✨`;

    const encoded = encodeURIComponent(text);
    const phone = sale.customerPhone ? sale.customerPhone.replace(/\D/g, '') : '';
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Telegram Digital Receipt
  const shareViaTelegram = () => {
    const text = `🧾 فاتورة وثّق - رقم: ${sale.invoiceNumber}
الزبون: ${sale.customerName}
المجموع: ₪${sale.total.toFixed(2)}`;
    const url = `https://t.me/share/url?url=https://watheq.app&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn print:p-0 print:bg-white print:static"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] print:max-w-none print:shadow-none print:border-none print:w-full">
        {/* Header toolbar (Hidden in print) */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                تم حفظ الفاتورة بنجاح
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">{sale.invoiceNumber}</span>
            </div>
          </div>

          {/* Paper format selector */}
          <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => setPaperWidth('80mm')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                paperWidth === '80mm'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              80mm
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth('58mm')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                paperWidth === '58mm'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              58mm
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable ESC/POS Thermal Receipt Paper */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/50 dark:bg-slate-950/50 flex justify-center print:bg-white print:p-0">
          <div
            id="printable-receipt"
            className={`bg-white text-black p-5 shadow-md border border-slate-200 font-mono text-xs rounded-xl print:shadow-none print:border-none print:p-2 ${
              paperWidth === '80mm' ? 'w-[320px]' : 'w-[250px]'
            }`}
          >
            {/* Merchant Branding */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-lg font-black tracking-tight font-cairo">متجر وثّق</h2>
              <p className="text-[11px] text-slate-600">نظام وثّق للمبيعات والذمم الفورية</p>
              <p className="text-[10px] text-slate-500 mt-0.5">فلسطين - رام الله / غزة</p>
            </div>

            {/* Receipt Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">رقم الفاتورة:</span>
                <span className="font-bold">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">التاريخ:</span>
                <span>{new Date(sale.date).toLocaleDateString('ar-EG')} {new Date(sale.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">العميل:</span>
                <span className="font-bold font-cairo">{sale.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">طريقة الدفع:</span>
                <span className="font-bold font-cairo">{getPaymentMethodLabel()}</span>
              </div>
              {sale.bankRefCode && (
                <div className="flex justify-between text-indigo-700">
                  <span>مرجع الحوالة:</span>
                  <span className="font-bold">{sale.bankRefCode}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <table className="w-full text-right text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-1">الصنف</th>
                    <th className="py-1 text-center">الكمية</th>
                    <th className="py-1 text-left">المجموع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items.map((item) => (
                    <tr key={item.product.id}>
                      <td className="py-1 font-cairo pr-1">{item.product.name}</td>
                      <td className="py-1 text-center font-bold">×{item.quantity}</td>
                      <td className="py-1 text-left font-bold">₪{item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Ledger Calculation */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span>₪{sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-amber-600 font-bold">
                  <span>الخصم الممنوح:</span>
                  <span>-₪{sale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200">
                <span>المجموع النهائي:</span>
                <span>₪{sale.total.toFixed(2)}</span>
              </div>

              {/* Cash particulars */}
              {sale.paymentMethod === 'cash' && sale.receivedAmount !== undefined && (
                <div className="pt-1 text-[10px] text-slate-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span>المبلغ المستلم:</span>
                    <span>₪{sale.receivedAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-black">
                    <span>الباقي للزبون:</span>
                    <span>₪{(sale.changeAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Debt particulars */}
              {sale.paymentMethod === 'debt' && (
                <div className="pt-1.5 bg-rose-50 p-1.5 rounded text-[10px] text-rose-800 space-y-0.5">
                  <div className="flex justify-between">
                    <span>الدين السابق:</span>
                    <span>₪{(sale.previousDebt || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>إجمالي ذمة الزبون الآن:</span>
                    <span>₪{(sale.newDebt || sale.total).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer QR & thank you */}
            <div className="pt-3 text-center space-y-1.5">
              <div className="mx-auto w-16 h-16 border border-slate-300 p-1 flex items-center justify-center">
                <QrCode className="w-14 h-14" />
              </div>
              <p className="text-[10px] text-slate-500 font-cairo">
                نسخة إلكترونية موثقة عبر منصة وثّق
              </p>
              <p className="text-[10px] font-bold font-cairo">شكراً لزيارتكم ونسعد بخدمتكم دائماً</p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden in print) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2.5 print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الإيصال (Print)</span>
            </button>

            <button
              type="button"
              onClick={shareViaWhatsApp}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              title="إرسال عبر واتساب"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">واتساب</span>
            </button>

            <button
              type="button"
              onClick={shareViaTelegram}
              className="px-3.5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              title="إرسال عبر تيليجرام"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">تيليجرام</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            إغلاق والعودة للكاشير (Enter)
          </button>
        </div>
      </div>
    </div>
  );
};
