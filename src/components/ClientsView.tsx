import React, { useState } from 'react';
import { ScreenType } from './Header';
import { 
  UserPlus, 
  Download, 
  Search, 
  Eye, 
  Edit, 
  MessageSquare, 
  History, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Plus,
  X
} from 'lucide-react';

interface ClientsViewProps {
  onNavigate: (screen: ScreenType) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ onNavigate }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'overdue' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Client Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState<'individual' | 'company'>('individual');
  const [newClientIdNum, setNewClientIdNum] = useState('');
  const [newClientDebt, setNewClientDebt] = useState('');

  const [clients, setClients] = useState([
    {
      id: 'c1',
      name: 'أحمد عبدالله الراجحي',
      type: 'عميل أفراد',
      initial: 'أ',
      avatarColor: 'bg-[#0b1d3a] text-white',
      idNum: '1029384756',
      debt: '45,000',
      status: 'overdue',
      statusText: 'متأخر',
      statusColor: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    {
      id: 'c2',
      name: 'شركة التقنية المتقدمة',
      type: 'عميل شركات',
      initial: 'ش',
      avatarColor: 'bg-blue-600 text-white',
      idNum: '7001234567',
      debt: '120,500',
      status: 'active',
      statusText: 'دين نشط',
      statusColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'c3',
      name: 'سالم محمد الدوسري',
      type: 'عميل أفراد',
      initial: 'س',
      avatarColor: 'bg-emerald-600 text-white',
      idNum: '1098765432',
      debt: '0.00',
      status: 'paid',
      statusText: 'تم السداد',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'c4',
      name: 'مؤسسة البناء الحديث',
      type: 'عميل شركات',
      initial: 'م',
      avatarColor: 'bg-indigo-600 text-white',
      idNum: '7009876543',
      debt: '15,750',
      status: 'active',
      statusText: 'دين نشط',
      statusColor: 'bg-blue-50 text-blue-700 border-blue-200'
    }
  ]);

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientIdNum) return;

    const newEntry = {
      id: `c${Date.now()}`,
      name: newClientName,
      type: newClientType === 'individual' ? 'عميل أفراد' : 'عميل شركات',
      initial: newClientName.charAt(0),
      avatarColor: 'bg-teal-600 text-white',
      idNum: newClientIdNum,
      debt: newClientDebt ? Number(newClientDebt).toLocaleString() : '0.00',
      status: Number(newClientDebt) > 0 ? 'active' : 'paid',
      statusText: Number(newClientDebt) > 0 ? 'دين نشط' : 'تم السداد',
      statusColor: Number(newClientDebt) > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };

    setClients([newEntry, ...clients]);
    setIsAddModalOpen(false);
    setNewClientName('');
    setNewClientIdNum('');
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
      client.name.includes(searchQuery) || 
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
            قائمة العملاء
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            إدارة وتتبع الديون المستحقة والمشددة لعملائك من خلال لوحة تحكم واحدة.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#0b1d3a] hover:bg-[#0f2a54] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة عميل جديد</span>
          </button>

          <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-2">
            <Download className="w-4 h-4 text-slate-500" />
            <span>تصدير</span>
          </button>
        </div>
      </div>

      {/* FILTERS & SEARCH CONTAINER */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Right in RTL: Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-[#0b1d3a] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل
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

          <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer">
            <option value="newest">الأحدث</option>
            <option value="highest">الأعلى ديناً</option>
            <option value="name">حسب الاسم</option>
          </select>
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
                      onClick={() => onNavigate('client-detail')}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shadow-xs ${row.avatarColor}`}>
                        {row.initial}
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
                        onClick={() => onNavigate('client-detail')}
                        title="عرض الملف المالي"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        title="تعديل البيانات"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
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
          <span>عرض 1 إلى {filteredClients.length} من 120 عميل</span>

          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="px-3 py-1 rounded-lg bg-[#0b1d3a] text-white font-bold">1</button>
            <button className="px-3 py-1 rounded-lg hover:bg-slate-200">2</button>
            <button className="px-3 py-1 rounded-lg hover:bg-slate-200">3</button>
            <span>...</span>
            <button className="px-3 py-1 rounded-lg hover:bg-slate-200">12</button>
            <button className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ADD NEW CLIENT MODAL DIALOG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-alexandria">إضافة عميل جديد</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل / المؤسسة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة الأفق التجاري"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع العميل</label>
                  <select
                    value={newClientType}
                    onChange={(e) => setNewClientType(e.target.value as 'individual' | 'company')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="individual">عميل أفراد</option>
                    <option value="company">عميل شركات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهوية / السجل</label>
                  <input
                    type="text"
                    required
                    placeholder="1029384756"
                    value={newClientIdNum}
                    onChange={(e) => setNewClientIdNum(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مبلغ الدين الابتدائي (اختياري)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newClientDebt}
                  onChange={(e) => setNewClientDebt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="bg-[#0b1d3a] hover:bg-[#0f2a54] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  إضافة العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
