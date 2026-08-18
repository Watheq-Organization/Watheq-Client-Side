import React, { useState } from 'react';
import { ScreenType } from './Header';
import { Client } from '../types/client';
import { INITIAL_CLIENTS } from '../data/mockClients';
import { 
  UserPlus, 
  Download, 
  Search, 
  Eye, 
  Edit, 
  MessageSquare, 
  CheckCircle2, 
  ChevronRight,
  Filter,
  Plus,
  X
} from 'lucide-react';

interface ClientsViewProps {
  onNavigate: (screen: ScreenType) => void;
  clients?: Client[];
  onSelectClient?: (client: Client) => void;
  onAddClient?: (newClient: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ 
  onNavigate,
  clients: externalClients,
  onSelectClient,
  onAddClient
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'overdue' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Client Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState<'individual' | 'company'>('individual');
  const [newClientIdNum, setNewClientIdNum] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientDebt, setNewClientDebt] = useState('');

  const [internalClients, setInternalClients] = useState<Client[]>(INITIAL_CLIENTS);
  const clients = externalClients || internalClients;

  const handleSelectClient = (client: Client) => {
    if (onSelectClient) {
      onSelectClient(client);
    }
    onNavigate('client-detail');
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientIdNum) return;

    const debtAmountNum = Number(newClientDebt) || 0;
    const newEntry: Client = {
      id: `c${Date.now()}`,
      name: newClientName,
      type: newClientType === 'individual' ? 'عميل أفراد' : 'عميل شركات',
      initial: newClientName.charAt(0),
      avatarColor: 'bg-teal-600 text-white',
      idNum: newClientIdNum,
      phone: newClientPhone || '+966 50 000 0000',
      registeredDate: 'اليوم',
      debt: debtAmountNum.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      status: debtAmountNum > 0 ? 'active' : 'paid',
      statusText: debtAmountNum > 0 ? 'دين نشط' : 'تم السداد',
      statusColor: debtAmountNum > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      transactions: debtAmountNum > 0 ? [
        {
          id: `t-${Date.now()}`,
          type: 'debt',
          title: 'رصيد افتتاحي / دين جديد',
          amount: `+${debtAmountNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          amountColor: 'text-rose-600',
          desc: 'تسجيل مديونية أولية عند فتح الحساب.',
          date: 'الآن',
          status: 'غير مدفوع',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
        }
      ] : []
    };

    if (onAddClient) {
      onAddClient(newEntry);
    } else {
      setInternalClients([newEntry, ...internalClients]);
    }

    setIsAddModalOpen(false);
    setNewClientName('');
    setNewClientIdNum('');
    setNewClientPhone('');
    setNewClientDebt('');
    setToastMsg(`تم إدراج العميل (${newClientName}) بنجاح!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const filteredClients = clients.filter(client => {
    const matchesFilter = 
      activeFilter === 'all' ? true :
      activeFilter === 'active' ? client.status === 'active' :
      activeFilter === 'overdue' ? client.status === 'overdue' :
      client.status === 'paid';

    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      client.idNum.includes(searchQuery) ||
      client.debt.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Notification Alert */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* HEADER TITLE & TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-alexandria tracking-tight">
            دليل العملاء والمديونيات
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            إدارة كافة العملاء، متابعة سجلات الديون، وحالات السداد الفردية والمؤسسية.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setToastMsg('جاري تصدير ملف إكسل بالعملاء...');
              setTimeout(() => setToastMsg(null), 3000);
            }}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة عميل جديد</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block mb-1">إجمالي العملاء</span>
          <span className="text-2xl font-extrabold text-slate-900 font-alexandria block">{clients.length}</span>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-block">حسابات نشطة في النظام</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block mb-1">ديون متأخرة</span>
          <span className="text-2xl font-extrabold text-rose-600 font-alexandria block">
            {clients.filter(c => c.status === 'overdue').length}
          </span>
          <span className="text-[11px] text-rose-500 font-medium mt-1 inline-block">تتطلب متابعة سريعة</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block mb-1">ديون نشطة منتظمة</span>
          <span className="text-2xl font-extrabold text-blue-600 font-alexandria block">
            {clients.filter(c => c.status === 'active').length}
          </span>
          <span className="text-[11px] text-blue-500 font-medium mt-1 inline-block">مواعيد سداد قادمة</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block mb-1">تمت التسوية بالكامل</span>
          <span className="text-2xl font-extrabold text-emerald-600 font-alexandria block">
            {clients.filter(c => c.status === 'paid').length}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-block">رصيد صفري</span>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        
        {/* Right in RTL: Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-[#0b1d3a] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جميع العملاء ({clients.length})
          </button>

          <button
            onClick={() => setActiveFilter('active')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'active'
                ? 'bg-[#0b1d3a] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ديون نشطة
          </button>

          <button
            onClick={() => setActiveFilter('overdue')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'overdue'
                ? 'bg-[#0b1d3a] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            متأخر
          </button>

          <button
            onClick={() => setActiveFilter('paid')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'paid'
                ? 'bg-[#0b1d3a] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            تم السداد
          </button>
        </div>

        {/* Left in RTL: Search Input & Sort Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="البحث عن عميل، رقم هوية، أو دين..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

      </div>

      {/* CLIENTS DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold text-[11px]">
                <th className="py-4 px-4 sm:px-6">معلومات العميل</th>
                <th className="py-4 px-4 sm:px-6">رقم الهوية / السجل</th>
                <th className="py-4 px-4 sm:px-6">إجمالي الدين</th>
                <th className="py-4 px-4 sm:px-6">حالة الحساب</th>
                <th className="py-4 px-4 sm:px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                  
                  {/* Client Info */}
                  <td className="py-4 px-4 sm:px-6">
                    <div 
                      onClick={() => handleSelectClient(row)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shadow-xs overflow-hidden ${row.avatarColor}`}>
                        {row.avatarUrl ? (
                          <img src={row.avatarUrl} alt={row.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{row.initial}</span>
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 font-alexandria block group-hover:text-emerald-600 transition-colors">
                          {row.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {row.type}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* ID / CR Number */}
                  <td className="py-4 px-4 sm:px-6 font-mono font-medium text-slate-600">
                    {row.idNum}
                  </td>

                  {/* Total Debt */}
                  <td className="py-4 px-4 sm:px-6 font-extrabold font-alexandria text-slate-900">
                    {row.debt} <span className="text-xs font-normal text-slate-500">ر.س</span>
                  </td>

                  {/* Account Status Badge */}
                  <td className="py-4 px-4 sm:px-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${row.statusColor}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {row.statusText}
                    </span>
                  </td>

                  {/* Action Icons */}
                  <td className="py-4 px-4 sm:px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleSelectClient(row)}
                        title="عرض الملف المالي"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-[11px] font-semibold hidden sm:inline">عرض السجل</span>
                      </button>

                      <button
                        onClick={() => {
                          setToastMsg(`تم إرسال تذكير واتساب إلى (${row.name})`);
                          setTimeout(() => setToastMsg(null), 3000);
                        }}
                        title="إرسال تذكير واتساب"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER PAGINATION */}
        <div className="bg-slate-50/60 p-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>عرض {filteredClients.length} من أصل {clients.length} عميل</span>

          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded-lg bg-[#0b1d3a] text-white font-bold">1</button>
          </div>
        </div>
      </div>

      {/* MODAL: ADD NEW CLIENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-right">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 font-alexandria">
                إضافة عميل جديد
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="p-5 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نوع العميل
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewClientType('individual')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newClientType === 'individual'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    عميل أفراد
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewClientType('company')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newClientType === 'company'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    عميل شركات / مؤسسات
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم العميل / الشركة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: عبدالله الراجحي"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم الهوية الوطنية / السجل التجاري <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="10XXXXXXXX أو 70XXXXXXXX"
                  value={newClientIdNum}
                  onChange={(e) => setNewClientIdNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم الجوال
                </label>
                <input
                  type="tel"
                  placeholder="05XXXXXXXX"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رصيد المديونية الافتتاحي (اختياري)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newClientDebt}
                  onChange={(e) => setNewClientDebt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  حفظ العميل
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
