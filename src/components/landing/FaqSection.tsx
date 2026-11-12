import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Code 2 (Lovable) design system tokens, scoped to this section.
 * Light values are the exact Code 2 oklch tokens. Dark values are derived from the
 * same system and switch with the project's `.dark` class.
 */

const FAQ_STYLES = `
.wq-faq {
  --wq-foreground: #18332d;
  --wq-background: #f8fbf9;
  --wq-card: #ffffff;

  --wq-primary: #0f8069;
  --wq-primary-foreground: #ffffff;

  --wq-muted-foreground: #647871;
  --wq-border: #e2ebe7;
  --wq-input: #dce7e2;

  --wq-ring: #0f8069;
  --wq-brand: #0f8069;
  --wq-brand-deep: #096653;

  --wq-surface-soft: #f0f6f3;

  color: var(--wq-foreground);
}

.dark .wq-faq {
  --wq-foreground: #f4f4f5;
  --wq-background: #18181b;
  --wq-card: #202023;

  --wq-primary: #0f8069;
  --wq-primary-foreground: #ffffff;

  --wq-muted-foreground: #a1a1aa;
  --wq-border: #333338;
  --wq-input: #3f3f46;

  --wq-ring: #0f8069;
  --wq-brand: #0f8069;
  --wq-brand-deep: #0b6957;

  --wq-surface-soft: #27272a;
}

.wq-faq-panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.wq-faq-panel.is-open {
  grid-template-rows: 1fr;
}

.wq-faq-panel > div {
  overflow: hidden;
}

@keyframes wq-faq-up {
  from {
    opacity: 0;
    transform: translate3d(0, 28px, 0);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .wq-faq-reveal {
    opacity: 0;
  }

  .wq-faq-reveal.is-in {
    animation: wq-faq-up 800ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
    animation-delay: var(--d, 0ms);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wq-faq-panel {
    transition: none;
  }
}
`;


/** Fires once when the element first scrolls into view. */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as React.CSSProperties;

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { ref, seen } = useInView<HTMLDivElement>();
  const inClass = seen ? 'is-in' : '';

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
      answer: 'الفائدة المباشرة هي حماية رأس مالك ومنع النزاعات والسرقات؛ مطابقة التحويلات تضمن أن كل حوالة بنكية استلمتها يقابلها بيع حقيقي مسجل، وتوثيق تليجرام/واتساب يوفر لك إقراراً رسمياً ملزماً من الزبون بالدين أو الدفعة بزر (تأكيد / اعتراض) مما يلغي النسيان وإنكار المديونية.',
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
    <section id="faq" className="wq-faq bg-[color:var(--wq-card)] py-20 lg:py-28">
      <style>{FAQ_STYLES}</style>

      <div ref={ref} className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1fr_1.6fr]">
        {/* Header */}
        <div className="text-right">
          <p
            style={delay(0)}
            className={`wq-faq-reveal ${inClass} text-xs font-bold tracking-wide text-[color:var(--wq-brand)]`}
          >
            الأسئلة الشائعة
          </p>
          <h2
            style={delay(90)}
            className={`wq-faq-reveal ${inClass} mt-3 font-cairo text-2xl font-bold leading-[1.6] sm:text-3xl lg:text-4xl lg:leading-[1.5]`}
          >
            عندك سؤال؟
          </h2>
          <p
            style={delay(180)}
            className={`wq-faq-reveal ${inClass} mt-4 leading-8 text-[color:var(--wq-muted-foreground)]`}
          >
            إليك إجابات شافية ومباشرة عن كافة الأسئلة التي قد تراودك حول تجربة وثّق.
          </p>
        </div>

        {/* Accordion */}
        <div className="w-full text-right">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const panelId = `wq-faq-panel-${idx}`;
            const buttonId = `wq-faq-button-${idx}`;

            return (
              <div
                key={faq.question}
                style={delay(idx * 60)}
                className={`wq-faq-reveal ${inClass} border-b border-[color:var(--wq-border)]`}
              >
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-right text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--wq-ring)]"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-[color:var(--wq-muted-foreground)] transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`wq-faq-panel ${isOpen ? 'is-open' : ''}`}
                >
                  <div>
                    <p className="pb-5 leading-8 text-[color:var(--wq-muted-foreground)]">{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};