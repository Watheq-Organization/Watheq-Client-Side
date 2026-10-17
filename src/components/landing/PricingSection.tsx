import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, Sparkles } from 'lucide-react';
import { PATHS } from '../../routes/paths';

export const PricingSection: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      id: 'starter',
      name: 'خطة "البداية"',
      subtitle: 'لمحل بفرع واحد يبدأ بتنظيم حساباته',
      priceMonthly: 79,
      priceYearly: 750,
      badge: 'الأساسية',
      isFeatured: false,
      buttonText: 'اختر البداية',
      features: [
        'إدارة الديون وحسابات الزبائن (غير محدود)',
        'تسجيل المبيعات اليومية',
        'كاشير أساسي أوفلاين',
        'توثيق تفاعلي عبر QR وتليجرام',
        'تقارير مالية أساسية يومية',
        'مستخدم واحد (مالك المتجر)',
      ],
    },
    {
      id: 'growth',
      name: 'خطة "النمو"',
      subtitle: 'لمحل ينمو ويهتم بالمخزون ومطابقة التحويلات',
      priceMonthly: 149,
      priceYearly: 1430,
      badge: 'الأكثر توازناً',
      isFeatured: true,
      buttonText: 'اختر النمو',
      features: [
        'كل مزايا خطة البداية بلا استثناء',
        'إدارة المخزون وتنبيهات النواقص الذكية',
        'مطابقة التحويلات البنكية مع المبيعات',
        'الإدخال الصوتي بالذكاء الاصطناعي (AI Voice)',
        'تقارير أرباح ورأس مال موسعة ومفصلة',
        'حسابات موظفين مع صلاحيات محددة (حتى 3 مستخدمين)',
        'دعم فني بأولوية خاصة عبر واتساب',
      ],
    },
    {
      id: 'business',
      name: 'خطة "الأعمال"',
      subtitle: 'للفروع المتعددة والنظرة المالية الموحدة',
      priceMonthly: 249,
      priceYearly: 2390,
      badge: 'المؤسسية',
      isFeatured: false,
      buttonText: 'اختر الأعمال',
      features: [
        'كل مزايا خطة النمو',
        'إدارة فروع متعددة مركزياً من لوحة واحدة',
        'صلاحيات متقدمة للموظفين (كاشير، مستودع، إدارة)',
        'ربط API مع الأنظمة المحاسبية والـ ERP',
        'تصدير كشوفات حساب وتقارير موسعة (Excel / PDF)',
        'مستخدمين غير محدودين',
        'مدير حساب مخصص ودعم فني على مدار الساعة',
      ],
    },
  ];

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-white dark:bg-[#070D1D] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6F9F0] dark:bg-[#00D685]/10 border border-[#00D685]/30 text-[#00A86B] dark:text-[#00D685] text-xs sm:text-sm font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>الخطط والأسعار</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] dark:text-white leading-tight font-cairo">
            خطط مرنة تناسب حجم تجارتك
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            استثمر في راحة بالك ووثّق كل حركة مالية بأسعار شفافة وبدون أي تكاليف خفية.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-4 flex items-center justify-center">
            <div className="inline-flex items-center p-1.5 rounded-full bg-slate-100 dark:bg-[#111C35] border border-slate-200 dark:border-white/10">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-[#0B132B] text-[#0F172A] dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                الدفع الشهري
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-[#00D685] text-[#0B132B] shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>الدفع السنوي</span>
                <span className="text-[10px] bg-[#0B132B] text-white px-2 py-0.5 rounded-full font-bold">
                  وفّر 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const isGrowth = plan.isFeatured;
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            const period = billingCycle === 'monthly' ? '/ شهرياً' : '/ سنوياً';

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 transition-all duration-300 flex flex-col justify-between text-right relative overflow-hidden ${
                  isGrowth
                    ? 'bg-[#0B132B] text-white border-2 border-[#00D685] shadow-[0_15px_40px_-5px_rgba(0,214,133,0.3)] lg:-translate-y-2'
                    : 'bg-white dark:bg-[#111C35] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-lg'
                }`}
              >
                {/* Featured Badge for Growth Card */}
                {isGrowth && (
                  <div className="absolute top-0 right-0 left-0 bg-[#00D685] text-[#0B132B] text-center text-xs font-black py-1 tracking-wider uppercase">
                    ⭐ {plan.badge}
                  </div>
                )}

                <div className={`space-y-6 ${isGrowth ? 'pt-4' : ''}`}>
                  {/* Card Title & Subtitle */}
                  <div>
                    {!isGrowth && (
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full border border-slate-200 dark:border-white/5 inline-block mb-3">
                        {plan.badge}
                      </span>
                    )}
                    <h3 className={`text-2xl font-black ${isGrowth ? 'text-white' : 'text-[#0F172A] dark:text-white'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${isGrowth ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      {plan.subtitle}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className={`text-4xl sm:text-5xl font-black ${isGrowth ? 'text-[#00D685]' : 'text-[#0F172A] dark:text-white'}`}>
                      {price}
                    </span>
                    <span className="text-base font-bold text-[#00A86B] dark:text-[#00D685]">₪</span>
                    <span className={`text-xs ${isGrowth ? 'text-slate-400' : 'text-slate-500'}`}>
                      {period}
                    </span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-white/10 text-xs sm:text-sm">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isGrowth
                            ? 'bg-[#00D685]/20 text-[#00D685]'
                            : 'bg-[#E6F9F0] dark:bg-[#00D685]/15 text-[#00A86B] dark:text-[#00D685]'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className={isGrowth ? 'text-slate-200 font-medium' : 'text-slate-600 dark:text-slate-300'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Button */}
                <div className="pt-8 mt-6">
                  <button
                    onClick={() => navigate(PATHS.REGISTER)}
                    className={`w-full py-3.5 px-6 rounded-full text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer ${
                      isGrowth
                        ? 'bg-[#00D685] hover:bg-[#00C875] text-[#0B132B] shadow-[0_8px_24px_-4px_rgba(0,214,133,0.5)] hover:-translate-y-0.5'
                        : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 hover:border-[#00D685]'
                    }`}
                  >
                    <span>{plan.buttonText}</span>
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
