import { useState, useEffect, type FC, type FormEvent, useRef } from 'react';
import {
  X,
  Banknote,
  Wallet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Receipt,
  Phone,
  User,
} from 'lucide-react';
import { registerPayment, toRegisterPaymentErrorMessage } from '../../services/paymentService';
import type { RegisterPaymentResponseDto } from '../../types/payment';
import {
  formatCurrency,
  getCurrencyId,
  normalizeCurrencyCode,
  SUPPORTED_CURRENCIES,
  ALL_CURRENCY_CODES,
  type CurrencyCode,
} from '../../utils/currency';

interface RegisterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id?: string;
    name: string;
    phone?: string;
    totalDebt?: number;
    currencyCode?: string;
  };
  defaultMethod?: 'cash' | 'wallet';
  onSuccess: (res: RegisterPaymentResponseDto, paidAmount: number) => void;
}

export const RegisterPaymentModal: FC<RegisterPaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
  defaultMethod = 'cash',
  onSuccess,
}) => {
  const [currency, setCurrency] = useState<CurrencyCode>('ILS');
  const [currencyId, setCurrencyId] = useState<number>(() => getCurrencyId('ILS'));
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'cash' | 'credit_card'>('cash');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const code = normalizeCurrencyCode(customer.currencyCode || 'ILS');
      setMethod(defaultMethod === 'wallet' ? 'credit_card' : 'cash');
      setCurrency(code);
      setCurrencyId(getCurrencyId(code));
      setAmount('');
      setReceiptNumber('');
      setNotes('');
      setReceiptFile(null);
      setFilePreview(null);
      setErrorMessage(null);
    }
  }, [isOpen, defaultMethod, customer.currencyCode]);

  if (!isOpen) return null;

  const totalDebt = customer.totalDebt || 0;
  const numAmount = parseFloat(amount) || 0;
  const remainingAfterPayment = Math.max(0, totalDebt - numAmount);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setReceiptFile(file);
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleQuickAmount = (val: number) => {
    const rounded = Math.round(val * 100) / 100;
    setAmount(String(rounded));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customer.id) {
      setErrorMessage('يجب اختيار عميل مسجل لتسجيل الدفعة.');
      return;
    }
    if (numAmount <= 0) {
      setErrorMessage('يجب أن تكون قيمة الدفعة أكبر من صفر.');
      return;
    }
    if (totalDebt > 0 && numAmount > totalDebt) {
      setErrorMessage(`قيمة الدفعة (${formatCurrency(numAmount, currency)}) أكبر من إجمالي الدين المتبقي (${formatCurrency(totalDebt, currency)}).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await registerPayment(customer.id, {
        amount: String(numAmount),
        method,
        currencyId: currencyId || getCurrencyId(currency),
        currencyCode: currency,
        currency: currency,
        receiptNumber: receiptNumber.trim() || undefined,
        notes: notes.trim(),
        receiptFile,
      });

      onSuccess(res, numAmount);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(toRegisterPaymentErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-emerald-500/30 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/80 dark:bg-emerald-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-lg">
                  تسجيل دفعة للعميل (سداد دين)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تسجيل دفعة مالية وتوزيعها تلقائياً على الديون المستحقة
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Customer Info Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {customer.name}
                </span>
              </div>
              {customer.phone && (
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3 text-emerald-500" />
                  {customer.phone}
                </span>
              )}
            </div>

            <div className="text-left font-mono">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-sans">
                إجمالي الدين الحالي:
              </span>
              <span
                className={`text-base font-black ${
                  totalDebt > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatCurrency(totalDebt, currency)}
              </span>
            </div>
          </div>

          {/* Currency Selector (ILS / USD / JOD) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              عملة الدفعة:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_CURRENCY_CODES.map((c) => {
                const cfg = SUPPORTED_CURRENCIES[c];
                const isSelected = currency === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCurrency(c);
                      setCurrencyId(getCurrencyId(c));
                    }}
                    className={`py-2 px-3 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-600/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="font-mono text-sm">{cfg.symbol}</span>
                    <span>{cfg.labelAr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector (Cash vs Wallet) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              طريقة دفع الدفعة:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`p-3 rounded-2xl border-2 text-right flex items-center gap-3 transition-all cursor-pointer ${
                  method === 'cash'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-white shadow-sm ring-1 ring-emerald-600/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    method === 'cash'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black block">نقداً (Cash)</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    استلام كاش مباشر
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('credit_card')}
                className={`p-3 rounded-2xl border-2 text-right flex items-center gap-3 transition-all cursor-pointer ${
                  method === 'credit_card'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-white shadow-sm ring-1 ring-indigo-600/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    method === 'credit_card'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black block">محفظة / بنك (Wallet)</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    PalPay / جوال باي
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                مبلغ الدفعة ({SUPPORTED_CURRENCIES[currency].symbol}):
              </label>
              {totalDebt > 0 && (
                <span className="text-[11px] text-slate-500 font-mono">
                  المتبقي بعد الدفعة: {formatCurrency(remainingAfterPayment, currency)}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={totalDebt > 0 ? totalDebt : undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
                className="w-full pr-4 pl-12 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-mono font-black text-lg outline-hidden focus:border-emerald-500 transition-colors"
              />
              <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-sm">
                {SUPPORTED_CURRENCIES[currency].symbol}
              </span>
            </div>

            {/* Quick Amount Presets */}
            {totalDebt > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickAmount(totalDebt)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 transition-colors"
                >
                  كامل الدين ({formatCurrency(totalDebt, currency)})
                </button>
                {totalDebt > 20 && (
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(totalDebt / 2)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    النصف ({formatCurrency(totalDebt / 2, currency)})
                  </button>
                )}
                {[50, 100, 200]
                  .filter((v) => v <= totalDebt)
                  .map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAmount(val)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      {val} {SUPPORTED_CURRENCIES[currency].symbol}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Receipt Number (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              رقم الإيصال / الحوالة (اختياري):
            </label>
            <input
              type="text"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="مثال: REC-1025 أو رقم الحوالة"
              maxLength={50}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ملاحظات على الدفعة (اختياري):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: دفعة نقدية باليد أو عبر المحفظة..."
              maxLength={500}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Receipt Image Upload (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              صورة إيصال الدفع (اختياري):
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {receiptFile ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                    {receiptFile.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null);
                    setFilePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs text-rose-500 font-bold hover:underline shrink-0 mr-2"
                >
                  إزالة
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>إرفاق صورة إيصال أو لقطة شاشة للتحويل</span>
              </button>
            )}

            {filePreview && (
              <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs">
                <img src={filePreview} alt="Receipt preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numAmount <= 0}
              className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 disabled:opacity-50 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري تسجيل الدفعة...' : 'تأكيد وتسجيل الدفعة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
