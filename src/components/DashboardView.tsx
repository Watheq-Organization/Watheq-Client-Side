import React, { useState } from 'react';
import { 
  Calendar, 
  Wallet, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  CheckCircle2, 
  PlusCircle, 
  ArrowLeft, 
  ChevronLeft,
  Clock,
  Send,
  MessageSquare
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const [remindedDebtors, setRemindedDebtors] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSendReminder = (name: string) => {
    if (!remindedDebtors.includes(name)) {
      setRemindedDebtors([...remindedDebtors, name]);
    }
    setToastMessage(`تم إرسال تذكير عبر واتساب للعميل (${name}) بنجاح!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const overduePayments = [
    { id: '1', name: 'عبدالله محمد', amount: '15,000', dueDate: '10 أكتوبر 2023' },
    { id: '2', name: 'سارة أحمد', amount: '8,500', dueDate: '12 أكتوبر 2023' },
    { id: '3', name: 'خالد علي', amount: '22,300', dueDate: '13 أكتوبر 2023' },
  ];

  const recentActivities = [
    {
      id: 'a1',
      title: 'تم استلام دفعة',
      actor: 'حمد شاهين',
      desc: 'قام عبدالله محمد بسداد مبلغ 5,000 ر.س.',
      time: 'اليوم 14:15',
      type: 'payment',
      color: 'bg-emerald-500'
    },
    {
      id: 'a2',
      title: 'إضافة دين جديد',
      actor: 'أمس 12:30',
      desc: 'تم تسجيل دين بقيمة 13,000 ر.س على مؤسسة الإعمار.',
      time: 'أمس 12:30',
      type: 'new_debt',
      color: 'bg-blue-600'
    },
    {
      id: 'a3',
      title: 'تم استلام دفعة',
      actor: 'أمس 09:15',
      desc: 'قامت عمارة أحمد بسداد مبلغ 3,250 ر.س.',
      time: 'أمس 09:15',
      type: 'payment',
      color: 'bg-emerald-500'
    },
    {
      id: 'a4',
      title: 'إرسال تذكير',
      actor: 'أمس 08:00',
      desc: 'تم إرسال تذكير سداد تلقائي للعميل خالد علي على الدفعة المتأخرة.',
      time: 'أمس 08:00',
      type: 'reminder',
      color: 'bg-slate-400'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* DASHBOARD HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-alexandria tracking-tight">
            لوحة القيادة
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            مرحباً بك مجدداً! إليك ملخص العمليات اليوم.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-slate-100/80 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>15 أكتوبر 2023</span>
        </div>
      </div>

      {/* TOP 3 SUMMARY KPI METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Total Due Debts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-start justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-2">
              إجمالي الديون المستحقة
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-alexandria">
                124,500
              </span>
              <span className="text-xs font-bold text-slate-500">ر.س</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              <TrendingDown className="w-3 h-3" />
              <span>-0.24%</span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active Clients */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-start justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-2">
              العملاء النشطون
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-alexandria">
                45
              </span>
              <span className="text-xs font-bold text-slate-500">عميل</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>+3 جديد</span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Collections */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-start justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-2">
              إجمالي التحصيلات
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-alexandria">
                45,200
              </span>
              <span className="text-xs font-bold text-slate-500">ر.س</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              <span>مكتملة هذا الشهر</span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* MAIN TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* RIGHT COLUMN IN RTL (7 cols): Overdue Payments Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 font-alexandria">
              المدفوعات المتأخرة
            </h2>
            <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer hover:underline">
              <span>عرض الكل</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 text-slate-400 font-bold text-[11px]">
                  <th className="py-3 px-3">اسم العميل</th>
                  <th className="py-3 px-3">المبلغ (ر.س)</th>
                  <th className="py-3 px-3">تاريخ الاستحقاق</th>
                  <th className="py-3 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overduePayments.map((row) => {
                  const isReminded = remindedDebtors.includes(row.name);

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-slate-900 font-alexandria whitespace-nowrap">
                        {row.name}
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-rose-600 whitespace-nowrap">
                        {row.amount}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 font-medium whitespace-nowrap">
                        {row.dueDate}
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleSendReminder(row.name)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
                            isReminded 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                          }`}
                        >
                          {isReminded ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>تم التذكير</span>
                            </>
                          ) : (
                            <>
                              <Bell className="w-3.5 h-3.5 text-slate-500" />
                              <span>تذكير</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* LEFT COLUMN IN RTL (5 cols): Recent Activity Timeline */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 font-alexandria">
              أحدث النشاطات
            </h2>
          </div>

          <div className="relative pr-4 space-y-6 before:absolute before:right-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {recentActivities.map((act) => (
              <div key={act.id} className="relative flex items-start gap-3">
                <span className={`absolute -right-4 top-1 w-3 h-3 rounded-full ring-4 ring-white ${act.color}`} />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 font-alexandria">{act.actor}</span>
                    <span className="text-[10px] text-slate-400">{act.time}</span>
                  </div>
                  <p className="font-semibold text-slate-900 mt-0.5">{act.title}</p>
                  <p className="text-slate-500 mt-1 leading-relaxed">{act.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button className="w-full text-center py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
              عرض جميع النشاطات
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
