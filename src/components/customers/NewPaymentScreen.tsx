import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ShieldCheck,
  Paperclip,
  ImagePlus,
  Info,
  User,
  Hash,
  Banknote,
  Landmark,
  CreditCard,
  Save,
  MessageSquareText,
  CalendarCheck2,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { Textarea } from '../ui/Textarea';
import {
  getCustomerProfile,
  setStoredTotalPaid,
  toGetCustomerProfileErrorMessage,
} from '../../services/customerService';
import {
  registerPayment,
  toRegisterPaymentErrorMessage,
  validatePaymentAmount,
  validatePaymentAmountAgainstBalance,
  validateReceiptNumber,
  validatePaymentNotes,
  validateReceiptFile,
} from '../../services/paymentService';
import { PAYMENT_METHOD_OPTIONS } from '../../types/payment';
import type { PaymentMethod } from '../../types/payment';
import type { CustomerProfileDto } from '../../types/customer';
import { PATHS } from '../../routes/paths';

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, typeof Banknote> = {
  cash: Banknote,
  bank_transfer: Landmark,
  credit_card: CreditCard,
};

export const NewPaymentScreen: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Customer context — fetched from the same getCustomerProfile endpoint
  // used by the Customer Details page, so the name/balance shown here are
  // never hardcoded.
  const [customerProfile, setCustomerProfile] = useState<CustomerProfileDto | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCustomerProfile = useCallback(() => {
    if (!id) {
      setIsLoadingProfile(false);
      setLoadError('معرّف العميل غير موجود.');
      return;
    }
    setIsLoadingProfile(true);
    setLoadError(null);
    getCustomerProfile(id)
      .then((dto) => setCustomerProfile(dto))
      .catch((err) => setLoadError(toGetCustomerProfileErrorMessage(err)))
      .finally(() => setIsLoadingProfile(false));
  }, [id]);

  useEffect(() => {
    loadCustomerProfile();
  }, [loadCustomerProfile]);

  // Form state
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fieldErrors, setFieldErrors] = useState<{
    amount?: string;
    receiptNumber?: string;
    notes?: string;
    receipt?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleReceiptChange = (file: File | null) => {
    if (!file) {
      setReceiptFile(null);
      setFieldErrors((prev) => ({ ...prev, receipt: undefined }));
      return;
    }
    const error = validateReceiptFile(file);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, receipt: error }));
      setReceiptFile(null);
      return;
    }
    setFieldErrors((prev) => ({ ...prev, receipt: undefined }));
    setReceiptFile(file);
  };

  const totalDebt = customerProfile?.totalDebt ?? 0;
  const totalPaid = customerProfile?.totalPaid ?? 0;
  const currentBalance = customerProfile?.currentBalance ?? totalDebt;

  // Balance after payment — only computable once a valid amount is entered,
  // otherwise shown as "---" exactly as in the reference.
  const parsedAmount = Number(amount);
  const hasValidAmount = amount.trim() !== '' && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const balanceAfterPayment = hasValidAmount ? Math.max(currentBalance - parsedAmount, 0) : null;

  // "مدى التزام العميل" has no dedicated field anywhere in the API — the
  // closest real signal already available is how much of the customer's
  // total activity (paid + owed) has actually been paid, so it's derived
  // from the real totalPaid/totalDebt figures rather than a fixed number.
  const commitmentDenominator = totalPaid + totalDebt;
  const commitmentPercent =
    commitmentDenominator > 0 ? Math.round((totalPaid / commitmentDenominator) * 100) : 100;

  const handleSave = async () => {
    if (isSaving) return;

    const errors: typeof fieldErrors = {
      amount:
        validatePaymentAmount(amount) ??
        (customerProfile
          ? validatePaymentAmountAgainstBalance(amount, currentBalance) ?? undefined
          : undefined),
      receiptNumber: validateReceiptNumber(receiptNumber) ?? undefined,
      notes: validatePaymentNotes(notes) ?? undefined,
    };
    setFieldErrors((prev) => ({ ...prev, ...errors }));
    if (errors.amount || errors.receiptNumber || errors.notes || !id) {
      if (!id) setSubmitError('معرّف العميل غير موجود.');
      return;
    }

    setSubmitError(null);
    setIsSaving(true);
    try {
      const res = await registerPayment(id, {
        amount,
        method,
        receiptNumber: receiptNumber.trim(),
        notes: notes.trim(),
        receiptFile,
      });

      // Update stored totalPaid immediately so details screen reflects it
      const numericAmount = Number(amount) || 0;
      const returnedPaid = Number(res?.totalPaid);
      const prevTotalPaid = Number(customerProfile?.totalPaid) || 0;
      const newTotalPaid = returnedPaid > 0 ? returnedPaid : (prevTotalPaid + numericAmount);
      setStoredTotalPaid(id, newTotalPaid);

      navigate(`/customers/${id}`, { state: { toast: 'تم حفظ الدفعة بنجاح.' } });
    } catch (error) {
      setSubmitError(toRegisterPaymentErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(id ? `/customers/${id}` : '/customers');
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 font-cairo antialiased flex" dir="rtl">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="customers"
      />

      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1 max-w-7xl w-full mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <button
              type="button"
              onClick={() => navigate(PATHS.DASHBOARD)}
              className="hover:text-[#0c2444] transition-colors cursor-pointer"
            >
              الرئيسية
            </button>
            <ChevronLeft className="w-3.5 h-3.5" />
            <button
              type="button"
              onClick={() => navigate(id ? `/customers/${id}` : '/customers')}
              className="hover:text-[#0c2444] transition-colors cursor-pointer"
            >
              سجل المدفوعات
            </button>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-slate-600">تسجيل دفعة جديدة</span>
          </nav>

          {/* Page Header + Security Badge */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-tajawal text-[#0c2444] tracking-tight">
                تسجيل دفعة جديدة
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                قم بتسجيل المبالغ المستلمة من العميل لتحديث رصيده المالي فوراً.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-bold self-start shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>نظام دفع آمن ومشفر</span>
            </div>
          </div>

          {/* Profile Load Status */}
          {loadError && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <button
                type="button"
                onClick={loadCustomerProfile}
                className="shrink-0 text-xs font-bold underline hover:no-underline cursor-pointer"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* Main 2-Column Grid: form (right/main, wider) + summary cards (left) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* MAIN: Payment Form Card */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-xs p-6 sm:p-8 space-y-5">
              {submitError && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3.5 py-2.5 text-right">
                  {submitError}
                </div>
              )}

              {/* Customer Name (context only, not selectable) */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs sm:text-sm font-semibold text-slate-700">اسم العميل</label>
                <div className="relative flex items-center">
                  <User className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={isLoadingProfile ? 'جاري التحميل...' : customerProfile?.fullName ?? ''}
                    readOnly
                    disabled
                    dir="rtl"
                    className="w-full pr-10 pl-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 text-right cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-400">تم اختيار العميل من صفحة التفاصيل السابقة.</p>
              </div>

              {/* Amount + Receipt Number, side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment Amount */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700">
                    مبلغ الدفعة (شيكل إسرائيلي)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute right-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                      ILS
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, amount: undefined }));
                      }}
                      placeholder="0.00"
                      dir="ltr"
                      className={`w-full pr-10 pl-3.5 py-2.5 bg-slate-50/70 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right font-sans ${
                        fieldErrors.amount ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {fieldErrors.amount && (
                    <p className="text-xs text-rose-600">{fieldErrors.amount}</p>
                  )}
                </div>

                {/* Receipt Number (optional) */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700">
                    رقم الإيصال <span className="font-normal text-slate-400">(اختياري)</span>
                  </label>
                  <div className="relative flex items-center">
                    <Hash className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={receiptNumber}
                      onChange={(e) => {
                        setReceiptNumber(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, receiptNumber: undefined }));
                      }}
                      placeholder="REC-10025"
                      dir="rtl"
                      maxLength={50}
                      className={`w-full pr-10 pl-3.5 py-2.5 bg-slate-50/70 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right font-sans ${
                        fieldErrors.receiptNumber ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {fieldErrors.receiptNumber && (
                    <p className="text-xs text-rose-600">{fieldErrors.receiptNumber}</p>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs sm:text-sm font-semibold text-slate-700">طريقة الدفع</label>
                <div className="grid grid-cols-3 gap-3">
                  {PAYMENT_METHOD_OPTIONS.map((option) => {
                    const Icon = PAYMENT_METHOD_ICONS[option.value];
                    const isSelected = method === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setMethod(option.value)}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0c2444] bg-slate-50 text-[#0c2444] shadow-xs'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-[#0c2444]' : 'text-slate-400'}`} />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <Textarea
                  label="ملاحظات إضافية (اختياري)"
                  placeholder="أضف تفاصيل أخرى للدفعة..."
                  value={notes}
                  maxLength={500}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, notes: undefined }));
                  }}
                  rows={3}
                />
                {fieldErrors.notes && (
                  <p className="text-xs text-rose-600 text-right mt-1">{fieldErrors.notes}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 bg-[#007a3d] hover:bg-[#006633] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-70"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      جاري الحفظ...
                    </span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>حفظ الدفعة</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="py-3 px-6 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-60"
                >
                  إلغاء
                </button>
              </div>
            </div>

            {/* LEFT: Payment Proof / Balance / Quick Help */}
            <div className="lg:col-span-4 space-y-4">
              {/* Payment Proof / Receipt Card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-[#0c2444]">إثبات الدفع / الإيصال</h3>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => handleReceiptChange(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 py-6 px-3 text-center transition-colors cursor-pointer"
                >
                  <ImagePlus className="w-6 h-6 text-slate-300" />
                  <span className="text-sm font-semibold text-slate-600">
                    {receiptFile ? receiptFile.name : 'رفع صورة الإيصال'}
                  </span>
                  <span className="text-xs text-slate-400">حتى 5 ميجابايت، PNG, JPG</span>
                </button>
                {fieldErrors.receipt && (
                  <p className="text-xs text-rose-600 text-right">{fieldErrors.receipt}</p>
                )}

                <div className="flex items-start gap-2 bg-slate-50 rounded-lg p-3 text-right">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    رفع الإثبات يساعد في تسوية النزاعات المالية بشكل أسرع ويوثق العملية للطرفين.
                  </p>
                </div>
              </div>

              {/* Customer Balance Summary Card */}
              <div className="bg-[#0c2444] text-white rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold">ملخص رصيد العميل</h3>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200/70 font-medium">إجمالي المديونية:</span>
                  <span className="font-bold" dir="ltr">
                    {isLoadingProfile ? '...' : `${totalDebt.toFixed(2).replace(/\.00$/, '')} ش.إ`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200/70 font-medium">الرصيد بعد الدفع:</span>
                  <span className="font-bold" dir="ltr">
                    {balanceAfterPayment === null
                      ? '---'
                      : `${balanceAfterPayment.toFixed(2).replace(/\.00$/, '')} ش.إ`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-200/70 font-medium">مدى التزام العميل:</span>
                    <span className="font-bold text-emerald-400">{commitmentPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${commitmentPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Help Card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3">
                <h3 className="text-sm font-bold text-[#0c2444]">مساعدة سريعة</h3>

                <div className="flex items-start gap-2">
                  <MessageSquareText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    سيتم إرسال إشعار SMS للعميل فور حفظ الدفعة.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <CalendarCheck2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    تأكد من مطابقة تاريخ التحويل البنكي مع تاريخ الإيصال.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewPaymentScreen;
