import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Store, 
  Truck, 
  Banknote, 
  Check, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';

export const TargetAudienceSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const categories = [
    {
      id: 'grocery',
      title: 'البقالات والميني ماركت',
      subtitle: 'إدارة البيع اليومي السريع والديون المتكررة',
      icon: ShoppingBag,
      details: [
        'تسجيل فوري لحسابات "دفتر الحارة" بالصوت دون تأخير الزبائن.',
        'إشعارات آلية فورية للزبون عبر تليجرام لمنع تكرار السؤال والإحراج.',
        'يعمل 100% بدون إنترنت مع حفظ كافة الديون والمبيعات محلياً.',
      ],
      tag: 'الأكثر استخداماً',
    },
    {
      id: 'retail',
      title: 'محلات الملابس والتجزئة والصيدليات',
      subtitle: 'متابعة الأصناف والدفعات والتحويلات البنكية',
      icon: Store,
      details: [
        'مطابقة تحويلات بنك فلسطين والقدس مع فواتير الزبائن باللحظة.',
        'جرد ذكي للأصناف والمقاسات ومعرفة الكميات المنتهية.',
        'تقارير أرباح يومية وشهرية توضح العائد الحقيقي للمحل.',
      ],
      tag: 'مطابقة تحويلات',
    },
    {
      id: 'hardware',
      title: 'محلات الأدوات واللوازم والموزعين',
      subtitle: 'ضبط الفواتير الآجلة وحسابات المقاولين والتجار',
      icon: Truck,
      details: [
        'إصدار سندات قبض وفواتير دين PDF رسمية برمز QR معتمد.',
        'متابعة سقوف الائتمان وتواريخ استحقاق الدفعات لكل عميل.',
        'مشاركة كشوفات الحساب التفاعلية بضغطة زر مع المقاولين.',
      ],
      tag: 'إدارة ائتمان',
    },
    {
      id: 'credit_merchants',
      title: 'التجار اللي ببيعوا بالدَّيْن والتحويلات',
      subtitle: 'توثيق فوري يمنع النسيان والخلافات المالية تماماً',
      icon: Banknote,
      details: [
        'إقرار إلكتروني ملزم بزر (تأكيد ✅ / اعتراض ❌) من طرف العميل.',
        'سجل مشفر غير قابل للتعديل العشوائي أو الضياع كالأوراق.',
        'توفير ساعات طويلة من تدقيق الحسابات ونهاية الشهر.',
      ],
      tag: 'حماية رأس المال',
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-slate-50 dark:bg-[#0B132B]/60 border-t border-slate-200/80 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6F9F0] dark:bg-[#00D685]/10 border border-[#00D685]/30 text-[#00A86B] dark:text-[#00D685] text-xs sm:text-sm font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>لمين وثّق؟</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] dark:text-white leading-tight font-cairo">
            لأي محل بده يفهم أرقامه ويحمي رأس ماله
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            مهما كان حجم تجارتك، وثّق مصمم ليتكيف مع طبيعة عملك اليومية ويلغي فوضى السجلات.
          </p>
        </div>

        {/* 4 Interactive Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {categories.map((cat, idx) => {
            const IconComp = cat.icon;
            const isHovered = activeCategory === idx;

            return (
              <div
                key={cat.id}
                onMouseEnter={() => setActiveCategory(idx)}
                onMouseLeave={() => setActiveCategory(null)}
                className={`bg-white dark:bg-[#111C35] rounded-3xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between text-right cursor-pointer relative overflow-hidden card-hover-luxury ${
                  isHovered
                    ? 'border-[#00D685] shadow-[0_12px_30px_-5px_rgba(0,214,133,0.25)] -translate-y-1'
                    : 'border-slate-200 dark:border-white/10 shadow-sm'
                }`}
              >
                {/* Accent top gradient line on hover */}
                <div
                  className={`absolute top-0 right-0 left-0 h-1 bg-[#00D685] transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                <div className="space-y-4">
                  {/* Icon & Tag Badge */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#E6F9F0] dark:bg-[#00D685]/10 text-[#00A86B] dark:text-[#00D685] flex items-center justify-center font-bold">
                      <IconComp className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                      {cat.tag}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#0F172A] dark:text-white mb-2">
                      {cat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {cat.subtitle}
                    </p>
                  </div>

                  {/* Detailed Bullet Points */}
                  <ul className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
                    {cat.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-snug">
                        <Check className="w-3.5 h-3.5 text-[#00D685] shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer action link */}
                <div className="pt-6 mt-4 flex items-center text-xs font-bold text-[#00A86B] dark:text-[#00D685] gap-1 group">
                  <span>اكتشف الحل المناسب</span>
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
