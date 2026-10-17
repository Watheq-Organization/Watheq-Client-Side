import React from 'react';
import { 
  UserCheck, 
  Mic, 
  BarChart3, 
  Sparkles 
} from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'أنشئ حسابك واضبط بيانات محلك',
      description: 'سجّل متجرك في دقائق وأضف زبائنك بسهولة عبر مسح كود QR أو رابط واتساب.',
      icon: UserCheck,
      badge: 'إعداد سريع في دقيقتين',
      preview: {
        tag: 'مسح QR فوري للزبائن',
        detail: 'رابط مباشر يربط الزبون بحسابه دون تحميل تطبيقات',
      },
    },
    {
      num: '02',
      title: 'سجّل عمليات البيع والحسابات بالصوت أو النص',
      description: 'أدخل المبيعات، الديون، والتحويلات في ثوانٍ (حتى بدون إنترنت) مع إشعار فوري للزبون.',
      icon: Mic,
      badge: 'إدخال صوتي بالعامية + أوفلاين',
      preview: {
        tag: 'تحدث فقط وسجّل',
        detail: 'الذكاء الاصطناعي يستخرج الصنف والمبلغ والزبون تلقائياً',
      },
    },
    {
      num: '03',
      title: 'راجع التقارير والحركات واتخذ قرارات أوضح',
      description: 'تابع مطابقة التحويلات، الأرباح الصافية، وكشوفات الحساب الموحدة بلحظتها.',
      icon: BarChart3,
      badge: 'رؤية مالية شاملة ودقيقة',
      preview: {
        tag: 'كشوفات حساب رسمية',
        detail: 'مطابقة تحويلات بنكية + فصل رأس المال عن الأرباح',
      },
    },
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-white dark:bg-[#070D1D] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6F9F0] dark:bg-[#00D685]/10 border border-[#00D685]/30 text-[#00A86B] dark:text-[#00D685] text-xs sm:text-sm font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>كيف يعمل وثّق؟</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] dark:text-white leading-tight font-cairo">
            بساطة فائقة في 3 خطوات
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            صُمم النظام ليعمل معك بسلاسة في خضم ضغط العمل اليومي دون أي تعقيد محاسبي.
          </p>
        </div>

        {/* 3 Connected Step Cards */}
        <div className="relative">
          
          {/* Desktop Connecting Line between cards */}
          <div className="hidden lg:block absolute top-1/2 right-[15%] left-[15%] h-0.5 border-t-2 border-dashed border-[#00D685]/30 -translate-y-12 z-0"></div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((step) => {
              const IconComp = step.icon;

              return (
                <div
                  key={step.num}
                  className="bg-slate-50/80 dark:bg-[#111C35] rounded-3xl p-8 border border-slate-200/80 dark:border-white/10 shadow-sm hover:border-[#00D685] transition-all duration-300 flex flex-col justify-between text-right group relative overflow-hidden card-hover-luxury"
                >
                  {/* Subtle hover gradient background */}
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-[#00D685] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="space-y-5">
                    {/* Top Row: Large Emerald Step Number & Icon */}
                    <div className="flex items-center justify-between">
                      <span className="text-4xl sm:text-5xl font-black text-[#00D685] font-jakarta tracking-tight drop-shadow-[0_2px_10px_rgba(0,214,133,0.3)]">
                        {step.num}
                      </span>
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-white/10 text-[#00A86B] dark:text-[#00D685] flex items-center justify-center font-bold shadow-sm group-hover:scale-110 transition-transform">
                        <IconComp className="w-6 h-6 stroke-[2]" />
                      </div>
                    </div>

                    {/* Step Title & Badge */}
                    <div>
                      <span className="inline-block text-[11px] font-bold text-[#00A86B] dark:text-[#00D685] bg-[#E6F9F0] dark:bg-[#00D685]/10 px-3 py-1 rounded-full border border-[#00D685]/30 mb-2">
                        {step.badge}
                      </span>
                      <h3 className="text-xl font-extrabold text-[#0F172A] dark:text-white leading-snug">
                        {step.title}
                      </h3>
                    </div>

                    {/* Step Description */}
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {step.description}
                    </p>
                  </div>

                  {/* Step Mini Preview Box */}
                  <div className="mt-8 pt-4 border-t border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0B132B] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-1">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {step.preview.tag}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {step.preview.detail}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
