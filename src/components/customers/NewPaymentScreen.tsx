import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ShieldCheck,
  Paperclip,
  ImagePlus,
  Info,
  User,
  Banknote,
  Landmark,
  CreditCard,
  Save,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { Textarea } from '../ui/Textarea';
import { CurrencySelector } from '../common/CurrencySelector';
import {
  type CurrencyCode,
  getCurrencyConfig,
  getCurrencyId,
  normalizeCurrencyCode,
  groupTotalsByCurrency,
  formatCurrency,
  getActiveCurrencySummaries,
} from '../../utils/currency';
import {
  getCustomerProfile,
  setStoredTotalPaid,
  toGetCustomerProfileErrorMessage,
} from '../../services/customerService';
import {
  registerPayment,
  parseRegisterPaymentApiError,
  updatePayment,
  parseUpdatePaymentApiError,
  validatePaymentAmount,
  validatePaymentAmountAgainstBalance,
  validatePaymentDate,
  validatePaymentNotes,
  validateReceiptFile,
  PAYMENT_METHOD_TO_NUMERIC,
  type PaymentFieldErrors,
} from '../../services/paymentService';
import { PAYMENT_METHOD_OPTIONS } from '../../types/payment';
import type { PaymentMethod, EditingPaymentState } from '../../types/payment';
import type { CustomerProfileDto } from '../../types/customer';
import { PATHS } from '../../routes/paths';
import { getDeviceLocalDateString } from '../../lib/dateUtils';

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
      setLoadError('معرّف العميل غير موجود في الرابط.');
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
  const navState = location.state as {
    editingPayment?: EditingPaymentState;
    targetDebt?: {
      id: number | string;
      reference?: string;
      amount?: number;
      remainingAmount?: number;
      currencyCode?: string;
      currencyId?: number;
    };
  } | null;
  const editingPayment = navState?.editingPayment ?? null;
  const targetDebt = navState?.targetDebt ?? null;
  const isEditMode = editingPayment !== null;

  // Initial currency: default to target debt's currency if available, or editing payment's currency, or 'ILS'
  const initialCurrency: CurrencyCode = useMemo(() => {
    if (editingPayment?.currencyCode || editingPayment?.currency) {
      return normalizeCurrencyCode(editingPayment.currencyCode || editingPayment.currency);
    }
    if (targetDebt?.currencyCode) {
      return normalizeCurrencyCode(targetDebt.currencyCode);
    }
    if (targetDebt?.currencyId) {
      return normalizeCurrencyCode(targetDebt.currencyId);
    }
    return 'ILS';
  }, [editingPayment, targetDebt]);

  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency);
  const [currencyId, setCurrencyId] = useState<number>(() =>
    targetDebt?.currencyId ? Number(targetDebt.currencyId) : getCurrencyId(initialCurrency)
  );
  const hasUserChangedCurrencyRef = useRef(false);

  // Form state
  const [amount, setAmount] = useState(
    editingPayment ? String(editingPayment.amount) : targetDebt?.remainingAmount ? String(targetDebt.remainingAmount) : ''
  );
  const [method, setMethod] = useState<PaymentMethod>(() =>
    parsePaymentMethod(editingPayment?.method)
  );
  const [paymentDate, setPaymentDate] = useState(() => {
    if (editingPayment?.date) {
      return editingPayment.date.split('T')[0];
    }
    return getDeviceLocalDateString();
  });
  const [notes, setNotes] = useState(editingPayment?.notes ?? '');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const [fieldErrors, setFieldErrors] = useState<PaymentFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorDetails, setSubmitErrorDetails] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
    setSubmitErrorDetails([]);
  }, []);

  const scrollToErrorBanner = useCallback(() => {
    requestAnimationFrame(() => {
      errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  const handleCurrencyChange = useCallback(
    (nextCode: CurrencyCode) => {
      hasUserChangedCurrencyRef.current = true;
      setCurrency(nextCode);
      setCurrencyId(getCurrencyId(nextCode));
      setFieldErrors((prev) => ({ ...prev, currency: undefined, amount: undefined }));
      clearSubmitError();
    },
    [clearSubmitError]
  );

  // Mismatch warning when merchant selects a different currency than target debt
  const isCurrencyMismatched = useMemo(() => {
    if (!targetDebt) return false;
    const debtCurrency = normalizeCurrencyCode(targetDebt.currencyCode || targetDebt.currencyId);
    return debtCurrency !== currency;
  }, [targetDebt, currency]);

  // Re-sync form state whenever the navigation state (editingPayment) changes.
  const editingPaymentId = editingPayment?.paymentId;
  useEffect(() => {
    if (editingPayment) {
      setAmount(String(editingPayment.amount));
      setMethod(parsePaymentMethod(editingPayment.method));
      setNotes(editingPayment.notes ?? '');
    } else {
      setAmount('');
      setMethod('cash');
      setPaymentDate(getDeviceLocalDateString());
      setNotes('');
    }
    setFieldErrors({});
    setSubmitError(null);
    setSubmitErrorDetails([]);
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
      setSubmitError(error);
      setSubmitErrorDetails([]);
      setReceiptFile(null);
      scrollToErrorBanner();
      return;
    }
    setFieldErrors((prev) => ({ ...prev, receipt: undefined }));
    clearSubmitError();
    setReceiptFile(file);
  };

  const totalDebt = customerProfile?.totalDebt ?? 0;
  const totalPaid = customerProfile?.totalPaid ?? 0;
  const currentBalance = customerProfile?.currentBalance ?? totalDebt;

  // Calculate per-currency breakdown from customer transactions
  const currencyGroups = useMemo(() => {
    return groupTotalsByCurrency(customerProfile?.transactions || []);
  }, [customerProfile?.transactions]);

  const activeCurrencies = useMemo(() => {
    return getActiveCurrencySummaries(currencyGroups);
  }, [currencyGroups]);

  // Auto-detect currency if no targetDebt provided and customer has active debt in exactly one currency
  useEffect(() => {
    if (targetDebt || isEditMode || hasUserChangedCurrencyRef.current || !customerProfile?.transactions) {
      return;
    }
    const withDebt = Object.entries(currencyGroups).filter(
      ([_, grp]) => grp.balance > 0
    );
    if (withDebt.length === 1) {
      const soleCurrency = withDebt[0][0] as CurrencyCode;
      setCurrency(soleCurrency);
      setCurrencyId(getCurrencyId(soleCurrency));
    }
  }, [customerProfile?.transactions, targetDebt, isEditMode, currencyGroups]);

  // Open debts for this customer
  const openDebts = useMemo(() => {
    if (!customerProfile?.transactions) return [];
    return customerProfile.transactions.filter(
      (tx) =>
        (tx.type === 'Debt' || tx.type === 'debt') &&
        (tx.status === 'pending' || tx.status === 'overdue' || tx.balance > 0)
    );
  }, [customerProfile?.transactions]);

  // Debts in other currencies (for warnings / switcher)
  const otherCurrencyDebts = useMemo(() => {
    return openDebts.filter(
      (d) => normalizeCurrencyCode(d.currencyCode || d.currencyId) !== currency
    );
  }, [openDebts, currency]);

  // Balance in the currently selected currency
  const selectedCurrencyBalance = useMemo(() => {
    if (customerProfile?.balances && customerProfile.balances.length > 0) {
      const matched = customerProfile.balances.find(
        (b) => normalizeCurrencyCode(b.currencyCode || b.currencyId) === currency
      );
      if (matched) {
        return Math.max(matched.currentBalance ?? 0, 0);
      }
      return 0;
    }
    if (customerProfile?.transactions && customerProfile.transactions.length > 0) {
      const group = currencyGroups[currency];
      if (group && (group.debtCount > 0 || group.paymentCount > 0)) {
        return Math.max(group.balance, 0);
      }
      return 0;
    }
    return Math.max(currentBalance, 0);
  }, [customerProfile, currencyGroups, currency, currentBalance]);

  // Balance after payment
  const parsedAmount = Number(amount);
  const hasValidAmount = amount.trim() !== '' && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const balanceAfterPayment = hasValidAmount
    ? isEditMode && editingPayment
      ? Math.max(selectedCurrencyBalance - (parsedAmount - editingPayment.amount), 0)
      : Math.max(selectedCurrencyBalance - parsedAmount, 0)
    : null;

  // Commitment percentage
  const commitmentDenominator = totalPaid + totalDebt;
  const commitmentPercent =
    commitmentDenominator > 0 ? Math.round((totalPaid / commitmentDenominator) * 100) : 100;

  const handleSave = async () => {
    if (isSaving) return;

    // In Edit Mode, call PUT /api/Payment/{id} with newAmount
    if (isEditMode && editingPayment) {
      const amountError = validatePaymentAmount(amount);
      if (amountError) {
        setFieldErrors({ amount: amountError });
        setSubmitError(amountError);
        setSubmitErrorDetails([]);
        scrollToErrorBanner();
        return;
      }

      clearSubmitError();
      setFieldErrors({});
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
        const parsed = parseUpdatePaymentApiError(error);
        setFieldErrors(parsed.fieldErrors);
        setSubmitError(parsed.generalMessage);
        setSubmitErrorDetails(parsed.details.length > 1 ? parsed.details : []);
        scrollToErrorBanner();
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!id) {
      setSubmitError('معرّف العميل غير موجود. يرجى الرجوع إلى صفحة العميل والمحاولة مجدداً.');
      setSubmitErrorDetails([]);
      scrollToErrorBanner();
      return;
    }

    // Comprehensive client-side validation with explicit reasons
    const nextFieldErrors: PaymentFieldErrors = {};
    const validationMessages: string[] = [];

    const amountFormatError = validatePaymentAmount(amount);
    if (amountFormatError) {
      nextFieldErrors.amount = amountFormatError;
      validationMessages.push(amountFormatError);
    } else if (customerProfile && !isLoadingProfile && !loadError) {
      if (selectedCurrencyBalance <= 0) {
        if (otherCurrencyDebts.length > 0) {
          const msg = `لا توجد ديون مستحقة على العميل بعملة ${getCurrencyConfig(currency).labelArFull}؛ يرجى التحويل إلى العملة التي توجد بها ديون قائمة.`;
          nextFieldErrors.currency = msg;
          nextFieldErrors.amount = `الرصيد المستحق بعملة ${getCurrencyConfig(currency).labelAr} يساوي صفر.`;
          validationMessages.push(msg);
        } else {
          const msg = 'لا توجد أي ديون قائمة مستحقة على هذا العميل لتسجيل دفعة عليها (الرصيد الحالي 0).';
          nextFieldErrors.amount = msg;
          validationMessages.push(msg);
        }
      } else {
        const balanceError = validatePaymentAmountAgainstBalance(
          amount,
          selectedCurrencyBalance,
          currency
        );
        if (balanceError) {
          nextFieldErrors.amount = balanceError;
          validationMessages.push(balanceError);
        }
      }
    }

    const dateError = validatePaymentDate(paymentDate);
    if (dateError) {
      nextFieldErrors.paymentDate = dateError;
      validationMessages.push(dateError);
    }

    const notesError = validatePaymentNotes(notes);
    if (notesError) {
      nextFieldErrors.notes = notesError;
      validationMessages.push(notesError);
    }

    if (receiptFile) {
      const fileError = validateReceiptFile(receiptFile);
      if (fileError) {
        nextFieldErrors.receipt = fileError;
        validationMessages.push(fileError);
      }
    }

    setFieldErrors(nextFieldErrors);

    if (validationMessages.length > 0) {
      setSubmitError(validationMessages[0]);
      setSubmitErrorDetails(validationMessages.length > 1 ? validationMessages : []);
      scrollToErrorBanner();
      return;
    }

    clearSubmitError();
    setIsSaving(true);
    try {
      const res = await registerPayment(id, {
        amount,
        method,
        currencyId: currencyId || getCurrencyId(currency),
        currencyCode: currency,
        currency: currency,
        debtId: '',
        paymentDate: paymentDate || undefined,
        notes: notes.trim(),
        receiptFile,
      });

      // Update stored totalPaid immediately so details screen reflects it
      const numericAmount = Number(amount) || 0;
      const returnedPaid = Number(res?.totalPaid);
      const prevTotalPaid = Number(customerProfile?.totalPaid) || 0;
      const newTotalPaid = returnedPaid > 0 ? returnedPaid : (prevTotalPaid + numericAmount);
      setStoredTotalPaid(id, newTotalPaid);
      window.dispatchEvent(new Event('watheq:activity-updated'));

      navigate(`/customers/${id}`, { state: { toast: 'تم حفظ الدفعة بنجاح.' } });
    } catch (error) {
      const parsed = parseRegisterPaymentApiError(error);
      setFieldErrors((prev) => ({ ...prev, ...parsed.fieldErrors }));
      setSubmitError(parsed.generalMessage);
      setSubmitErrorDetails(parsed.details.length > 1 ? parsed.details : []);
      scrollToErrorBanner();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(id ? `/customers/${id}` : '/customers');
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-cairo antialiased flex" dir="rtl">
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
              className="hover:text-[#0c2444] dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              الرئيسية
            </button>
            <ChevronLeft className="w-3.5 h-3.5" />
            <button
              type="button"
              onClick={() => navigate(id ? `/customers/${id}` : '/customers')}
              className="hover:text-[#0c2444] dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              سجل المدفوعات
            </button>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-slate-600 dark:text-slate-400">
              {isEditMode ? 'تعديل الدفعة' : 'تسجيل دفعة جديدة'}
            </span>
          </nav>

          {/* Page Header + Security Badge */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-cairo text-[#0c2444] dark:text-blue-400 tracking-tight">
                {isEditMode ? 'تعديل الدفعة' : 'تسجيل دفعة جديدة'}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                {isEditMode
                  ? 'قم بتعديل قيمة الدفعة للعميل لتحديث رصيده المالي فوراً.'
                  : 'قم بتسجيل المبالغ المستلمة من العميل لتحديث رصيده المالي فوراً.'}
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold self-start shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>نظام دفع آمن ومشفر</span>
            </div>
          </div>

          {/* Profile Load Status */}
          {loadError && (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-sm px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>تعذر تحميل بيانات العميل: {loadError}</span>
              </div>
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
            <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs p-6 sm:p-8 space-y-5">
              {/* Structured Explicit Error Alert Banner */}
              {submitError && (
                <div
                  ref={errorBannerRef}
                  role="alert"
                  className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200 p-4 text-right animate-fade-in"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-sm">
                        <p className="font-bold font-cairo text-rose-900 dark:text-rose-200">
                          {isEditMode ? 'تعذر تعديل الدفعة:' : 'تعذر تسجيل الدفعة:'}
                        </p>
                        {submitErrorDetails.length > 1 ? (
                          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm font-medium text-rose-700 dark:text-rose-300">
                            {submitErrorDetails.map((detail, index) => (
                              <li key={index}>{detail}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs sm:text-sm font-medium text-rose-700 dark:text-rose-300 leading-relaxed">
                            {submitError}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={clearSubmitError}
                      className="text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                      aria-label="إغلاق رسالة الخطأ"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {isEditMode && (
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-200 text-xs px-4 py-2.5 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>
                    يتم تعديل قيمة الدفعة الحالية، وسيقوم النظام تلقائياً بإعادة احتساب وتوزيع المبلغ على ديون العميل.
                  </span>
                </div>
              )}

              {/* Zero Balance Proactive Alert */}
              {!isEditMode &&
                !targetDebt &&
                !isLoadingProfile &&
                customerProfile &&
                !loadError &&
                selectedCurrencyBalance === 0 &&
                otherCurrencyDebts.length === 0 && (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-300 text-xs p-3.5 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold">تنبيه رصيد العميل:</span>{' '}
                      الرصيد المستحق على العميل بعملة ({getCurrencyConfig(currency).labelArFull}) يساوي{' '}
                      <span className="font-bold">0</span> حالياً. لا توجد ديون قائمة لتسجيل دفعة جديدة عليها.
                    </div>
                  </div>
                )}

              {/* Customer Name (context only, not selectable) */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">اسم العميل</label>
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
                    className="w-full pr-10 pl-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 text-right cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-400">تم اختيار العميل من صفحة التفاصيل السابقة.</p>
              </div>

              {/* Currency Selector */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                  عملة التحصيل
                </label>
                <CurrencySelector
                  value={currency}
                  currencyId={currencyId}
                  onChange={handleCurrencyChange}
                  onChangeId={setCurrencyId}
                  disabled={isEditMode}
                />
                {fieldErrors.currency && (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.currency}</span>
                  </p>
                )}
                {isEditMode && (
                  <p className="text-xs text-slate-400">لا يمكن تغيير عملة الدفعة أثناء التعديل.</p>
                )}
                {isCurrencyMismatched && targetDebt && (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs p-3 flex items-start gap-2.5 mt-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-bold">تنبيه اختلاف العملة:</span> أنت تسجل دفعة بعملة (
                      {getCurrencyConfig(currency).labelAr}) بينما الدين المحدد رقم {targetDebt.reference || targetDebt.id} مسجل بعملة (
                      {getCurrencyConfig(targetDebt.currencyCode).labelAr}). تأكد من رغبتك بالتحصيل بهذه العملة.
                    </div>
                  </div>
                )}
                {!targetDebt && customerProfile && selectedCurrencyBalance === 0 && otherCurrencyDebts.length > 0 && (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mt-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <span className="font-bold">تنبيه:</span> لا توجد ديون مستحقة على العميل بعملة ({getCurrencyConfig(currency).labelArFull}).
                        ديون العميل الحالية مسجلة بعملة أخرى:
                        <span className="font-bold mr-1">
                          {Array.from(new Set(otherCurrencyDebts.map((d) => normalizeCurrencyCode(d.currencyCode || d.currencyId))))
                            .map((c) => `${getCurrencyConfig(c).labelArFull} (${formatCurrency(currencyGroups[c]?.balance || 0, c)})`)
                            .join('، ')}
                        </span>
                      </div>
                    </div>
                    {otherCurrencyDebts[0] && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCurrencyChange(
                            normalizeCurrencyCode(
                              otherCurrencyDebts[0].currencyCode || otherCurrencyDebts[0].currencyId
                            )
                          )
                        }
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 text-amber-900 dark:text-amber-100 whitespace-nowrap transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
                      >
                        التحويل إلى {getCurrencyConfig(otherCurrencyDebts[0].currencyCode || otherCurrencyDebts[0].currencyId).labelArFull}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Amount + Payment Date, side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment Amount */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    مبلغ الدفعة ({getCurrencyConfig(currency).labelArFull})
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, amount: undefined }));
                        clearSubmitError();
                      }}
                      placeholder="0.00"
                      dir="ltr"
                      className={`w-full pr-3.5 pl-10 py-2.5 bg-slate-50/70 dark:bg-slate-800/70 border rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-left font-sans ${
                        fieldErrors.amount
                          ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    <span className="absolute left-3 text-sm font-bold text-slate-400 font-sans pointer-events-none">
                      {getCurrencyConfig(currency).symbol}
                    </span>
                  </div>
                  {fieldErrors.amount && (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-start gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{fieldErrors.amount}</span>
                    </p>
                  )}
                </div>

                {/* Payment Date */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    تاريخ الدفع
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={paymentDate}
                      disabled={isEditMode}
                      onChange={(e) => {
                        setPaymentDate(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, paymentDate: undefined }));
                        clearSubmitError();
                      }}
                      onClick={(e) => !isEditMode && e.currentTarget.showPicker?.()}
                      dir="ltr"
                      placeholder="mm/dd/yyyy"
                      className={`w-full px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-800/70 border rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-left font-sans ${
                        isEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      } ${
                        fieldErrors.paymentDate
                          ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </div>
                  {fieldErrors.paymentDate && (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-start gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{fieldErrors.paymentDate}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">طريقة الدفع</label>
                <div className="grid grid-cols-3 gap-3">
                  {PAYMENT_METHOD_OPTIONS.map((option) => {
                    const Icon = PAYMENT_METHOD_ICONS[option.value];
                    const isSelected = method === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          setMethod(option.value);
                          setFieldErrors((prev) => ({ ...prev, method: undefined }));
                          clearSubmitError();
                        }}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${
                          isSelected
                            ? 'border-[#0c2444] dark:border-blue-400 bg-slate-50 dark:bg-slate-800/50 text-[#0c2444] dark:text-blue-400 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-[#0c2444] dark:text-blue-400' : 'text-slate-400'}`} />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.method && (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-start gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{fieldErrors.method}</span>
                  </p>
                )}
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
                    clearSubmitError();
                  }}
                  rows={3}
                  className={isEditMode ? 'opacity-60 cursor-not-allowed' : ''}
                />
                <div className="flex items-center justify-between mt-1">
                  {fieldErrors.notes ? (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-start gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{fieldErrors.notes}</span>
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[11px] text-slate-400 tabular-nums" dir="ltr">
                    {notes.length} / 500
                  </span>
                </div>
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
                  className="py-3 px-6 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-60"
                >
                  إلغاء
                </button>
              </div>
            </div>

            {/* LEFT: Payment Proof / Balance / Quick Help */}
            <div className="lg:col-span-4 space-y-4">
              {/* Payment Proof / Receipt Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-bold text-[#0c2444] dark:text-blue-400">إثبات الدفع / الإيصال</h3>
                  </div>

                  {receiptFile && !isEditMode && (
                    <button
                      type="button"
                      onClick={() => {
                        handleReceiptChange(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>إزالة</span>
                    </button>
                  )}
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
                      ? 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 cursor-not-allowed opacity-60'
                      : fieldErrors.receipt
                        ? 'border-rose-400 dark:border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 cursor-pointer'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 cursor-pointer'
                  }`}
                >
                  <ImagePlus className="w-6 h-6 text-slate-300" />
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 truncate max-w-full px-2">
                    {isEditMode ? 'إثبات الدفع (غير متاح في التعديل)' : receiptFile ? receiptFile.name : 'رفع صورة الإيصال'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {isEditMode ? 'تعديل الدفعة يقتصر على تعديل القيمة فقط' : 'حتى 5 ميجابايت، PNG, JPG'}
                  </span>
                </button>
                {fieldErrors.receipt && (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-start gap-1 text-right">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{fieldErrors.receipt}</span>
                  </p>
                )}

                <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-right">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    رفع الإثبات يساعد في تسوية النزاعات المالية بشكل أسرع ويوثق العملية للطرفين.
                  </p>
                </div>
              </div>

              {/* Customer Balance Summary Card */}
              <div className="bg-[#0c2444] text-white rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold font-cairo">ملخص رصيد العميل</h3>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200/70 font-medium">المديونية ({getCurrencyConfig(currency).labelAr}):</span>
                  <span className="font-bold font-mono" dir="ltr">
                    {isLoadingProfile ? '...' : formatCurrency(selectedCurrencyBalance, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200/70 font-medium">الرصيد بعد الدفع:</span>
                  <span className="font-bold font-mono" dir="ltr">
                    {balanceAfterPayment === null
                      ? '---'
                      : formatCurrency(balanceAfterPayment, currency)}
                  </span>
                </div>

                {/* Multi-Currency breakdown if other currencies exist */}
                {activeCurrencies.length > 1 && (
                  <div className="pt-3 border-t border-white/10 space-y-1.5">
                    <span className="text-[11px] text-blue-200/60 block font-medium">أرصدة العملات الأخرى:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeCurrencies
                        .filter((s) => s.currency.code !== currency)
                        .map((s) => (
                          <span
                            key={s.currency.code}
                            className="px-2 py-0.5 rounded-md text-[11px] bg-white/10 text-white font-mono"
                          >
                            {formatCurrency(s.balance, s.currency.code)}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-5 space-y-3">
                <h3 className="text-sm font-bold text-[#0c2444] dark:text-blue-400">مساعدة سريعة</h3>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    سيتم إرسال إشعار للعميل فور حفظ الدفعة.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
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
