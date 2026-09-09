import { useState, useMemo, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Check,
  Plus,
  FileText,
  CreditCard,
  Trash2,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Phone,
  HelpCircle,
  Bell,
  X,
  Pencil,
  Menu,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import {
  getCustomerProfile,
  mapCustomerProfileToCustomer,
  toGetCustomerProfileErrorMessage,
  updateCustomer,
  isDuplicatePhoneNumberError,
  toUpdateCustomerErrorMessage,
  deleteCustomer,
  toDeleteCustomerErrorMessage,
  getStoredTotalPaid,
  setStoredTotalPaid,
} from '../../services/customerService';
import {
  getEditableDebt,
  type EditableDebtRecord,
  deleteDebt,
  isDeleteDebtRequiresConfirmation,
  toDeleteDebtErrorMessage,
} from '../../services/debtService';
import { deletePayment, toDeletePaymentErrorMessage } from '../../services/paymentService';
import type { Customer, CustomerProfileTransactionDto } from '../../types/customer';
import { ApiError } from '../../api/httpClient';
import { PATHS } from '../../routes/paths';
import { useMerchantProfile } from '../../services/merchantProfileService';

interface ActivityItem {
  id: string;
  type: 'debt' | 'payment' | 'alert';
  title: string;
  badgeText?: string;
  badgeStyle?: string;
  amount?: string;
  amountColor?: string;
  description: string;
  date: string;
  balanceLabel?: string;
  iconBg: string;
  /** Raw reference/debt number from the API (debt.DebtNumber /
   * payment.ReceiptNumber) — used as a secondary lookup key for the local
   * editable-debt cache, and shown to the user as-is. */
  reference: string;
  /** Real numeric id of the underlying Debt/Payment record
   * (CustomerProfileTransactionDto.id). This is what PUT /api/Debt/{id}
   * needs — see handleEditActivityClick below. */
  recordId: number;
  /** Unformatted transaction amount (tx.amount, no sign/decimals applied),
   * used to prefill the edit form when no local cache entry exists. */
  rawAmount: number;
  /** Raw debt status (tx.status), null for payments. */
  rawStatus: string | null;
}

/**
 * Treat totalDebt below this as "paid off" for the Delete Customer guard —
 * avoids blocking deletion over a sub-cent floating-point remainder
 * (e.g. 0.0000000001 from repeated debt/payment recalculation) that isn't
 * a real outstanding balance.
 */
const DEBT_ZERO_EPSILON = 0.009;

const EMPTY_CUSTOMER: Customer = {
  id: '',
  name: '',
  type: 'individual',
  typeLabel: 'عميل أفراد',
  nationalOrCrId: '',
  totalDebt: 0,
  totalPaid: 0,
  status: 'paid',
  statusLabel: 'تم السداد',
  avatarLetter: 'ع',
  avatarBg: 'bg-rose-100 text-rose-600',
  phone: '',
  address: '',
  registrationDate: '',
};

/**
 * The backend has no nationalOrCrId field at all (see the comments in
 * customerService.ts) — getCustomerProfile/addCustomer/updateCustomer never
 * return or accept it. That's why it kept showing "غير متوفر" even right
 * after being entered: the value the user typed was validated, but there
 * was nowhere for it to be saved, so the next render (and the next visit)
 * had nothing to read it back from. Persisting it locally, keyed by
 * customer id, is the smallest fix that survives a save and a page
 * reload without needing a backend field that doesn't exist.
 */
function getStoredNationalId(customerId: string): string {
  if (!customerId) return '';
  try {
    return localStorage.getItem(`customer-national-id:${customerId}`) ?? '';
  } catch {
    return '';
  }
}

function setStoredNationalId(customerId: string, value: string): void {
  if (!customerId) return;
  try {
    localStorage.setItem(`customer-national-id:${customerId}`, value);
  } catch {
    // Ignore storage failures (e.g. private browsing) — the field simply
    // won't persist across reloads in that case.
  }
}

/** Formats an ISO date string (from the API) into an Arabic date, optionally with time. */
function formatApiDate(iso: string, withTime = false): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('ar-EG', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

export const CustomerDetailsScreen: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<'all' | 'debt' | 'payment'>('all');
  const [searchActivityQuery, setSearchActivityQuery] = useState('');
  const merchantProfile = useMerchantProfile();

  // Customer Data — fetched from GET /api/Customer/getCustomerProfile/{customerId}
  const [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER);
  const [profileTransactions, setProfileTransactions] = useState<CustomerProfileTransactionDto[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
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
      .then((dto) => {
        setCustomer({
          ...mapCustomerProfileToCustomer(dto),
          nationalOrCrId: getStoredNationalId(dto.id),
        });
        setProfileTransactions(dto.transactions);
        setCurrentBalance(dto.currentBalance);
      })
      .catch((err) => {
        setLoadError(toGetCustomerProfileErrorMessage(err));
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, [id]);

  useEffect(() => {
    loadCustomerProfile();
  }, [loadCustomerProfile]);

  // Edit Customer Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    nationalOrCrId: '',
    phoneNumber: '',
  });
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    nationalOrCrId?: string;
    phoneNumber?: string;
  }>({});
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Shows a one-off success toast passed via navigation state (e.g. after
  // saving a payment from the New Payment page), then clears it from
  // history so it doesn't reappear on back/forward navigation or refresh.
  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (state?.toast) {
      showToast(state.toast);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Delete Customer Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * Delete-Activity affordance on each timeline item (per the "add debt" /
   * "receive payment" reference design).
   *
   * Debts ARE wired to a real endpoint — DELETE /api/Debt/{id} — per the
   * confirmed API doc. That endpoint has a two-step contract: a first call
   * with confirmDeleteWithPayments=false either deletes the debt directly
   * (no prior payments) or comes back 400 with requiresConfirmation=true
   * (the debt has payments, and deleting it will also delete all of
   * them). `debtPendingHardDelete` below drives that second, stronger
   * confirmation step; `activityPendingDelete` is the first, ordinary
   * "delete this?" prompt.
   *
   * Payments ARE also wired to a real endpoint — DELETE /api/Payment/{id}
   * — per the confirmed API doc. Unlike debts, deleting a payment is a
   * single-step call: the backend recalculates the debt's PaidAmount and
   * Status plus the customer's TotalDebt in one transaction, so no second
   * confirmation step is needed.
   *
   * The edit icon, in contrast, IS wired to a real endpoint for debts
   * (PUT /api/Debt/{id}) — see handleEditActivityClick below.
   */
  const [activityPendingDelete, setActivityPendingDelete] = useState<ActivityItem | null>(null);
  /** Set only when the backend reports the debt has payments and a second,
   * explicit confirmation is required before it (and all its payments)
   * are deleted. `paymentsCount` comes straight from that response. */
  const [debtPendingHardDelete, setDebtPendingHardDelete] = useState<{
    activity: ActivityItem;
    paymentsCount: number;
  } | null>(null);
  const [isDeletingActivity, setIsDeletingActivity] = useState(false);

  /**
   * Edit icon on a debt row: opens the Add Debt screen pre-filled with
   * this debt's details, in edit mode (see AddDebtNavigationState in
   * AddDebtScreen.tsx).
   *
   * getCustomerProfile (confirmed API doc) returns the real numeric debt
   * id as `transactions[].id`, so every debt is editable now — not just
   * ones created/edited in this browser. What that endpoint does NOT
   * return is `dueDate` or `notes` (only the combined `description` and
   * `status`/`currencyCode`), so those two fields can't be prefilled from
   * it alone. The local cache (see rememberEditableDebt in
   * debtService.ts) is kept as a bonus: when this exact debt was created
   * or last edited in this browser, it still has the accurate dueDate —
   * use it when present. Otherwise the form opens with the due date left
   * blank for the merchant to (re)select, rather than silently guessing a
   * wrong date.
   *
   * Payments have no update endpoint in the documented API at all, so the
   * edit icon on a payment row always shows the "coming soon" message.
   */
  const handleEditActivityClick = (act: ActivityItem) => {
    if (act.type === 'payment') {
      showToast('تعديل الدفعات سيتوفر قريباً بعد ربطه بواجهة الخادم.');
      return;
    }

    if (!act.recordId) {
      showToast('تعذر فتح هذا الدين للتعديل.');
      return;
    }

    const cached = getEditableDebt(customer.id, act.reference);
    const record =
      cached ??
      ({
        id: String(act.recordId),
        debtNumber: act.reference,
        customerId: customer.id,
        amount: act.rawAmount,
        dueDate: '',
        notes: '',
        status: act.rawStatus,
      } satisfies EditableDebtRecord);

    navigate(PATHS.DEBT_NEW, {
      state: {
        editingDebt: {
          ...record,
          customerFullName: customer.name,
          phoneNumber: customer.phone ?? '',
        },
      },
    });
  };

  const confirmDeleteActivity = async () => {
    if (!activityPendingDelete) return;

    if (!activityPendingDelete.recordId) {
      showToast(
        activityPendingDelete.type === 'debt' ? 'تعذر حذف هذا الدين.' : 'تعذر حذف هذه الدفعة.'
      );
      setActivityPendingDelete(null);
      return;
    }

    const activity = activityPendingDelete;

    if (activity.type === 'payment') {
      setIsDeletingActivity(true);
      try {
        await deletePayment(activity.recordId);
        setActivityPendingDelete(null);
        setStoredTotalPaid(customer.id, Math.max(0, computedTotalPaid - (activity.rawAmount || 0)));
        loadCustomerProfile();
        showToast('تم حذف الدفعة بنجاح.');
      } catch (err) {
        showToast(toDeletePaymentErrorMessage(err));
        setActivityPendingDelete(null);
      } finally {
        setIsDeletingActivity(false);
      }
      return;
    }

    setIsDeletingActivity(true);
    try {
      await deleteDebt(activity.recordId, false);
      setActivityPendingDelete(null);
      loadCustomerProfile();
      showToast('تم حذف الدين بنجاح.');
    } catch (err) {
      if (isDeleteDebtRequiresConfirmation(err)) {
        // The debt has payments — hand off to the stronger confirmation
        // step instead of treating this as a failure.
        setActivityPendingDelete(null);
        setDebtPendingHardDelete({
          activity,
          paymentsCount: err.body.paymentsCount ?? 0,
        });
      } else {
        showToast(toDeleteDebtErrorMessage(err));
        setActivityPendingDelete(null);
      }
    } finally {
      setIsDeletingActivity(false);
    }
  };

  const confirmHardDeleteDebt = async () => {
    if (!debtPendingHardDelete) return;
    const { activity } = debtPendingHardDelete;
    setIsDeletingActivity(true);
    try {
      await deleteDebt(activity.recordId, true);
      setDebtPendingHardDelete(null);
      loadCustomerProfile();
      showToast('تم حذف الدين والدفعات المرتبطة به بنجاح.');
    } catch (err) {
      showToast(toDeleteDebtErrorMessage(err));
      setDebtPendingHardDelete(null);
    } finally {
      setIsDeletingActivity(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customer.id) return;
    setDeleteError(null);
    // Frontend-only guard (not enforced by the Delete Customer API itself):
    // a customer with an outstanding balance must be paid off first.
    // Re-checked here too — not just at the button click below — in case
    // the profile refreshed with a new totalDebt while the modal was open.
    if (customer.totalDebt > DEBT_ZERO_EPSILON) {
      const message = 'لا يمكن حذف هذا العميل، فعليه ديون لم يتم تسديدها بعد.';
      setDeleteError(message);
      showToast(message);
      return;
    }
    setIsDeletingCustomer(true);
    try {
      await deleteCustomer(customer.id);
      setIsDeleteModalOpen(false);
      // Navigate back to the customers list (no page refresh) and let it
      // show the success toast itself, since this screen unmounts here.
      navigate(PATHS.CUSTOMERS, { state: { toast: 'تم حذف العميل بنجاح.' } });
    } catch (err) {
      const message = toDeleteCustomerErrorMessage(err);
      setDeleteError(message);
      showToast(message);
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  const openEditModal = () => {
    setEditForm({
      fullName: customer.name,
      nationalOrCrId: customer.nationalOrCrId,
      phoneNumber: customer.phone ?? '',
    });
    setFieldErrors({});
    setSubmitError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetCustomerId = customer.id || id;
    if (!targetCustomerId) {
      setSubmitError('معرّف العميل غير متوفر.');
      return;
    }

    const trimmedName = editForm.fullName.trim();
    const trimmedPhone = editForm.phoneNumber.trim();
    const trimmedNationalId = editForm.nationalOrCrId.trim();

    const errors: typeof fieldErrors = {};
    if (!trimmedName || trimmedName.length < 2) {
      errors.fullName = 'الاسم مطلوب ويجب ألا يقل عن حرفين.';
    } else if (trimmedName.length > 150) {
      errors.fullName = 'الاسم طويل جداً (الحد الأقصى 150 حرفاً).';
    }

    if (!trimmedNationalId) {
      errors.nationalOrCrId = 'رقم الهوية الوطنية / السجل التجاري مطلوب.';
    }

    if (!trimmedPhone) {
      errors.phoneNumber = 'رقم الجوال مطلوب.';
    } else if (trimmedPhone.length > 20 || !/^\+?[0-9]{8,15}$/.test(trimmedPhone)) {
      errors.phoneNumber = 'صيغة رقم الجوال غير صحيحة.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitError(null);
    setIsSavingCustomer(true);
    try {
      const dto = await updateCustomer(targetCustomerId, {
        fullName: trimmedName,
        phoneNumber: trimmedPhone,
        address: customer.address ?? '',
        nationalId: trimmedNationalId,
      });

      // The backend doesn't store nationalOrCrId (see getStoredNationalId
      // above), so it's persisted locally here instead of coming back from `dto`.
      setStoredNationalId(targetCustomerId, trimmedNationalId);

      setCustomer((prev) => ({
        ...prev,
        name: dto.fullName || trimmedName,
        phone: dto.phoneNumber || trimmedPhone,
        address: dto.address || prev.address,
        totalDebt: dto.totalDebt || prev.totalDebt,
        totalPaid: dto.totalPaid || prev.totalPaid,
        nationalOrCrId: trimmedNationalId,
      }));

      setIsEditModalOpen(false);
      showToast('تم تحديث بيانات العميل بنجاح.');
      loadCustomerProfile();
    } catch (err) {
      if (err instanceof ApiError && isDuplicatePhoneNumberError(err)) {
        setFieldErrors((p) => ({ ...p, phoneNumber: 'يوجد عميل آخر مسجل بنفس رقم الجوال.' }));
      } else {
        const message = toUpdateCustomerErrorMessage(err);
        setSubmitError(message);
        showToast(message);
      }
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Activity Log — derived from the transaction history returned by
  // getCustomerProfile (already newest-first, per the API contract).
  const activities: ActivityItem[] = useMemo(() => {
    return profileTransactions.map((tx, index) => {
      const isDebt = tx.type === 'Debt';
      const sign = isDebt ? '+' : '-';
      return {
        id: `${tx.reference || (isDebt ? 'debt' : 'payment')}-${index}`,
        type: isDebt ? 'debt' : 'payment',
        title: isDebt
          ? `دين جديد${tx.reference ? ` - ${tx.reference}` : ''}`
          : `دفعة مستلمة${tx.reference ? ` - ${tx.reference}` : ''}`,
        badgeText: (isDebt ? tx.status : tx.paymentMethod) ?? undefined,
        badgeStyle: isDebt
          ? 'bg-blue-50 text-blue-600 border border-blue-100'
          : 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        amount: `${sign}${tx.amount.toFixed(2)}`,
        amountColor: isDebt ? 'text-[#e11d48]' : 'text-emerald-600',
        description: tx.description || (isDebt ? 'معاملة دين' : 'معاملة دفع'),
        date: formatApiDate(tx.date, true),
        balanceLabel: `${tx.balance.toFixed(2)} ${tx.currencyCode || 'ر.س'}`,
        reference: tx.reference,
        recordId: tx.id,
        rawAmount: tx.amount,
        rawStatus: isDebt ? tx.status : null,
        iconBg: isDebt ? 'bg-[#0c2444] text-white' : 'bg-emerald-600 text-white',
      };
    });
  }, [profileTransactions]);

  // Latest payment amount, used in the debt banner below. Transactions are
  // already newest-first, so the first Payment entry is the most recent one.
  const lastPaymentAmount = useMemo(() => {
    const lastPayment = profileTransactions.find((tx) => tx.type === 'Payment');
    return lastPayment ? lastPayment.amount : 0;
  }, [profileTransactions]);

  // Real total paid: combines backend customer.totalPaid, transactions history sum,
  // debt differential (totalDebt - currentBalance), and locally persisted payment total.
  const computedTotalPaid = useMemo(() => {
    const transactionsPaid = profileTransactions.reduce((acc, tx) => {
      const typeStr = String(tx.type || '').toLowerCase();
      if (
        typeStr.includes('payment') ||
        typeStr.includes('pay') ||
        typeStr.includes('دفعة') ||
        typeStr.includes('سداد')
      ) {
        return acc + (Number(tx.amount) || 0);
      }
      return acc;
    }, 0);

    const diffPaid =
      customer.totalDebt > 0 && currentBalance >= 0 && customer.totalDebt > currentBalance
        ? customer.totalDebt - currentBalance
        : 0;

    const storedPaid = getStoredTotalPaid(customer.id);

    return Math.max(
      customer.totalPaid || 0,
      transactionsPaid,
      diffPaid,
      storedPaid
    );
  }, [customer.totalPaid, customer.totalDebt, customer.id, profileTransactions, currentBalance]);

  // Filter activities based on tab and search
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (activeActivityTab !== 'all' && act.type !== activeActivityTab) {
        return false;
      }
      if (searchActivityQuery.trim()) {
        const q = searchActivityQuery.toLowerCase().trim();
        return (
          act.title.toLowerCase().includes(q) ||
          act.description.toLowerCase().includes(q) ||
          (act.amount && act.amount.includes(q))
        );
      }
      return true;
    });
  }, [activities, activeActivityTab, searchActivityQuery]);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 font-cairo antialiased flex print:bg-white print:block" dir="rtl">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="customers"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300 print:mr-0 print:p-0">

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-[60] bg-[#051838] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in text-sm font-medium print:hidden">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header Bar */}
        <header className="w-full bg-white border-b border-slate-100/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs print:hidden">
          {/* Mobile menu trigger & Search bar */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="فتح القائمة الجانبية"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative w-full">
              <input
                type="text"
                value={searchActivityQuery}
                onChange={(e) => setSearchActivityQuery(e.target.value)}
                placeholder="بحث عن معاملة..."
                className="w-full bg-[#f8fafc] border border-slate-200/90 text-slate-800 text-xs sm:text-sm rounded-xl pr-10 pl-4 py-2.5 outline-none focus:border-[#0c2444] focus:bg-white transition-all placeholder:text-slate-400 font-cairo"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* User & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              className="relative p-2 rounded-xl text-slate-600 hover:text-[#0c2444] hover:bg-slate-50 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 left-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>

            <button
              type="button"
              className="p-2 rounded-xl text-slate-600 hover:text-[#0c2444] hover:bg-slate-50 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pr-1 sm:pr-2 border-r border-slate-100">
              <div className="w-10 h-10 rounded-full ring-2 ring-slate-100 overflow-hidden shadow-xs cursor-pointer">
                <img
                  src={merchantProfile.profileImagePath || '/merchant-avatar.jpg'}
                  alt={merchantProfile.fullName || 'صورة التاجر'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none print:w-full">

          {/* Breadcrumb / Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(PATHS.CUSTOMERS)}
                  className="text-slate-400 hover:text-[#0c2444] transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>العملاء</span>
                </button>
                <span className="text-slate-300">/</span>
                <span className="text-slate-700 text-xs font-bold">ملف العميل</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-tajawal text-[#0c2444] tracking-tight mt-1">
                ملف العميل
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                عرض وإدارة سجل المديونية الخاص بالعميل
              </p>
            </div>

            {/* Top Action Buttons (Visual UI only) */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <button
                type="button"
                onClick={openEditModal}
                className="px-4 py-2 bg-[#0c2444] hover:bg-[#123663] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
              >
                تحديث بيانات العميل
              </button>

              <button
                type="button"
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                تحميل السجل
              </button>
            </div>
          </div>

          {/* Profile Load Status */}
          {loadError && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 flex items-center justify-between gap-3 print:hidden">
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
          {isLoadingProfile && !loadError && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-sm px-4 py-3 text-center print:hidden">
              جاري تحميل بيانات العميل...
            </div>
          )}

          {/* Main 2-Column Grid matching Design */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block print:w-full">

            {/* RIGHT COLUMN: Client Profile Card & Actions (Takes 4 cols on desktop) */}
            <div className="lg:col-span-4 space-y-4 print:hidden">

              {/* Profile Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs flex flex-col items-center text-center">

                {/* Avatar with Verified Badge */}
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-slate-100/80 shadow-md bg-slate-100 flex items-center justify-center">
                    <img
                      src="/merchant-avatar.jpg"
                      alt={customer.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="w-full h-full bg-[#123663] text-white font-bold flex items-center justify-center text-2xl font-tajawal">
                      {customer.avatarLetter || 'أ'}
                    </div>
                  </div>
                  {/* Verified Green Shield / Check Badge */}
                  <div className="absolute -bottom-1 -left-1 w-7 h-7 bg-emerald-600 rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>

                {/* Name */}
                <h2 className="text-xl font-extrabold font-tajawal text-[#0c2444]">
                  {customer.name || 'أحمد الراجحي'}
                </h2>

                {/* National ID Pill */}
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold font-mono" dir="rtl">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>هوية: {customer.nationalOrCrId || 'غير متوفر'}</span>
                </div>

                {/* Divider */}
                <div className="w-full border-t border-slate-100 my-5" />

                {/* Info List */}
                <div className="w-full space-y-4 text-xs sm:text-sm">
                  {/* Phone */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>رقم الهاتف</span>
                    </div>
                    <span className="font-bold text-slate-800 font-mono" dir="ltr">
                      {customer.phone || 'غير متوفر'}
                    </span>
                  </div>

                  {/* Registration Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>تاريخ التسجيل</span>
                    </div>
                    <span className="font-bold text-slate-800">
                      {customer.registrationDate ? formatApiDate(customer.registrationDate) : 'غير متوفر'}
                    </span>
                  </div>

                  {/* Total Paid */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Check className="w-4 h-4 text-slate-400" />
                      <span>إجمالي المدفوع</span>
                    </div>
                    <span className="font-bold text-slate-800 font-mono" dir="ltr">
                      {computedTotalPaid.toFixed(2)} ر.س
                    </span>
                  </div>

                  {/* Credit Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span>حالة الائتمان</span>
                    </div>
                    <span className="px-3 py-0.5 bg-emerald-500 text-white rounded-md text-xs font-bold shadow-2xs">
                      موثوق
                    </span>
                  </div>
                </div>

              </div>

              {/* Action Buttons Stack (Visual UI as requested) */}
              <div className="space-y-2.5">
                {/* 1. Record New Payment Button */}
                <button
                  type="button"
                  onClick={() => navigate(`/customers/${customer.id}/payments/new`)}
                  disabled={!customer.id}
                  className="w-full py-3 px-4 bg-[#007a3d] hover:bg-[#006633] text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>تسجيل دفعة جديدة</span>
                </button>

                {/* 2. Add New Debt Button */}
                <button
                  type="button"
                  onClick={() =>
                    navigate(PATHS.DEBT_NEW, {
                      state: {
                        presetCustomer: {
                          id: customer.id,
                          fullName: customer.name,
                          phoneNumber: customer.phone ?? '',
                          address: customer.address ?? '',
                          totalDebt: customer.totalDebt,
                          totalPaid: computedTotalPaid,
                          createdAt: customer.registrationDate ?? '',
                        },
                      },
                    })
                  }
                  disabled={!customer.id}
                  className="w-full py-3 px-4 bg-[#0c2444] hover:bg-[#123663] text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة دين جديد</span>
                </button>

                {/* 3. Export Statement PDF */}
                <button
                  type="button"
                  className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>تصدير كشف حساب (PDF)</span>
                </button>

                {/* 4. Delete Customer Button */}
                <button
                  type="button"
                  onClick={() => {
                    // Frontend-only guard (the Delete Customer API doesn't
                    // enforce this itself): block deletion up front — and
                    // tell the merchant why — instead of opening the
                    // confirmation modal only to fail on submit.
                    if (customer.totalDebt > DEBT_ZERO_EPSILON) {
                      showToast('لا يمكن حذف هذا العميل، فعليه ديون لم يتم تسديدها بعد.');
                      return;
                    }
                    setDeleteError(null);
                    setIsDeleteModalOpen(true);
                  }}
                  className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border border-rose-200/60 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف العميل</span>
                </button>
              </div>

            </div>

            {/* LEFT COLUMN: Financial Activity Log & Total Debt Banner (Takes 8 cols on desktop) */}
            <div className="lg:col-span-8 space-y-6 print:w-full print:space-y-4 print:m-0 print:p-0">

              {/* Financial Activity Log Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6 print:border print:border-slate-200 print:rounded-2xl print:p-6 print:shadow-none">

                {/* Print-Only Header with Customer Info */}
                <div className="hidden print:flex items-center justify-between pb-4 border-b-2 border-slate-200" dir="rtl">
                  <div>
                    <h2 className="text-xl font-extrabold font-tajawal text-[#0c2444]">
                      سجل النشاط المالي وكشف الحساب
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 font-cairo">
                      <span><strong>العميل:</strong> {customer.name || 'عميل'}</span>
                      <span>•</span>
                      <span><strong>الهاتف:</strong> <span dir="ltr">{customer.phone || 'غير متوفر'}</span></span>
                      <span>•</span>
                      <span><strong>معرف/هوية:</strong> {customer.nationalOrCrId || 'غير متوفر'}</span>
                    </div>
                  </div>
                  <div className="text-left text-xs text-slate-500 font-mono">
                    <span className="font-bold text-[#0c2444] block font-tajawal text-sm">منصة وثيق</span>
                    <span>{new Date().toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>

                {/* Header with Title and Filter Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 print:hidden">
                  <h3 className="text-lg sm:text-xl font-extrabold font-tajawal text-[#0c2444]">
                    سجل النشاط المالي
                  </h3>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveActivityTab('all')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeActivityTab === 'all'
                        ? 'bg-white text-[#0c2444] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      الكل
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveActivityTab('debt')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeActivityTab === 'debt'
                        ? 'bg-white text-[#0c2444] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      الديون
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveActivityTab('payment')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeActivityTab === 'payment'
                        ? 'bg-white text-[#0c2444] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      المدفوعات
                    </button>
                  </div>
                </div>

                {/* Timeline Items */}
                {filteredActivities.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                    <p className="text-sm font-semibold">لا توجد معاملات مسجلة لهذا العميل حتى الآن</p>
                  </div>
                ) : (
                  <div className="relative space-y-6 before:absolute before:top-4 before:bottom-4 before:right-5 before:w-0.5 before:bg-slate-100">
                    {filteredActivities.map((act) => (
                      <div key={act.id} className="relative flex items-start gap-4 sm:gap-5">
                        
                        {/* Timeline Icon Node */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10 shadow-2xs ${act.iconBg}`}
                        >
                          {act.type === 'debt' && <Plus className="w-5 h-5 stroke-[2.5]" />}
                          {act.type === 'payment' && <Check className="w-5 h-5 stroke-[2.5]" />}
                          {act.type === 'alert' && <AlertTriangle className="w-5 h-5 text-slate-600" />}
                        </div>

                        {/* Content Card */}
                        <div
                          className={`flex-1 rounded-2xl p-4 sm:p-5 transition-all ${
                            act.type === 'alert'
                              ? 'bg-[#f8fafc] border-2 border-dashed border-slate-200'
                              : 'bg-white border border-slate-100 shadow-2xs hover:shadow-xs'
                          }`}
                        >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-bold text-[#0c2444] text-sm sm:text-base font-tajawal">
                              {act.title}
                            </span>
                            {act.badgeText && (
                              <span
                                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${act.badgeStyle}`}
                              >
                                {act.badgeText}
                              </span>
                            )}
                          </div>

                          {/* Amount + Row Actions (Delete / Edit) */}
                          <div className="flex items-center gap-3">
                            {act.amount && (
                              <div className="text-left" dir="ltr">
                                <span className={`text-base sm:text-lg font-extrabold font-tajawal ${act.amountColor}`}>
                                  {act.amount}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-cairo">
                                  ريال سعودي
                                </span>
                              </div>
                            )}

                            {act.type !== 'alert' && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setActivityPendingDelete(act)}
                                  aria-label="حذف العملية"
                                  title="حذف"
                                  className="w-8 h-8 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditActivityClick(act)}
                                  aria-label="تعديل العملية"
                                  title="تعديل"
                                  className="w-8 h-8 rounded-lg bg-[#0c2444] hover:bg-[#123663] text-white flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed font-normal">
                          {act.description}
                        </p>

                        {/* Date & Running Balance */}
                        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{act.date}</span>
                          </div>
                          {act.balanceLabel && (
                            <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                              الرصيد بعد العملية: {act.balanceLabel}
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

                {/* Footer Note */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400 print:hidden">
                  <Clock className="w-4 h-4" />
                  <span>يتم تحديث السجل تلقائياً عند كل عملية إضافة أو سداد موثقة.</span>
                </div>

              </div>

              {/* Total Current Debt Banner (Dark Navy Banner) */}
              <div className="bg-[#0c2444] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden print:rounded-2xl print:p-6 print:shadow-none print:break-inside-avoid">
                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Right: Total Debt Amount */}
                <div className="text-right space-y-1 relative z-10">
                  <span className="text-xs sm:text-sm font-semibold text-slate-300 block">
                    إجمالي المديونية الحالية
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-5xl font-black font-tajawal tracking-tight">
                      {currentBalance.toFixed(2)}
                    </span>
                    <span className="text-sm font-bold text-slate-400 font-cairo">
                      ر.س
                    </span>
                  </div>
                </div>

                {/* Left: 2 Inset Cards */}
                <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
                  {/* Last Payment Card */}
                  <div className="flex-1 md:w-32 bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-xs">
                    <span className="text-[11px] text-slate-400 font-medium block mb-1">
                      آخر دفعة
                    </span>
                    <span className="text-sm sm:text-base font-bold text-white font-tajawal">
                      {lastPaymentAmount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-cairo">
                      ر.س
                    </span>
                  </div>

                  {/* Transaction Count Card */}
                  <div className="flex-1 md:w-36 bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-xs">
                    <span className="text-[11px] text-slate-400 font-medium block mb-1">
                      عدد المعاملات
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white font-tajawal block">
                      {profileTransactions.length}
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </main>
      </div>

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in print:hidden"
          dir="rtl"
        >
          <div className="bg-white rounded-[12px] w-[450px] max-w-[calc(100vw-32px)] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="h-[68px] flex items-center justify-between px-6 border-b border-slate-200">
              <h3 className="text-lg font-bold font-tajawal text-[#0c2444]">
                تعديل بيانات العميل
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setIsSavingCustomer(false);
                  setSubmitError(null);
                  setFieldErrors({});
                }}
                className="text-slate-900 hover:opacity-60 transition-opacity cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer}>
              <div className="px-6 py-5 space-y-4">
                {submitError && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3.5 py-2.5 text-right">
                    {submitError}
                  </div>
                )}
                {/* Field 1: Customer Name */}
                <div>
                  <label className="block text-sm font-bold text-[#0c2444] mb-1.5">
                    اسم العميل <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
                    dir="rtl"
                    className={`w-full h-[38px] bg-white border rounded-lg px-3.5 text-sm text-right text-slate-800 placeholder-slate-400 outline-none focus:border-[#123663] transition-colors ${fieldErrors.fullName ? 'border-rose-400' : 'border-slate-200'
                      }`}
                  />
                  {fieldErrors.fullName && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.fullName}</p>
                  )}
                </div>

                {/* Field 2: National ID / CR Number (display only — not sent to the API) */}
                <div>
                  <label className="block text-sm font-bold text-[#0c2444] mb-1.5">
                    رقم الهوية الوطنية <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.nationalOrCrId}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, nationalOrCrId: e.target.value }))
                    }
                    dir="rtl"
                    className={`w-full h-[38px] bg-white border rounded-lg px-3.5 text-sm text-right text-slate-800 placeholder-slate-400 outline-none focus:border-[#123663] transition-colors ${fieldErrors.nationalOrCrId ? 'border-rose-400' : 'border-slate-200'
                      }`}
                  />
                  {fieldErrors.nationalOrCrId && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.nationalOrCrId}</p>
                  )}
                </div>

                {/* Field 3: Mobile Number */}
                <div>
                  <label className="block text-sm font-bold text-[#0c2444] mb-1.5">
                    رقم الجوال
                  </label>
                  <input
                    type="tel"
                    value={editForm.phoneNumber}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, phoneNumber: e.target.value }))
                    }
                    dir="rtl"
                    className={`w-full h-[38px] bg-white border rounded-lg px-3.5 text-sm text-right text-slate-800 placeholder-slate-400 outline-none focus:border-[#123663] transition-colors ${fieldErrors.phoneNumber ? 'border-rose-400' : 'border-slate-200'
                      }`}
                  />
                  {fieldErrors.phoneNumber && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.phoneNumber}</p>
                  )}
                </div>

                {/* Field 4: Debt Balance — read-only, not sent to the API */}
                <div>
                  <label className="block text-sm font-bold text-[#0c2444] mb-1.5">
                    رصيد المديونية (ريال) <span className="font-normal text-slate-400">(اختياري)</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-sm font-semibold text-slate-400 pointer-events-none">
                      SAR
                    </span>
                    <input
                      type="text"
                      value={customer.totalDebt.toFixed(2)}
                      disabled
                      readOnly
                      dir="rtl"
                      className="w-full h-[38px] bg-slate-50 border border-slate-200 rounded-lg pr-3.5 pl-12 text-sm text-right text-slate-500 outline-none cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">القيمة الحالية للمديونية.</p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setIsSavingCustomer(false);
                    setSubmitError(null);
                    setFieldErrors({});
                  }}
                  className="h-9 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustomer}
                  className="h-9 px-5 rounded-lg bg-[#007a3d] hover:bg-[#006633] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-70 flex items-center gap-2"
                >
                  {isSavingCustomer ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>جاري التحديث...</span>
                    </>
                  ) : (
                    <span>تحديث البيانات</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200 print:hidden"
          dir="rtl"
          onClick={() => !isDeletingCustomer && setIsDeleteModalOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center transform transition-all duration-200 scale-100 animate-in fade-in zoom-in-95"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold font-tajawal text-slate-900 mb-2">
              حذف العميل
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6 font-cairo">
              هل أنت متأكد من حذف {customer.name || 'هذا العميل'}؟ لا يمكن التراجع عن هذا الإجراء.
            </p>

            {deleteError && (
              <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm px-3.5 py-2.5 text-right">
                {deleteError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isDeletingCustomer}
                onClick={handleDeleteCustomer}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-[#fecaca] hover:bg-[#fca5a5] text-[#b91c1c] transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isDeletingCustomer ? 'جاري الحذف...' : 'حذف العميل'}
              </button>

              <button
                type="button"
                disabled={isDeletingCustomer}
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Activity (Debt/Payment) Confirmation Modal */}
      {activityPendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
          dir="rtl"
          onClick={() => !isDeletingActivity && setActivityPendingDelete(null)}
          aria-modal="true"
          role="dialog"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center transform transition-all duration-200 scale-100 animate-in fade-in zoom-in-95"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold font-tajawal text-slate-900 mb-2">
              {activityPendingDelete.type === 'debt' ? 'حذف الدين' : 'حذف الدفعة'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6 font-cairo">
              هل أنت متأكد من حذف "{activityPendingDelete.title}"؟ لا يمكن التراجع عن هذا الإجراء.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={confirmDeleteActivity}
                disabled={isDeletingActivity}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-[#fecaca] hover:bg-[#fca5a5] text-[#b91c1c] transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeletingActivity ? 'جارٍ الحذف...' : 'حذف'}
              </button>

              <button
                type="button"
                onClick={() => setActivityPendingDelete(null)}
                disabled={isDeletingActivity}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hard-Delete Debt Confirmation Modal — shown when the backend
          reports the debt has associated payments (DELETE /api/Debt/{id}
          responded 400 with requiresConfirmation=true) and deleting it
          means deleting every linked payment too. */}
      {debtPendingHardDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
          dir="rtl"
          onClick={() => !isDeletingActivity && setDebtPendingHardDelete(null)}
          aria-modal="true"
          role="dialog"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center transform transition-all duration-200 scale-100 animate-in fade-in zoom-in-95"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold font-tajawal text-slate-900 mb-2">
              هذا الدين مرتبط بدفعات
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6 font-cairo">
              يحتوي هذا الدين على{' '}
              {debtPendingHardDelete.paymentsCount > 0
                ? `${debtPendingHardDelete.paymentsCount} دفعة/دفعات مرتبطة به`
                : 'دفعات مرتبطة به'}
              . حذف الدين سيؤدي أيضاً إلى حذف جميع الدفعات المرتبطة به، ولا يمكن التراجع عن هذا
              الإجراء. هل أنت متأكد من المتابعة؟
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={confirmHardDeleteDebt}
                disabled={isDeletingActivity}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-[#fecaca] hover:bg-[#fca5a5] text-[#b91c1c] transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeletingActivity ? 'جارٍ الحذف...' : 'حذف الدين والدفعات'}
              </button>

              <button
                type="button"
                onClick={() => setDebtPendingHardDelete(null)}
                disabled={isDeletingActivity}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
