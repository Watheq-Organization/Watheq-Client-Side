import { useState, useMemo, useEffect, useCallback, useRef, type FC, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Download,
  Eye,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCw,
  Loader2,
  Check,
  Smartphone,
  AlertCircle,
  Users,
  UserPlus,
  Send,
} from 'lucide-react';
import { TelegramLinkModal } from './TelegramLinkModal';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import type { Customer, CustomerStatus } from '../../types/customer';
import {
  addCustomer,
  getCustomers,
  mapCustomerDtoToCustomer,
  parseAddCustomerApiError,
  toGetCustomersErrorMessage,
  validateCustomerFullName,
  validateCustomerPhoneNumber,
  validateCustomerNationalId,
  validateCustomerInitialDebt,
  formatFullCustomerPhone,
} from '../../services/customerService';
import { getDashboardSummary } from '../../services/dashboardService';
import { getOutstandingDebtsReport } from '../../services/reportService';
import { sendDebtReminder, toSendReminderErrorMessage } from '../../services/debtService';
import { Toast, type ToastType } from '../ui/Toast';
import { PhoneInputWithCountry, type CountryCode } from '../ui/PhoneInputWithCountry';
import { formatCurrency, normalizeCurrencyCode, getCurrencyConfig } from '../../utils/currency';

type SortOption = 'newest' | 'highest_debt' | 'name';

const ITEMS_PER_PAGE = 10;

