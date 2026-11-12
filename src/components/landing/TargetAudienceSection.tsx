import React, { useEffect, useRef, useState } from 'react';
import { ShoppingBag, Store, Truck, Banknote } from 'lucide-react';

/**
 * Code 2 (Lovable) design system tokens, scoped to this section.
 * Light values are the exact Code 2 oklch tokens. Dark values are derived from the
 * same system and switch with the project's `.dark` class.
 */

const AUDIENCE_STYLES = `
.wq-audience {
  --wq-foreground: #18332d;
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

.dark .wq-audience {
  --wq-foreground: #f4f4f5;
  --wq-card: #18181b;

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

.wq-audience {
  --wq-brand-30: color-mix(in oklab, var(--wq-brand) 30%, transparent);
}

@keyframes wq-aud-in-right {
  from { opacity: 0; transform: translate3d(36px, 0, 0); }
  to { opacity: 1; transform: none; }
}

@keyframes wq-aud-in-scale {
  from { opacity: 0; transform: scale(0.94); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: no-preference) {
  .wq-aud-right,
  .wq-aud-scale {
    opacity: 0;
  }

  .wq-aud-right.is-in {
    animation: wq-aud-in-right 800ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
    animation-delay: var(--d, 0ms);
  }

  .wq-aud-scale.is-in {
    animation: wq-aud-in-scale 700ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
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

export const TargetAudienceSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const { ref, seen } = useInView<HTMLDivElement>();
  const inClass = seen ? 'is-in' : '';

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
        'إقرار إلكتروني ملزم بزر (تأكيد / اعتراض) من طرف العميل.',
        'سجل مشفر غير قابل للتعديل العشوائي أو الضياع كالأوراق.',
        'توفير ساعات طويلة من تدقيق الحسابات ونهاية الشهر.',
      ],
      tag: 'حماية رأس المال',
    },
  ];

  return (
    <section className="wq-audience bg-[color:var(--wq-surface-soft)] py-20 lg:py-24">
      <style>{AUDIENCE_STYLES}</style>

      <div
        ref={ref}
        className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1fr_2fr] lg:items-center"
      >
        {/* Header */}
        <div className="text-right">
          <p
            style={delay(0)}
            className={`wq-aud-right ${inClass} text-xs font-bold tracking-wide text-[color:var(--wq-brand)]`}
          >
            لمين وثّق؟
          </p>
          <h2
            style={delay(90)}
            className={`wq-aud-right ${inClass} mt-3 font-cairo text-2xl font-bold leading-[1.6] sm:text-3xl lg:text-4xl lg:leading-[1.5]`}
          >
            لأي محل بده يفهم أرقامه ويحمي رأس ماله
          </h2>
          <p
            style={delay(180)}
            className={`wq-aud-right ${inClass} mt-4 leading-8 text-[color:var(--wq-muted-foreground)]`}
          >
            مهما كان حجم تجارتك، وثّق مصمم ليتكيف مع طبيعة عملك اليومية ويلغي فوضى السجلات.
          </p>
        </div>

        {/* 4 Interactive Category Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {categories.map((cat, idx) => {
            const IconComp = cat.icon;
            const isActive = activeCategory === idx;

            return (
              <div
                key={cat.id}
                tabIndex={0}
                onMouseEnter={() => setActiveCategory(idx)}
                onMouseLeave={() => setActiveCategory(null)}
                onFocus={() => setActiveCategory(idx)}
                onBlur={() => setActiveCategory(null)}
                style={delay(150 + idx * 100)}
                className={`wq-aud-scale ${inClass} flex cursor-pointer flex-col gap-4 rounded-2xl border bg-[color:var(--wq-card)] p-5 text-right transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--wq-brand)] ${
                  isActive
                    ? '-translate-y-1 border-[color:var(--wq-brand-30)] shadow-[var(--wq-shadow-float)]'
                    : 'border-transparent shadow-[var(--wq-shadow-card)]'
                }`}
              >
                {/* Icon, Title & Tag */}
                <div className="flex items-start gap-4">
                  <IconComp
                    className={`size-7 shrink-0 text-[color:var(--wq-brand)] transition duration-500 ${
                      isActive ? 'scale-110' : ''
                    }`}
                    strokeWidth={1.5}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold leading-7">{cat.title}</p>
                    <p className="text-xs leading-6 text-[color:var(--wq-muted-foreground)]">
                      {cat.subtitle}
                    </p>
                  </div>
                </div>

                <span className="w-fit rounded-full bg-[color:var(--wq-surface-soft)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--wq-brand)]">
                  {cat.tag}
                </span>

                {/* Detailed Points */}
                {/* <ul className="space-y-2 border-t border-[color:var(--wq-border)] pt-3">
                  {cat.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-start gap-2 text-xs leading-6 text-[color:var(--wq-muted-foreground)]"
                    >
                      <span
                        aria-hidden
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-[color:var(--wq-brand)]"
                      />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul> */}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};