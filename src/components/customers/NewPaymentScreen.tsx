import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ShieldCheck,
  Paperclip,
  ImagePlus,
  Info,
  User,
  Calendar,
  Banknote,
  Landmark,
  CreditCard,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { Textarea } from '../ui/Textarea';
import {
  getCustomerProfile,
  toGetCustomerProfileErrorMessage,
} from '../../services/customerService';
import {
  registerPayment,
  toRegisterPaymentErrorMessage,
  updatePayment,
  toUpdatePaymentErrorMessage,
  validatePaymentAmount,
  validatePaymentAmountAgainstBalance,
  validatePaymentNotes,
  validateReceiptFile,
  PAYMENT_METHOD_TO_NUMERIC,
} from '../../services/paymentService';
import { PAYMENT_METHOD_OPTIONS } from '../../types/payment';
import type { PaymentMethod, EditingPaymentState } from '../../types/payment';
import type { CustomerProfileDto } from '../../types/customer';
import { PATHS } from '../../routes/paths';

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, typeof Banknote> = {
  cash: Banknote,
  bank_transfer: Landmark,
  credit_card: CreditCard,
};

function parsePaymentMethod(value: string | null | undefined): PaymentMethod {
  if (!value) return 'cash';
  const v = value.trim().toLowerCase().replace(/[\s_-]/g, '');
  if (
    v.includes('credit') ||
    v.includes('card') ||
    v.includes('محفظة') ||
    v.includes('بطاقة') ||
    v === '3'
  ) {
    return 'credit_card';
  }
  if (
    v.includes('transfer') ||
    v.includes('bank') ||
    v.includes('تحويل') ||
    v.includes('بنك') ||
    v === '2'
  ) {
    return 'bank_transfer';
  }
  return 'cash';
}

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

  const location = useLocation();
  const navState = location.state as { editingPayment?: EditingPaymentState } | null;
  const editingPayment = navState?.editingPayment ?? null;
  const isEditMode = editingPayment !== null;

  // Form state
  const [amount, setAmount] = useState(
    editingPayment ? String(editingPayment.amount) : ''
  );
  const [method, setMethod] = useState<PaymentMethod>(() =>
    parsePaymentMethod(editingPayment?.method)
  );
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState(editingPayment?.notes ?? '');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fieldErrors, setFieldErrors] = useState<{
    amount?: string;
    paymentDate?: string;
    notes?: string;
    receipt?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Re-sync form state whenever the navigation state (editingPayment) changes.
  // useState initialises only once, but if the user navigates between payments
  // without the component unmounting, the state stays stale.
  const editingPaymentId = editingPayment?.paymentId;
  useEffect(() => {
    if (editingPayment) {
      setAmount(String(editingPayment.amount));
      setMethod(parsePaymentMethod(editingPayment.method));
      setNotes(editingPayment.notes ?? '');
    } else {
      setAmount('');
      setMethod('cash');
      setNotes('');
    }
    setFieldErrors({});
    setSubmitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPaymentId]);

  const handleReceiptChange = (file: File | null) => {
    if (isEditMode) return;
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
  const balanceAfterPayment = hasValidAmount
    ? isEditMode && editingPayment
      ? Math.max(currentBalance - (parsedAmount - editingPayment.amount), 0)
      : Math.max(currentBalance - parsedAmount, 0)
    : null;

  // "مدى التزام العميل" has no dedicated field anywhere in the API — the
  // closest real signal already available is how much of the customer's
  // total activity (paid + owed) has actually been paid, so it's derived
  // from the real totalPaid/totalDebt figures rather than a fixed number.
  const commitmentDenominator = totalPaid + totalDebt;
  const commitmentPercent =
    commitmentDenominator > 0 ? Math.round((totalPaid / commitmentDenominator) * 100) : 100;

  const handleSave = async () => {
    if (isSaving) return;

    // In Edit Mode, call PUT /api/Payment/{id} with newAmount
    if (isEditMode && editingPayment) {
      const amountError = validatePaymentAmount(amount);
      if (amountError) {
        setFieldErrors((prev) => ({ ...prev, amount: amountError }));
        return;
      }

      setSubmitError(null);
      setIsSaving(true);
      try {
        await updatePayment(
          editingPayment.paymentId,
          Number(amount.trim()),
          PAYMENT_METHOD_TO_NUMERIC[method]
        );
        navigate(id ? `/customers/${id}` : '/customers', {
          state: { toast: 'تم تعديل الدفعة بنجاح.' },
        });
      } catch (error) {
        setSubmitError(toUpdatePaymentErrorMessage(error));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const errors: typeof fieldErrors = {
      amount:
        validatePaymentAmount(amount) ??
        (customerProfile
          ? validatePaymentAmountAgainstBalance(amount, currentBalance) ?? undefined
          : undefined),
      notes: validatePaymentNotes(notes) ?? undefined,
    };
    setFieldErrors((prev) => ({ ...prev, ...errors }));
    if (errors.amount || errors.notes || !id) {
      if (!id) setSubmitError('معرّف العميل غير موجود.');
      return;
    }

    setSubmitError(null);
    setIsSaving(true);
    try {
      await registerPayment(id, {
        amount,
        method,
        paymentDate: paymentDate || undefined,
        notes: notes.trim(),
        receiptFile,
      });
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
            <span className="text-slate-600">
              {isEditMode ? 'تعديل الدفعة' : 'تسجيل دفعة جديدة'}
            </span>
          </nav>

          {/* Page Header + Security Badge */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-tajawal text-[#0c2444] tracking-tight">
                {isEditMode ? 'تعديل الدفعة' : 'تسجيل دفعة جديدة'}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                {isEditMode
                  ? 'قم بتعديل قيمة الدفعة للعميل لتحديث رصيده المالي فوراً.'
                  : 'قم بتسجيل المبالغ المستلمة من العميل لتحديث رصيده المالي فوراً.'}
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

              {isEditMode && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs px-4 py-2.5 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-blue-600" />
                  <span>
                    يتم تعديل قيمة الدفعة الحالية، وسيقوم النظام تلقائياً بإعادة احتساب وتوزيع المبلغ على ديون العميل في قاعدة البيانات.
                  </span>
                </div>
              )}

              {/* Customer Name (context only, not selectable) */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs sm:text-sm font-semibold text-slate-700">اسم العميل</label>
                <div className="relative flex items-center">
                  <User className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={
                      isLoadingProfile
                        ? editingPayment?.customerFullName || 'جاري التحميل...'
                        : customerProfile?.fullName || editingPayment?.customerFullName || ''
                    }
                    readOnly
                    disabled
                    dir="rtl"
                    className="w-full pr-10 pl-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 text-right cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-400">تم اختيار العميل من صفحة التفاصيل السابقة.</p>
              </div>

              {/* Amount + Payment Date, side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment Amount */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700">
                    مبلغ الدفعة (ريال سعودي)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                      SR
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
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right font-sans ${
                        fieldErrors.amount ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {fieldErrors.amount && (
                    <p className="text-xs text-rose-600">{fieldErrors.amount}</p>
                  )}
                </div>

                {/* Payment Date */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700">
                    تاريخ الدفع
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <input
                      type="date"
                      value={paymentDate}
                      disabled={isEditMode}
                      onChange={(e) => {
                        setPaymentDate(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, paymentDate: undefined }));
                      }}
                      onClick={(e) => !isEditMode && e.currentTarget.showPicker?.()}
                      dir="ltr"
                      placeholder="mm/dd/yyyy"
                      className={`w-full pr-10 pl-3.5 py-2.5 bg-slate-50/70 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-left font-sans ${
                        isEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      } ${fieldErrors.paymentDate ? 'border-rose-400' : 'border-slate-200'}`}
                    />
                  </div>
                  {fieldErrors.paymentDate && (
                    <p className="text-xs text-rose-600">{fieldErrors.paymentDate}</p>
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
                        disabled={isSaving}
                        onClick={() => setMethod(option.value)}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${
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
                  placeholder="أضف تفاصيل أخرى عن الدفعة..."
                  value={notes}
                  disabled={isEditMode}
                  maxLength={500}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, notes: undefined }));
                  }}
                  rows={3}
                  className={isEditMode ? 'opacity-60 cursor-not-allowed' : ''}
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
                      {isEditMode ? 'جاري تعديل الدفعة...' : 'جاري الحفظ...'}
                    </span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isEditMode ? 'تعديل الدفعة' : 'حفظ الدفعة'}</span>
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
                  disabled={isEditMode}
                  onClick={() => !isEditMode && fileInputRef.current?.click()}
                  className={`w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 px-3 text-center transition-colors ${
                    isEditMode
                      ? 'border-slate-200 bg-slate-50/50 cursor-not-allowed opacity-60'
                      : 'border-slate-200 hover:border-slate-300 cursor-pointer'
                  }`}
                >
                  <ImagePlus className="w-6 h-6 text-slate-300" />
                  <span className="text-sm font-semibold text-slate-600">
                    {isEditMode ? 'إثبات الدفع (غير متاح في التعديل)' : receiptFile ? receiptFile.name : 'رفع صورة الإيصال'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {isEditMode ? 'تعديل الدفعة يقتصر على تعديل القيمة فقط' : 'حتى 5 ميجابايت، PNG, JPG'}
                  </span>
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
                    {isLoadingProfile ? '...' : `${totalDebt.toFixed(2).replace(/\.00$/, '')} SR`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200/70 font-medium">الرصيد بعد الدفع:</span>
                  <span className="font-bold" dir="ltr">
                    {balanceAfterPayment === null
                      ? '---'
                      : `${balanceAfterPayment.toFixed(2).replace(/\.00$/, '')} SR`}
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
                  <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    سيتم إرسال إشعار SMS للعميل فور حفظ الدفعة.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
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
