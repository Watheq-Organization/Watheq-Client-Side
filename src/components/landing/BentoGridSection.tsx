import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpenCheck,
  Receipt,
  Boxes,
  Users,
  Store,
  CloudUpload,
} from 'lucide-react';

/**
 * Code 2 (Lovable) design system tokens, scoped to this section.
 * Light values are the exact Code 2 oklch tokens. Dark values are derived from the
 * same system and switch with the project's `.dark` class.
 */

const BENTO_STYLES = `
.wq-bento {
  --wq-foreground: #18332d;
  --wq-background: #f8fbf9;
  --wq-card: #ffffff;

  --wq-muted-foreground: #647871;
  --wq-border: #e2ebe7;

  --wq-brand: #0f8069;
  --wq-surface-soft: #f0f6f3;

  --wq-shadow-card:
    0 1px 2px rgba(15, 65, 52, 0.04),
    0 12px 32px -16px rgba(15, 65, 52, 0.16);

  --wq-shadow-float:
    0 30px 60px -24px rgba(15, 65, 52, 0.25);

  color: var(--wq-foreground);
}

.dark .wq-bento {
  --wq-foreground: #f4f4f5;
  --wq-background: #18181b;
  --wq-card: #202023;

  --wq-muted-foreground: #a1a1aa;
  --wq-border: #333338;

  --wq-brand: #0f8069;
  --wq-surface-soft: #27272a;

  --wq-shadow-card:
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 12px 32px -16px rgba(0, 0, 0, 0.5);

  --wq-shadow-float:
    0 30px 60px -24px rgba(0, 0, 0, 0.7);
}

.wq-bento {
  --wq-brand-30: color-mix(in oklab, var(--wq-brand) 30%, transparent);
}

.wq-bento-shadow-card {
  box-shadow: var(--wq-shadow-card);
}

@keyframes wq-bento-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: no-preference) {
  .wq-bento-reveal {
    opacity: 0;
  }

  .wq-bento-reveal.is-in {
    animation: wq-bento-in 700ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
    animation-delay: var(--d, 0ms);
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

type FeatureCard = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

export const BentoGridSection: React.FC = () => {
  const { ref, seen } = useInView<HTMLDivElement>();
  const reveal = `wq-bento-reveal ${seen ? 'is-in' : ''}`;

  const cards: FeatureCard[] = [
    {
      id: 'debts',
      title: 'إدارة الديون وحسابات الزبائن',
      description:
        'سجّل الديون والدفعات بالصوت أو النص وتابع الرصيد المتبقي وكشوفات الحساب PDF بضغطة زر.',
      icon: <BookOpenCheck className="size-6" strokeWidth={1.6} />,
    },
    {
      id: 'sales',
      title: 'المبيعات والكاشير والعمل أوفلاين',
      description:
        'سجّل عمليات البيع اليومية وتابع حركة الكاشير حتى بدون إنترنت مع مزامنة تلقائية مشفرة.',
      icon: <Receipt className="size-6" strokeWidth={1.6} />,
    },
    {
      id: 'inventory',
      title: 'إدارة المخزون الذكية',
      description:
        'اعرف الكميات المتوفرة والأصناف التي قاربت على النفاد مع فصل واضح بين رأس المال والأرباح.',
      icon: <Boxes className="size-6" strokeWidth={1.6} />,
    },
    {
      id: 'staff',
      title: 'الموظفين والصلاحيات',
      description: 'أضف موظفيك وحدد صلاحية كل موظف بدقة لحماية بياناتك المالية.',
      icon: <Users className="size-6" strokeWidth={1.6} />,
    },
    {
      id: 'branches',
      title: 'إدارة الفروع المتعددة',
      description: 'تابع أكثر من فرع وشوف نظرة مالية عامة وموحدة على نشاطهم من لوحة تحكم واحدة.',
      icon: <Store className="size-6" strokeWidth={1.6} />,
    },
    {
      id: 'backup',
      title: 'النسخ الاحتياطي التلقائي',
      description:
        'نحفظ نسخة مشفّرة من مبيعاتك وديونك ومخزونك تلقائياً كل يوم، وتقدر تسترجعها بضغطة زر إذا تعطل جهازك أو ضاع.',
      icon: <CloudUpload className="size-6" strokeWidth={1.6} />,
    },
  ];

  const cardClass = `${reveal} wq-bento-shadow-card group relative flex min-w-0 flex-col items-center rounded-3xl border border-[color:var(--wq-border)] bg-[color:var(--wq-card)] px-5 pb-7 pt-12 text-center transition duration-300 hover:-translate-y-1 hover:border-[color:var(--wq-brand-30)] hover:shadow-[var(--wq-shadow-float)] sm:px-6`;
  // Circle centered on the card's top edge (half outside, half inside)
  const iconClass =
    'absolute left-1/2 top-0 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[color:var(--wq-brand)] text-white ring-[6px] ring-[color:var(--wq-background)] transition duration-500 group-hover:scale-110';

  return (
    <section id="features" className="wq-bento overflow-x-clip py-20 lg:py-28">
      <style>{BENTO_STYLES}</style>

      <div ref={ref} className="mx-auto max-w-6xl px-5">
        {/* Section Header */}
        <div className="max-w-2xl text-right">
          <p
            style={delay(0)}
            className={`${reveal} text-xs font-bold tracking-wide text-[color:var(--wq-brand)]`}
          >
            مزايا صُممت لواقع التاجر
          </p>
          <h2
            style={delay(90)}
            className={`${reveal} mt-3 font-cairo text-2xl font-bold leading-[1.6] sm:text-3xl lg:text-4xl lg:leading-[1.5]`}
          >
            كل اللي بتحتاجه لتتابع مالية محلك
          </h2>
          <p
            style={delay(180)}
            className={`${reveal} mt-4 leading-8 text-[color:var(--wq-muted-foreground)]`}
          >
            أدوات مالية عملية تدمج التوثيق الفوري مع إدارة المبيعات والمخزون، لتوفر وقتك وتحفظ كل مليم من الضياع.
          </p>
        </div>

        {/* Grid: 1 col mobile, 2 cols tablet, 3 cols desktop (extra top gap for the overhanging icons) */}
        <div className="mt-20 grid gap-x-5 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <article key={card.id} style={delay(120 + i * 90)} className={cardClass}>
              <span className={iconClass}>{card.icon}</span>
              <h3 className="font-bold leading-7">{card.title}</h3>
              <span className="my-3 h-0.5 w-8 rounded-full bg-[color:var(--wq-brand)]" />
              <p className="text-sm leading-7 text-[color:var(--wq-muted-foreground)]">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};