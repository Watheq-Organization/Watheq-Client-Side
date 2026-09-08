import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Download,
  Eye,
  MessageCircle,
  History,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  RotateCw,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import type { Customer, CustomerStatus } from '../../types/customer';
import {
  addCustomer,
  getCustomers,
  isDuplicatePhoneNumberError,
  mapCustomerDtoToCustomer,
  toAddCustomerErrorMessage,
  toGetCustomersErrorMessage,
  validateCustomerFullName,
  validateCustomerPhoneNumber,
  validateCustomerNationalId,
  validateCustomerInitialDebt,
} from '../../services/customerService';
import { ApiError } from '../../api/httpClient';
import { getDashboardSummary } from '../../services/dashboardService';

export const CustomersScreen: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | CustomerStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'highest_debt' | 'name'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Real customer rows from GET /api/customer/getCustomers. No demo/mock
  // data is used here — an empty or failed response is shown as such.
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customersLoadError, setCustomersLoadError] = useState<string | null>(null);
  const [customersReloadToken, setCustomersReloadToken] = useState(0);

  // Add Customer Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    fullName: '',
    nationalId: '',
    phoneNumber: '',
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Shows a one-off success toast passed via navigation state (e.g. after
  // deleting a customer from the details screen), then clears it from
  // history so it doesn't reappear on back/forward navigation or refresh.
  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (state?.toast) {
      setToastMessage(state.toast);
      setTimeout(() => setToastMessage(null), 3000);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real customer count from GET /api/Dashboard/summary (customersCount).
  // Stays null on load failure so the UI falls back to the number of rows
  // actually shown instead of a fabricated total.
  const [totalCustomersCount, setTotalCustomersCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    getDashboardSummary()
      .then((data) => {
        if (isMounted) {
          setTotalCustomersCount(data.customersCount);
        }
      })
      .catch(() => {
        // Non-critical here: this count is only a supplementary display
        // value, and the table below shows the real row count regardless.
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingCustomers(true);
    setCustomersLoadError(null);

    getCustomers()
      .then((dtos) => {
        if (!isMounted) return;
        const sorted = [...dtos].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (dateA && dateB && dateA !== dateB) return dateA - dateB;
          return Number(a.id || 0) - Number(b.id || 0);
        });
        setCustomers(sorted.map((dto, idx) => mapCustomerDtoToCustomer(dto, idx)));
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
  }, [customersReloadToken]);

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewCustomer({ fullName: '', nationalId: '', phoneNumber: '', initialDebt: '' });
    setAddFieldErrors({});
    setAddSubmitError(null);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        if (!c) return false;
        // Tab status filter
        if (activeTabFilter !== 'all' && c.status !== activeTabFilter) {
          return false;
        }
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (c.name || '').toLowerCase().includes(q);
          const matchId = (c.nationalOrCrId || '').includes(q);
          const matchDebt = String(c.totalDebt ?? 0).includes(q);
          return matchName || matchId || matchDebt;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest_debt') return (b.totalDebt ?? 0) - (a.totalDebt ?? 0);
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '', 'ar');
        return 0; // Default newest
      });
  }, [customers, activeTabFilter, searchQuery, sortBy]);

  const handleAddCustomer = async (e: React.FormEvent) => {
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
    if (Object.keys(errors).length > 0) return;

    setAddSubmitError(null);
    setIsAddingCustomer(true);
    try {
      const parsedDebt = trimmedDebt ? Number(trimmedDebt) : 0;
      const dto = await addCustomer({
        fullName: trimmedName,
        nationalId: trimmedNationalId,
        phoneNumber: trimmedPhone || null,
        initialDebt: parsedDebt,
      });

      const nextIndex = customers.length;
      const newCustomerItem = mapCustomerDtoToCustomer(dto, nextIndex);
      
      // Store nationalId locally for persistence and details screen
      newCustomerItem.nationalOrCrId = trimmedNationalId;
      if (dto.id) {
        try {
          localStorage.setItem(`customer-national-id:${dto.id}`, trimmedNationalId);
        } catch {
          // ignore
        }
      }

      if (parsedDebt > 0) {
        newCustomerItem.totalDebt = parsedDebt;
        newCustomerItem.status = 'active_debt';
        newCustomerItem.statusLabel = 'دين نشط';
      }

      // Ensure form inputs are used as backup if dto fields were missing
      if (!newCustomerItem.name || newCustomerItem.name === 'عميل بدون اسم') {
        newCustomerItem.name = trimmedName;
      }
      if (!newCustomerItem.phone && trimmedPhone) {
        newCustomerItem.phone = trimmedPhone;
      }

      setCustomers((prev) => [newCustomerItem, ...prev]);
      setTotalCustomersCount((prev) => (prev !== null ? prev + 1 : null));
      closeAddModal();
      showToast('تمت إضافة العميل بنجاح.');
    } catch (err) {
      if (err instanceof ApiError && isDuplicatePhoneNumberError(err)) {
        setAddFieldErrors((p) => ({ ...p, phoneNumber: 'يوجد عميل آخر مسجل بنفس رقم الجوال.' }));
      } else {
        const message = toAddCustomerErrorMessage(err);
        setAddSubmitError(message);
        showToast(message);
      }
    } finally {
      setIsAddingCustomer(false);
    }
  };

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['الاسم,النوع,رقم الهوية / السجل,إجمالي الدين,الحالة,رقم الهاتف']
        .concat(
          filteredCustomers.map(
            (c) =>
              `"${c.name}","${c.typeLabel}","${c.nationalOrCrId}","${c.totalDebt}","${c.statusLabel}","${c.phone || ''}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'watheq_customers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير قائمة العملاء بنجاح.');
  };

  const handleWhatsApp = (customer: Customer) => {
    const phone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
    const text = encodeURIComponent(
      `مرحباً ${customer.name}، نود تذكيركم بمستحقاتكم المالية لدى منصة وثّق بمبلغ ${customer.totalDebt.toLocaleString('ar-SA')} ر.س.`
    );
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    } else {
      showToast('لا يوجد رقم هاتف مسجل لهذا العميل.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 font-cairo antialiased flex" dir="rtl">
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
          onSearchChange={setSearchQuery}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-50 bg-[#051838] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in text-sm font-medium">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Header Row: Title & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-tajawal text-[#0c2444] tracking-tight">
                قائمة العملاء
              </h1>
              <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
                إدارة وتتبع الديون المستحقة والمسددة لعملائك من خلال لوحة تحكم واحدة.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#123663] hover:bg-[#0c2444] text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة عميل جديد</span>
                </button>

              <button
                type="button"
                onClick={() => setCustomersReloadToken((t) => t + 1)}
                disabled={isLoadingCustomers}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50"
                title="تحديث البيانات من السيرفر"
              >
                <RotateCw className={`w-4 h-4 text-slate-500 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>

              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>تصدير</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setActiveTabFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTabFilter === 'all'
                    ? 'bg-[#123663] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                الكل
              </button>

              <button
                type="button"
                onClick={() => setActiveTabFilter('active_debt')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTabFilter === 'active_debt'
                    ? 'bg-[#123663] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                ديون نشطة
              </button>

              <button
                type="button"
                onClick={() => setActiveTabFilter('overdue')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTabFilter === 'overdue'
                    ? 'bg-[#123663] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                متأخر
              </button>

              <button
                type="button"
                onClick={() => setActiveTabFilter('paid')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTabFilter === 'paid'
                    ? 'bg-[#123663] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                تم السداد
              </button>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">ترتيب حسب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm rounded-xl px-3 py-2 outline-none focus:border-[#123663] cursor-pointer font-cairo"
              >
                <option value="newest">الأحدث</option>
                <option value="highest_debt">الأعلى ديناً</option>
                <option value="name">الاسم أبجدياً</option>
              </select>
            </div>
          </div>

          {/* Customers Table Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-slate-500 text-xs sm:text-sm font-semibold border-b border-slate-100">
                    <th className="py-4 px-4 sm:px-6">معلومات العميل</th>
                    <th className="py-4 px-4 sm:px-6">رقم الهوية / السجل</th>
                    <th className="py-4 px-4 sm:px-6">إجمالي الدين</th>
                    <th className="py-4 px-4 sm:px-6 text-center">حالة الحساب</th>
                    <th className="py-4 px-4 sm:px-6 text-center">الإجراءات</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-700">
                  {isLoadingCustomers ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        جارٍ تحميل قائمة العملاء...
                      </td>
                    </tr>
                  ) : customersLoadError ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-rose-600 font-semibold">{customersLoadError}</span>
                          <button
                            type="button"
                            onClick={() => setCustomersReloadToken((t) => t + 1)}
                            className="px-4 py-2 rounded-lg bg-[#123663] hover:bg-[#0c2444] text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            إعادة المحاولة
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-3">
                          <span>لا يوجد عملاء بعد.</span>
                          <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#123663] hover:bg-[#0c2444] text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة عميل</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        لا يوجد عملاء يطابقون خيارات البحث أو التصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="hover:bg-slate-50/80 transition-colors duration-150 group cursor-pointer"
                      >
                        {/* 1. Client Info */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base font-tajawal shadow-2xs ${customer.avatarBg}`}
                            >
                              {customer.avatarLetter}
                            </div>
                            <div>
                              <div className="font-bold text-[#0c2444] text-sm sm:text-base font-tajawal group-hover:text-blue-700 transition-colors">
                                {customer.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-normal">
                                {customer.typeLabel}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. ID / CR Number */}
                        <td className="py-4 px-4 sm:px-6 font-mono text-slate-600" dir="ltr">
                          <span className="inline-block text-right">
                            {customer.nationalOrCrId || '0001'}
                          </span>
                        </td>

                        {/* 3. Total Debt */}
                        <td className="py-4 px-4 sm:px-6 font-bold text-slate-900 font-tajawal text-sm sm:text-base">
                          <span>{(customer.totalDebt ?? 0).toLocaleString('ar-SA')}</span>{' '}
                          <span className="text-xs font-normal text-slate-400 font-cairo">ر.س</span>
                        </td>

                        {/* 4. Status Badge */}
                        <td className="py-4 px-4 sm:px-6 text-center">
                          {customer.status === 'overdue' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>متأخر</span>
                            </span>
                          )}
                          {customer.status === 'active_debt' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              <span>دين نشط</span>
                            </span>
                          )}
                          {customer.status === 'paid' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>تم السداد</span>
                            </span>
                          )}
                        </td>

                        {/* 5. Actions */}
                        <td className="py-4 px-4 sm:px-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2 text-slate-400">
                            {/* WhatsApp Button */}
                            <button
                              type="button"
                              onClick={() => handleWhatsApp(customer)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="إرسال رسالة واتساب"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>

                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => navigate(`/customers/${customer.id}`)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="عرض ملف العميل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* History */}
                            <button
                              type="button"
                              onClick={() => navigate(`/customers/${customer.id}`)}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="سجل المعاملات والديون"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">
                عرض 1 إلى {filteredCustomers.length} من {(totalCustomersCount ?? filteredCustomers.length).toLocaleString('ar-SA')} عميل
              </span>

              <div className="flex items-center gap-1.5" dir="ltr">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs ${
                    currentPage === 1
                      ? 'bg-[#123663] text-white shadow-xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  1
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage(2)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs ${
                    currentPage === 2
                      ? 'bg-[#123663] text-white shadow-xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  2
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage(3)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs ${
                    currentPage === 3
                      ? 'bg-[#123663] text-white shadow-xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  3
                </button>

                <span className="px-1 text-slate-400">...</span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(12)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs ${
                    currentPage === 12
                      ? 'bg-[#123663] text-white shadow-xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  12
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(12, p + 1))}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  disabled={currentPage === 12}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-[12px] w-[450px] max-w-[calc(100vw-32px)] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="h-[68px] flex items-center justify-between px-6 border-b border-slate-200">
              <h3 className="text-lg font-bold font-tajawal text-[#0c2444]">
                إضافة عميل جديد
              </h3>
              <button
                type="button"
                onClick={closeAddModal}
                className="text-slate-900 hover:opacity-60 transition-opacity cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleAddCustomer} noValidate>
              <div className="px-6 py-5 space-y-4">
              {addSubmitError && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3.5 py-2.5 text-right">
                  {addSubmitError}
                </div>
              )}

              {/* Field 1: Full Name / Company Name */}
              <div>
                <label className="block text-sm font-bold text-[#0c2444] mb-1.5">
                  اسم العميل / الشركة <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomer.fullName}
                  onChange={(e) => {
                    setNewCustomer((p) => ({ ...p, fullName: e.target.value }));
                    setAddFieldErrors((p) => ({ ...p, fullName: undefined }));
                  }}
                  placeholder="مثال: عبدالله الراجحي"
                  dir="rtl"
                  className={`w-full h-[40px] bg-white border rounded-lg px-3.5 text-sm text-right text-slate-800 placeholder-slate-400 outline-none transition-colors ${
                    addFieldErrors.fullName
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-slate-200 focus:border-[#123663]'
                  }`}
                />
                {addFieldErrors.fullName && (
                  <p className="mt-1 text-xs text-red-600">{addFieldErrors.fullName}</p>
                )}
              </div>

              {/* Field 2: National ID / CR ID */}
              <div>
                <label className="block text-sm font-bold text-[#0c2444] mb-1.5">
                  رقم الهوية الوطنية / السجل التجاري <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomer.nationalId}
                  onChange={(e) => {
                    setNewCustomer((p) => ({ ...p, nationalId: e.target.value }));
                    setAddFieldErrors((p) => ({ ...p, nationalId: undefined }));
                  }}
                  placeholder="10XXXXXXXX أو 70XXXXXXXX"
                  dir="ltr"
                  className={`w-full h-[40px] bg-white border rounded-lg px-3.5 text-sm text-right text-slate-800 placeholder-slate-400 outline-none transition-colors ${
                    addFieldErrors.nationalId
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-slate-200 focus:border-[#123663]'
                  }`}
                />
                {addFieldErrors.nationalId && (
                  <p className="mt-1 text-xs text-red-600">{addFieldErrors.nationalId}</p>
                )}
              </div>

              {/* Field 3: Phone Number */}
              <div>
                <label className="block text-sm font-bold text-[#0c2444] mb-1.5">
                  رقم الجوال
                </label>
                <input
                  type="tel"
                  value={newCustomer.phoneNumber}
                  onChange={(e) => {
                    setNewCustomer((p) => ({ ...p, phoneNumber: e.target.value }));
                    setAddFieldErrors((p) => ({ ...p, phoneNumber: undefined }));
                  }}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                  className={`w-full h-[40px] bg-white border rounded-lg px-3.5 text-sm text-right text-slate-800 placeholder-slate-400 outline-none transition-colors ${
                    addFieldErrors.phoneNumber
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-slate-200 focus:border-[#123663]'
                  }`}
                />
                {addFieldErrors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-600">{addFieldErrors.phoneNumber}</p>
                )}
              </div>

              {/* Field 4: Initial Debt Balance (Optional) */}
              <div>
                <label className="block text-sm font-bold text-[#0c2444] mb-1.5">
                  رصيد المديونية الافتتاحي (اختياري)
                </label>
                <input
                  type="text"
                  value={newCustomer.initialDebt}
                  onChange={(e) => {
                    setNewCustomer((p) => ({ ...p, initialDebt: e.target.value }));
                    setAddFieldErrors((p) => ({ ...p, initialDebt: undefined }));
                  }}
                  placeholder="0.00 ر.س"
                  dir="ltr"
                  className={`w-full h-[40px] bg-white border rounded-lg px-3.5 text-sm text-right text-slate-800 placeholder-slate-400 outline-none transition-colors ${
                    addFieldErrors.initialDebt
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-slate-200 focus:border-[#123663]'
                  }`}
                />
                {addFieldErrors.initialDebt && (
                  <p className="mt-1 text-xs text-red-600">{addFieldErrors.initialDebt}</p>
                )}
              </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={isAddingCustomer}
                  className="h-9 w-[62px] rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isAddingCustomer}
                  className="h-9 min-w-[110px] px-4 rounded-lg bg-[#007a3d] hover:bg-[#006633] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAddingCustomer ? (
                    <>
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
    </div>
  );
};
