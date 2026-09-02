import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Download,
  Eye,
  MessageCircle,
  History,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building2,
  X,
  Check,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import type { Customer, CustomerStatus } from '../../types/customer';
import { MOCK_CUSTOMERS } from '../../services/customerService';

export const CustomersScreen: FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | CustomerStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'highest_debt' | 'name'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    type: 'individual' as 'individual' | 'company',
    nationalOrCrId: '',
    totalDebt: '',
    phone: '',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Tab status filter
        if (activeTabFilter !== 'all' && c.status !== activeTabFilter) {
          return false;
        }
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = c.name.toLowerCase().includes(q);
          const matchId = c.nationalOrCrId.includes(q);
          const matchDebt = c.totalDebt.toString().includes(q);
          return matchName || matchId || matchDebt;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest_debt') return b.totalDebt - a.totalDebt;
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
        return 0; // Default newest
      });
  }, [customers, activeTabFilter, searchQuery, sortBy]);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.nationalOrCrId) return;

    const debtVal = parseFloat(newCustomer.totalDebt) || 0;
    const added: Customer = {
      id: Date.now().toString(),
      name: newCustomer.name,
      type: newCustomer.type,
      typeLabel: newCustomer.type === 'company' ? 'عميل شركات' : 'عميل أفراد',
      nationalOrCrId: newCustomer.nationalOrCrId,
      totalDebt: debtVal,
      status: debtVal > 0 ? 'active_debt' : 'paid',
      statusLabel: debtVal > 0 ? 'دين نشط' : 'تم السداد',
      avatarLetter: newCustomer.name.trim().charAt(0) || 'ع',
      avatarBg: newCustomer.type === 'company' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600',
      phone: newCustomer.phone,
    };

    setCustomers((prev) => [added, ...prev]);
    setIsAddModalOpen(false);
    setNewCustomer({
      name: '',
      type: 'individual',
      nationalOrCrId: '',
      totalDebt: '',
      phone: '',
    });
    showToast('تمت إضافة العميل بنجاح.');
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#123663] hover:bg-[#0c2444] text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة عميل جديد</span>
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
                  {filteredCustomers.length === 0 ? (
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
                          <span className="inline-block text-right">{customer.nationalOrCrId}</span>
                        </td>

                        {/* 3. Total Debt */}
                        <td className="py-4 px-4 sm:px-6 font-bold text-slate-900 font-tajawal text-sm sm:text-base">
                          <span>{customer.totalDebt.toLocaleString('ar-SA')}</span>{' '}
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
                عرض 1 إلى {filteredCustomers.length} من 120 عميل
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold font-tajawal text-[#0c2444]">
                إضافة عميل جديد
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نوع العميل
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewCustomer((p) => ({ ...p, type: 'individual' }))}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      newCustomer.type === 'individual'
                        ? 'border-[#123663] bg-blue-50 text-[#123663]'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>أفراد</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCustomer((p) => ({ ...p, type: 'company' }))}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      newCustomer.type === 'company'
                        ? 'border-[#123663] bg-blue-50 text-[#123663]'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>شركات / مؤسسات</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم العميل / المنشأة *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                  placeholder="أدخل الاسم الكامل"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#123663] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {newCustomer.type === 'company' ? 'السجل التجاري *' : 'رقم الهوية الوطنية *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.nationalOrCrId}
                    onChange={(e) =>
                      setNewCustomer((p) => ({ ...p, nationalOrCrId: e.target.value }))
                    }
                    placeholder="10xxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#123663] focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    رقم الجوال
                  </label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="05xxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#123663] focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  إجمالي الدين المبدئي (ر.س)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={newCustomer.totalDebt}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, totalDebt: e.target.value }))}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#123663] focus:bg-white font-mono"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#123663] text-white text-sm font-bold shadow-md hover:bg-[#0c2444] transition-all"
                >
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
