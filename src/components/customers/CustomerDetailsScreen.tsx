import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { FC, ReactNode } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
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
  X,
  Pencil,
  RefreshCw,
  Package,
  Coins,
  Printer,
  QrCode,
  AlertCircle,
} from 'lucide-react';
import { TelegramLinkModal } from './TelegramLinkModal';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
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
  parseCustomerPhone,
  formatFullCustomerPhone,
  unlinkTelegram,
  toTelegramUnlinkErrorMessage,
  validateCustomerFullName,
  validateCustomerNationalId,
  validateCustomerPhoneNumber,
} from '../../services/customerService';
import {
  getEditableDebt,
  type EditableDebtRecord,
  deleteDebt,
  isDeleteDebtRequiresConfirmation,
  toDeleteDebtErrorMessage,
} from '../../services/debtService';
import { deletePayment, toDeletePaymentErrorMessage } from '../../services/paymentService';
import { getPosTransactionDetails } from '../../services/posService';
import type {
  Customer,
  CustomerProfileTransactionDto,
  CustomerCurrencyBalanceDto,
} from '../../types/customer';
import { ApiError } from '../../api/httpClient';
import { Toast, type ToastType } from '../ui/Toast';
import { PhoneInputWithCountry, type CountryCode } from '../ui/PhoneInputWithCountry';
import { PATHS } from '../../routes/paths';
import { formatApiDate } from '../../lib/dateUtils';
import {
  formatCurrency,
  getCurrencyConfig,
  groupTotalsByCurrency,
  CURRENCY_BADGE_STYLES,
  normalizeCurrencyCode,
  ALL_CURRENCY_CODES,
  type CurrencyCode,
} from '../../utils/currency';

type TransactionWithFallbackCurrency = CustomerProfileTransactionDto & {
  currency?: string;
};

function getTransactionCurrencyCode(tx: TransactionWithFallbackCurrency): CurrencyCode {
  return normalizeCurrencyCode(tx.currencyCode || tx.currency || 'ILS');
}

/**
 * Returns complete badge style classes (bg + text + border) for any currency code.
 */
const getCurrencyBadgeClasses = (code: string | CurrencyCode | undefined) => {
  const normalized = normalizeCurrencyCode(code);
  const style = CURRENCY_BADGE_STYLES[normalized] || CURRENCY_BADGE_STYLES['ILS'];
  return `${style.bg} ${style.text} ${style.border} border`;
};

const CURRENCY_CARD_TOP_BORDER: Record<string, string> = {
  ILS: 'border-t-blue-600 dark:border-t-blue-500',
  USD: 'border-t-emerald-600 dark:border-t-emerald-500',
  EUR: 'border-t-amber-600 dark:border-t-amber-500',
  GBP: 'border-t-indigo-600 dark:border-t-indigo-500',
};

const CURRENCY_CARD_ICON_BOX: Record<string, string> = {
  ILS: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  USD: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  EUR: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  GBP: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
};

interface LedgerModalProps {
  onClose: () => void;
  isBusy?: boolean;
  labelledBy: string;
  maxWidthClass?: string;
  closeOnBackdrop?: boolean;
  children: ReactNode;
}

/**
 * Native modal dialog wrapper using HTML `<dialog>` + `showModal()` for
 * top-layer stacking, focus containment, Esc dismissal, and focus restoration.
 */
const LedgerModal: FC<LedgerModalProps> = ({
  onClose,
  isBusy = false,
  labelledBy,
  maxWidthClass = 'max-w-sm',
  closeOnBackdrop = true,
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const pressedOutsideRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  const isPointerOutside = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return false;
    const rect = dialog.getBoundingClientRect();
    return (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );
  };

  return (
    <dialog
      ref={dialogRef}
      dir="rtl"
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        if (!isBusy) onClose();
      }}
      onPointerDown={(e) => {
        pressedOutsideRef.current = isPointerOutside(e);
      }}
      onPointerUp={(e) => {
        if (closeOnBackdrop && !isBusy && pressedOutsideRef.current && isPointerOutside(e)) {
          onClose();
        }
        pressedOutsideRef.current = false;
      }}
      className={`m-auto w-full ${maxWidthClass} max-w-[calc(100vw-2rem)] bg-transparent p-0 border-0 outline-none backdrop:bg-slate-950/60 backdrop:backdrop-blur-xs print:hidden`}
    >
      {children}
    </dialog>
  );
};

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
  /** Currency code for transaction ('ILS' | 'USD' | 'EUR' | 'GBP') */
  currencyCode: CurrencyCode;
  /** Raw debt status (tx.status), null for payments. */
  rawStatus: string | null;
  /** Raw payment method (tx.paymentMethod), null for debts. */
  rawPaymentMethod?: string | null;
  /** Formatted due date for debts, if available. */
  dueDate?: string;
  /** invoice id for printing pdf */
  invoiceId?: number | null;
}

/**
 * Translates backend payment method enum/string into user-friendly Arabic.
 * Specifically maps CreditCard to 'محفظة' so it never displays in English.
 */
function formatPaymentMethodLabel(method: string | null | undefined): string {
  if (!method) return '';
  const normalized = method.trim().toLowerCase().replace(/[\s_-]/g, '');
  if (
    normalized.includes('credit') ||
    normalized.includes('card') ||
    normalized.includes('محفظة') ||
    normalized.includes('بطاقة') ||
    normalized === '3'
  ) {
    return 'محفظة';
  }
  if (
    normalized.includes('transfer') ||
    normalized.includes('bank') ||
    normalized.includes('تحويل') ||
    normalized.includes('بنك') ||
    normalized === '2'
  ) {
    return 'تحويل بنكي';
  }
  if (normalized.includes('cash') || normalized.includes('نقدي') || normalized === '1') {
    return 'نقدي (Cash)';
  }
  return method;
}

/**
 * Translates backend debt status enum/string into user-friendly Arabic.
 */
function formatDebtStatusLabel(status: string | null | undefined): string {
  if (!status) return '';
  const normalized = status.trim().toLowerCase();
  if (normalized === 'paid') return 'مسدد';
  if (normalized === 'partiallypaid') return 'مسدد جزئياً';
  if (normalized === 'unpaid') return 'غير مسدد';
  if (normalized === 'overdue') return 'متأخر';
  return status;
}

