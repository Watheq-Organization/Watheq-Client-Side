import React, { useState } from 'react';
import { 
  Landmark, 
  BookOpenCheck, 
  Receipt, 
  Boxes, 
  Users, 
  Store, 
  Check, 
  AlertCircle, 
  FileDown, 
  Sparkles,
  ArrowLeftRight
} from 'lucide-react';

export const BentoGridSection: React.FC = () => {
  // Interactive reconciliation item toggle in the featured card
  const [reconciliationItems, setReconciliationItems] = useState([
    {
      id: 'tx1',
      bank: 'بنك فلسطين',
      amount: '450.00 ₪',
      matchStatus: 'مطابق للبيع #1042 ✓',
      isMatched: true,
      time: 'قبل 10 دقائق',
      sender: 'سامي الخالدي',
    },
    {
      id: 'tx2',
      bank: 'بنك القدس',
      amount: '280.00 ₪',
      matchStatus: 'بحاجة لمراجعة ⚠️',
      isMatched: false,
      time: 'قبل 25 دقيقة',
      sender: 'حوالة واردة غير معرفة',
    },
    {
      id: 'tx3',
      bank: 'البنك الإسلامي العربي',
      amount: '620.00 ₪',
      matchStatus: 'مطابق للبيع #1055 ✓',
      isMatched: true,
      time: 'اليوم 01:15 م',
      sender: 'مؤسسة السلام',
    },
  ]);

  const toggleMatch = (id: string) => {
    setReconciliationItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              isMatched: !item.isMatched,
              matchStatus: !item.isMatched ? 'مطابق للبيع ✓' : 'بحاجة لمراجعة ⚠️',
            }
          : item
      )
    );
  };

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-white dark:bg-[#070D1D] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6F9F0] dark:bg-[#00D685]/10 border border-[#00D685]/30 text-[#00A86B] dark:text-[#00D685] text-xs sm:text-sm font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>باقة متكاملة للمحلات</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] dark:text-white leading-tight font-cairo">
            مزايا صُممت لواقع التاجر
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            أدوات مالية عملية تدمج التوثيق الفوري مع إدارة المبيعات والمخزون، لتوفر وقتك وتحفظ كل مليم من الضياع.
          </p>
        </div>

        {/* Bento Grid: 6 Cards Total */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* 1. Large Featured Dark Card (#0B132B, spans 2 columns on desktop) */}
          <div className="md:col-span-2 bg-[#0B132B] text-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between group card-hover-luxury">
            {/* Background subtle security grid lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#00D685_1px,transparent_1px)] [background-size:18px_18px] opacity-10 pointer-events-none"></div>

            {/* Subtle sweeping light shimmer */}
            <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-25"></div>
            
            {/* Emerald glow in corner */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#00D685]/20 rounded-full blur-[90px] pointer-events-none"></div>

            <div className="relative z-10 space-y-4 max-w-2xl text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D685]/20 border border-[#00D685]/40 text-[#00D685] text-xs font-bold">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>الميزة الحصرية في وثّق</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                مطابقة التحويلات البنكية والتوثيق الثنائي
              </h3>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                قارن التحويلات البنكية التي وصلتك مع المبيعات المسجّلة، ووثّق الديون مع زبائنك لحظياً عبر QR Code وبوت تليجرام/واتساب بزر (تأكيد ✅ / اعتراض ❌) لضمان حقوق الطرفين.
              </p>
            </div>

            {/* Embedded Live UI Preview: Mini interactive reconciliation list */}
            <div className="relative z-10 mt-8 bg-[#111C35] rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-[#00D685]" />
                  <span>قائمة مطابقة التحويلات البنكية اللحظية</span>
                </div>
                <span className="text-[11px] text-[#00D685] font-normal cursor-pointer hover:underline">
                  (انقر للمطابقة التفاعلية)
                </span>
              </div>

              <div className="space-y-2.5">
                {reconciliationItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleMatch(item.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#0B132B]/80 hover:bg-[#0B132B] border border-white/5 hover:border-[#00D685]/40 transition-all cursor-pointer gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        item.isMatched ? 'bg-[#00D685]/20 text-[#00D685]' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {item.isMatched ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{item.bank}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({item.sender})</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{item.time}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-left">
                      <span className="text-xs font-black text-white font-mono">{item.amount}</span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        item.isMatched
                          ? 'bg-[#E6F9F0]/10 text-[#00D685] border-[#00D685]/40'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {item.matchStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 2. Light Card 2: إدارة الديون وحسابات الزبائن */}
          <div className="bg-white dark:bg-[#111C35] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-sm hover:border-[#00D685] transition-all flex flex-col justify-between text-right group card-hover-luxury">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E6F9F0] dark:bg-[#00D685]/10 text-[#00A86B] dark:text-[#00D685] flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                <BookOpenCheck className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-extrabold text-[#0F172A] dark:text-white">
                إدارة الديون وحسابات الزبائن
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                سجّل الديون والدفعات بالصوت أو النص وتابع الرصيد المتبقي وكشوفات الحساب PDF بضغطة زر.
              </p>
            </div>

            {/* Mini preview widget: PDF statement & balance */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-[#0B132B] p-3.5 rounded-xl border border-slate-200/60 dark:border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">الرصيد القائم:</span>
                <span className="font-black text-rose-500 font-mono">1,250 ₪</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#00A86B] dark:text-[#00D685] font-bold">
                <span className="flex items-center gap-1">
                  <FileDown className="w-3.5 h-3.5" />
                  <span>تصدير كشف حساب PDF</span>
                </span>
                <span className="text-[10px] text-slate-400">مختوم رسمياً ✓</span>
              </div>
            </div>
          </div>

          {/* 3. Light Card 3: المبيعات والكاشير والعمل أوفلاين */}
          <div className="bg-white dark:bg-[#111C35] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-sm hover:border-[#00D685] transition-all flex flex-col justify-between text-right group card-hover-luxury">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                <Receipt className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-extrabold text-[#0F172A] dark:text-white">
                المبيعات والكاشير والعمل أوفلاين
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                سجّل عمليات البيع اليومية وتابع حركة الكاشير حتى بدون إنترنت مع مزامنة تلقائية مشفرة.
              </p>
            </div>

            {/* Mini preview widget: Offline badge + POS counter */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-[#0B132B] p-3.5 rounded-xl border border-slate-200/60 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-[#00D685] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#00D685]"></span>
                  <span>أوفلاين نشط 100%</span>
                </span>
                <span className="text-slate-500 font-mono text-[11px]">8 فواتير بالانتظار</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                تزامن تلقائي فوري فور عودة اتصال الشبكة
              </div>
            </div>
          </div>

          {/* 4. Light Card 4: إدارة المخزون الذكية */}
          <div className="bg-white dark:bg-[#111C35] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-sm hover:border-[#00D685] transition-all flex flex-col justify-between text-right group card-hover-luxury">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                <Boxes className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-extrabold text-[#0F172A] dark:text-white">
                إدارة المخزون الذكية
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                اعرف الكميات المتوفرة والأصناف التي قاربت على النفاد مع فصل واضح بين رأس المال والأرباح.
              </p>
            </div>

            {/* Mini preview widget: Stock level progress */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-[#0B132B] p-3.5 rounded-xl border border-slate-200/60 dark:border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-200">زيت ذرة 3 لتر</span>
                <span className="text-amber-500 font-mono text-[11px]">باقي 3 قطع (نقص)</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full w-[15%]"></div>
              </div>
            </div>
          </div>

          {/* 5. Light Card 5: الموظفين والصلاحيات */}
          <div className="bg-white dark:bg-[#111C35] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-sm hover:border-[#00D685] transition-all flex flex-col justify-between text-right group card-hover-luxury">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-extrabold text-[#0F172A] dark:text-white">
                الموظفين والصلاحيات
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                أضف موظفيك وحدد صلاحية كل موظف بدقة لحماية بياناتك المالية.
              </p>
            </div>

            {/* Mini preview widget: Role badges */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-[#0B132B] p-3.5 rounded-xl border border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-1.5">
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-[#00D685]/10 text-[#00A86B] dark:text-[#00D685]">
                كاشير (بيع فقط)
              </span>
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                أمين مستودع
              </span>
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                مدير عام
              </span>
            </div>
          </div>

          {/* 6. Light Card 6: إدارة الفروع المتعددة */}
          <div className="bg-white dark:bg-[#111C35] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-sm hover:border-[#00D685] transition-all flex flex-col justify-between text-right group card-hover-luxury">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                <Store className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-extrabold text-[#0F172A] dark:text-white">
                إدارة الفروع المتعددة
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                تابع أكثر من فرع وشوف نظرة مالية عامة وموحدة على نشاطهم من لوحة تحكم واحدة.
              </p>
            </div>

            {/* Mini preview widget: Branch consolidated summary */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-[#0B132B] p-3.5 rounded-xl border border-slate-200/60 dark:border-white/5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="font-semibold">فرع نابلس + فرع رام الله:</span>
                <span className="text-[#00A86B] dark:text-[#00D685] font-bold">تقرير موحد</span>
              </div>
              <div className="text-[10px] text-slate-400">
                مقارنة الأداء اليومي وكميات المخزون المشتركة
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
