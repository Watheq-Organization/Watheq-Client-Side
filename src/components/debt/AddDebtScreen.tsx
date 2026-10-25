import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { parseVoiceDebt } from '../../lib/voiceDebtParser';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  UserSearch,
  Save,
  Mic,
  MessageCircle,
  Lock,
  Check,
  Loader2,
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
  sendDebtReminder,
  type EditableDebtRecord,
} from '../../services/debtService';

// Minimal ambient shape for the browser's native SpeechRecognition API —
// no @types package for it is installed in this project, and only the
// handful of members actually used below are declared.
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

/**
 * Optional navigation state set when this screen is opened from a specific
 * customer's profile (the "إضافة دين جديد" button on Customer Details),
 * so that customer arrives already selected instead of making the merchant
 * search for them again. Entirely optional: the screen still works exactly
 * as before (empty search) when reached from the sidebar's generic
 * "إضافة دين" link, which sends no state at all.
 *
 * `editingDebt` is set instead when this screen is opened via the edit
 * (pencil) icon on a debt row in the Financial Activity Log — it carries
 * the cached record (see rememberEditableDebt/getEditableDebt in
 * debtService.ts) plus the customer's display info, and switches the whole
 * screen into "edit" mode: the form is pre-filled, the customer is locked,
 * and Save calls updateDebt() instead of createDebt().
 */
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

  // When editing, the customer is fixed to whoever the debt already
  // belongs to — build a minimal CustomerDto from what the caller passed
  // (see AddDebtNavigationState above) rather than requiring a re-search.
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

  // Customer search — no dedicated search endpoint exists, so this filters
  // the existing customer list client-side (see debtService.searchCustomersByIdOrPhone).
  // When a presetCustomer arrives via navigation state, the field starts
  // already filled in and selected rather than empty. In edit mode the
  // customer comes from editingDebt instead and the field is locked (see
  // the input's `disabled` prop below) — editing a debt never moves it to
  // a different customer.
  const [customerQuery, setCustomerQuery] = useState(
    editingCustomerAsDto?.fullName ?? presetCustomer?.fullName ?? ''
  );
  const [customerResults, setCustomerResults] = useState<CustomerDto[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | null>(
    editingCustomerAsDto ?? presetCustomer
  );
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selectedCustomer) return; // don't re-search once a customer is chosen
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!customerQuery.trim()) {
      return;
    }

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

  const handleSelectCustomer = (customer: CustomerDto) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.fullName);
    setCustomerResults([]);
    setFieldErrors((prev) => ({ ...prev, customer: undefined }));
  };

  const handleCustomerQueryChange = (value: string) => {
    setCustomerQuery(value);
    if (selectedCustomer) setSelectedCustomer(null);
  };

  // Currencies from GET /api/Currency/getCurrencies
  const [currencies, setCurrencies] = useState<CurrencyDto[]>(DEFAULT_CURRENCIES);
  const [currencyId, setCurrencyId] = useState<number>(() => {
    if (editingDebt?.currencyId) return editingDebt.currencyId;
    if (editingDebt?.currencyCode) return getCurrencyId(editingDebt.currencyCode);
    return 1; // default ILS (id: 1)
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
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  const [fieldErrors, setFieldErrors] = useState<{
    customer?: string;
    amount?: string;
    dueDate?: string;
    notes?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Voice input — browser-native Web Speech API only (no backend of any
  // kind is invented for this). When unsupported, the button stays
  // visually present per the screenshot but informs the user via toast.
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
  }, [isListening]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);


  const handleCancel = () => {
    navigate(-1);
  };

  const handleSave = async () => {
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
    //
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

        let toastMsg = 'تم تسجيل الدين بنجاح.';
        if (whatsappEnabled) {
          try {
            await sendDebtReminder(customerId);
            toastMsg = 'تم تسجيل الدين وإرسال إشعار التوثيق بنجاح ✓';
          } catch (botErr) {
            console.error('[AddDebtScreen] Failed to send debt reminder:', botErr);
          }
        }

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
    <div className="min-h-screen bg-[#F9F9FF] dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-cairo antialiased flex" dir="rtl">
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
          <div className="fixed bottom-6 left-6 z-50 bg-[#051838] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in text-sm font-medium">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-10 flex-1">
          {/* Page Title */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#00204F] dark:text-white font-cairo">
              {isEditMode ? 'تعديل الدين' : 'إضافة دين جديد'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              {isEditMode
                ? 'قم بتعديل تفاصيل هذا الدين وحفظ التغييرات.'
                : 'قم بإدخال تفاصيل الدين للعميل الجديد أو الحالي.'}
            </p>
          </div>

          {/* Main Form Card */}
          <div className="max-w-[485px] mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm border-t-[3px] border-t-[#00204F] p-7 space-y-5">
            {submitError && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3.5 py-2.5 text-right">
                {submitError}
              </div>
            )}

            {/* Voice Input Section */}
            <div className="space-y-2">
              <style>{`
                @keyframes watheqAudioWave {
                  0% { transform: scaleY(0.25); opacity: 0.55; }
                  50% { transform: scaleY(1.25); opacity: 1; }
                  100% { transform: scaleY(0.4); opacity: 0.7; }
                }
              `}</style>
              <button
                type="button"
                onClick={handleVoiceInputClick}
                aria-pressed={isListening}
                aria-label="إدخال صوتي سريع"
                className={`w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-all text-right cursor-pointer select-none overflow-hidden ${
                  isListening
                    ? 'bg-gradient-to-l from-blue-50/90 to-indigo-50/50 dark:from-slate-900 dark:to-slate-800 border-blue-400 dark:border-blue-500 shadow-sm shadow-blue-500/10'
                    : 'bg-[#F2F4F6] hover:bg-[#e9ecf0] dark:bg-slate-800/50 dark:hover:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/60'
                }`}
              >
                {isListening ? (
                  <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-white bg-blue-600 shadow-sm shadow-blue-600/30">
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

                    {/* Animated Sound Waveform matching provided image */}
                    <div className="flex items-center gap-[3px] h-8 px-2.5 py-1 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-blue-200/70 dark:border-blue-700/50 shrink-0">
                      {[
                        { h: 12, bg: 'bg-blue-300 dark:bg-blue-400', dur: '0.65s', del: '0.1s' },
                        { h: 20, bg: 'bg-blue-500 dark:bg-blue-400', dur: '0.5s', del: '0.25s' },
                        { h: 16, bg: 'bg-blue-300 dark:bg-blue-400', dur: '0.75s', del: '0.0s' },
                        { h: 26, bg: 'bg-[#00204F] dark:bg-blue-200', dur: '0.6s', del: '0.35s' },
                        { h: 32, bg: 'bg-blue-600 dark:bg-blue-500', dur: '0.45s', del: '0.15s' },
                        { h: 22, bg: 'bg-blue-300 dark:bg-blue-400', dur: '0.7s', del: '0.3s' },
                        { h: 28, bg: 'bg-[#00204F] dark:bg-blue-200', dur: '0.55s', del: '0.05s' },
                        { h: 30, bg: 'bg-blue-500 dark:bg-blue-400', dur: '0.65s', del: '0.2s' },
                        { h: 24, bg: 'bg-blue-300 dark:bg-blue-400', dur: '0.8s', del: '0.1s' },
                        { h: 28, bg: 'bg-[#00204F] dark:bg-blue-200', dur: '0.5s', del: '0.4s' },
                        { h: 18, bg: 'bg-blue-400 dark:bg-blue-400', dur: '0.7s', del: '0.15s' },
                        { h: 24, bg: 'bg-[#00204F] dark:bg-blue-200', dur: '0.6s', del: '0.3s' },
                      ].map((bar, i) => (
                        <span
                          key={i}
                          className={`w-[3px] rounded-full ${bar.bg}`}
                          style={{
                            height: `${bar.h}px`,
                            animation: `watheqAudioWave ${bar.dur} ease-in-out infinite alternate`,
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
                      <div className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-white bg-[#00204F]">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#00204F] dark:text-white">
                          إدخال صوتي سريع
                        </p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full shrink-0 bg-slate-400" />
                  </>
                )}
              </button>

              {/* Exemplary format shown outside the box */}
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 text-right leading-relaxed px-1">
                <span className="font-medium text-slate-600 dark:text-slate-300">مثال:</span> «سجل دين على [اسم العميل] بقيمة [المبلغ] يستحق بتاريخ [التاريخ] والملاحظات [الملاحظات]»
              </p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700" />

            {/* Customer Search */}
            <div className="space-y-1.5 text-right relative">
              <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">بحث عن عميل</label>
              <div className="relative flex items-center">
                <UserSearch className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                {isSearchingCustomers && (
                  <Loader2 className="absolute left-3.5 w-4 h-4 text-slate-400 animate-spin pointer-events-none" />
                )}
                <input
                  type="text"
                  value={customerQuery}
                  onChange={(e) => handleCustomerQueryChange(e.target.value)}
                  placeholder="ابحث بالاسم، رقم الهوية أو رقم الجوال..."
                  dir="rtl"
                  disabled={isEditMode}
                  className={`w-full pr-10 pl-9 py-2.5 bg-[#F7F7FC] dark:bg-slate-900 border rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00204F]/20 dark:focus:ring-blue-500/20 focus:border-[#00204F] dark:focus:border-blue-500 transition-all text-right disabled:cursor-not-allowed disabled:opacity-70 ${fieldErrors.customer ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                    }`}
                />
              </div>

              {isEditMode && (
                <p className="text-xs text-slate-400">
                  لا يمكن تغيير العميل عند تعديل دين قائم.
                </p>
              )}

              {/* Results dropdown */}
              {!selectedCustomer && customerQuery.trim() && customerResults.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {customerResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm text-right hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-300">{customer.fullName}</span>
                      <span className="text-xs text-slate-400" dir="ltr">
                        {customer.phoneNumber}
                      </span>
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
                <p className="text-xs text-rose-600">{fieldErrors.customer}</p>
              )}

              {selectedCustomer && (
                <p className="text-sm text-slate-600 dark:text-slate-400 pt-0.5">
                  اسم العميل : <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedCustomer.fullName}</span>
                </p>
              )}
            </div>

            {/* Currency Selector (Confirmed Backend Dropdown Spec) */}
            <div className="space-y-1.5 text-right">
              <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                عملة الدين
              </label>
              <select
                value={currencyId}
                onChange={(e) => setCurrencyId(Number(e.target.value))}
                disabled={isEditMode}
                className="w-full pr-3.5 pl-3 py-2.5 bg-[#F7F7FC] dark:bg-slate-900 border rounded-lg text-sm font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00204F]/20 dark:focus:ring-blue-500/20 focus:border-[#00204F] dark:focus:border-blue-500 transition-all text-right disabled:cursor-not-allowed disabled:opacity-70 border-slate-200 dark:border-slate-700 cursor-pointer"
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

            {/* Amount + Due Date, side by side (amount renders on the right in RTL) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Amount */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                  المبلغ ({activeCurrencyConfig.labelArFull})
                </label>
                <div
                  className={`w-full flex items-center gap-1 pr-3.5 pl-3 py-2.5 bg-[#F7F7FC] dark:bg-slate-900 border rounded-lg focus-within:bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-[#00204F]/20 dark:focus-within:ring-blue-500/20 focus-within:border-[#00204F] dark:focus-within:border-blue-500 transition-all ${fieldErrors.amount ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
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
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none text-right font-sans"
                  />
                  <span className="text-base font-bold text-slate-500 dark:text-slate-300 shrink-0 mr-1 font-sans">
                    {activeCurrencyConfig.symbol}
                  </span>
                </div>
                {fieldErrors.amount && <p className="text-xs text-rose-600">{fieldErrors.amount}</p>}
              </div>

              {/* Due Date */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">تاريخ الاستحقاق</label>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, dueDate: undefined }));
                    }}
                    dir="ltr"
                    className={`w-full px-3.5 py-2.5 bg-[#F7F7FC] dark:bg-slate-900 border rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00204F]/20 dark:focus:ring-blue-500/20 focus:border-[#00204F] dark:focus:border-blue-500 transition-all text-right font-sans ${fieldErrors.dueDate ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                      }`}
                  />
                </div>
                {fieldErrors.dueDate && <p className="text-xs text-rose-600">{fieldErrors.dueDate}</p>}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Textarea
                label="ملاحظات (اختياري)"
                placeholder="أضف تفاصيل إضافية حول هذا الدين..."
                value={notes}
                maxLength={2000}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, notes: undefined }));
                }}
                className={`w-full px-3.5 py-2.5 bg-[#F7F7FC] dark:bg-slate-900 border rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00204F]/20 dark:focus:ring-blue-500/20 focus:border-[#00204F] dark:focus:border-blue-500 transition-all text-right resize-none h-[75px] ${fieldErrors.notes ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                  }`}
              />
              {fieldErrors.notes && <p className="text-xs text-rose-600 text-right mt-1">{fieldErrors.notes}</p>}
            </div>

            {/* WhatsApp Confirmation */}
            <div className="flex items-center justify-between gap-3 bg-[#F4F6FF] dark:bg-slate-800/50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">إرسال تأكيد عبر واتساب</p>
                  <p className="text-xs text-slate-400">سيتم إشعار العميل فور تسجيل الدين</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={whatsappEnabled}
                onClick={() => setWhatsappEnabled((prev) => !prev)}
                className="relative w-11 h-6 shrink-0 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner transition-colors cursor-pointer"
              >
                <span
                  className={`absolute top-0 w-6 h-6 rounded-full shadow flex items-center justify-center transition-all ${whatsappEnabled ? 'left-0 bg-blue-600' : 'right-0 bg-slate-300'
                    }`}
                >
                  {whatsappEnabled && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </span>
              </button>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700" />

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2.5 px-4 bg-[#00204F] hover:bg-[#00204F]/90 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-70"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditMode ? 'جاري تعديل الدين...' : 'جاري الحفظ...'}
                  </span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditMode ? 'تعديل دين' : 'حفظ وتسجيل الدين'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="py-2.5 px-6 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-60"
              >
                إلغاء
              </button>
            </div>
          </div>

          {/* Security Footer */}
          <div className="flex items-center justify-center gap-1.5 mt-5 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span>جميع البيانات مشفرة ومحفوظة بأمان في نظام وثّق.</span>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddDebtScreen;