/**
 * Treat totalDebt below this as "paid off" for the Delete Customer guard —
 * avoids blocking deletion over a sub-cent floating-point remainder.
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
  avatarBg: 'bg-slate-900 text-white',
  phone: '',
  address: '',
  registrationDate: '',
};

/**
 * The backend has no nationalOrCrId field at all — persisted locally keyed by
 * customer id so it survives save and reload without needing a missing API field.
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
    // Ignore storage failures (e.g. private browsing).
  }
}

export const CustomerDetailsScreen: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<'all' | 'debt' | 'payment'>('all');
  const [selectedCurrencyTab, setSelectedCurrencyTab] = useState<'all' | CurrencyCode>('all');
  const [searchActivityQuery, setSearchActivityQuery] = useState('');
  const [telegramModalCustomer, setTelegramModalCustomer] = useState<{
    id: string;
    name: string;
    phone: string;
    mode: 'generate' | 'regenerate';
    sendViaWhatsApp?: boolean;
  } | null>(null);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [isUnlinkingTelegram, setIsUnlinkingTelegram] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);

  // Customer Data — fetched from GET /api/Customer/getCustomerProfile/{customerId}
  const [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER);
  const [profileTransactions, setProfileTransactions] = useState<CustomerProfileTransactionDto[]>([]);
  const [profileBalances, setProfileBalances] = useState<CustomerCurrencyBalanceDto[]>([]);
  const [posItemsMap, setPosItemsMap] = useState<Record<string, string>>({});
  const fetchedPosIdsRef = useRef<Set<string>>(new Set());
  const [currentBalance, setCurrentBalance] = useState(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(() => Boolean(id));
  const [loadError, setLoadError] = useState<string | null>(() =>
    id ? null : 'معرّف العميل غير موجود.'
  );
  const [reloadNonce, setReloadNonce] = useState(0);

  const reloadCustomerProfile = useCallback(() => {
    if (!id) {
      setIsLoadingProfile(false);
      setLoadError('معرّف العميل غير موجود.');
      return;
    }
    setIsLoadingProfile(true);
    setLoadError(null);
    setReloadNonce((n) => n + 1);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let isCancelled = false;

    getCustomerProfile(id)
      .then((dto) => {
        if (isCancelled) return;
        setCustomer({
          ...mapCustomerProfileToCustomer(dto),
          nationalOrCrId: getStoredNationalId(dto.id),
        });
        setProfileTransactions(dto.transactions);
        setProfileBalances(dto.balances ?? []);
        setCurrentBalance(dto.currentBalance);
        setLoadError(null);
      })
      .catch((err) => {
        if (!isCancelled) {
          setLoadError(toGetCustomerProfileErrorMessage(err));
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingProfile(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [id, reloadNonce]);

  // Load real purchased items from POS API for any debt transactions that have placeholder notes
  useEffect(() => {
    if (!profileTransactions || profileTransactions.length === 0) return;
    let isCancelled = false;

    profileTransactions.forEach((tx) => {
      const isDebt =
        String(tx.type || '').toLowerCase().includes('debt') ||
        String(tx.type || '').includes('دين');
      if (!isDebt) return;

      const desc = String(tx.description || '').trim();
      const isPlaceholder =
        !desc ||
        desc === 'POS Debt Checkout' ||
        desc.toLowerCase().includes('pos debt') ||
        desc === 'معاملة دين' ||
        desc === 'مشتريات بالآجل (نقطة البيع - كاشير)';
      if (!isPlaceholder) return;

      const txId = tx.id || tx.reference;
      if (!txId) return;

      const idStr = String(txId);
      if (fetchedPosIdsRef.current.has(idStr)) return;

      // Skip API request if already cached locally (resolved synchronously in useMemo)
      const cached =
        localStorage.getItem(`debt-notes:${customer.id}:${idStr}`) ||
        localStorage.getItem(`debt-notes:${idStr}`) ||
        localStorage.getItem(`debt-notes:DEBT-${idStr}`);
      if (cached) {
        fetchedPosIdsRef.current.add(idStr);
        return;
      }

      fetchedPosIdsRef.current.add(idStr);
      const lookupId = idStr.startsWith('DEBT-') ? idStr : `DEBT-${idStr}`;

      const persistAndStore = (itemsText: string, detailsId?: string) => {
        if (isCancelled || !itemsText) return;
        setPosItemsMap((prev) => ({
          ...prev,
          [idStr]: itemsText,
          ...(detailsId ? { [detailsId]: itemsText } : {}),
        }));
        try {
          localStorage.setItem(`debt-notes:${customer.id}:${idStr}`, itemsText);
          localStorage.setItem(`debt-notes:${idStr}`, itemsText);
          if (detailsId) {
            localStorage.setItem(`debt-notes:${customer.id}:${detailsId}`, itemsText);
            localStorage.setItem(`debt-notes:${detailsId}`, itemsText);
          }
        } catch {
          // Ignore storage quota errors
        }
      };

      getPosTransactionDetails(lookupId)
        .then((details) => {
          if (details?.items && details.items.length > 0) {
            const itemsText = details.items
              .map((it) => `${it.productName} × ${it.quantity}`)
              .join(' | ');
            persistAndStore(itemsText, details.id);
          }
        })
        .catch(() => {
          const bareNumeric = idStr.replace(/\D/g, '');
          if (bareNumeric && bareNumeric !== idStr) {
            getPosTransactionDetails(bareNumeric)
              .then((details) => {
                if (details?.items && details.items.length > 0) {
                  const itemsText = details.items
                    .map((it) => `${it.productName} × ${it.quantity}`)
                    .join(' | ');
                  persistAndStore(itemsText);
                }
              })
              .catch(() => {
                // Ignore secondary lookup failures
              });
          }
        });
    });

    return () => {
      isCancelled = true;
    };
  }, [profileTransactions, customer.id]);

  // Edit Customer Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    nationalOrCrId: '',
    phoneNumber: '',
    countryCode: '970' as CountryCode,
  });
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    nationalOrCrId?: string;
    phoneNumber?: string;
  }>({});
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type?: ToastType } | null>(() => {
    const state = location.state as { toast?: string } | null;
    return state?.toast ? { message: state.toast, type: 'success' } : null;
  });

  const showToast = useCallback((msg: string, type: ToastType = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === msg ? null : prev));
    }, 4500);
  }, []);

  // Clear one-off navigation toast state so back/forward/refresh won't replay it
  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (!state?.toast) return;
    navigate(location.pathname, { replace: true, state: {} });
    const msg = state.toast;
    const timer = setTimeout(() => {
      setToast((prev) => (prev?.message === msg ? null : prev));
    }, 4500);
    return () => clearTimeout(timer);
  }, [location.pathname, location.state, navigate]);

  // Delete Customer Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Delete Activity Modals State
  const [activityPendingDelete, setActivityPendingDelete] = useState<ActivityItem | null>(null);
  const [debtPendingHardDelete, setDebtPendingHardDelete] = useState<{
    activity: ActivityItem;
    paymentsCount: number;
  } | null>(null);
  const [isDeletingActivity, setIsDeletingActivity] = useState(false);
  const [activityDeleteError, setActivityDeleteError] = useState<string | null>(null);

  const handleEditActivityClick = (act: ActivityItem) => {
    if (act.type === 'payment') {
      if (!act.recordId) {
        showToast('تعذر فتح هذه الدفعة للتعديل: معرّف الدفعة غير متوفر.', 'error');
        return;
      }
      navigate(`/customers/${customer.id}/payments/new`, {
        state: {
          editingPayment: {
            paymentId: act.recordId,
            customerId: customer.id,
            customerFullName: customer.name,
            amount: act.rawAmount,
            date: act.date,
            method: act.rawPaymentMethod || act.badgeText,
            notes: act.description === 'معاملة دفع' ? '' : act.description,
          },
        },
      });
      return;
    }

    if (!act.recordId) {
      showToast('تعذر فتح هذا الدين للتعديل: معرّف الدين غير متوفر.', 'error');
      return;
    }

    const cleanRef = act.reference ? act.reference.trim() : '';
    const digitsRef = cleanRef ? cleanRef.replace(/\D/g, '') : '';
    const cached =
      getEditableDebt(customer.id, cleanRef) ||
      (digitsRef ? getEditableDebt(customer.id, digitsRef) : null) ||
      (digitsRef ? getEditableDebt(customer.id, `DEBT-${digitsRef}`) : null);

    const record =
      cached ??
      ({
        id: String(act.recordId),
        debtNumber: act.reference,
        customerId: customer.id,
        amount: act.rawAmount,
        dueDate: '',
        notes:
          act.description === 'معاملة دين' || act.description === 'POS Debt Checkout'
            ? ''
            : act.description,
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

    return Math.max(customer.totalPaid || 0, transactionsPaid, diffPaid, storedPaid);
  }, [customer, profileTransactions, currentBalance]);

  const confirmDeleteActivity = async () => {
    if (!activityPendingDelete) return;
    setActivityDeleteError(null);

    if (!activityPendingDelete.recordId) {
      const msg =
        activityPendingDelete.type === 'debt'
          ? 'تعذر حذف هذا الدين لعدم توفر معرّف العملية.'
          : 'تعذر حذف هذه الدفعة لعدم توفر معرّف العملية.';
      setActivityDeleteError(msg);
      showToast(msg, 'error');
      return;
    }

    const activity = activityPendingDelete;

    if (activity.type === 'payment') {
      setIsDeletingActivity(true);
      try {
        await deletePayment(activity.recordId);
        setActivityPendingDelete(null);
        setActivityDeleteError(null);
        setStoredTotalPaid(customer.id, Math.max(0, computedTotalPaid - (activity.rawAmount || 0)));
        reloadCustomerProfile();
        showToast('تم حذف الدفعة بنجاح.', 'success');
      } catch (err) {
        const msg = toDeletePaymentErrorMessage(err);
        setActivityDeleteError(msg);
        showToast(msg, 'error');
      } finally {
        setIsDeletingActivity(false);
      }
      return;
    }

    setIsDeletingActivity(true);
    try {
      await deleteDebt(activity.recordId, false);
      setActivityPendingDelete(null);
      setActivityDeleteError(null);
      reloadCustomerProfile();
      showToast('تم حذف الدين بنجاح.', 'success');
    } catch (err) {
      if (isDeleteDebtRequiresConfirmation(err)) {
        setActivityPendingDelete(null);
        setActivityDeleteError(null);
        setDebtPendingHardDelete({
          activity,
          paymentsCount: err.body.paymentsCount ?? 0,
        });
      } else {
        const msg = toDeleteDebtErrorMessage(err);
        setActivityDeleteError(msg);
        showToast(msg, 'error');
      }
    } finally {
      setIsDeletingActivity(false);
    }
  };

  const confirmHardDeleteDebt = async () => {
    if (!debtPendingHardDelete) return;
    const { activity } = debtPendingHardDelete;
    setActivityDeleteError(null);
    setIsDeletingActivity(true);
    try {
      await deleteDebt(activity.recordId, true);
      setDebtPendingHardDelete(null);
      setActivityDeleteError(null);
      reloadCustomerProfile();
      showToast('تم حذف الدين والدفعات المرتبطة به بنجاح.', 'success');
    } catch (err) {
      const msg = toDeleteDebtErrorMessage(err);
      setActivityDeleteError(msg);
      showToast(msg, 'error');
    } finally {
      setIsDeletingActivity(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customer.id) return;
    setDeleteError(null);

    if (customer.totalDebt > DEBT_ZERO_EPSILON) {
      const message = 'لا يمكن حذف هذا العميل، فعليه ديون لم يتم تسديدها بعد.';
      setDeleteError(message);
      showToast(message, 'error');
      return;
    }

    setIsDeletingCustomer(true);
    try {
      await deleteCustomer(customer.id);
      setIsDeleteModalOpen(false);
      navigate(PATHS.CUSTOMERS, { state: { toast: 'تم حذف العميل بنجاح.' } });
    } catch (err) {
      const message = toDeleteCustomerErrorMessage(err);
      setDeleteError(message);
      showToast(message, 'error');
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  const openEditModal = () => {
    const parsed = parseCustomerPhone(customer.phone);
    setEditForm({
      fullName: customer.name,
      nationalOrCrId: customer.nationalOrCrId,
      phoneNumber: parsed.localNumber,
      countryCode: parsed.countryCode,
    });
    setFieldErrors({});
    setSubmitError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetCustomerId = customer.id || id;
    if (!targetCustomerId) {
      const msg = 'معرّف العميل غير متوفر.';
      setSubmitError(msg);
      showToast(msg, 'error');
      return;
    }

    const trimmedName = editForm.fullName.trim();
    const trimmedPhone = editForm.phoneNumber.trim();
    const trimmedNationalId = editForm.nationalOrCrId.trim();

    const fullNameError = validateCustomerFullName(trimmedName);
    const nationalIdError = validateCustomerNationalId(trimmedNationalId);
    const phoneError = validateCustomerPhoneNumber(trimmedPhone);

    const errors: typeof fieldErrors = {};
    if (fullNameError) errors.fullName = fullNameError;
    if (nationalIdError) errors.nationalOrCrId = nationalIdError;
    if (phoneError) errors.phoneNumber = phoneError;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitError(null);
    setIsSavingCustomer(true);
    try {
      const fullPhone = formatFullCustomerPhone(editForm.countryCode, trimmedPhone);

      const dto = await updateCustomer(targetCustomerId, {
        fullName: trimmedName,
        phoneNumber: fullPhone,
        address: customer.address ?? '',
        nationalId: trimmedNationalId,
      });

      setStoredNationalId(targetCustomerId, trimmedNationalId);

      setCustomer((prev) => ({
        ...prev,
        name: dto.fullName || trimmedName,
        phone: dto.phoneNumber || fullPhone,
        address: dto.address || prev.address,
        totalDebt: dto.totalDebt || prev.totalDebt,
        totalPaid: dto.totalPaid || prev.totalPaid,
        nationalOrCrId: trimmedNationalId,
      }));

      setIsEditModalOpen(false);
      showToast('تم تحديث بيانات العميل بنجاح.', 'success');
      reloadCustomerProfile();
    } catch (err) {
      if (err instanceof ApiError && isDuplicatePhoneNumberError(err)) {
        const dupMsg = 'يوجد عميل آخر مسجل بنفس رقم الجوال.';
        setFieldErrors((p) => ({ ...p, phoneNumber: dupMsg }));
        setSubmitError(dupMsg);
        showToast(dupMsg, 'error');
      } else {
        const message = toUpdateCustomerErrorMessage(err);
        setSubmitError(message);
        showToast(message, 'error');
      }
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const confirmUnlinkTelegram = async () => {
    setUnlinkError(null);
    setIsUnlinkingTelegram(true);
    try {
      await unlinkTelegram(customer.id);
      setCustomer((prev) => ({ ...prev, isTelegramLinked: false }));
      setShowUnlinkConfirm(false);
      showToast('تم فك ربط Telegram عن العميل بنجاح.', 'success');
    } catch (err) {
      const message = toTelegramUnlinkErrorMessage(err);
      setUnlinkError(message);
      showToast(message, 'error');
    } finally {
      setIsUnlinkingTelegram(false);
    }
  };

  // Activity Log — derived from transaction history returned by getCustomerProfile
  const activities: ActivityItem[] = useMemo(() => {
    return profileTransactions.map((tx, index) => {
      const isDebt =
        String(tx.type || '').toLowerCase().includes('debt') ||
        String(tx.type || '').includes('دين');
      const sign = isDebt ? '+' : '-';
      const currencyCode = getTransactionCurrencyCode(tx as TransactionWithFallbackCurrency);
      const cleanRef = tx.reference ? tx.reference.trim() : '';
      const digitsRef = cleanRef ? cleanRef.replace(/\D/g, '') : '';
      const txIdStr = tx.id ? String(tx.id) : '';
      const digitsFromId = txIdStr ? txIdStr.replace(/\D/g, '') : '';
      const invoiceIdStr = tx.invoiceId ? String(tx.invoiceId) : '';

      const candidateKeys = [
        txIdStr,
        cleanRef,
        digitsRef,
        digitsFromId,
        invoiceIdStr,
        txIdStr ? `DEBT-${txIdStr}` : '',
        cleanRef ? `DEBT-${cleanRef}` : '',
        digitsRef ? `DEBT-${digitsRef}` : '',
      ].filter(Boolean);

      let storedNotes: string | null = null;
      for (const k of candidateKeys) {
        storedNotes =
          localStorage.getItem(`debt-notes:${customer.id}:${k}`) ||
          localStorage.getItem(`debt-notes:${k}`);
        if (storedNotes) break;
      }
      if (!storedNotes && isDebt && (posItemsMap[txIdStr] || (cleanRef && posItemsMap[cleanRef]))) {
        storedNotes = posItemsMap[txIdStr] || posItemsMap[cleanRef];
      }
      if (!storedNotes && isDebt && index === 0) {
        storedNotes = localStorage.getItem(`debt-notes-latest:${customer.id}`);
      }

      let cachedDebt: EditableDebtRecord | null = null;
      for (const k of candidateKeys) {
        cachedDebt = getEditableDebt(customer.id, k);
        if (cachedDebt) break;
      }

      const rawDueDate = isDebt ? tx.dueDate || cachedDebt?.dueDate : null;
      const formattedDueDate = rawDueDate ? formatApiDate(rawDueDate) : undefined;

      let resolvedDescription = tx.description ? tx.description.trim() : '';
      const isPlaceholder =
        !resolvedDescription ||
        resolvedDescription === 'POS Debt Checkout' ||
        resolvedDescription.toLowerCase().includes('pos debt') ||
        resolvedDescription === 'مشتريات بالآجل (نقطة البيع - كاشير)' ||
        resolvedDescription === 'معاملة دين';

      if (isPlaceholder) {
        if (cachedDebt?.notes) {
          resolvedDescription = cachedDebt.notes;
        } else if (storedNotes) {
          resolvedDescription = storedNotes;
        } else if (posItemsMap[txIdStr] || (cleanRef && posItemsMap[cleanRef])) {
          resolvedDescription = posItemsMap[txIdStr] || posItemsMap[cleanRef];
        } else if (resolvedDescription === 'POS Debt Checkout') {
          resolvedDescription = 'مشتريات بالآجل (نقطة البيع - كاشير)';
        } else if (isDebt) {
          resolvedDescription = 'معاملة دين';
        } else {
          resolvedDescription = 'معاملة دفع';
        }
      }

      return {
        id: `${tx.reference || (isDebt ? 'debt' : 'payment')}-${index}`,
        type: isDebt ? 'debt' : 'payment',
        title: isDebt
          ? `دين جديد${tx.reference ? ` - ${tx.reference}` : ''}`
          : `دفعة مستلمة${tx.reference ? ` - ${tx.reference}` : ''}`,
        badgeText:
          (isDebt
            ? formatDebtStatusLabel(tx.status)
            : formatPaymentMethodLabel(tx.paymentMethod)) || undefined,
        badgeStyle: isDebt
          ? 'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        amount: `${sign}${tx.amount.toFixed(2)}`,
        amountColor: isDebt
          ? 'text-rose-700 dark:text-rose-400'
          : 'text-emerald-700 dark:text-emerald-400',
        description: resolvedDescription,
        date: formatApiDate(tx.date, true),
        dueDate: formattedDueDate,
        balanceLabel: `${tx.balance.toFixed(2)} ${getCurrencyConfig(currencyCode).symbol}`,
        reference: tx.reference,
        recordId:
          tx.id ||
          (isDebt && tx.reference ? Number(getEditableDebt(customer.id, tx.reference)?.id) : undefined) ||
          0,
        rawAmount: tx.amount,
        currencyCode,
        rawStatus: isDebt ? tx.status : null,
        rawPaymentMethod: isDebt ? null : tx.paymentMethod,
        iconBg: isDebt
          ? 'bg-[#09152B] text-white dark:bg-blue-600'
          : 'bg-emerald-700 text-white dark:bg-emerald-600',
        invoiceId: tx.invoiceId,
      };
    });
  }, [profileTransactions, customer.id, posItemsMap]);

  const activityCounts = useMemo(() => {
    let debts = 0;
    let payments = 0;
    for (const act of activities) {
      if (act.type === 'debt') debts += 1;
      else if (act.type === 'payment') payments += 1;
    }
    return {
      all: activities.length,
      debt: debts,
      payment: payments,
    };
  }, [activities]);

  // Latest payment record, used in the debt banner below.
  const lastPayment = useMemo(() => {
    return profileTransactions.find((tx) => {
      const typeStr = String(tx.type || '').toLowerCase();
      return typeStr.includes('payment') || typeStr.includes('pay') || typeStr.includes('دفعة');
    });
  }, [profileTransactions]);

  // Strict Accounting Multi-Currency Breakdown (ILS, USD, EUR, GBP never merged)
  const currencyBreakdown = useMemo(() => {
    const currencies: CurrencyCode[] = ALL_CURRENCY_CODES;

    // 1. Primary source of truth: backend balances[]
    if (profileBalances && profileBalances.length > 0) {
      const items = currencies.map((c) => {
        const found = profileBalances.find((b) => normalizeCurrencyCode(b.currencyCode) === c);
        const totalDebt = found?.totalDebt ?? 0;
        const totalPaid = found?.totalPaid ?? 0;
        const remaining = found?.currentBalance ?? Math.max(0, totalDebt - totalPaid);
        return {
          currency: c,
          config: getCurrencyConfig(c),
          totalDebt,
          totalPaid,
          remaining,
          hasActivity: totalDebt > 0 || totalPaid > 0 || remaining > 0,
        };
      });

      const activeCurrencies = items.filter((i) => i.hasActivity);
      return {
        items,
        activeCurrencies:
          activeCurrencies.length > 0
            ? activeCurrencies
            : [
                {
                  currency: 'ILS' as const,
                  config: getCurrencyConfig('ILS'),
                  totalDebt: customer.totalDebt || 0,
                  totalPaid: computedTotalPaid || 0,
                  remaining: currentBalance || 0,
                  hasActivity: true,
                },
              ],
      };
    }

    // 2. Fallback: calculate from profile transactions
    const debtItems: { amount: number; currency: string }[] = [];
    const paymentItems: { amount: number; currency: string }[] = [];

    profileTransactions.forEach((tx) => {
      const typeStr = String(tx.type || '').toLowerCase();
      const isDebt = typeStr.includes('debt') || typeStr.includes('دين');
      const code = getTransactionCurrencyCode(tx as TransactionWithFallbackCurrency);
      if (isDebt) {
        debtItems.push({ amount: tx.amount, currency: code });
      } else {
        paymentItems.push({ amount: tx.amount, currency: code });
      }
    });

    const debtsByCur = groupTotalsByCurrency(debtItems);
    const paymentsByCur = groupTotalsByCurrency(paymentItems);

    const items = currencies.map((c) => {
      const totalDebt = debtsByCur[c]?.totalDebts ?? 0;
      const totalPaid = paymentsByCur[c]?.totalPayments ?? 0;
      const remaining = Math.max(0, totalDebt - totalPaid);
      return {
        currency: c,
        config: getCurrencyConfig(c),
        totalDebt,
        totalPaid,
        remaining,
        hasActivity: totalDebt > 0 || totalPaid > 0,
      };
    });

    const activeCurrencies = items.filter((i) => i.hasActivity);
    return {
      items,
      activeCurrencies:
        activeCurrencies.length > 0
          ? activeCurrencies
          : [
              {
                currency: 'ILS' as const,
                config: getCurrencyConfig('ILS'),
                totalDebt: customer.totalDebt || 0,
                totalPaid: computedTotalPaid || 0,
                remaining: currentBalance || 0,
                hasActivity: true,
              },
            ],
    };
  }, [profileBalances, profileTransactions, customer.totalDebt, computedTotalPaid, currentBalance]);

  const primaryCurrency: CurrencyCode = currencyBreakdown.activeCurrencies[0]?.currency || 'ILS';

  // Filter activities based on tab, currency, and search query
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (activeActivityTab !== 'all' && act.type !== activeActivityTab) {
        return false;
      }
      if (selectedCurrencyTab !== 'all' && act.currencyCode !== selectedCurrencyTab) {
        return false;
      }
      if (searchActivityQuery.trim()) {
        const q = searchActivityQuery.toLowerCase().trim();
        return (
          act.title.toLowerCase().includes(q) ||
          act.description.toLowerCase().includes(q) ||
          (act.amount && act.amount.includes(q)) ||
          act.currencyCode.toLowerCase().includes(q) ||
          (act.reference && act.reference.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activities, activeActivityTab, selectedCurrencyTab, searchActivityQuery]);

  const handlePrintStatement = () => {
    if (isLoadingProfile) {
      showToast('يرجى انتظار اكتمال تحميل بيانات العميل قبل الطباعة.', 'error');
      return;
    }
    if (loadError) {
      showToast('لا يمكن طباعة كشف الحساب قبل حل خطأ تحميل بيانات العميل.', 'error');
      return;
    }
    window.print();
  };

  return (
    <div
      className="min-h-screen bg-[#F5F6F8] dark:bg-[#0B0F19] text-[#09152B] dark:text-slate-100 font-cairo antialiased flex print:bg-white print:text-slate-900 print:block"
      dir="rtl"
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="customers"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300 print:mr-0 print:p-0">
        {/* Toast Notification */}
        <Toast
          message={toast?.message ?? null}
          type={toast?.type}
          onClose={() => setToast(null)}
        />

        {/* Unified Top Header Bar */}
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          searchQuery={searchActivityQuery}
          onSearchChange={setSearchActivityQuery}
          searchPlaceholder="بحث في سجل معاملات العميل..."
          className="print:hidden"
        />

        {/* Page Main Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none print:w-full">
          {/* Breadcrumb / Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => navigate(PATHS.CUSTOMERS)}
                  className="text-slate-600 dark:text-slate-400 hover:text-[#09152B] dark:hover:text-white transition-colors inline-flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>العملاء</span>
                </button>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="text-[#09152B] dark:text-slate-200 font-bold">ملف العميل</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-cairo text-[#09152B] dark:text-white tracking-tight mt-1">
                ملف العميل
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                عرض وإدارة السجل المالي والمديونيات وسندات العميل
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={openEditModal}
                disabled={isLoadingProfile || Boolean(loadError) || !customer.id}
                className="px-4 py-2 bg-[#09152B] hover:bg-[#122344] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>تحديث بيانات العميل</span>
              </button>

              <button
                type="button"
                onClick={handlePrintStatement}
                disabled={isLoadingProfile || Boolean(loadError)}
                className="px-4 py-2 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-[#09152B] dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>طباعة / تحميل السجل</span>
              </button>
            </div>
          </div>

          {/* Profile Load Status */}
          {loadError && (
            <div
              role="alert"
              className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm px-4 py-3 flex items-center justify-between gap-3 print:hidden"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-semibold">{loadError}</span>
              </div>
              <button
                type="button"
                onClick={reloadCustomerProfile}
                className="shrink-0 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {isLoadingProfile && !loadError && (
            <div className="rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-sm px-4 py-3 text-center print:hidden font-medium">
              جاري تحميل بيانات ملف العميل وسجل معاملاته...
            </div>
          )}

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block print:w-full">
            {/* RIGHT COLUMN: Client Profile Card & Actions */}
            <div className="lg:col-span-4 space-y-4 print:hidden">
              {/* Profile Card */}
              <div className="bg-white dark:bg-[#111827] rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-4">
                  {isLoadingProfile ? (
                    <div className="w-20 h-20 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-[#09152B] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-white font-extrabold flex items-center justify-center text-2xl font-cairo">
                      {customer.avatarLetter || customer.name?.trim()?.charAt(0) || 'ع'}
                    </div>
                  )}
                  {!isLoadingProfile && !loadError && (
                    <div
                      title="عميل مسجل"
                      className="absolute -bottom-1.5 -left-1.5 w-6 h-6 bg-emerald-600 rounded-lg border-2 border-white dark:border-[#111827] flex items-center justify-center text-white"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <h2 className="text-lg font-extrabold font-cairo text-[#09152B] dark:text-white">
                  {isLoadingProfile ? 'جاري التحميل...' : customer.name || 'بدون اسم'}
                </h2>

                {/* National ID Pill */}
                {!isLoadingProfile && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>هوية:</span>
                    <span className="font-jakarta tabular-nums" dir="ltr">
                      {customer.nationalOrCrId || 'غير متوفر'}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="w-full border-t border-slate-200 dark:border-slate-800 my-5" />

                {/* Info List */}
                <div className="w-full space-y-3.5 text-xs sm:text-sm">
                  {/* Phone */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>رقم الهاتف</span>
                    </div>
                    <span
                      className="font-bold text-[#09152B] dark:text-slate-100 font-jakarta tabular-nums"
                      dir="ltr"
                    >
                      {isLoadingProfile ? '—' : customer.phone || 'غير متوفر'}
                    </span>
                  </div>

                  {/* Registration Date */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>تاريخ التسجيل</span>
                    </div>
                    <span
                      className="font-bold text-[#09152B] dark:text-slate-100 font-jakarta tabular-nums"
                      dir="ltr"
                    >
                      {isLoadingProfile
                        ? '—'
                        : customer.registrationDate
                        ? formatApiDate(customer.registrationDate)
                        : 'غير متوفر'}
                    </span>
                  </div>

                  {/* Total Paid */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium shrink-0">
                      <Check className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>إجمالي المدفوع</span>
                    </div>
                    {isLoadingProfile ? (
                      <span className="font-jakarta text-slate-400">—</span>
                    ) : currencyBreakdown.activeCurrencies.length > 1 ? (
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {currencyBreakdown.activeCurrencies.map((c) => (
                          <span
                            key={c.currency}
                            dir="ltr"
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-jakarta tabular-nums ${getCurrencyBadgeClasses(
                              c.currency
                            )}`}
                          >
                            {formatCurrency(c.totalPaid, c.currency)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span
                        className="font-bold text-emerald-700 dark:text-emerald-400 font-jakarta tabular-nums"
                        dir="ltr"
                      >
                        {formatCurrency(computedTotalPaid, primaryCurrency)}
                      </span>
                    )}
                  </div>

                  {/* Total Debt */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium shrink-0">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>إجمالي المديونية</span>
                    </div>
                    {isLoadingProfile ? (
                      <span className="font-jakarta text-slate-400">—</span>
                    ) : currencyBreakdown.activeCurrencies.length > 1 ? (
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {currencyBreakdown.activeCurrencies.map((c) => (
                          <span
                            key={c.currency}
                            dir="ltr"
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-jakarta tabular-nums border ${
                              c.remaining > 0
                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {formatCurrency(c.remaining, c.currency)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span
                        className={`font-bold font-jakarta tabular-nums ${
                          currentBalance > DEBT_ZERO_EPSILON
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                        dir="ltr"
                      >
                        {formatCurrency(currentBalance, primaryCurrency)}
                      </span>
                    )}
                  </div>

                  {/* Credit Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                      <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>حالة الحساب</span>
                    </div>
                    {isLoadingProfile ? (
                      <span className="text-slate-400">—</span>
                    ) : currentBalance > DEBT_ZERO_EPSILON ? (
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 rounded-md text-xs font-bold">
                        رصيد قائم
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 rounded-md text-xs font-bold">
                        مسدد بالكامل
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Stack */}
              <div className="space-y-2.5">
                {/* 1. Record New Payment Button */}
                <button
                  type="button"
                  onClick={() => navigate(`/customers/${customer.id}/payments/new`)}
                  disabled={!customer.id}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="w-full py-2.5 px-4 bg-[#09152B] hover:bg-[#122344] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة دين جديد</span>
                </button>

                {/* 3. Export Statement PDF */}
                <button
                  type="button"
                  onClick={handlePrintStatement}
                  disabled={isLoadingProfile || Boolean(loadError)}
                  className="w-full py-2.5 px-4 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-[#09152B] dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>تصدير كشف حساب (PDF)</span>
                </button>

                {/* Telegram Card */}
                <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-700 dark:text-sky-400 shrink-0">
                        <QrCode className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#09152B] dark:text-white font-cairo">
                          ربط تيليجرام
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          كشف الحساب وتنبيهات الديون
                        </div>
                      </div>
                    </div>
                    {customer.isTelegramLinked ? (
                      <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-md text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                        مرتبط
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700">
                        غير مرتبط
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {customer.isTelegramLinked
                      ? 'العميل مرتبط ببوت وثّق على تيليجرام ويستلم كشوفات الحساب وتنبيهات الديون تلقائياً.'
                      : 'أنشئ رمز QR أو رابطاً مباشراً ليربط العميل حسابه على تيليجرام ويتابع ديونه بنفسه.'}
                  </p>

                  {customer.isTelegramLinked ? (
                    <div className="grid grid-cols-2 gap-2.5 mt-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setUnlinkError(null);
                          setShowUnlinkConfirm(true);
                        }}
                        disabled={!customer.id}
                        className="py-2 px-3 rounded-lg text-rose-700 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>إلغاء الربط</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setTelegramModalCustomer({
                            id: customer.id,
                            name: customer.name,
                            phone: customer.phone || '',
                            mode: 'regenerate',
                            sendViaWhatsApp: false,
                          })
                        }
                        disabled={!customer.id}
                        className="py-2 px-3 rounded-lg text-sky-700 dark:text-sky-300 font-bold text-xs border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-950/70 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>تجديد الرابط</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setTelegramModalCustomer({
                          id: customer.id,
                          name: customer.name,
                          phone: customer.phone || '',
                          mode: 'generate',
                          sendViaWhatsApp: false,
                        })
                      }
                      disabled={!customer.id}
                      className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors mt-auto cursor-pointer disabled:opacity-50"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>عرض رمز QR ورابط تيليجرام</span>
                    </button>
                  )}
                </div>

                {/* 4. Delete Customer Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (customer.totalDebt > DEBT_ZERO_EPSILON) {
                      showToast('لا يمكن حذف هذا العميل، فعليه ديون لم يتم تسديدها بعد.', 'error');
                      return;
                    }
                    setDeleteError(null);
                    setIsDeleteModalOpen(true);
                  }}
                  disabled={!customer.id || isLoadingProfile}
                  className="w-full py-2.5 px-4 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900/70 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف العميل</span>
                </button>
              </div>
            </div>

            {/* LEFT COLUMN: Financial Activity Log & Total Debt Banner */}
            <div className="lg:col-span-8 space-y-6 print:w-full print:space-y-4 print:m-0 print:p-0">
              {/* Financial Activity Log Card */}
              <div className="bg-white dark:bg-[#111827] rounded-xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 print:border print:border-slate-300 print:rounded-xl print:p-6 print:shadow-none">
                {/* Print-Only Header */}
                <div
                  className="hidden print:flex items-center justify-between pb-4 border-b-2 border-slate-300"
                  dir="rtl"
                >
                  <div>
                    <h2 className="text-xl font-extrabold font-cairo text-[#09152B]">
                      سجل النشاط المالي وكشف الحساب
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-slate-700 mt-1 font-cairo">
                      <span>
                        <strong>العميل:</strong> {customer.name || 'عميل'}
                      </span>
                      <span>•</span>
                      <span>
                        <strong>الهاتف:</strong>{' '}
                        <span className="font-jakarta tabular-nums" dir="ltr">
                          {customer.phone || 'غير متوفر'}
                        </span>
                      </span>
                      <span>•</span>
                      <span>
                        <strong>رقم الهوية:</strong>{' '}
                        <span className="font-jakarta tabular-nums" dir="ltr">
                          {customer.nationalOrCrId || 'غير متوفر'}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="text-left text-xs text-slate-600 font-jakarta tabular-nums">
                    <span className="font-bold text-[#09152B] block font-cairo text-sm">
                      منصة وثّق
                    </span>
                    <span dir="ltr">{formatApiDate(new Date().toISOString())}</span>
                  </div>
                </div>

                {/* Print-Only Multi-Currency Summary Table */}
                <div
                  className="hidden print:block my-4 border border-slate-300 rounded-xl overflow-hidden"
                  dir="rtl"
                >
                  <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-900 border-b border-slate-300">
                    جدول مطابقة الأرصدة والذمم المالية حسب العملة
                  </div>
                  <table className="w-full text-right text-xs border-separate border-spacing-0">
                    <caption className="sr-only">
                      ملخص الأرصدة والديون والمدفوعات حسب العملة
                    </caption>
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th scope="col" className="p-2.5 font-bold text-slate-900">
                          العملة
                        </th>
                        <th scope="col" className="p-2.5 font-bold text-slate-900">
                          إجمالي الديون
                        </th>
                        <th scope="col" className="p-2.5 font-bold text-slate-900">
                          إجمالي المدفوعات
                        </th>
                        <th scope="col" className="p-2.5 font-bold text-slate-900">
                          الرصيد المتبقي
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {currencyBreakdown.activeCurrencies.map((c) => (
                        <tr key={c.currency}>
                          <td className="p-2.5 font-bold font-jakarta">
                            {c.config.labelArFull} ({c.currency} {c.config.symbol})
                          </td>
                          <td className="p-2.5 font-jakarta tabular-nums" dir="ltr">
                            {formatCurrency(c.totalDebt, c.currency)}
                          </td>
                          <td
                            className="p-2.5 font-jakarta tabular-nums text-emerald-700"
                            dir="ltr"
                          >
                            {formatCurrency(c.totalPaid, c.currency)}
                          </td>
                          <td
                            className="p-2.5 font-jakarta tabular-nums font-bold text-rose-700"
                            dir="ltr"
                          >
                            {formatCurrency(c.remaining, c.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* On-Screen Multi-Currency Balances Cards */}
                {currencyBreakdown.activeCurrencies.length > 1 && (
                  <div className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 print:hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 mb-4 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2.5 font-cairo">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#09152B] dark:text-blue-400 flex items-center justify-center">
                          <Coins className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-extrabold text-[#09152B] dark:text-white leading-tight">
                            الأرصدة والذمم المالية حسب العملة
                          </h3>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                            كشف تفصيلي بالأرصدة المستحقة والمسددة لكل عملة
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-[#09152B] dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-jakarta tabular-nums">
                        {currencyBreakdown.activeCurrencies.length} عملات نشطة
                      </span>
                    </div>

                    <div
                      className={`grid ${
                        currencyBreakdown.activeCurrencies.length === 2
                          ? 'grid-cols-1 sm:grid-cols-2'
                          : currencyBreakdown.activeCurrencies.length === 3
                          ? 'grid-cols-1 sm:grid-cols-3'
                          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                      } gap-3.5`}
                    >
                      {currencyBreakdown.activeCurrencies.map((c) => {
                        const topBorder =
                          CURRENCY_CARD_TOP_BORDER[c.currency] || 'border-t-slate-600';
                        const iconBox =
                          CURRENCY_CARD_ICON_BOX[c.currency] ||
                          'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
                        const paidPercent =
                          c.totalDebt > 0
                            ? Math.min(100, Math.max(0, Math.round((c.totalPaid / c.totalDebt) * 100)))
                            : c.remaining === 0 && c.totalPaid > 0
                            ? 100
                            : 0;

                        return (
                          <div
                            key={c.currency}
                            className={`rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 border-t-2 ${topBorder} p-4 flex flex-col justify-between`}
                          >
                            {/* Header Row: Currency Name & Status Pill */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-jakarta text-sm ${iconBox}`}
                                >
                                  {c.config.symbol}
                                </div>
                                <div>
                                  <h4 className="text-sm font-extrabold text-[#09152B] dark:text-white font-cairo leading-tight">
                                    {c.config.labelArFull}
                                  </h4>
                                  <span className="text-[11px] font-jakarta font-bold text-slate-500 dark:text-slate-400 block mt-0.5">
                                    {c.currency} ({c.config.symbol})
                                  </span>
                                </div>
                              </div>

                              {c.remaining > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  مستحق
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <Check className="w-3 h-3" />
                                  مسدد
                                </span>
                              )}
                            </div>

                            {/* Hero Value: Remaining Balance */}
                            <div className="bg-slate-50 dark:bg-slate-900/70 rounded-lg p-3 border border-slate-200/80 dark:border-slate-800 mb-3">
                              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">
                                <span>المتبقي:</span>
                                {c.totalDebt > 0 && (
                                  <span className="text-[11px] font-bold font-jakarta tabular-nums">
                                    سُدد {paidPercent}%
                                  </span>
                                )}
                              </div>
                              <div className="flex items-baseline justify-between" dir="ltr">
                                <span
                                  className={`text-xl sm:text-2xl font-extrabold font-jakarta tabular-nums tracking-tight ${
                                    c.remaining > 0
                                      ? 'text-rose-700 dark:text-rose-400'
                                      : 'text-[#09152B] dark:text-slate-100'
                                  }`}
                                >
                                  {formatCurrency(c.remaining, c.currency)}
                                </span>
                              </div>

                              {c.totalDebt > 0 && (
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      c.remaining === 0 ? 'bg-emerald-600' : 'bg-[#09152B] dark:bg-blue-500'
                                    }`}
                                    style={{ width: `${paidPercent}%` }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Sub-Metrics */}
                            <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-slate-200 dark:border-slate-800">
                              <div className="bg-slate-50/70 dark:bg-slate-900/50 rounded-lg p-2 border border-slate-200/70 dark:border-slate-800">
                                <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">
                                  إجمالي الدين
                                </span>
                                <span
                                  className="font-bold font-jakarta tabular-nums text-[#09152B] dark:text-slate-100 text-xs mt-0.5 block"
                                  dir="ltr"
                                >
                                  {formatCurrency(c.totalDebt, c.currency)}
                                </span>
                              </div>
                              <div className="bg-slate-50/70 dark:bg-slate-900/50 rounded-lg p-2 border border-slate-200/70 dark:border-slate-800">
                                <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">
                                  إجمالي المسدد
                                </span>
                                <span
                                  className="font-bold font-jakarta tabular-nums text-emerald-700 dark:text-emerald-400 text-xs mt-0.5 block"
                                  dir="ltr"
                                >
                                  {formatCurrency(c.totalPaid, c.currency)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Header with Title and Filter Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg sm:text-xl font-extrabold font-cairo text-[#09152B] dark:text-white">
                      سجل النشاط المالي
                    </h3>
                    <span className="text-xs text-[#09152B] dark:text-slate-200 font-bold font-jakarta tabular-nums px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {filteredActivities.length}
                    </span>
                  </div>

                  {/* Filter Controls */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Activity Type Tabs */}
                    <div
                      role="tablist"
                      aria-label="تصفية حسب نوع العملية"
                      className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full"
                    >
                      {(
                        [
                          { id: 'all', label: 'الكل', count: activityCounts.all },
                          { id: 'debt', label: 'الديون', count: activityCounts.debt },
                          { id: 'payment', label: 'المدفوعات', count: activityCounts.payment },
                        ] as const
                      ).map((tab) => {
                        const isSelected = activeActivityTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            onClick={() => setActiveActivityTab(tab.id)}
                            className={`flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 border ${
                              isSelected
                                ? 'bg-white dark:bg-[#111827] text-[#09152B] dark:text-white border-slate-300 dark:border-slate-600 shadow-2xs'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-[#09152B] dark:hover:text-white'
                            }`}
                          >
                            <span>{tab.label}</span>
                            <span className="text-[11px] font-jakarta tabular-nums opacity-75">
                              ({tab.count})
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Currency Filter Tabs */}
                    {currencyBreakdown.activeCurrencies.length > 1 && (
                      <div
                        role="tablist"
                        aria-label="تصفية حسب العملة"
                        className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full"
                      >
                        <button
                          type="button"
                          role="tab"
                          aria-selected={selectedCurrencyTab === 'all'}
                          onClick={() => setSelectedCurrencyTab('all')}
                          className={`flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                            selectedCurrencyTab === 'all'
                              ? 'bg-white dark:bg-[#111827] text-[#09152B] dark:text-white border-slate-300 dark:border-slate-600 shadow-2xs'
                              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-[#09152B] dark:hover:text-white'
                          }`}
                        >
                          كل العملات
                        </button>
                        {currencyBreakdown.activeCurrencies.map((c) => {
                          const isSelected = selectedCurrencyTab === c.currency;
                          return (
                            <button
                              key={c.currency}
                              type="button"
                              role="tab"
                              aria-selected={isSelected}
                              onClick={() => setSelectedCurrencyTab(c.currency)}
                              className={`flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer border ${
                                isSelected
                                  ? 'bg-white dark:bg-[#111827] text-[#09152B] dark:text-white border-slate-300 dark:border-slate-600 shadow-2xs'
                                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-[#09152B] dark:hover:text-white'
                              }`}
                            >
                              <span className="font-jakarta">{c.config.symbol}</span>
                              <span>{c.config.labelAr}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline Items */}
                {isLoadingProfile ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                        <div className="flex-1 rounded-xl h-24 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800" />
                      </div>
                    ))}
                  </div>
                ) : filteredActivities.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                    <p className="text-sm font-semibold">
                      {activities.length > 0
                        ? 'لا توجد معاملات تطابق خيارات التصفية أو البحث الحالية.'
                        : 'لا توجد معاملات مسجلة لهذا العميل حتى الآن.'}
                    </p>
                  </div>
                ) : (
                  <div className="relative space-y-4 before:absolute before:top-4 before:bottom-4 before:right-5 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
                    {filteredActivities.map((act) => (
                      <div key={act.id} className="relative flex items-start gap-3.5 sm:gap-4">
                        {/* Timeline Icon Node */}
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 z-10 border border-white dark:border-[#111827] ${act.iconBg}`}
                        >
                          {act.type === 'debt' && <Plus className="w-4.5 h-4.5 stroke-[2.5]" />}
                          {act.type === 'payment' && <Check className="w-4.5 h-4.5 stroke-[2.5]" />}
                          {act.type === 'alert' && (
                            <AlertTriangle className="w-4.5 h-4.5 text-slate-600 dark:text-slate-400" />
                          )}
                        </div>

                        {/* Content Card */}
                        <div
                          className={`flex-1 rounded-xl p-4 transition-colors ${
                            act.type === 'alert'
                              ? 'bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700'
                              : 'bg-white dark:bg-[#0F172A]/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[#09152B] dark:text-white text-sm sm:text-base font-cairo">
                                {act.title}
                              </span>
                              {act.badgeText && (
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${act.badgeStyle}`}
                                >
                                  {act.badgeText}
                                </span>
                              )}
                            </div>

                            {/* Amount + Row Actions */}
                            <div className="flex items-center gap-3 flex-wrap justify-between sm:justify-end">
                              {act.amount && (
                                <div className="text-left" dir="ltr">
                                  <div className="flex items-center gap-1.5 justify-end">
                                    <span
                                      className={`text-base sm:text-lg font-extrabold font-jakarta tabular-nums ${act.amountColor}`}
                                    >
                                      {act.type === 'debt' ? '+' : '-'}
                                      {act.rawAmount.toFixed(2)}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-jakarta ${getCurrencyBadgeClasses(
                                        act.currencyCode
                                      )}`}
                                    >
                                      {getCurrencyConfig(act.currencyCode).symbol} {act.currencyCode}
                                    </span>
                                  </div>
                                  <span
                                    className="text-[10px] text-slate-500 dark:text-slate-400 block font-cairo mt-0.5 text-right"
                                    dir="rtl"
                                  >
                                    {getCurrencyConfig(act.currencyCode).labelArFull}
                                  </span>
                                </div>
                              )}

                              {act.type !== 'alert' && (
                                <div className="flex items-center gap-1.5 print:hidden">
                                  {act.type === 'debt' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigate(`/customers/${customer.id}/payments/new`, {
                                          state: {
                                            targetDebt: {
                                              id: act.recordId,
                                              reference: act.reference,
                                              amount: act.rawAmount,
                                              currencyCode: act.currencyCode,
                                            },
                                          },
                                        });
                                      }}
                                      aria-label={`تسجيل دفعة لـ ${act.title}`}
                                      title="تسجيل دفعة لهذا الدين"
                                      className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                      <CreditCard className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {act.type === 'debt' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigate(
                                          `/debts/${act.recordId || act.reference || 'UNKNOWN'}/invoice`,
                                          {
                                            state: {
                                              debt: {
                                                id: String(act.recordId),
                                                invoiceId: act.invoiceId || undefined,
                                                invoiceNumber: `INV-DEBT-${
                                                  act.reference || act.recordId || 'UNKNOWN'
                                                }`,
                                                customerId: customer.id,
                                                customerName: customer.name,
                                                customerNationalId: customer.nationalOrCrId,
                                                customerPhone: customer.phone,
                                                customerRegistrationDate: customer.registrationDate,
                                                fileOpenDate: customer.registrationDate,
                                                invoiceAmount: act.rawAmount,
                                                issueDate: act.date,
                                                dueDate: act.dueDate,
                                                currency: act.currencyCode,
                                                notes: act.description,
                                              },
                                            },
                                          }
                                        );
                                      }}
                                      aria-label={`عرض سند إثبات الدين ${act.title}`}
                                      title="عرض سند إثبات الدين"
                                      className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {act.type === 'payment' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigate(
                                          `/payments/${act.recordId || act.reference || '4821'}/receipt`,
                                          {
                                            state: {
                                              payment: {
                                                id: String(act.recordId),
                                                invoiceId: act.invoiceId || undefined,
                                                customerId: customer.id,
                                                receiptNumber: act.reference,
                                                customerName: customer.name,
                                                phone: customer.phone,
                                                nationalId: customer.nationalOrCrId,
                                                amount: act.rawAmount,
                                                date: act.date,
                                                method: act.rawPaymentMethod || 'نقداً',
                                                remainingDebt: customer.totalDebt,
                                                previousDebt:
                                                  (customer.totalDebt ?? 0) + (act.rawAmount ?? 0),
                                                currency: act.currencyCode,
                                              },
                                            },
                                          }
                                        );
                                      }}
                                      aria-label={`عرض سند القبض ${act.title}`}
                                      title="عرض سند القبض"
                                      className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActivityDeleteError(null);
                                      setActivityPendingDelete(act);
                                    }}
                                    aria-label={`حذف ${act.title}`}
                                    title="حذف"
                                    className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleEditActivityClick(act)}
                                    aria-label={`تعديل ${act.title}`}
                                    title="تعديل"
                                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#09152B] hover:text-white dark:hover:bg-blue-600 text-[#09152B] dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Description & Items Display */}
                          {act.description && (
                            <div className="mt-2.5">
                              {act.description.includes(' | ') ||
                              (act.type === 'debt' && /×\s*\d+/.test(act.description)) ? (
                                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#09152B] dark:text-slate-200">
                                    <Package className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                                    <span>الأصناف المشتراة في الفاتورة:</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {act.description
                                      .split('|')
                                      .map((item) => item.trim())
                                      .filter(Boolean)
                                      .map((item, idx) => {
                                        const match = item.match(
                                          /^(.*?)\s*[×xX*]\s*(\d+(?:\.\d+)?)$/
                                        );
                                        const name = match ? match[1].trim() : item;
                                        const qty = match ? match[2] : null;

                                        return (
                                          <span
                                            key={idx}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-[#09152B] dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                                          >
                                            <span>{name}</span>
                                            {qty && (
                                              <span className="px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-jakarta tabular-nums font-bold text-[11px]">
                                                × {qty}
                                              </span>
                                            )}
                                          </span>
                                        );
                                      })}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                                  {act.description}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Date & Running Balance & Due Date */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-jakarta tabular-nums">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span dir="ltr">{act.date}</span>
                              </div>
                              {act.dueDate && (
                                <div className="flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 font-semibold">
                                  <Clock className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                                  <span>تاريخ الاستحقاق:</span>
                                  <span className="font-jakarta tabular-nums" dir="ltr">
                                    {act.dueDate}
                                  </span>
                                </div>
                              )}
                            </div>
                            {act.balanceLabel && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                الرصيد بعد العملية:{' '}
                                <span
                                  className="font-jakarta tabular-nums font-bold text-[#09152B] dark:text-slate-200"
                                  dir="ltr"
                                >
                                  {act.balanceLabel}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer Note */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 print:hidden">
                  <Clock className="w-4 h-4" />
                  <span>يتم تحديث السجل تلقائياً عند كل عملية إضافة أو سداد موثقة.</span>
                </div>
              </div>

              {/* Total Current Debt Banner (Precision Navy Ledger Summary) */}
              <div className="bg-[#09152B] dark:bg-[#111827] border border-slate-800 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:rounded-xl print:p-6 print:shadow-none print:break-inside-avoid">
                {/* Right: Total Debt Amount */}
                <div className="text-right space-y-1.5">
                  <span className="text-xs sm:text-sm font-semibold text-slate-300 block">
                    إجمالي المديونية الحالية
                  </span>
                  {isLoadingProfile ? (
                    <div className="h-9 w-32 bg-slate-800 rounded-lg" />
                  ) : currencyBreakdown.activeCurrencies.length > 1 ? (
                    <div className="flex items-center gap-2.5 flex-wrap pt-1">
                      {currencyBreakdown.activeCurrencies.map((c) => (
                        <div
                          key={c.currency}
                          dir="ltr"
                          className="px-3.5 py-1.5 rounded-lg bg-white/10 border border-white/15 flex items-baseline gap-1.5"
                        >
                          <span className="text-xl sm:text-2xl font-extrabold font-jakarta tabular-nums">
                            {c.remaining.toFixed(2)}
                          </span>
                          <span className="text-xs font-bold text-slate-300 font-jakarta">
                            {c.config.symbol} {c.currency}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2" dir="ltr">
                      <span className="text-3xl sm:text-4xl font-extrabold font-jakarta tabular-nums tracking-tight">
                        {currentBalance.toFixed(2)}
                      </span>
                      <span className="text-sm font-bold text-slate-300 font-jakarta">
                        {getCurrencyConfig(primaryCurrency).symbol} {primaryCurrency}
                      </span>
                    </div>
                  )}
                </div>

                {/* Left: 2 Inset Stat Cards */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex-1 md:w-40 bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                    <span className="text-[11px] text-slate-300 font-medium block mb-1">
                      آخر دفعة
                    </span>
                    {isLoadingProfile ? (
                      <span className="text-sm font-jakarta text-slate-400">—</span>
                    ) : (
                      <span
                        className="text-sm sm:text-base font-bold text-white font-jakarta tabular-nums block"
                        dir="ltr"
                      >
                        {lastPayment
                          ? formatCurrency(lastPayment.amount, lastPayment.currencyCode || 'ILS')
                          : `0.00 ${getCurrencyConfig(primaryCurrency).symbol}`}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 md:w-36 bg-white/5 border border-white/10 rounded-xl p-3.5 text-center">
                    <span className="text-[11px] text-slate-300 font-medium block mb-1">
                      عدد المعاملات
                    </span>
                    {isLoadingProfile ? (
                      <span className="text-sm font-jakarta text-slate-400">—</span>
                    ) : (
                      <span className="text-sm sm:text-base font-bold text-white font-jakarta tabular-nums block">
                        {profileTransactions.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <LedgerModal
          onClose={() => {
            setIsEditModalOpen(false);
            setIsSavingCustomer(false);
            setSubmitError(null);
            setFieldErrors({});
          }}
          isBusy={isSavingCustomer}
          labelledBy="edit-customer-modal-title"
          maxWidthClass="max-w-md"
          closeOnBackdrop={false}
        >
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xl overflow-hidden text-right">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60">
              <h3
                id="edit-customer-modal-title"
                className="text-base sm:text-lg font-extrabold font-cairo text-[#09152B] dark:text-white"
              >
                تعديل بيانات العميل
              </h3>
              <button
                type="button"
                disabled={isSavingCustomer}
                onClick={() => {
                  setIsEditModalOpen(false);
                  setIsSavingCustomer(false);
                  setSubmitError(null);
                  setFieldErrors({});
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-[#09152B] dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} noValidate>
              <div className="px-5 py-5 space-y-4">
                {submitError && (
                  <div
                    role="alert"
                    className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm px-3.5 py-2.5 flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Field 1: Customer Name */}
                <div>
                  <label
                    htmlFor="edit-full-name"
                    className="block text-sm font-bold text-[#09152B] dark:text-slate-200 mb-1.5"
                  >
                    اسم العميل <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="edit-full-name"
                    type="text"
                    autoFocus
                    value={editForm.fullName}
                    onChange={(e) => {
                      setEditForm((p) => ({ ...p, fullName: e.target.value }));
                      setFieldErrors((p) => ({ ...p, fullName: undefined }));
                      setSubmitError(null);
                    }}
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    aria-describedby={fieldErrors.fullName ? 'edit-full-name-error' : undefined}
                    dir="rtl"
                    className={`w-full h-10 bg-white dark:bg-slate-900 border rounded-lg px-3.5 text-sm text-right text-[#09152B] dark:text-slate-100 placeholder-slate-400 outline-none transition-colors ${
                      fieldErrors.fullName
                        ? 'border-rose-400 focus:border-rose-600'
                        : 'border-slate-300 dark:border-slate-700 focus:border-[#09152B] dark:focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.fullName && (
                    <p
                      id="edit-full-name-error"
                      role="alert"
                      className="mt-1 text-xs font-medium text-rose-700 dark:text-rose-400"
                    >
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                {/* Field 2: National ID */}
                <div>
                  <label
                    htmlFor="edit-national-id"
                    className="block text-sm font-bold text-[#09152B] dark:text-slate-200 mb-1.5"
                  >
                    رقم الهوية الوطنية <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="edit-national-id"
                    type="text"
                    inputMode="numeric"
                    maxLength={9}
                    value={editForm.nationalOrCrId}
                    onChange={(e) => {
                      setEditForm((p) => ({
                        ...p,
                        nationalOrCrId: e.target.value.replace(/\D/g, '').slice(0, 9),
                      }));
                      setFieldErrors((p) => ({ ...p, nationalOrCrId: undefined }));
                      setSubmitError(null);
                    }}
                    aria-invalid={Boolean(fieldErrors.nationalOrCrId)}
                    aria-describedby={
                      fieldErrors.nationalOrCrId ? 'edit-national-id-error' : undefined
                    }
                    dir="ltr"
                    className={`w-full h-10 bg-white dark:bg-slate-900 border rounded-lg px-3.5 text-sm text-right font-jakarta tabular-nums text-[#09152B] dark:text-slate-100 placeholder-slate-400 outline-none transition-colors ${
                      fieldErrors.nationalOrCrId
                        ? 'border-rose-400 focus:border-rose-600'
                        : 'border-slate-300 dark:border-slate-700 focus:border-[#09152B] dark:focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.nationalOrCrId && (
                    <p
                      id="edit-national-id-error"
                      role="alert"
                      className="mt-1 text-xs font-medium text-rose-700 dark:text-rose-400"
                    >
                      {fieldErrors.nationalOrCrId}
                    </p>
                  )}
                </div>

                {/* Field 3: Mobile Number with Country Code */}
                <div>
                  <PhoneInputWithCountry
                    id="edit-customer-phone"
                    countryCode={editForm.countryCode}
                    localNumber={editForm.phoneNumber}
                    onCountryCodeChange={(code) => {
                      setEditForm((p) => ({ ...p, countryCode: code }));
                      setSubmitError(null);
                    }}
                    onLocalNumberChange={(localNumber) => {
                      setEditForm((p) => ({ ...p, phoneNumber: localNumber }));
                      setFieldErrors((p) => ({ ...p, phoneNumber: undefined }));
                      setSubmitError(null);
                    }}
                    error={fieldErrors.phoneNumber}
                  />
                </div>

                {/* Field 4: Debt Balance — read-only */}
                <div>
                  <label
                    htmlFor="edit-balance-readonly"
                    className="block text-sm font-bold text-[#09152B] dark:text-slate-200 mb-1.5"
                  >
                    رصيد المديونية الحالي ({getCurrencyConfig(primaryCurrency).labelAr}){' '}
                    <span className="font-normal text-xs text-slate-500 dark:text-slate-400">
                      (للقراءة فقط)
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold font-jakarta text-slate-500 pointer-events-none">
                      {primaryCurrency}
                    </span>
                    <input
                      id="edit-balance-readonly"
                      type="text"
                      value={currentBalance.toFixed(2)}
                      disabled
                      readOnly
                      dir="ltr"
                      className="w-full h-10 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pr-3.5 pl-14 text-sm text-right font-jakarta tabular-nums text-slate-600 dark:text-slate-400 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={isSavingCustomer}
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setIsSavingCustomer(false);
                    setSubmitError(null);
                    setFieldErrors({});
                  }}
                  className="h-9 px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustomer}
                  className="h-9 px-5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {isSavingCustomer ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>جاري التحديث...</span>
                    </>
                  ) : (
                    <span>حفظ التعديلات</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </LedgerModal>
      )}

      {/* Delete Customer Confirmation Modal */}
      {isDeleteModalOpen && (
        <LedgerModal
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteError(null);
          }}
          isBusy={isDeletingCustomer}
          labelledBy="delete-customer-modal-title"
          maxWidthClass="max-w-sm"
        >
          <div className="w-full bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl border border-slate-300 dark:border-slate-700 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3
              id="delete-customer-modal-title"
              className="text-lg font-extrabold font-cairo text-[#09152B] dark:text-white mb-2"
            >
              حذف العميل
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5 font-cairo">
              هل أنت متأكد من حذف {customer.name || 'هذا العميل'}؟ لا يمكن التراجع عن هذا الإجراء.
            </p>

            {deleteError && (
              <div
                role="alert"
                className="mb-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs px-3 py-2 text-right"
              >
                {deleteError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isDeletingCustomer}
                onClick={handleDeleteCustomer}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingCustomer ? 'جاري الحذف...' : 'حذف العميل'}
              </button>

              <button
                type="button"
                autoFocus
                disabled={isDeletingCustomer}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteError(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </LedgerModal>
      )}

      {/* Delete Activity (Debt/Payment) Confirmation Modal */}
      {activityPendingDelete && (
        <LedgerModal
          onClose={() => {
            setActivityPendingDelete(null);
            setActivityDeleteError(null);
          }}
          isBusy={isDeletingActivity}
          labelledBy="delete-activity-modal-title"
          maxWidthClass="max-w-sm"
        >
          <div className="w-full bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl border border-slate-300 dark:border-slate-700 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3
              id="delete-activity-modal-title"
              className="text-lg font-extrabold font-cairo text-[#09152B] dark:text-white mb-2"
            >
              {activityPendingDelete.type === 'debt' ? 'حذف الدين' : 'حذف الدفعة'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5 font-cairo">
              هل أنت متأكد من حذف &quot;{activityPendingDelete.title}&quot;؟ لا يمكن التراجع عن هذا
              الإجراء.
            </p>

            {activityDeleteError && (
              <div
                role="alert"
                className="mb-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs px-3 py-2 text-right"
              >
                {activityDeleteError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={confirmDeleteActivity}
                disabled={isDeletingActivity}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeletingActivity ? 'جارٍ الحذف...' : 'تأكيد الحذف'}
              </button>

              <button
                type="button"
                autoFocus
                onClick={() => {
                  setActivityPendingDelete(null);
                  setActivityDeleteError(null);
                }}
                disabled={isDeletingActivity}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
            </div>
          </div>
        </LedgerModal>
      )}

      {/* Hard-Delete Debt Confirmation Modal */}
      {debtPendingHardDelete && (
        <LedgerModal
          onClose={() => {
            setDebtPendingHardDelete(null);
            setActivityDeleteError(null);
          }}
          isBusy={isDeletingActivity}
          labelledBy="hard-delete-debt-modal-title"
          maxWidthClass="max-w-sm"
        >
          <div className="w-full bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl border border-slate-300 dark:border-slate-700 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3
              id="hard-delete-debt-modal-title"
              className="text-lg font-extrabold font-cairo text-[#09152B] dark:text-white mb-2"
            >
              هذا الدين مرتبط بدفعات
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5 font-cairo">
              يحتوي هذا الدين على{' '}
              {debtPendingHardDelete.paymentsCount > 0
                ? `${debtPendingHardDelete.paymentsCount} دفعة/دفعات مرتبطة به`
                : 'دفعات مرتبطة به'}
              . حذف الدين سيؤدي أيضاً إلى حذف جميع الدفعات المرتبطة به، ولا يمكن التراجع عن هذا
              الإجراء.
            </p>

            {activityDeleteError && (
              <div
                role="alert"
                className="mb-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs px-3 py-2 text-right"
              >
                {activityDeleteError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={confirmHardDeleteDebt}
                disabled={isDeletingActivity}
                className="w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeletingActivity ? 'جارٍ الحذف...' : 'حذف الدين والدفعات'}
              </button>

              <button
                type="button"
                autoFocus
                onClick={() => {
                  setDebtPendingHardDelete(null);
                  setActivityDeleteError(null);
                }}
                disabled={isDeletingActivity}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
            </div>
          </div>
        </LedgerModal>
      )}

      {/* Telegram Unlink Confirmation Modal */}
      {showUnlinkConfirm && (
        <LedgerModal
          onClose={() => {
            setShowUnlinkConfirm(false);
            setUnlinkError(null);
          }}
          isBusy={isUnlinkingTelegram}
          labelledBy="unlink-telegram-modal-title"
          maxWidthClass="max-w-sm"
        >
          <div className="w-full bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl border border-slate-300 dark:border-slate-700 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3
              id="unlink-telegram-modal-title"
              className="text-lg font-extrabold font-cairo text-[#09152B] dark:text-white mb-2"
            >
              إلغاء ربط تيليجرام
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5 font-cairo">
              هل أنت متأكد من فك ربط حساب تيليجرام لهذا العميل؟ سيتم إيقاف كشوفات الحساب وتنبيهات
              الديون عبر حسابه الحالي.
            </p>

            {unlinkError && (
              <div
                role="alert"
                className="mb-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs px-3 py-2 text-right"
              >
                {unlinkError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={confirmUnlinkTelegram}
                disabled={isUnlinkingTelegram}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isUnlinkingTelegram ? 'جارٍ الإلغاء...' : 'نعم، إلغاء الربط'}
              </button>

              <button
                type="button"
                autoFocus
                onClick={() => {
                  setShowUnlinkConfirm(false);
                  setUnlinkError(null);
                }}
                disabled={isUnlinkingTelegram}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                تراجع
              </button>
            </div>
          </div>
        </LedgerModal>
      )}

      {/* Telegram Link Modal */}
      {telegramModalCustomer && (
        <TelegramLinkModal
          key={`telegram-link-${telegramModalCustomer.id}-${telegramModalCustomer.mode}`}
          isOpen={true}
          onClose={() => setTelegramModalCustomer(null)}
          customerId={telegramModalCustomer.id}
          customerName={telegramModalCustomer.name}
          customerPhone={telegramModalCustomer.phone}
          mode={telegramModalCustomer.mode}
          linkType="Customer"
          sendViaWhatsApp={telegramModalCustomer.sendViaWhatsApp ?? false}
          onLinked={() => {
            setCustomer((prev) => ({ ...prev, isTelegramLinked: true }));
          }}
        />
      )}
    </div>
  );
};