export const CustomersScreen: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialNavToast = (location.state as { toast?: string } | null)?.toast;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | CustomerStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customersLoadError, setCustomersLoadError] = useState<string | null>(null);

  /** customerId -> permanently sent (success) */
  const [remindedCustomerIds, setRemindedCustomerIds] = useState<Record<string, boolean>>({});
  /** customerId -> currently sending (in-flight) */
  const [sendingCustomerIds, setSendingCustomerIds] = useState<Record<string, boolean>>({});

  // Add Customer Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    fullName: '',
    nationalId: '',
    phoneNumber: '',
    countryCode: '970' as CountryCode,
    initialDebt: '',
  });
  const [addFieldErrors, setAddFieldErrors] = useState<{
    fullName?: string;
    nationalId?: string;
    phoneNumber?: string;
    initialDebt?: string;
  }>({});
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [addSubmitError, setAddSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: ToastType } | null>(() =>
    initialNavToast ? { message: initialNavToast, type: 'success' } : null
  );
  const [telegramModalCustomer, setTelegramModalCustomer] = useState<{
    id: string;
    name: string;
    phone: string;
    sendViaWhatsApp?: boolean;
    initialLink?: string;
  } | null>(null);
  const isSubmittingAddRef = useRef(false);

  const [totalCustomersCount, setTotalCustomersCount] = useState<number | null>(null);

  // Clear one-off navigation toast from history and auto-dismiss after 4s
  useEffect(() => {
    if (!initialNavToast) return;
    navigate(location.pathname, { replace: true, state: {} });
    const timer = setTimeout(() => {
      setToast((prev) => (prev?.message === initialNavToast ? null : prev));
    }, 4000);
    return () => clearTimeout(timer);
  }, [initialNavToast, location.pathname, navigate]);

  const mapOverdueStatuses = useCallback(
    (
      dtos: Awaited<ReturnType<typeof getCustomers>>,
      overdueReport: Awaited<ReturnType<typeof getOutstandingDebtsReport>> | null
    ): Customer[] => {
      const overdueCustomerIds = new Set<string>();
      const overdueCustomerNames = new Set<string>();

      if (overdueReport?.details?.items) {
        for (const item of overdueReport.details.items) {
          if (item.customerId) {
            overdueCustomerIds.add(String(item.customerId));
          }
          if (item.customerName) {
            overdueCustomerNames.add(item.customerName.trim().toLowerCase());
          }
        }
      }

      return dtos.map((dto, idx) => {
        const c = mapCustomerDtoToCustomer(dto, idx);
        const isOverdue =
          overdueCustomerIds.has(String(c.id)) ||
          overdueCustomerNames.has(c.name.trim().toLowerCase());

        if (isOverdue && c.totalDebt > 0) {
          c.status = 'overdue';
          c.statusLabel = 'متأخر';
        }
        return c;
      });
    },
    []
  );

  // Initial load on mount (async promise callbacks avoid synchronous setState in effect)
  useEffect(() => {
    let isMounted = true;

    getDashboardSummary()
      .then((data) => {
        if (isMounted) setTotalCustomersCount(data.customersCount);
      })
      .catch(() => {
        // Non-critical supplementary count
      });

    Promise.all([
      getCustomers(),
      getOutstandingDebtsReport({ isOverdue: true, pageNumber: 1, pageSize: 200 }).catch(() => null),
    ])
      .then(([dtos, overdueReport]) => {
        if (!isMounted) return;
        setCustomers(mapOverdueStatuses(dtos, overdueReport));
        setCustomersLoadError(null);
      })
      .catch((error) => {
        if (!isMounted) return;
        setCustomers([]);
        setCustomersLoadError(toGetCustomersErrorMessage(error));
      })
      .finally(() => {
        if (isMounted) setIsLoadingCustomers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mapOverdueStatuses]);

  const handleRefreshCustomers = async () => {
    setIsLoadingCustomers(true);
    setCustomersLoadError(null);
    try {
      const [dtos, overdueReport, summaryRes] = await Promise.all([
        getCustomers(),
        getOutstandingDebtsReport({ isOverdue: true, pageNumber: 1, pageSize: 200 }).catch(() => null),
        getDashboardSummary().catch(() => null),
      ]);
      setCustomers(mapOverdueStatuses(dtos, overdueReport));
      if (summaryRes) {
        setTotalCustomersCount(summaryRes.customersCount);
      }
    } catch (error) {
      setCustomersLoadError(toGetCustomersErrorMessage(error));
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const closeAddModal = () => {
    if (isAddingCustomer) return;
    setIsAddModalOpen(false);
    setNewCustomer({
      fullName: '',
      nationalId: '',
      phoneNumber: '',
      countryCode: '970',
      initialDebt: '',
    });
    setAddFieldErrors({});
    setAddSubmitError(null);
  };

  const showToast = (msg: string, type?: ToastType) => {
    setToast({ message: msg, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === msg ? null : prev));
    }, 4000);
  };

  // Counts per status for filter tabs
  const statusCounts = useMemo(() => {
    let activeDebt = 0;
    let overdue = 0;
    let paid = 0;
    for (const c of customers) {
      if (c.status === 'overdue') overdue += 1;
      else if (c.status === 'active_debt') activeDebt += 1;
      else paid += 1;
    }
    return {
      all: customers.length,
      active_debt: activeDebt,
      overdue,
      paid,
    };
  }, [customers]);

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        if (activeTabFilter !== 'all' && c.status !== activeTabFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = c.name.toLowerCase().includes(q);
          const matchId = c.nationalOrCrId.toLowerCase().includes(q);
          const matchPhone = (c.phone || '').toLowerCase().includes(q);
          const matchDebt =
            c.totalDebt.toString().includes(q) ||
            (Array.isArray(c.balances) &&
              c.balances.some(
                (b) =>
                  (b.totalDebt && b.totalDebt.toString().includes(q)) ||
                  (b.currentBalance && b.currentBalance.toString().includes(q)) ||
                  b.currencyCode.toLowerCase().includes(q)
              ));
          return matchName || matchId || matchPhone || matchDebt;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest_debt') return b.totalDebt - a.totalDebt;
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
        return 0;
      });
  }, [customers, activeTabFilter, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredCustomers.length);

  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, startIndex, endIndex]);

  const isFilteredView = activeTabFilter !== 'all' || Boolean(searchQuery.trim());
  const displayTotalCount = isFilteredView
    ? filteredCustomers.length
    : (totalCustomersCount ?? filteredCustomers.length);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleTabChange = (tab: 'all' | CustomerStatus) => {
    setActiveTabFilter(tab);
    setCurrentPage(1);
  };

  const handleSortChange = (val: SortOption) => {
    setSortBy(val);
    setCurrentPage(1);
  };

  const handleAddCustomer = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = newCustomer.fullName.trim();
    const trimmedNationalId = newCustomer.nationalId.trim();
    const trimmedPhone = newCustomer.phoneNumber.trim();
    const trimmedDebt = newCustomer.initialDebt.trim();

    const errors: typeof addFieldErrors = {};
    const nameError = validateCustomerFullName(trimmedName);
    if (nameError) errors.fullName = nameError;

    const nationalIdError = validateCustomerNationalId(trimmedNationalId);
    if (nationalIdError) errors.nationalId = nationalIdError;

    if (trimmedPhone) {
      const phoneError = validateCustomerPhoneNumber(trimmedPhone);
      if (phoneError) errors.phoneNumber = phoneError;
    }

    if (trimmedDebt) {
      const debtError = validateCustomerInitialDebt(trimmedDebt);
      if (debtError) errors.initialDebt = debtError;
    }

    setAddFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setAddSubmitError('يرجى تصحيح الحقول المحددة قبل حفظ العميل.');
      return;
    }

    if (isAddingCustomer || isSubmittingAddRef.current) return;
    isSubmittingAddRef.current = true;

    setAddSubmitError(null);
    setIsAddingCustomer(true);
    try {
      const parsedDebt = trimmedDebt ? Number(trimmedDebt) : 0;
      const formattedPhone = trimmedPhone
        ? formatFullCustomerPhone(newCustomer.countryCode, trimmedPhone)
        : null;

      const dto = await addCustomer({
        fullName: trimmedName,
        nationalId: trimmedNationalId,
        phoneNumber: formattedPhone,
        initialDebt: parsedDebt,
      });

      const nextIndex = customers.length;
      const newCustomerItem = mapCustomerDtoToCustomer(dto, nextIndex);

      newCustomerItem.nationalOrCrId = trimmedNationalId;
      if (dto.id) {
        try {
          localStorage.setItem(`customer-national-id:${dto.id}`, trimmedNationalId);
        } catch {
          // ignore storage errors
        }
      }

      if (parsedDebt > 0) {
        newCustomerItem.totalDebt = parsedDebt;
        newCustomerItem.status = 'active_debt';
        newCustomerItem.statusLabel = 'دين نشط';
      }

      if (!newCustomerItem.name || newCustomerItem.name === 'عميل بدون اسم') {
        newCustomerItem.name = trimmedName;
      }
      if (!newCustomerItem.phone && formattedPhone) {
        newCustomerItem.phone = formattedPhone;
      }

      setCustomers((prev) => [newCustomerItem, ...prev]);
      setTotalCustomersCount((prev) => (prev !== null ? prev + 1 : null));
      setIsAddModalOpen(false);
      setNewCustomer({
        fullName: '',
        nationalId: '',
        phoneNumber: '',
        countryCode: '970',
        initialDebt: '',
      });
      setAddFieldErrors({});
      setAddSubmitError(null);
      showToast('تمت إضافة العميل بنجاح.', 'success');

      // Backend already delivers initial WhatsApp Token 1 on creation; keep sendViaWhatsApp: false
      const createdCustId = dto.id ? String(dto.id) : newCustomerItem.id;
      if (createdCustId) {
        setTelegramModalCustomer({
          id: createdCustId,
          name: newCustomerItem.name,
          phone: newCustomerItem.phone || formattedPhone || '',
          sendViaWhatsApp: false,
          initialLink: dto.telegramLink,
        });
      }
    } catch (err) {
      const { fieldErrors: backendFieldErrors, generalMessage } = parseAddCustomerApiError(err);
      if (backendFieldErrors && Object.keys(backendFieldErrors).length > 0) {
        setAddFieldErrors((prev) => ({ ...prev, ...backendFieldErrors }));
      }
      setAddSubmitError(generalMessage);
      showToast(generalMessage, 'error');
    } finally {
      setIsAddingCustomer(false);
      isSubmittingAddRef.current = false;
    }
  };

  const handleExport = () => {
    if (filteredCustomers.length === 0) {
      showToast('لا توجد بيانات عملاء لتصديرها.', 'error');
      return;
    }

    const csvRows = [
      ['الاسم', 'النوع', 'رقم الهوية / السجل', 'إجمالي الدين', 'الحالة', 'رقم الهاتف'],
      ...filteredCustomers.map((c) => {
        const debtDisplay =
          c.balances && c.balances.length > 0
            ? c.balances
                .filter((b) => (b.currentBalance ?? 0) > 0 || (b.totalDebt ?? 0) > 0)
                .map((b) => `${b.currentBalance || b.totalDebt} ${b.currencyCode}`)
                .join(' | ') || String(c.totalDebt)
            : String(c.totalDebt);
        return [
          c.name,
          c.typeLabel,
          c.nationalOrCrId,
          debtDisplay,
          c.statusLabel,
          c.phone || '',
        ];
      }),
    ];

    const csvText =
      '\uFEFF' +
      csvRows
        .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\r\n');

    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'watheq_customers.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('تم تصدير قائمة العملاء بنجاح.', 'success');
  };

  const handleSendReminder = async (customer: Customer) => {
    const custId = String(customer.id);
    if (!custId) {
      showToast('لا يمكن إرسال تذكير: لم يتم العثور على معرّف العميل.', 'error');
      return;
    }
    if (sendingCustomerIds[custId] || remindedCustomerIds[custId]) return;

    setSendingCustomerIds((prev) => ({ ...prev, [custId]: true }));
    try {
      await sendDebtReminder(custId);
      setRemindedCustomerIds((prev) => ({ ...prev, [custId]: true }));
      showToast('تم إرسال التذكير للعميل عبر تيليجرام بنجاح.', 'success');
    } catch (err) {
      showToast(toSendReminderErrorMessage(err), 'error');
    } finally {
      setSendingCustomerIds((prev) => ({ ...prev, [custId]: false }));
    }
  };

  const renderCustomerDebt = (customer: Customer) => {
    const activeBalances = (customer.balances || []).filter(
      (b) => (b.currentBalance ?? 0) > 0 || (b.totalDebt ?? 0) > 0
    );

    if (activeBalances.length > 1) {
      const tooltipText = activeBalances
        .map((b) => {
          const cfg = getCurrencyConfig(b.currencyCode);
          const amt = (b.currentBalance ?? 0) > 0 ? b.currentBalance : b.totalDebt;
          return `${cfg.labelAr}: ${formatCurrency(amt, b.currencyCode)}`;
        })
        .join(' • ');

      return (
        <div className="inline-flex items-center gap-1.5 flex-wrap" title={tooltipText}>
          <div className="inline-flex items-center divide-x divide-x-reverse divide-slate-200 dark:divide-slate-700 bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-lg px-1.5 py-1 text-xs font-jakarta tabular-nums shadow-2xs">
            {activeBalances.map((b) => {
              const code = normalizeCurrencyCode(b.currencyCode);
              const cfg = getCurrencyConfig(code);
              const amount = (b.currentBalance ?? 0) > 0 ? b.currentBalance : b.totalDebt;
              const formattedAmt = amount.toLocaleString('en-US', {
                minimumFractionDigits: amount % 1 !== 0 ? 2 : 0,
                maximumFractionDigits: 2,
              });

              return (
                <div
                  key={code}
                  className="px-2 py-0.5 flex items-center gap-1 font-extrabold text-[#09152B] dark:text-white whitespace-nowrap"
                  dir="ltr"
                >
                  <span>{formattedAmt}</span>
                  <span
                    className={
                      code === 'USD'
                        ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                        : code === 'EUR'
                          ? 'text-amber-700 dark:text-amber-400 font-bold'
                          : code === 'JOD'
                            ? 'text-purple-700 dark:text-purple-400 font-bold'
                            : 'text-slate-600 dark:text-slate-300 font-bold'
                    }
                  >
                    {cfg.symbol}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (activeBalances.length === 1) {
      const b = activeBalances[0];
      const code = normalizeCurrencyCode(b.currencyCode);
      const amount = (b.currentBalance ?? 0) > 0 ? b.currentBalance : b.totalDebt;
      return (
        <span
          className="font-extrabold text-[#09152B] dark:text-white font-jakarta tabular-nums text-sm sm:text-[15px]"
          dir="ltr"
        >
          {formatCurrency(amount, code)}
        </span>
      );
    }

    if (customer.totalDebt > 0) {
      return (
        <span
          className="font-extrabold text-[#09152B] dark:text-white font-jakarta tabular-nums text-sm sm:text-[15px]"
          dir="ltr"
        >
          {formatCurrency(customer.totalDebt, 'ILS')}
        </span>
      );
    }

    return (
      <span
        className="text-slate-500 dark:text-slate-400 font-jakarta tabular-nums text-sm font-bold"
        dir="ltr"
      >
        0 ₪
      </span>
    );
  };

  return (
    <div
      className="min-h-screen bg-[#F5F6F8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-cairo antialiased flex"
      dir="rtl"
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="customers"
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        {/* Top Header */}
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder="ابحث باسم العميل، رقم الهوية، الهاتف، أو المبلغ..."
        />

        {/* Toast Notification */}
        <Toast
          message={toast?.message ?? null}
          type={toast?.type}
          onClose={() => setToast(null)}
        />

        {/* Page Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto w-full space-y-5 flex-1">
          {/* Header Row: Title & Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                <span>سجل العملاء والذمم</span>
                <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">
                  ·
                </span>
                <span className="font-jakarta tabular-nums font-bold text-[#09152B] dark:text-white">
                  {totalCustomersCount ?? customers.length} حساب
                </span>
              </div>
              <h1 className="mt-1 text-2xl sm:text-[26px] font-extrabold font-cairo text-[#09152B] dark:text-white tracking-tight">
                قائمة العملاء
              </h1>
              <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                إدارة حسابات العملاء، متابعة الأرصدة متعددة العملات، وإرسال التنبيهات الفورية.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="h-9 px-4 bg-[#09152B] hover:bg-[#12264B] dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg text-[13px] font-bold shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة عميل جديد</span>
              </button>

              <button
                type="button"
                onClick={() => void handleRefreshCustomers()}
                disabled={isLoadingCustomers}
                className="h-9 px-3.5 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-[#09152B] dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-lg text-[13px] font-bold shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="تحديث البيانات من السيرفر"
              >
                <RotateCw
                  className={`w-3.5 h-3.5 text-slate-700 dark:text-slate-300 ${
                    isLoadingCustomers ? 'animate-spin' : ''
                  }`}
                />
                <span>تحديث</span>
              </button>

              <button
                type="button"
                onClick={handleExport}
                className="h-9 px-3.5 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-[#09152B] dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-lg text-[13px] font-bold shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                <span>تصدير CSV</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-300/90 dark:border-slate-700 px-4 py-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Segmented Status Tabs */}
            <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-300/70 dark:border-slate-700 overflow-x-auto max-w-full">
              {(
                [
                  { id: 'all', label: 'الكل', count: statusCounts.all },
                  { id: 'active_debt', label: 'ديون نشطة', count: statusCounts.active_debt },
                  { id: 'overdue', label: 'متأخر', count: statusCounts.overdue },
                  { id: 'paid', label: 'تم السداد', count: statusCounts.paid },
                ] as const
              ).map((tab) => {
                const isActive = activeTabFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-slate-700 text-[#09152B] dark:text-white shadow-2xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-[#09152B] dark:hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-jakarta tabular-nums leading-none ${
                        isActive
                          ? 'bg-slate-100 dark:bg-slate-800 text-[#09152B] dark:text-slate-200'
                          : 'bg-slate-200/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <label
                htmlFor="customers-sort-select"
                className="text-xs text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap"
              >
                ترتيب حسب:
              </label>
              <select
                id="customers-sort-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="h-9 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[#09152B] dark:text-slate-100 text-xs sm:text-[13px] font-bold rounded-lg px-3 outline-hidden focus:border-[#09152B] dark:focus:border-slate-400 cursor-pointer font-cairo"
              >
                <option value="newest">الأحدث</option>
                <option value="highest_debt">الأعلى ديناً</option>
                <option value="name">الاسم أبجدياً</option>
              </select>
            </div>
          </div>

          {/* Customers Table Card */}
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-300/90 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 text-xs font-bold border-b border-slate-200 dark:border-slate-800">
                    <th scope="col" className="py-3.5 px-4 sm:px-6 font-bold">
                      معلومات العميل
                    </th>
                    <th scope="col" className="py-3.5 px-4 sm:px-6 font-bold">
                      رقم الهوية / السجل
                    </th>
                    <th scope="col" className="py-3.5 px-4 sm:px-6 font-bold">
                      إجمالي الدين
                    </th>
                    <th scope="col" className="py-3.5 px-4 sm:px-6 text-center font-bold">
                      حالة الحساب
                    </th>
                    <th scope="col" className="py-3.5 px-4 sm:px-6 text-center font-bold">
                      الإجراءات
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                  {isLoadingCustomers ? (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800" />
                              <div className="space-y-2">
                                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/70 rounded" />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-md mx-auto" />
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto" />
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : customersLoadError ? (
                    <tr>
                      <td colSpan={5} className="py-14 px-6 text-center">
                        <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
                          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <span className="text-sm text-rose-700 dark:text-rose-300 font-bold">
                            {customersLoadError}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleRefreshCustomers()}
                            className="h-9 px-4 rounded-lg bg-[#09152B] hover:bg-[#12264B] dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            <span>إعادة المحاولة</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-14 px-6 text-center">
                        <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#09152B] dark:text-white">
                              لا يوجد عملاء مسجّلون حتى الآن
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              أضف عميلك الأول للبدء في متابعة الديون والمدفوعات وإشعارات تيليجرام.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#09152B] hover:bg-[#12264B] dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة عميل جديد</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-14 px-6 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-sm font-bold text-[#09152B] dark:text-white">
                            لا يوجد عملاء يطابقون البحث أو التصفية الحالية
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            جرّب مسح نص البحث أو اختيار تبويب &quot;الكل&quot;.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((customer) => {
                      const custId = String(customer.id);
                      const isSent = !!remindedCustomerIds[custId];
                      const isSending = !!sendingCustomerIds[custId];
                      const isDisabled = isSent || isSending;

                      return (
                        <tr
                          key={customer.id}
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 group cursor-pointer"
                        >
                          {/* 1. Client Info */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#09152B] dark:text-white flex items-center justify-center font-extrabold text-sm font-cairo shrink-0">
                                {customer.avatarLetter}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-[#09152B] dark:text-white text-sm font-cairo group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2 flex-wrap">
                                  <span className="truncate">{customer.name}</span>
                                  {customer.isTelegramLinked && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-[11px] font-bold">
                                      <Send className="w-2.5 h-2.5 shrink-0" />
                                      <span>تيليجرام</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                                  <span>{customer.typeLabel}</span>
                                  {customer.phone && (
                                    <>
                                      <span aria-hidden="true" className="text-slate-400">
                                        ·
                                      </span>
                                      <span className="font-jakarta tabular-nums" dir="ltr">
                                        {customer.phone}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. ID / CR Number */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <span
                              className="inline-block font-jakarta tabular-nums font-bold text-[13px] text-slate-700 dark:text-slate-300"
                              dir="ltr"
                            >
                              {customer.nationalOrCrId || '—'}
                            </span>
                          </td>

                          {/* 3. Total Debt */}
                          <td className="py-3.5 px-4 sm:px-6">{renderCustomerDebt(customer)}</td>

                          {/* 4. Status Badge */}
                          <td className="py-3.5 px-4 sm:px-6 text-center whitespace-nowrap">
                            {customer.status === 'overdue' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
                                <span>متأخر</span>
                              </span>
                            )}
                            {customer.status === 'active_debt' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                                <span>دين نشط</span>
                              </span>
                            )}
                            {customer.status === 'paid' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                                <span>تم السداد</span>
                              </span>
                            )}
                          </td>

                          {/* 5. Actions */}
                          <td className="py-3.5 px-4 sm:px-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Reminder Button */}
                              <button
                                type="button"
                                disabled={isDisabled}
                                onClick={() => void handleSendReminder(customer)}
                                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                                  isSent
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 cursor-default'
                                    : isSending
                                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 cursor-wait'
                                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-400 cursor-pointer'
                                }`}
                                title={
                                  isSent
                                    ? 'تم إرسال التذكير'
                                    : isSending
                                      ? 'جاري إرسال التذكير...'
                                      : 'إرسال تذكير بالدين عبر تيليجرام'
                                }
                                aria-label={`إرسال تذكير للعميل ${customer.name}`}
                              >
                                {isSent ? (
                                  <Check className="w-4 h-4" />
                                ) : isSending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <MessageCircle className="w-4 h-4" />
                                )}
                              </button>

                              {/* Telegram Link */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTelegramModalCustomer({
                                    id: custId,
                                    name: customer.name,
                                    phone: customer.phone || '',
                                    sendViaWhatsApp: false,
                                  });
                                }}
                                className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-400 flex items-center justify-center transition-colors cursor-pointer"
                                title="ربط حساب العميل بتيليجرام"
                                aria-label={`ربط تيليجرام للعميل ${customer.name}`}
                              >
                                <Smartphone className="w-4 h-4" />
                              </button>

                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => navigate(`/customers/${customer.id}`)}
                                className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#09152B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                                title="عرض ملف العميل"
                                aria-label={`عرض ملف العميل ${customer.name}`}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-[13px]">
              <span className="text-slate-700 dark:text-slate-300 font-semibold tabular-nums">
                {filteredCustomers.length === 0
                  ? 'لا توجد نتائج للعرض'
                  : `عرض ${(startIndex + 1).toLocaleString('en-US')} إلى ${endIndex.toLocaleString('en-US')} من ${displayTotalCount.toLocaleString('en-US')} عميل`}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-jakarta tabular-nums ml-1">
                  صفحة {safePage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#09152B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                  title="الصفحة السابقة"
                  aria-label="الصفحة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#09152B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                  title="الصفحة التالية"
                  aria-label="الصفحة التالية"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-customer-modal-title"
        >
          <div className="bg-white dark:bg-[#111827] rounded-2xl w-[460px] max-w-[calc(100vw-32px)] shadow-xl border border-slate-300 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#09152B] dark:text-white flex items-center justify-center shrink-0">
                  <UserPlus className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3
                    id="add-customer-modal-title"
                    className="text-base font-extrabold font-cairo text-[#09152B] dark:text-white"
                  >
                    إضافة عميل جديد
                  </h3>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    تسجيل بيانات العميل وفتح ملف مالي جديد
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAddModal}
                disabled={isAddingCustomer}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-[#09152B] dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleAddCustomer} noValidate className="flex-1 overflow-y-auto">
              <div className="px-5 py-5 space-y-4">
                {addSubmitError && (
                  <div
                    role="alert"
                    className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold px-3.5 py-2.5 text-right flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                    <span>{addSubmitError}</span>
                  </div>
                )}

                {/* Field 1: Full Name */}
                <div>
                  <label
                    htmlFor="add-customer-fullname"
                    className="block text-xs font-bold text-[#09152B] dark:text-slate-200 mb-1.5"
                  >
                    اسم العميل / الشركة <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="add-customer-fullname"
                    type="text"
                    required
                    value={newCustomer.fullName}
                    onChange={(e) => {
                      setNewCustomer((p) => ({ ...p, fullName: e.target.value }));
                      setAddFieldErrors((p) => ({ ...p, fullName: undefined }));
                      setAddSubmitError(null);
                    }}
                    placeholder="مثال: محمود خالد"
                    dir="rtl"
                    aria-invalid={Boolean(addFieldErrors.fullName)}
                    aria-describedby={addFieldErrors.fullName ? 'add-customer-fullname-error' : undefined}
                    className={`w-full h-10 bg-slate-50 dark:bg-slate-900 border rounded-xl px-3.5 text-sm font-medium text-right text-[#09152B] dark:text-white placeholder:text-slate-400 outline-hidden focus:bg-white dark:focus:bg-slate-900 transition-colors ${
                      addFieldErrors.fullName
                        ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500'
                        : 'border-slate-300 dark:border-slate-700 focus:border-[#09152B] dark:focus:border-slate-400'
                    }`}
                  />
                  {addFieldErrors.fullName && (
                    <p
                      id="add-customer-fullname-error"
                      className="mt-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400"
                    >
                      {addFieldErrors.fullName}
                    </p>
                  )}
                </div>

                {/* Field 2: National ID */}
                <div>
                  <label
                    htmlFor="add-customer-national-id"
                    className="block text-xs font-bold text-[#09152B] dark:text-slate-200 mb-1.5"
                  >
                    رقم الهوية الوطنية / السجل التجاري <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="add-customer-national-id"
                    type="text"
                    inputMode="numeric"
                    required
                    value={newCustomer.nationalId}
                    maxLength={9}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setNewCustomer((p) => ({ ...p, nationalId: digitsOnly }));
                      setAddFieldErrors((p) => ({ ...p, nationalId: undefined }));
                      setAddSubmitError(null);
                    }}
                    placeholder="مثال: 123456789 (9 أرقام)"
                    dir="ltr"
                    aria-invalid={Boolean(addFieldErrors.nationalId)}
                    aria-describedby={addFieldErrors.nationalId ? 'add-customer-national-id-error' : undefined}
                    className={`w-full h-10 bg-slate-50 dark:bg-slate-900 border rounded-xl px-3.5 text-sm font-jakarta tabular-nums font-semibold text-right text-[#09152B] dark:text-white placeholder:text-slate-400 outline-hidden focus:bg-white dark:focus:bg-slate-900 transition-colors ${
                      addFieldErrors.nationalId
                        ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500'
                        : 'border-slate-300 dark:border-slate-700 focus:border-[#09152B] dark:focus:border-slate-400'
                    }`}
                  />
                  {addFieldErrors.nationalId && (
                    <p
                      id="add-customer-national-id-error"
                      className="mt-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400"
                    >
                      {addFieldErrors.nationalId}
                    </p>
                  )}
                </div>

                {/* Field 3: Phone Number */}
                <div>
                  <PhoneInputWithCountry
                    id="add-customer-phone"
                    countryCode={newCustomer.countryCode}
                    localNumber={newCustomer.phoneNumber}
                    onCountryCodeChange={(code) => {
                      setNewCustomer((p) => ({ ...p, countryCode: code }));
                    }}
                    onLocalNumberChange={(localNumber) => {
                      setNewCustomer((p) => ({ ...p, phoneNumber: localNumber }));
                      setAddFieldErrors((p) => ({ ...p, phoneNumber: undefined }));
                      setAddSubmitError(null);
                    }}
                    error={addFieldErrors.phoneNumber}
                  />
                </div>

                {/* Field 4: Initial Debt Balance (Optional) */}
                <div>
                  <label
                    htmlFor="add-customer-initial-debt"
                    className="block text-xs font-bold text-[#09152B] dark:text-slate-200 mb-1.5"
                  >
                    رصيد المديونية الافتتاحي (اختياري)
                  </label>
                  <input
                    id="add-customer-initial-debt"
                    type="text"
                    inputMode="decimal"
                    value={newCustomer.initialDebt}
                    onChange={(e) => {
                      setNewCustomer((p) => ({ ...p, initialDebt: e.target.value }));
                      setAddFieldErrors((p) => ({ ...p, initialDebt: undefined }));
                      setAddSubmitError(null);
                    }}
                    placeholder="0.00 ₪"
                    dir="ltr"
                    aria-invalid={Boolean(addFieldErrors.initialDebt)}
                    aria-describedby={addFieldErrors.initialDebt ? 'add-customer-initial-debt-error' : undefined}
                    className={`w-full h-10 bg-slate-50 dark:bg-slate-900 border rounded-xl px-3.5 text-sm font-jakarta tabular-nums font-semibold text-right text-[#09152B] dark:text-white placeholder:text-slate-400 outline-hidden focus:bg-white dark:focus:bg-slate-900 transition-colors ${
                      addFieldErrors.initialDebt
                        ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500'
                        : 'border-slate-300 dark:border-slate-700 focus:border-[#09152B] dark:focus:border-slate-400'
                    }`}
                  />
                  {addFieldErrors.initialDebt && (
                    <p
                      id="add-customer-initial-debt-error"
                      className="mt-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400"
                    >
                      {addFieldErrors.initialDebt}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={isAddingCustomer}
                  className="h-9 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#09152B] dark:text-slate-100 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isAddingCustomer}
                  className="h-9 min-w-[116px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {isAddingCustomer ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جارٍ الحفظ...</span>
                    </>
                  ) : (
                    <span>حفظ العميل</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Telegram Link Modal */}
      {telegramModalCustomer && (
        <TelegramLinkModal
          key={`telegram-link-${telegramModalCustomer.id}`}
          isOpen={true}
          onClose={() => setTelegramModalCustomer(null)}
          customerId={telegramModalCustomer.id}
          customerName={telegramModalCustomer.name}
          customerPhone={telegramModalCustomer.phone}
          linkType="Customer"
          initialLink={telegramModalCustomer.initialLink}
          sendViaWhatsApp={telegramModalCustomer.sendViaWhatsApp ?? false}
          onLinked={() => {
            setCustomers((prev) =>
              prev.map((c) =>
                String(c.id) === String(telegramModalCustomer.id)
                  ? { ...c, isTelegramLinked: true }
                  : c
              )
            );
          }}
        />
      )}
    </div>
  );
};
