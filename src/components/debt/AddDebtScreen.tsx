import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  UserSearch,
  Calendar,
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

  // Form state
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

      // Best-effort auto-fill: pull the first number mentioned into the
      // amount field, and drop the full transcript into notes so nothing
      // said is lost even if it couldn't be mapped to a specific field.
      const numberMatch = transcript.match(/\d+(\.\d+)?/);
      if (numberMatch) {
        setAmount(numberMatch[0]);
        setFieldErrors((prev) => ({ ...prev, amount: undefined }));
      }
      setNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
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

    setSubmitError(null);
    setIsSaving(true);
    try {
      if (isEditMode && editingDebt) {
        const dto = await updateDebt(editingDebt.id, {
          customerId,
          amount,
          dueDate,
          notes,
          currencyId: editingDebt.currencyId,
        });
        rememberEditableDebt(customerId, { customerId, amount, dueDate, notes }, dto);
        navigate(`/customers/${customerId}`, {
          state: { toast: 'تم تحديث الدين بنجاح.' },
        });
      } else {
        const dto = await createDebt({ customerId, amount, dueDate, notes });
        rememberEditableDebt(customerId, { customerId, amount, dueDate, notes }, dto);
        navigate(`/customers/${customerId}`, {
          state: { toast: 'تم تسجيل الدين بنجاح.' },
        });
      }
    } catch (error) {
      setSubmitError(isEditMode ? toUpdateDebtErrorMessage(error) : toCreateDebtErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FF] text-slate-800 font-cairo antialiased flex" dir="rtl">
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
            <h1 className="text-xl sm:text-2xl font-semibold text-[#00204F] font-tajawal">
              {isEditMode ? 'تعديل الدين' : 'إضافة دين جديد'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              {isEditMode
                ? 'قم بتعديل تفاصيل هذا الدين وحفظ التغييرات.'
                : 'قم بإدخال تفاصيل الدين للعميل الجديد أو الحالي.'}
            </p>
          </div>

          {/* Main Form Card */}
          <div className="max-w-[485px] mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm border-t-[3px] border-t-[#00204F] p-7 space-y-5">
            {submitError && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3.5 py-2.5 text-right">
                {submitError}
              </div>
            )}

            {/* Voice Input Section */}
            <div className="flex items-center justify-between gap-3 bg-[#F2F4F6] border border-slate-200/70 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleVoiceInputClick}
                  aria-pressed={isListening}
                  aria-label="إدخال صوتي سريع"
                  className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-white transition-colors cursor-pointer ${
                    isListening ? 'bg-rose-600 animate-pulse' : 'bg-[#00204F] hover:bg-[#00204F]/90'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#00204F]">
                    {isListening ? 'جاري الاستماع...' : 'إدخال صوتي سريع'}
                  </p>
                  <p className="text-xs text-slate-400">تحدث وسيتم تعبئة النموذج تلقائياً</p>
                </div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            </div>

            <div className="border-t border-slate-100" />

            {/* Customer Search */}
            <div className="space-y-1.5 text-right relative">
              <label className="text-xs sm:text-sm font-semibold text-slate-700">بحث عن عميل</label>
              <div className="relative flex items-center">
                <UserSearch className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                {isSearchingCustomers && (
                  <Loader2 className="absolute left-3.5 w-4 h-4 text-slate-400 animate-spin pointer-events-none" />
                )}
                <input
                  type="text"
                  value={customerQuery}
                  onChange={(e) => handleCustomerQueryChange(e.target.value)}
                  placeholder="رقم الهوية أو رقم الجوال..."
                  dir="rtl"
                  disabled={isEditMode}
                  className={`w-full pr-10 pl-9 py-2.5 bg-[#F7F7FC] border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00204F]/20 focus:border-[#00204F] transition-all text-right disabled:cursor-not-allowed disabled:opacity-70 ${
                    fieldErrors.customer ? 'border-rose-400' : 'border-slate-200'
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
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {customerResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm text-right hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-slate-700">{customer.fullName}</span>
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
                <p className="text-sm text-slate-600 pt-0.5">
                  اسم العميل : <span className="font-semibold text-slate-800">{selectedCustomer.fullName}</span>
                </p>
              )}
            </div>

            {/* Amount + Due Date, side by side (amount renders on the right in RTL) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Amount */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs sm:text-sm font-semibold text-slate-700">
                  المبلغ (شيكل إسرائيلي)
                </label>
                <div
                  className={`w-full flex items-center gap-1 pr-3.5 pl-3 py-2.5 bg-[#F7F7FC] border rounded-lg focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00204F]/20 focus-within:border-[#00204F] transition-all ${
                    fieldErrors.amount ? 'border-rose-400' : 'border-slate-200'
                  }`}
                >
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
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none text-right font-sans"
                  />
                  <span className="text-xs font-bold text-slate-400 shrink-0">ش.إ</span>
                </div>
                {fieldErrors.amount && <p className="text-xs text-rose-600">{fieldErrors.amount}</p>}
              </div>

              {/* Due Date */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs sm:text-sm font-semibold text-slate-700">تاريخ الاستحقاق</label>
                <div className="relative flex items-center">
                  <Calendar className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, dueDate: undefined }));
                    }}
                    dir="ltr"
                    className={`w-full pr-10 pl-3.5 py-2.5 bg-[#F7F7FC] border rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00204F]/20 focus:border-[#00204F] transition-all text-right font-sans ${
                      fieldErrors.dueDate ? 'border-rose-400' : 'border-slate-200'
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
                className={`w-full px-3.5 py-2.5 bg-[#F7F7FC] border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00204F]/20 focus:border-[#00204F] transition-all text-right resize-none h-[75px] ${
                  fieldErrors.notes ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {fieldErrors.notes && <p className="text-xs text-rose-600 text-right mt-1">{fieldErrors.notes}</p>}
            </div>

            {/* WhatsApp Confirmation */}
            <div className="flex items-center justify-between gap-3 bg-[#F4F6FF] rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700">إرسال تأكيد عبر واتساب</p>
                  <p className="text-xs text-slate-400">سيتم إشعار العميل فور تسجيل الدين</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={whatsappEnabled}
                onClick={() => setWhatsappEnabled((prev) => !prev)}
                className="relative w-11 h-6 shrink-0 rounded-full bg-white border border-slate-200 shadow-inner transition-colors cursor-pointer"
              >
                <span
                  className={`absolute top-0 w-6 h-6 rounded-full shadow flex items-center justify-center transition-all ${
                    whatsappEnabled ? 'left-0 bg-blue-600' : 'right-0 bg-slate-300'
                  }`}
                >
                  {whatsappEnabled && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </span>
              </button>
            </div>

            <div className="border-t border-slate-100" />

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
                className="py-2.5 px-6 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-60"
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
