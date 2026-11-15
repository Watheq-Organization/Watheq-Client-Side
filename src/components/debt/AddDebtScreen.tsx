import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC, FormEvent } from 'react';
import { parseVoiceDebt } from '../../lib/voiceDebtParser';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  UserSearch,
  Save,
  Mic,
  Lock,
  Check,
  Loader2,
  AlertCircle,
  ChevronLeft,
  User,
  X,
  Calendar,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { Textarea } from '../ui/Textarea';
import {
  type CurrencyCode,
  getCurrencyConfig,
  getCurrencyId,
  normalizeCurrencyCode,
} from '../../utils/currency';
import { getCurrencies, type CurrencyDto, DEFAULT_CURRENCIES } from '../../services/currencyService';
import type { CustomerDto } from '../../types/customer';
import {
  searchCustomersByIdOrPhone,
  validateSelectedCustomer,
  validateDebtAmount,
  validateDebtDueDate,
  validateDebtNotes,
  createDebt,
  toCreateDebtErrorMessage,
  updateDebt,
  toUpdateDebtErrorMessage,
  validateUpdateNotesForStatus,
  rememberEditableDebt,
  type EditableDebtRecord,
} from '../../services/debtService';
import { PATHS } from '../../routes/paths';

// Minimal ambient shape for the browser's native SpeechRecognition API
interface MinimalSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => MinimalSpeechRecognition) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => MinimalSpeechRecognition;
    webkitSpeechRecognition?: new () => MinimalSpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface AddDebtNavigationState {
  presetCustomer?: CustomerDto;
  editingDebt?: EditableDebtRecord & { customerFullName: string; phoneNumber: string };
}

