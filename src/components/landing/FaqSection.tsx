import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'شو هو وثّق بالضبط؟',
      answer: 'وثّق هو منظومة رقمية متكاملة للمحلات والمتاجر تجمع بين إدارة الديون وحسابات الزبائن، كاشير المبيعات، إدارة المخزون، ومطابقة التحويلات البنكية، مع ميزة التوثيق الثنائي اللحظي للديون مع الزبائن عبر QR Code وتليجرام/واتساب دون إلزام العميل بتحميل أي برامج.',
    },
    {
      question: 'هل وثّق مناسب لمحلي الصغير أو المتوسط؟',
      answer: 'نعم بالتأكيد! صُمم وثّق خصيصاً ليناسب البقالات، محلات الملابس، الصيدليات، ومتاجر التجزئة ومحلات التوريدات. يمكنك البدء بباقة البداية البسيطة والترقية تدريجياً مع نمو عملك دون أي تعقيد.',
    },
    {
      question: 'كيف بقدر أتابع الديون والمبيعات والتحويلات من مكان واحد؟',
      answer: 'من خلال شاشة تحكم موحدة (Dashboard) ذكية؛ بمجرد تسجيل عملية بيع آجل أو نقدي، تتحدث أرصدة العميل وحركة الصندوق والمخزون بلحظتها. كما تظهر التحويلات البنكية ومطابقتها مباشرة في نفس التقرير المالي.',
    },
    {
      question: 'هل يعمل التطبيق عند انقطاع الإنترنت والكهرباء؟',
      answer: 'نعم 100%! تطبيق وثّق مبني بمعمارية (Offline-First) مع قاعدة بيانات محلية مشفرة. تواصل عمليات البيع وتسجيل الديون بدون أي توقف، وفور عودة اتصال الإنترنت، يقوم النظام بمزامنة كل البيانات تلقائياً مع السحابة وإرسال إشعارات التوثيق للزبائن.',
    },
    {
      question: 'شو فائدة مطابقة التحويلات البنكية وتوثيق الزبون عبر تليجرام؟',
      answer: 'الفائدة المباشرة هي حماية رأس مالك ومنع النزاعات والسرقات؛ مطابقة التحويلات تضمن أن كل حوالة بنكية استلمتها يقابلها بيع حقيقي مسجل، وتوثيق تليجرام/واتساب يوفر لك إقراراً رسمياً ملزماً من الزبون بالدين أو الدفعة بزر (تأكيد ✅ / اعتراض ❌) مما يلغي النسيان وإنكار المديونية.',
    },
    {
      question: 'هل يدعم وثّق إدارة المخزون والفروع المتعددة؟',
      answer: 'نعم، يتيح لك وثّق جرد المخزون، تتبع الوارد والمنصرف، وتلقي تنبيهات عند اقتراب نفاد الأصناف مع فصل واضح بين رأس المال والأرباح. كما تدعم باقة الأعمال إدارة فروع متعددة مركزياً وتحديد صلاحيات الموظفين لكل فرع بدقة.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 relative overflow-hidden bg-white dark:bg-[#070D1D] transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6F9F0] dark:bg-[#00D685]/10 border border-[#00D685]/30 text-[#00A86B] dark:text-[#00D685] text-xs sm:text-sm font-bold shadow-sm">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>الأسئلة الشائعة</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] dark:text-white leading-tight font-cairo">
            عندك سؤال؟
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            إليك إجابات شافية ومباشرة عن كافة الأسئلة التي قد تراودك حول تجربة وثّق.
          </p>
        </div>

        {/* Accordion Container */}
        <div className="space-y-4 text-right">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'bg-white dark:bg-[#111C35] border-[#00D685] shadow-md ring-1 ring-[#00D685]/20'
                    : 'bg-slate-50 dark:bg-[#0B132B] border-slate-200 dark:border-white/5 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 sm:p-6 text-right flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white leading-snug">
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                    isOpen
                      ? 'bg-[#00D685] text-[#0B132B] rotate-180'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                  }`}>
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 sm:pb-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
