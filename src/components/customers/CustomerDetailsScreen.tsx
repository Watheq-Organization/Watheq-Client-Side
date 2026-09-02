import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { getCustomerById, MOCK_CUSTOMERS } from '../../services/customerService';
import { PATHS } from '../../routes/paths';

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
  iconBg: string;
}

export const CustomerDetailsScreen: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<'all' | 'debt' | 'payment'>('all');
  const [searchActivityQuery, setSearchActivityQuery] = useState('');

  // Customer Data
  const customer = (id ? getCustomerById(id) : null) || MOCK_CUSTOMERS[0];

  // Activity Log
  const activities: ActivityItem[] = [
    {
      id: 'act-1',
      type: 'debt',
      title: 'إضافة دين جديد - فاتورة #8821',
      badgeText: 'غير مدفوع',
      badgeStyle: 'bg-blue-50 text-blue-600 border border-blue-100',
      amount: '+1,250.00',
      amountColor: 'text-[#e11d48]',
      description: 'شراء مستلزمات مكتبية وأدوات قرطاسية متنوعة.',
      date: '14 مارس 2024 - 04:30 م',
      iconBg: 'bg-[#0c2444] text-white',
    },
    {
      id: 'act-2',
      type: 'payment',
      title: 'استلام دفعة نقدية',
      badgeText: 'مسددة',
      badgeStyle: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      amount: '-500.00',
      amountColor: 'text-emerald-600',
      description: 'سداد جزئي مقابل مديونية شهر فبراير.',
      date: '02 مارس 2024 - 11:15 ص',
      iconBg: 'bg-emerald-600 text-white',
    },
    {
      id: 'act-3',
      type: 'alert',
      title: 'تنبيه آلي: تأخر سداد',
      description: 'لقد تجاوز العميل موعد السداد المحدد للفاتورة #8122.',
      date: '01 فبراير 2024',
      iconBg: 'bg-slate-100 text-slate-500 border border-slate-200',
    },
  ];

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
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 font-cairo antialiased flex" dir="rtl">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="customers"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        
        {/* Top Header Bar */}
        <header className="w-full bg-white border-b border-slate-100/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          {/* Search bar */}
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={searchActivityQuery}
              onChange={(e) => setSearchActivityQuery(e.target.value)}
              placeholder="بحث عن معاملة..."
              className="w-full bg-[#f8fafc] border border-slate-200/90 text-slate-800 text-xs sm:text-sm rounded-xl pr-10 pl-4 py-2.5 outline-none focus:border-[#0c2444] focus:bg-white transition-all placeholder:text-slate-400 font-cairo"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  src="/merchant-avatar.jpg"
                  alt="صورة التاجر"
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
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          
          {/* Breadcrumb / Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                className="px-4 py-2 bg-[#0c2444] hover:bg-[#123663] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
              >
                تحديث البيانات
              </button>

              <button
                type="button"
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                تحميل السجل
              </button>
            </div>
          </div>

          {/* Main 2-Column Grid matching Design */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* RIGHT COLUMN: Client Profile Card & Actions (Takes 4 cols on desktop) */}
            <div className="lg:col-span-4 space-y-4">
              
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
                  <span>هوية: {customer.nationalOrCrId || '1029384756'}</span>
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
                      {customer.phone || '+966 50 123 4567'}
                    </span>
                  </div>

                  {/* Registration Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>تاريخ التسجيل</span>
                    </div>
                    <span className="font-bold text-slate-800">
                      12 أكتوبر 2023
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
                  className="w-full py-3 px-4 bg-[#007a3d] hover:bg-[#006633] text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>تسجيل دفعة جديدة</span>
                </button>

                {/* 2. Add New Debt Button */}
                <button
                  type="button"
                  className="w-full py-3 px-4 bg-[#0c2444] hover:bg-[#123663] text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
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

                {/* 4. Delete Customer Button (UI only) */}
                <button
                  type="button"
                  className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border border-rose-200/60 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف العميل</span>
                </button>
              </div>

            </div>

            {/* LEFT COLUMN: Financial Activity Log & Total Debt Banner (Takes 8 cols on desktop) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Financial Activity Log Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
                
                {/* Header with Title and Filter Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <h3 className="text-lg sm:text-xl font-extrabold font-tajawal text-[#0c2444]">
                    سجل النشاط المالي
                  </h3>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveActivityTab('all')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeActivityTab === 'all'
                          ? 'bg-white text-[#0c2444] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      الكل
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveActivityTab('debt')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeActivityTab === 'debt'
                          ? 'bg-white text-[#0c2444] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      الديون
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveActivityTab('payment')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeActivityTab === 'payment'
                          ? 'bg-white text-[#0c2444] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      المدفوعات
                    </button>
                  </div>
                </div>

                {/* Timeline Items */}
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

                          {/* Amount */}
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
                        </div>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed font-normal">
                          {act.description}
                        </p>

                        {/* Date */}
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{act.date}</span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Footer Note */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>يتم تحديث السجل تلقائياً عند كل عملية إضافة أو سداد موثقة.</span>
                </div>

              </div>

              {/* Total Current Debt Banner (Dark Navy Banner) */}
              <div className="bg-[#0c2444] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Right: Total Debt Amount */}
                <div className="text-right space-y-1 relative z-10">
                  <span className="text-xs sm:text-sm font-semibold text-slate-300 block">
                    إجمالي المديونية الحالية
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-5xl font-black font-tajawal tracking-tight">
                      4,250.00
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
                      500.00
                    </span>
                    <span className="text-[10px] text-slate-400 block font-cairo">
                      ر.س
                    </span>
                  </div>

                  {/* Due Date Card */}
                  <div className="flex-1 md:w-36 bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-xs">
                    <span className="text-[11px] text-slate-400 font-medium block mb-1">
                      تاريخ الاستحقاق
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white font-tajawal block">
                      25 مارس
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      2024
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
};
