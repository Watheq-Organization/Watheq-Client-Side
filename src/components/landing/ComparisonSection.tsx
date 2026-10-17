import React from 'react';
import { Sparkles } from 'lucide-react';

export const ComparisonSection: React.FC = () => {
  const criteria = [
    {
      title: 'إدارة الديون وتوثيق الزبون التفاعلي',
      subtitle: 'تأكيد مباشر عبر Telegram / WhatsApp بدون تطبيق للعميل',
      paperApps: '❌ غير متوفر (إنكار وخلافات مستمرة)',
      traditionalPos: '❌ مقتصر على ورق الفاتورة',
      complexErp: '⚠️ رسائل نصية مكلفة وغير تفاعلية',
      watheq: '✅ توثيق فوري بزر تأكيد/اعتراض ملزم',
    },
    {
      title: 'مطابقة التحويلات البنكية مع المبيعات',
      subtitle: 'التحقق اللحظي من الحوالات الواردة لمنع السرقات والحوالات الوهمية',
      paperApps: '❌ غير متوفر تماماً',
      traditionalPos: '❌ فحص يدوي بطيء ومعرض للخطأ',
      complexErp: '⚠️ يحتاج ربط بنكي معقد وتكاليف باهظة',
      watheq: '✅ مطابقة آلية ذكية بنقرة واحدة',
    },
    {
      title: 'العمل بدون إنترنت (Offline-First)',
      subtitle: 'استمرار تسجيل البيع والديون عند انقطاع الكهرباء والإنترنت',
      paperApps: '⚠️ الدفتر يعمل لكنه مهدد بالتلف والضياع',
      traditionalPos: '⚠️ محلي فقط ولا يتزامن سحابياً',
      complexErp: '❌ يتوقف كلياً عن العمل أوفلاين',
      watheq: '✅ أوفلاين 100% مع مزامنة تلقائية مشفرة',
    },
    {
      title: 'التسجيل الصوتي السريع (AI Voice Entry)',
      subtitle: 'تسجيل الديون والمبيعات بالعامية أثناء انشغال الكاشير',
      paperApps: '❌ كتابة يدوية تستغرق وقتاً',
      traditionalPos: '❌ يتطلب إدخال يدوي بطيء بالباركود/الكيبورد',
      complexErp: '❌ شاشات محاسبية معقدة جداً',
      watheq: '✅ فهم صوتي دقيق باللهجة المحلية',
    },
    {
      title: 'المبيعات، الكاشير والمخزون بمكان واحد',
      subtitle: 'ربط مبيعات الكاشير فورياً بحسابات الديون وجرد المستودع',
      paperApps: '❌ منفصل تماماً ولا يوجد جرد',
      traditionalPos: '⚠️ كاشير ومخزون دون توثيق ديون تفاعلي',
      complexErp: '⚠️ شامل ولكنه مرهق وبطيء الاستخدام',
      watheq: '✅ منظومة موحدة متناغمة 100%',
    },
    {
      title: 'سهولة الاستخدام وسرعة الإطلاق',
      subtitle: 'جاهز للاستخدام في دقائق دون الحاجة لمحاسب متخصص',
      paperApps: '⚠️ بسيط لكنه فوضوي ومحفوف بالمخاطر',
      traditionalPos: '⚠️ يتطلب أجهزة مخصصة وتدريب',
      complexErp: '❌ يتطلب شهوراً من التدريب ومحاسب متفرغ',
      watheq: '✅ تبدأ بالعمل خلال دقيقتين فقط',
    },
  ];

  return (
    <section id="comparison" className="py-24 relative overflow-hidden bg-slate-50 dark:bg-[#0B132B]/50 border-y border-slate-200/80 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6F9F0] dark:bg-[#00D685]/10 border border-[#00D685]/30 text-[#00A86B] dark:text-[#00D685] text-xs sm:text-sm font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>المقارنة الشاملة</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] dark:text-white leading-tight font-cairo">
            وثّق مقارنة بأنواع التطبيقات والأساليب المشابهة
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            اكتشف الفرق الجوهري بين فوضى الدفاتر القديمة والأنظمة المعقدة وبين تجربة "وثّق" المصممة خصيصاً للتجار.
          </p>
        </div>

        {/* Comparison Table Container */}
        <div className="bg-white dark:bg-[#111C35] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#0B132B]/50">
                  <th className="p-5 text-sm sm:text-base font-extrabold text-[#0F172A] dark:text-white w-2/6">
                    المعيار والخاصية
                  </th>
                  <th className="p-5 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 w-1/6 text-center">
                    الدفتر الورقي وتطبيقات الديون
                  </th>
                  <th className="p-5 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 w-1/6 text-center">
                    أنظمة الكاشير التقليدية
                  </th>
                  <th className="p-5 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 w-1/6 text-center">
                    أنظمة ERP المعقدة
                  </th>
                  {/* Highlighted Watheq Header */}
                  <th className="p-5 text-sm sm:text-base font-black text-[#0B132B] dark:text-white bg-[#00D685]/10 dark:bg-[#00D685]/15 border-r border-l border-[#00D685]/30 w-1/6 text-center relative">
                    <div className="inline-block bg-[#00D685] text-[#0B132B] text-[10px] font-black px-2.5 py-0.5 rounded-full mb-1">
                      الخيار المتكامل
                    </div>
                    <div className="text-[#00A86B] dark:text-[#00D685] font-black text-lg">
                      منصة وثّق
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs sm:text-sm">
                {criteria.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                    {/* Feature description */}
                    <td className="p-5">
                      <div className="font-extrabold text-[#0F172A] dark:text-white mb-0.5">
                        {row.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {row.subtitle}
                      </div>
                    </td>

                    {/* Paper & Simple Apps */}
                    <td className="p-4 text-center font-medium text-slate-600 dark:text-slate-400">
                      {row.paperApps}
                    </td>

                    {/* Traditional POS */}
                    <td className="p-4 text-center font-medium text-slate-600 dark:text-slate-400">
                      {row.traditionalPos}
                    </td>

                    {/* ERP */}
                    <td className="p-4 text-center font-medium text-slate-600 dark:text-slate-400">
                      {row.complexErp}
                    </td>

                    {/* Highlighted Watheq Cell */}
                    <td className="p-4 text-center font-bold text-[#00A86B] dark:text-[#00D685] bg-[#00D685]/5 dark:bg-[#00D685]/10 border-r border-l border-[#00D685]/30">
                      {row.watheq}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
};
