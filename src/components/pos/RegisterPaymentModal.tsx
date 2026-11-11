import { useState, type FC, type FormEvent, useRef } from 'react';
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
  Loader2,
} from 'lucide-react';
import {
  registerPayment,
  parseRegisterPaymentApiError,
  validatePaymentAmount,
  validatePaymentAmountAgainstBalance,
  validateReceiptNumber,
  validatePaymentNotes,
  validateReceiptFile,
  type PaymentFieldErrors,
} from '../../services/paymentService';
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

const RegisterPaymentModalContent: FC<Omit<RegisterPaymentModalProps, 'isOpen'>> = ({
  onClose,
  customer,
  defaultMethod = 'cash',
  onSuccess,
}) => {
  const initialCurrencyCode = normalizeCurrencyCode(customer.currencyCode || 'ILS');
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrencyCode);
  const [currencyId, setCurrencyId] = useState<number>(() => getCurrencyId(initialCurrencyCode));
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'cash' | 'credit_card'>(
    defaultMethod === 'wallet' ? 'credit_card' : 'cash'
  );
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<PaymentFieldErrors>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalDebt = customer.totalDebt || 0;
  const numAmount = parseFloat(amount) || 0;
  const remainingAfterPayment = Math.max(0, totalDebt - numAmount);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setReceiptFile(null);
      setFilePreview(null);
      setFieldErrors((prev) => ({ ...prev, receipt: undefined }));
      return;
    }

    const fileErr = validateReceiptFile(file);
    if (fileErr) {
      setFieldErrors((prev) => ({ ...prev, receipt: fileErr }));
      setErrorMessage(fileErr);
      setReceiptFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFieldErrors((prev) => ({ ...prev, receipt: undefined }));
    setErrorMessage(null);
    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleQuickAmount = (val: number) => {
    const rounded = Math.round(val * 100) / 100;
    setAmount(String(rounded));
    setFieldErrors((prev) => ({ ...prev, amount: undefined }));
    setErrorMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!customer.id) {
      setErrorMessage('يجب اختيار عميل مسجل لتسجيل الدفعة.');
      return;
    }

    const nextFieldErrors: PaymentFieldErrors = {};
    const messages: string[] = [];

    const amountErr =
      validatePaymentAmount(amount) ??
      (totalDebt > 0
        ? validatePaymentAmountAgainstBalance(amount, totalDebt, currency)
        : null);
    if (amountErr) {
      nextFieldErrors.amount = amountErr;
      messages.push(amountErr);
    }

    const recNumErr = validateReceiptNumber(receiptNumber);
    if (recNumErr) {
      messages.push(recNumErr);
    }

    const notesErr = validatePaymentNotes(notes);
    if (notesErr) {
      nextFieldErrors.notes = notesErr;
      messages.push(notesErr);
    }

    if (receiptFile) {
      const fileErr = validateReceiptFile(receiptFile);
      if (fileErr) {
        nextFieldErrors.receipt = fileErr;
        messages.push(fileErr);
      }
    }

    setFieldErrors(nextFieldErrors);
    if (messages.length > 0) {
      setErrorMessage(messages.join(' — '));
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
        debtId: '',
        receiptNumber: receiptNumber.trim() || undefined,
        notes: notes.trim(),
        receiptFile,
      });

      onSuccess(res, numAmount);
      onClose();
    } catch (err: unknown) {
      const parsed = parseRegisterPaymentApiError(err);
      setFieldErrors((prev) => ({ ...prev, ...parsed.fieldErrors }));
      setErrorMessage(parsed.generalMessage);
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
      <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Receipt className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                تسجيل دفعة للعميل (سداد دين)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                توزيع المبلغ المستلم على الديون القائمة
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Customer Info Card */}
          <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {customer.name}
                </span>
              </div>
              {customer.phone && (
                <span className="text-[11px] text-slate-500 font-jakarta tabular-nums inline-flex items-center gap-1 mt-1" dir="ltr">
                  <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  {customer.phone}
                </span>
              )}
            </div>

            <div className="text-left">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                إجمالي الدين المسجل
              </span>
              <span
                className={`text-sm font-bold font-jakarta tabular-nums ${
                  totalDebt > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
                dir="ltr"
              >
                {formatCurrency(totalDebt, currency)}
              </span>
            </div>
          </div>

          {/* Currency Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              عملة الدفعة
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
                      setFieldErrors((prev) => ({ ...prev, currency: undefined }));
                      setErrorMessage(null);
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#09152B] dark:border-slate-200 bg-[#09152B] dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <span className="font-jakarta text-sm">{cfg.symbol}</span>
                    <span>{cfg.labelAr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              طريقة الدفع
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`p-3 rounded-xl border text-right flex items-center gap-2.5 transition-colors cursor-pointer ${
                  method === 'cash'
                    ? 'border-[#09152B] dark:border-slate-200 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    method === 'cash'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">نقداً (Cash)</span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    استلام كاش مباشر
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('credit_card')}
                className={`p-3 rounded-xl border text-right flex items-center gap-2.5 transition-colors cursor-pointer ${
                  method === 'credit_card'
                    ? 'border-[#09152B] dark:border-slate-200 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    method === 'credit_card'
                      ? 'bg-[#09152B] dark:bg-slate-200 text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">محفظة / بنك</span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    PalPay / جوال باي
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                مبلغ الدفعة ({SUPPORTED_CURRENCIES[currency].symbol}) *
              </label>
              {totalDebt > 0 && (
                <span className="text-[11px] text-slate-500 font-jakarta tabular-nums">
                  المتبقي بعد الدفعة: {formatCurrency(remainingAfterPayment, currency)}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, amount: undefined }));
                  setErrorMessage(null);
                }}
                placeholder="0.00"
                dir="ltr"
                autoFocus
                className={`w-full pr-4 pl-12 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-jakarta tabular-nums font-bold text-lg outline-hidden text-left focus:bg-white dark:focus:bg-slate-900 ${
                  fieldErrors.amount
                    ? 'border-rose-400 dark:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-600'
                }`}
              />
              <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">
                {SUPPORTED_CURRENCIES[currency].symbol}
              </span>
            </div>
            {fieldErrors.amount && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                {fieldErrors.amount}
              </p>
            )}

            {/* Quick Amount Presets */}
            {totalDebt > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickAmount(totalDebt)}
                  className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer tabular-nums"
                >
                  كامل الدين ({formatCurrency(totalDebt, currency)})
                </button>
                {totalDebt > 20 && (
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(totalDebt / 2)}
                    className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors cursor-pointer tabular-nums"
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
                      className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors cursor-pointer tabular-nums"
                    >
                      {val} {SUPPORTED_CURRENCIES[currency].symbol}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Receipt Number (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              رقم الإيصال / الحوالة (اختياري)
            </label>
            <input
              type="text"
              value={receiptNumber}
              onChange={(e) => {
                setReceiptNumber(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="مثال: REC-1025"
              maxLength={50}
              dir="ltr"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-hidden focus:border-slate-400 font-jakarta text-left"
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ملاحظات على الدفعة (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setFieldErrors((prev) => ({ ...prev, notes: undefined }));
                setErrorMessage(null);
              }}
              placeholder="تفاصيل إضافية..."
              maxLength={500}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-hidden focus:border-slate-400"
            />
            {fieldErrors.notes && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{fieldErrors.notes}</p>
            )}
          </div>

          {/* Receipt Image Upload (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              صورة إيصال الدفع (اختياري — PNG/JPG حتى 5MB)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            {receiptFile ? (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                    {receiptFile.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null);
                    setFilePreview(null);
                    setFieldErrors((prev) => ({ ...prev, receipt: undefined }));
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs text-rose-600 font-semibold hover:underline shrink-0 mr-2 cursor-pointer"
                >
                  إزالة
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>إرفاق صورة الإيصال</span>
              </button>
            )}
            {fieldErrors.receipt && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{fieldErrors.receipt}</p>
            )}

            {filePreview && (
              <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={filePreview} alt="معاينة الإيصال" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل الدفعة...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد وتسجيل الدفعة</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const RegisterPaymentModal: FC<RegisterPaymentModalProps> = ({
  isOpen,
  ...props
}) => {
  if (!isOpen) return null;
  return (
    <RegisterPaymentModalContent
      key={`${props.customer.id || props.customer.name}-${props.defaultMethod || 'cash'}`}
      {...props}
    />
  );
};