export const AddDebtScreen: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as AddDebtNavigationState | null;
  const presetCustomer = navState?.presetCustomer ?? null;
  const editingDebt = navState?.editingDebt ?? null;
  const isEditMode = editingDebt !== null;

  const editingCustomerAsDto: CustomerDto | null = editingDebt
    ? {
      id: editingDebt.customerId,
      fullName: editingDebt.customerFullName,
      phoneNumber: editingDebt.phoneNumber,
      address: '',
      totalDebt: 0,
      totalPaid: 0,
      createdAt: '',
    }
    : null;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

  const [customerQuery, setCustomerQuery] = useState(
    editingCustomerAsDto?.fullName ?? presetCustomer?.fullName ?? ''
  );
  const [customerResults, setCustomerResults] = useState<CustomerDto[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | null>(
    editingCustomerAsDto ?? presetCustomer
  );
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{
    customer?: string;
    amount?: string;
    dueDate?: string;
    notes?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCustomerQueryChange = useCallback((value: string) => {
    setCustomerQuery(value);
    setSelectedCustomer(null);
    if (!value.trim()) {
      setCustomerResults([]);
    }
    setFieldErrors((prev) => ({ ...prev, customer: undefined }));
  }, []);

  const handleSelectCustomer = useCallback((customer: CustomerDto) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.fullName);
    setCustomerResults([]);
    setFieldErrors((prev) => ({ ...prev, customer: undefined }));
  }, []);

  const handleClearSelectedCustomer = useCallback(() => {
    if (isEditMode) return;
    setSelectedCustomer(null);
    setCustomerQuery('');
    setCustomerResults([]);
  }, [isEditMode]);

  useEffect(() => {
    if (selectedCustomer || !customerQuery.trim()) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      setIsSearchingCustomers(true);
      searchCustomersByIdOrPhone(customerQuery)
        .then(setCustomerResults)
        .catch(() => setCustomerResults([]))
        .finally(() => setIsSearchingCustomers(false));
    }, 300);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [customerQuery, selectedCustomer]);

  // Currencies from GET /api/Currency/getCurrencies
  const [currencies, setCurrencies] = useState<CurrencyDto[]>(DEFAULT_CURRENCIES);
  const [currencyId, setCurrencyId] = useState<number>(() => {
    if (editingDebt?.currencyId) return editingDebt.currencyId;
    if (editingDebt?.currencyCode) return getCurrencyId(editingDebt.currencyCode);
    return getCurrencyId('ILS');
  });

  useEffect(() => {
    getCurrencies().then((list) => {
      if (list && list.length > 0) {
        setCurrencies(list);
      }
    });
  }, []);

  const activeCurrencyDto = currencies.find((c) => c.id === currencyId) || currencies[0] || DEFAULT_CURRENCIES[0];
  const activeCurrencyCode: CurrencyCode = normalizeCurrencyCode(activeCurrencyDto.code);
  const activeCurrencyConfig = getCurrencyConfig(activeCurrencyCode);

  const [amount, setAmount] = useState(editingDebt ? String(editingDebt.amount) : '');
  const [dueDate, setDueDate] = useState(editingDebt?.dueDate ?? '');
  const [notes, setNotes] = useState(editingDebt?.notes ?? '');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Voice input
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);

  const handleVoiceInputClick = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const RecognitionCtor = getSpeechRecognitionCtor();
    if (!RecognitionCtor) {
      showToast('الإدخال الصوتي غير مدعوم على هذا المتصفح حالياً.');
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = 'ar-SA';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      if (!transcript) return;

      const parsed = parseVoiceDebt(transcript);

      if (parsed.customerName && !selectedCustomer) {
        handleCustomerQueryChange(parsed.customerName);
      }
      if (parsed.amount !== null) {
        setAmount(String(parsed.amount));
        setFieldErrors((prev) => ({ ...prev, amount: undefined }));
      }
      if (parsed.dueDate) {
        setDueDate(parsed.dueDate);
        setFieldErrors((prev) => ({ ...prev, dueDate: undefined }));
      }
      if (parsed.notes) {
        setNotes(parsed.notes);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [isListening, selectedCustomer, handleCustomerQueryChange]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;

    const customerId = selectedCustomer?.id ?? '';
    const notesLengthError = validateDebtNotes(notes);
    const notesError =
      notesLengthError ?? (isEditMode ? validateUpdateNotesForStatus(editingDebt?.status, notes) : null);
    const errors: typeof fieldErrors = {
      customer: validateSelectedCustomer(customerId) ?? undefined,
      amount: validateDebtAmount(amount) ?? undefined,
      dueDate: validateDebtDueDate(dueDate) ?? undefined,
      notes: notesError ?? undefined,
    };
    setFieldErrors(errors);
    if (errors.customer || errors.amount || errors.dueDate || errors.notes) {
      return;
    }

    setSubmitError(null);
    setIsSaving(true);
    try {
      if (isEditMode && editingDebt) {
        const dto = await updateDebt(editingDebt.id, {
          customerId,
          amount,
          dueDate,
          notes,
          currencyId,
        });
        rememberEditableDebt(customerId, {
          customerId,
          amount,
          dueDate,
          notes,
          currencyId,
        }, dto);
        window.dispatchEvent(new Event('watheq:activity-updated'));
        navigate(`/customers/${customerId}`, {
          state: { toast: 'تم تحديث الدين بنجاح.' },
        });
      } else {
        const dto = await createDebt({
          customerId,
          amount,
          dueDate,
          notes,
          currencyId,
        });
        rememberEditableDebt(customerId, {
          customerId,
          amount,
          dueDate,
          notes,
          currencyId,
        }, dto);

        const toastMsg = 'تم تسجيل الدين بنجاح.';
        window.dispatchEvent(new Event('watheq:activity-updated'));
        navigate(`/customers/${customerId}`, {
          state: { toast: toastMsg },
        });
      }
    } catch (error) {
      setSubmitError(isEditMode ? toUpdateDebtErrorMessage(error) : toCreateDebtErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-cairo antialiased flex" dir="rtl">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="add-debt"
      />

      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          searchQuery={headerSearchQuery}
          onSearchChange={setHeaderSearchQuery}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-50 bg-[#09152B] dark:bg-slate-800 text-white px-5 py-3 rounded-xl shadow-xl border border-slate-700/50 flex items-center gap-3 animate-fade-in text-sm font-semibold">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-2xl w-full mx-auto space-y-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400" aria-label="مسار التنقل">
            <button
              type="button"
              onClick={() => navigate(PATHS.DASHBOARD)}
              className="hover:text-[#09152B] dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              الرئيسية
            </button>
            <ChevronLeft className="w-3.5 h-3.5" />
            <button
              type="button"
              onClick={() => navigate(selectedCustomer?.id ? `/customers/${selectedCustomer.id}` : PATHS.CUSTOMERS)}
              className="hover:text-[#09152B] dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              العملاء
            </button>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-slate-600 dark:text-slate-400">
              {isEditMode ? 'تعديل الدين' : 'إضافة دين جديد'}
            </span>
          </nav>

          {/* Page Header */}
          <div className="text-center sm:text-right">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-cairo text-[#09152B] dark:text-white tracking-tight">
              {isEditMode ? 'تعديل الدين' : 'إضافة دين جديد'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isEditMode
                ? 'قم بتعديل تفاصيل هذا الدين وحفظ التغييرات في سجل العميل المالي.'
                : 'قم بإدخال تفاصيل الدين لتسجيلها في ذمة العميل المحددة وفق المعايير المالية.'}
            </p>
          </div>

          {/* Main Form Card */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 sm:p-8 space-y-6">
            {/* Explicit Submission Error Alert */}
            {submitError && (
              <div
                role="alert"
                className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200 p-4 text-right flex items-start gap-3 animate-fade-in"
              >
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-bold font-cairo">
                    {isEditMode ? 'تعذر تعديل الدين:' : 'تعذر تسجيل الدين:'}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-rose-700 dark:text-rose-300 leading-relaxed">
                    {submitError}
                  </p>
                </div>
              </div>
            )}

            {/* Voice Input Section */}
            <div className="space-y-2">
              <style>{`
                @keyframes watheqWavePulse {
                  0% { transform: scaleY(0.3); opacity: 0.6; }
                  50% { transform: scaleY(1.15); opacity: 1; }
                  100% { transform: scaleY(0.4); opacity: 0.7; }
                }
              `}</style>
              <button
                type="button"
                onClick={handleVoiceInputClick}
                aria-pressed={isListening}
                aria-label={isListening ? 'إيقاف الاستماع الصوتي' : 'بدء الإدخال الصوتي السريع'}
                className={`w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-all text-right cursor-pointer select-none overflow-hidden ${
                  isListening
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isListening ? (
                  <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-white bg-blue-600 shadow-xs">
                        <Mic className="w-4 h-4 animate-pulse" />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block" />
                          جاري الاستماع...
                        </p>
                        <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 font-medium">
                          تحدث الآن (انقر للإيقاف)
                        </p>
                      </div>
                    </div>

                    {/* Precision Sound Waveform */}
                    <div className="flex items-center gap-[3px] h-8 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800 shrink-0">
                      {[
                        { h: 12, dur: '0.65s', del: '0.1s' },
                        { h: 20, dur: '0.5s', del: '0.25s' },
                        { h: 16, dur: '0.75s', del: '0.0s' },
                        { h: 26, dur: '0.6s', del: '0.35s' },
                        { h: 28, dur: '0.45s', del: '0.15s' },
                        { h: 22, dur: '0.7s', del: '0.3s' },
                        { h: 26, dur: '0.55s', del: '0.05s' },
                        { h: 28, dur: '0.65s', del: '0.2s' },
                        { h: 20, dur: '0.8s', del: '0.1s' },
                        { h: 16, dur: '0.5s', del: '0.4s' },
                      ].map((bar, i) => (
                        <span
                          key={i}
                          className="w-[3px] rounded-full bg-blue-600 dark:bg-blue-400"
                          style={{
                            height: `${bar.h}px`,
                            animation: `watheqWavePulse ${bar.dur} ease-in-out infinite alternate`,
                            animationDelay: bar.del,
                            transformOrigin: 'center',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-white bg-[#09152B] dark:bg-slate-700">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#09152B] dark:text-white">
                          إدخال صوتي سريع
                        </p>
                        <p className="text-xs text-slate-400">
                          انقر للتحدث وإملاء بيانات الدين تلقائياً
                        </p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full shrink-0 bg-slate-300 dark:bg-slate-600" />
                  </>
                )}
              </button>

              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 text-right leading-relaxed px-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">صيغة مقترحة:</span> «سجل دين على [اسم العميل] بقيمة [المبلغ] يستحق بتاريخ [التاريخ] والملاحظات [الملاحظات]»
              </p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* Semantic Form Container */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Customer Search Section */}
              <div className="space-y-1.5 text-right relative">
                <label
                  htmlFor="customer-search-input"
                  className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                  العميل المستهدف <span className="text-rose-500">*</span>
                </label>

                {selectedCustomer ? (
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {selectedCustomer.fullName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-jakarta tabular-nums font-medium" dir="ltr">
                          {selectedCustomer.phoneNumber || 'لا يوجد هاتف'}
                        </p>
                      </div>
                    </div>

                    {!isEditMode && (
                      <button
                        type="button"
                        onClick={handleClearSelectedCustomer}
                        className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer p-1"
                        aria-label="تغيير العميل المختار"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>تغيير</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative flex items-center">
                    <UserSearch className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    {isSearchingCustomers && (
                      <Loader2 className="absolute left-3.5 w-4 h-4 text-slate-400 animate-spin pointer-events-none" />
                    )}
                    <input
                      id="customer-search-input"
                      name="customerQuery"
                      type="text"
                      value={customerQuery}
                      onChange={(e) => handleCustomerQueryChange(e.target.value)}
                      placeholder="ابحث بالاسم، رقم الهوية أو رقم الجوال..."
                      dir="rtl"
                      disabled={isEditMode}
                      aria-invalid={Boolean(fieldErrors.customer)}
                      aria-describedby={fieldErrors.customer ? 'customer-error' : undefined}
                      className={`w-full pr-10 pl-9 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#09152B]/15 dark:focus:ring-blue-500/20 focus:border-[#09152B] dark:focus:border-blue-500 transition-all text-right disabled:cursor-not-allowed disabled:opacity-70 ${
                        fieldErrors.customer ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </div>
                )}

                {isEditMode && (
                  <p className="text-xs text-slate-400">
                    لا يمكن تغيير العميل عند تعديل دين قائم.
                  </p>
                )}

                {/* Search Results Dropdown */}
                {!selectedCustomer && customerQuery.trim() && customerResults.length > 0 && (
                  <div className="absolute z-20 top-full mt-1.5 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {customerResults.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm text-right hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer border-b last:border-b-0 border-slate-100 dark:border-slate-700/50"
                      >
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                          {customer.fullName}
                        </div>
                        <div className="text-xs text-slate-400 font-jakarta tabular-nums" dir="ltr">
                          {customer.phoneNumber}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!selectedCustomer &&
                  !isSearchingCustomers &&
                  customerQuery.trim() &&
                  customerResults.length === 0 && (
                    <p className="text-xs text-slate-400">لا يوجد عملاء مطابقون لهذا البحث.</p>
                  )}

                {fieldErrors.customer && (
                  <p id="customer-error" role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.customer}</span>
                  </p>
                )}
              </div>

              {/* Currency Selector */}
              <div className="space-y-1.5 text-right">
                <label
                  htmlFor="debt-currency-select"
                  className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                  عملة الدين <span className="text-rose-500">*</span>
                </label>
                <select
                  id="debt-currency-select"
                  name="currencyId"
                  value={currencyId}
                  onChange={(e) => setCurrencyId(Number(e.target.value))}
                  disabled={isEditMode}
                  className="w-full pr-3.5 pl-3 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#09152B]/15 dark:focus:ring-blue-500/20 focus:border-[#09152B] dark:focus:border-blue-500 transition-all text-right disabled:cursor-not-allowed disabled:opacity-70 border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  {currencies.map((curr) => (
                    <option key={curr.id} value={curr.id}>
                      {curr.name} ({curr.code})
                    </option>
                  ))}
                </select>
                {isEditMode && (
                  <p className="text-xs text-slate-400">لا يمكن تغيير عملة الدين أثناء تعديل بياناته.</p>
                )}
              </div>

              {/* Amount + Due Date (2-column layout) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-1.5 text-right">
                  <label
                    htmlFor="debt-amount-input"
                    className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300"
                  >
                    المبلغ ({activeCurrencyConfig.labelArFull}) <span className="text-rose-500">*</span>
                  </label>
                  <div
                    className={`w-full flex items-center gap-1 pr-3.5 pl-3 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-[#09152B]/15 dark:focus-within:ring-blue-500/20 focus-within:border-[#09152B] dark:focus-within:border-blue-500 transition-all ${
                      fieldErrors.amount ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      id="debt-amount-input"
                      name="amount"
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      aria-invalid={Boolean(fieldErrors.amount)}
                      aria-describedby={fieldErrors.amount ? 'amount-error' : undefined}
                      onChange={(e) => {
                        let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
                        const parts = val.split('.');
                        if (parts.length > 2) {
                          val = parts[0] + '.' + parts.slice(1).join('');
                        }
                        setAmount(val);
                        setFieldErrors((prev) => ({ ...prev, amount: undefined }));
                      }}
                      placeholder="0.00"
                      dir="ltr"
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none text-right font-jakarta tabular-nums font-bold"
                    />
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 shrink-0 mr-1 font-jakarta tabular-nums">
                      {activeCurrencyConfig.symbol}
                    </span>
                  </div>
                  {fieldErrors.amount && (
                    <p id="amount-error" role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.amount}</span>
                    </p>
                  )}
                </div>

                {/* Due Date */}
                <div className="space-y-1.5 text-right">
                  <label
                    htmlFor="debt-due-date-input"
                    className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300"
                  >
                    تاريخ الاستحقاق <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="debt-due-date-input"
                      name="dueDate"
                      type="date"
                      value={dueDate}
                      aria-invalid={Boolean(fieldErrors.dueDate)}
                      aria-describedby={fieldErrors.dueDate ? 'due-date-error' : undefined}
                      onChange={(e) => {
                        setDueDate(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, dueDate: undefined }));
                      }}
                      dir="ltr"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#09152B]/15 dark:focus:ring-blue-500/20 focus:border-[#09152B] dark:focus:border-blue-500 transition-all text-right font-jakarta tabular-nums font-semibold cursor-pointer ${
                        fieldErrors.dueDate ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    <Calendar className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  {fieldErrors.dueDate && (
                    <p id="due-date-error" role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.dueDate}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5 text-right">
                <Textarea
                  id="debt-notes-input"
                  name="notes"
                  label="ملاحظات (اختياري)"
                  placeholder="أضف تفاصيل إضافية حول هذا الدين أو بنود الفاتورة..."
                  value={notes}
                  maxLength={2000}
                  aria-invalid={Boolean(fieldErrors.notes)}
                  aria-describedby={fieldErrors.notes ? 'notes-error' : undefined}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, notes: undefined }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#09152B]/15 dark:focus:ring-blue-500/20 focus:border-[#09152B] dark:focus:border-blue-500 transition-all text-right resize-none h-[85px] ${
                    fieldErrors.notes ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                <div className="flex items-center justify-between text-xs text-slate-400">
                  {fieldErrors.notes ? (
                    <p id="notes-error" role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.notes}</span>
                    </p>
                  ) : <span />}
                  <span className="font-jakarta tabular-nums" dir="ltr">{notes.length} / 2000</span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-2" />

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 bg-[#09152B] hover:bg-[#060e1d] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isEditMode ? 'جاري تعديل الدين...' : 'جاري الحفظ والتسجيل...'}
                    </span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isEditMode ? 'حفظ تعديل الدين' : 'حفظ وتسجيل الدين'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="py-3 px-6 bg-white dark:bg-[#1f2937] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-60"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>

          {/* Security Assurance Footer */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span>جميع البيانات المالية مشفرة ومسجلة بدقة في نظام وثّق المحاسبي.</span>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddDebtScreen;
