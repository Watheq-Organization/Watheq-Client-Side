
import React, { useEffect, useRef, useState } from 'react';

/**
 * Code 2 (Lovable) design system tokens, scoped to this section.
 */


const HOW_STYLES = `
.wq-how {
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

.dark .wq-how {
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

@keyframes wq-how-up {
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
  .wq-how-reveal {
    opacity: 0;
  }

  .wq-how-reveal.is-in {
    animation: wq-how-up 800ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
    animation-delay: var(--d, 0ms);
  }

  .wq-how-line {
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 1400ms cubic-bezier(0.22, 0.61, 0.36, 1) 300ms;
  }

  .wq-how-line.is-in {
    transform: scaleX(1);
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
      { threshold: 0.15 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, seen };
}

const delay = (ms: number) =>
  ({ '--d': `${ms}ms` }) as React.CSSProperties;

export const HowItWorksSection: React.FC = () => {
  const { ref, seen } = useInView<HTMLDivElement>();
  const inClass = seen ? 'is-in' : '';

  const steps = [
    {
      num: 1,
      title: 'أنشئ حسابك واضبط بيانات محلك',
      description:
        'سجّل متجرك في دقائق وأضف زبائنك بسهولة عبر مسح كود QR أو رابط واتساب.',
      badge: 'إعداد سريع في دقيقتين',
      preview: {
        tag: 'مسح QR فوري للزبائن',
        detail: 'رابط مباشر يربط الزبون بحسابه دون تحميل تطبيقات',
      },
    },
    {
      num: 2,
      title: 'سجّل عمليات البيع والحسابات بالصوت أو النص',
      description:
        'أدخل المبيعات، الديون، والتحويلات في ثوانٍ (حتى بدون إنترنت) مع إشعار فوري للزبون.',
      badge: 'إدخال صوتي بالعامية + أوفلاين',
      preview: {
        tag: 'تحدث فقط وسجّل',
        detail: 'الذكاء الاصطناعي يستخرج الصنف والمبلغ والزبون تلقائياً',
      },
    },
    {
      num: 3,
      title: 'راجع التقارير والحركات واتخذ قرارات أوضح',
      description:
        'تابع مطابقة التحويلات، الأرباح الصافية، وكشوفات الحساب الموحدة بلحظتها.',
      badge: 'رؤية مالية شاملة ودقيقة',
      preview: {
        tag: 'كشوفات حساب رسمية',
        detail: 'مطابقة تحويلات بنكية + فصل رأس المال عن الأرباح',
      },
    },
  ];

  return (
    <section
      id="how-it-works"
      className="wq-how bg-[color:var(--wq-card)] py-20 lg:py-28"
    >
      <style>{HOW_STYLES}</style>

      <div ref={ref} className="mx-auto max-w-6xl px-5">
        {/* Section Header */}
        <div className="text-center">
          <p
            style={delay(0)}
            className={`wq-how-reveal ${inClass} text-xs font-bold tracking-wide text-[color:var(--wq-brand)]`}
          >
            كيف يعمل وثّق؟
          </p>

          <h2
            style={delay(90)}
            className={`wq-how-reveal ${inClass} mt-3 font-cairo text-2xl font-bold leading-[1.6] sm:text-3xl lg:text-4xl lg:leading-[1.5]`}
          >
            بساطة فائقة في 3 خطوات
          </h2>

          <p
            style={delay(180)}
            className={`wq-how-reveal ${inClass} mx-auto mt-4 max-w-2xl leading-8 text-[color:var(--wq-muted-foreground)]`}
          >
            صُمم النظام ليعمل معك بسلاسة في خضم ضغط العمل اليومي دون أي تعقيد محاسبي.
          </p>
        </div>

        {/* 3 Connected Steps */}
        <ol className="relative mt-14 grid items-stretch gap-10 md:grid-cols-3 md:gap-8">
          {/* Connecting line (desktop) */}
          <div
            aria-hidden
            className="absolute inset-x-[16%] top-7 hidden h-px bg-[color:var(--wq-border)] md:block"
          >
            <div
              className={`wq-how-line ${inClass} h-full w-full bg-[color:var(--wq-brand)]`}
            />
          </div>

          {steps.map((step, i) => (
            <li
              key={step.num}
              style={delay(250 + i * 350)}
              className={`wq-how-reveal ${inClass} relative flex h-full flex-col items-center text-center`}
            >
              {/* Step Number */}
              <span
                className={`relative grid size-14 shrink-0 place-items-center rounded-full text-lg font-bold ${
                  i === 2
                    ? 'bg-[color:var(--wq-primary)] text-[color:var(--wq-primary-foreground)]'
                    : 'border-2 border-[color:var(--wq-primary)] bg-[color:var(--wq-card)] text-[color:var(--wq-brand)]'
                }`}
              >
                {step.num}
              </span>

              {/* Badge */}
              <span className="mt-5 inline-block text-[11px] font-bold text-[color:var(--wq-brand)]">
                {step.badge}
              </span>

              {/* Title */}
              <h3 className="mx-auto mt-2 min-h-[64px] max-w-72 font-semibold leading-8">
                {step.title}
              </h3>

              {/* Step Mini Preview Box */}
              <div className="mx-auto mt-auto min-h-[100px] w-full max-w-72 space-y-1 rounded-2xl border border-[color:var(--wq-border)] bg-[color:var(--wq-background)] p-4 text-right">
                <div className="text-xs font-bold">
                  {step.preview.tag}
                </div>

                <div className="text-[11px] leading-5 text-[color:var(--wq-muted-foreground)]">
                  {step.preview.detail}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
