import React, { useEffect, useRef, useState } from 'react';

/**
 * Code 2 (Lovable) design system tokens, scoped to this section.
 * Light values are the exact Code 2 oklch tokens. Dark values are derived from the
 * same system and switch with the project's `.dark` class.
 */

const COMPARE_STYLES = `
.wq-compare {
  --wq-foreground: #18332d;
  --wq-card: #ffffff;
  --wq-muted: #f0f6f3;
  --wq-muted-foreground: #647871;
  --wq-border: #e2ebe7;
  --wq-brand: #0f8069;
  --wq-surface-soft: #f0f6f3;
  color: var(--wq-foreground);
}

.dark .wq-compare {
  --wq-foreground: #f4f4f5;
  --wq-card: #202023;
  --wq-muted: #27272a;
  --wq-muted-foreground: #a1a1aa;
  --wq-border: #333338;
  --wq-brand: #0f8069;
  --wq-surface-soft: #27272a;
}

.wq-compare {
  --wq-muted-60: color-mix(in oklab, var(--wq-muted) 60%, transparent);
  --wq-muted-foreground-60: color-mix(in oklab, var(--wq-muted-foreground) 60%, transparent);
}

@keyframes wq-cmp-up {
  from { opacity: 0; transform: translate3d(0, 28px, 0); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: no-preference) {
  .wq-cmp-reveal { opacity: 0; }
  .wq-cmp-reveal.is-in {
    animation: wq-cmp-up 800ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
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

type Level = 'yes' | 'partial' | 'no';

interface Cell {
  level: Level;
  text: string;
}

const columns = [
  'الدفتر الورقي وتطبيقات الديون',
  'أنظمة الكاشير التقليدية',
  'أنظمة ERP المعقدة',
  'منصة وثّق',
];

const criteria: { title: string; subtitle: string; cells: [Cell, Cell, Cell, Cell] }[] = [
  {
    title: 'إدارة الديون وتوثيق الزبون التفاعلي',
    subtitle: 'تأكيد مباشر عبر Telegram / WhatsApp بدون تطبيق للعميل',
    cells: [
      { level: 'no', text: 'غير متوفر (إنكار وخلافات مستمرة)' },
      { level: 'no', text: 'مقتصر على ورق الفاتورة' },
      { level: 'partial', text: 'رسائل نصية مكلفة وغير تفاعلية' },
      { level: 'yes', text: 'توثيق فوري بزر تأكيد/اعتراض ملزم' },
    ],
  },
  {
    title: 'مطابقة التحويلات البنكية مع المبيعات',
    subtitle: 'التحقق اللحظي من الحوالات الواردة لمنع السرقات والحوالات الوهمية',
    cells: [
      { level: 'no', text: 'غير متوفر تماماً' },
      { level: 'no', text: 'فحص يدوي بطيء ومعرض للخطأ' },
      { level: 'partial', text: 'يحتاج ربط بنكي معقد وتكاليف باهظة' },
      { level: 'yes', text: 'مطابقة آلية ذكية بنقرة واحدة' },
    ],
  },
  {
    title: 'العمل بدون إنترنت (Offline-First)',
    subtitle: 'استمرار تسجيل البيع والديون عند انقطاع الكهرباء والإنترنت',
    cells: [
      { level: 'partial', text: 'الدفتر يعمل لكنه مهدد بالتلف والضياع' },
      { level: 'partial', text: 'محلي فقط ولا يتزامن سحابياً' },
      { level: 'no', text: 'يتوقف كلياً عن العمل أوفلاين' },
      { level: 'yes', text: 'أوفلاين 100% مع مزامنة تلقائية مشفرة' },
    ],
  },
  {
    title: 'التسجيل الصوتي السريع (AI Voice Entry)',
    subtitle: 'تسجيل الديون والمبيعات بالعامية أثناء انشغال الكاشير',
    cells: [
      { level: 'no', text: 'كتابة يدوية تستغرق وقتاً' },
      { level: 'no', text: 'يتطلب إدخال يدوي بطيء بالباركود/الكيبورد' },
      { level: 'no', text: 'شاشات محاسبية معقدة جداً' },
      { level: 'yes', text: 'فهم صوتي دقيق باللهجة المحلية' },
    ],
  },
  {
    title: 'المبيعات، الكاشير والمخزون بمكان واحد',
    subtitle: 'ربط مبيعات الكاشير فورياً بحسابات الديون وجرد المستودع',
    cells: [
      { level: 'no', text: 'منفصل تماماً ولا يوجد جرد' },
      { level: 'partial', text: 'كاشير ومخزون دون توثيق ديون تفاعلي' },
      { level: 'partial', text: 'شامل ولكنه مرهق وبطيء الاستخدام' },
      { level: 'yes', text: 'منظومة موحدة متناغمة 100%' },
    ],
  },
  {
    title: 'سهولة الاستخدام وسرعة الإطلاق',
    subtitle: 'جاهز للاستخدام في دقائق دون الحاجة لمحاسب متخصص',
    cells: [
      { level: 'partial', text: 'بسيط لكنه فوضوي ومحفوف بالمخاطر' },
      { level: 'partial', text: 'يتطلب أجهزة مخصصة وتدريب' },
      { level: 'no', text: 'يتطلب شهوراً من التدريب ومحاسب متفرغ' },
      { level: 'yes', text: 'تبدأ بالعمل خلال دقيقتين فقط' },
    ],
  },
];

const levelClass = (level: Level, isWatheq: boolean) => {
  if (isWatheq) return 'font-bold text-[color:var(--wq-brand)]';
  if (level === 'partial') return 'font-medium text-[color:var(--wq-muted-foreground)]';
  return 'font-medium text-[color:var(--wq-muted-foreground-60)]';
};

export const ComparisonSection: React.FC = () => {
  const { ref, seen } = useInView<HTMLDivElement>();
  const inClass = seen ? 'is-in' : '';

  return (
    <section id="comparison" className="wq-compare py-20 lg:py-28">
      <style>{COMPARE_STYLES}</style>

      <div ref={ref} className="mx-auto max-w-6xl px-5">
        {/* Section Header */}
        <div className="max-w-2xl text-right">
          <p
            style={delay(0)}
            className={`wq-cmp-reveal ${inClass} text-xs font-bold tracking-wide text-[color:var(--wq-brand)]`}
          >
            المقارنة الشاملة
          </p>
          <h2
            style={delay(90)}
            className={`wq-cmp-reveal ${inClass} mt-3 font-cairo text-2xl font-bold leading-[1.6] sm:text-3xl lg:text-4xl lg:leading-[1.5]`}
          >
            وثّق مقارنة بأنواع التطبيقات والأساليب المشابهة
          </h2>
          <p
            style={delay(180)}
            className={`wq-cmp-reveal ${inClass} mt-4 leading-8 text-[color:var(--wq-muted-foreground)]`}
          >
            اكتشف الفرق الجوهري بين فوضى الدفاتر القديمة والأنظمة المعقدة وبين تجربة "وثّق" المصممة خصيصاً للتجار.
          </p>
        </div>

        {/* Desktop table */}
        <div
          style={delay(180)}
          className={`wq-cmp-reveal ${inClass} mt-12 hidden overflow-hidden rounded-3xl border border-[color:var(--wq-border)] bg-[color:var(--wq-card)] md:block`}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--wq-border)]">
                <th className="w-[28%] p-5 text-right font-semibold text-[color:var(--wq-muted-foreground)]">
                  المعيار والخاصية
                </th>
                {columns.map((c, i) => (
                  <th
                    key={c}
                    className={`p-5 text-center font-bold ${
                      i === 3 ? 'bg-[color:var(--wq-surface-soft)] text-[color:var(--wq-brand)]' : ''
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map((row) => (
                <tr
                  key={row.title}
                  className="border-b border-[color:var(--wq-border)] transition-colors last:border-0 hover:bg-[color:var(--wq-muted-60)]"
                >
                  <td className="p-5 text-right">
                    <div className="font-semibold">{row.title}</div>
                    <div className="mt-0.5 text-[11px] leading-5 text-[color:var(--wq-muted-foreground)]">
                      {row.subtitle}
                    </div>
                  </td>
                  {row.cells.map((cell, i) => (
                    <td
                      key={i}
                      className={`p-5 text-center text-xs leading-6 ${
                        i === 3 ? 'bg-[color:var(--wq-surface-soft)]' : ''
                      } ${levelClass(cell.level, i === 3)}`}
                    >
                      {cell.text}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mt-10 space-y-3 md:hidden">
          {criteria.map((row, idx) => (
            <div
              key={row.title}
              style={delay(idx * 60)}
              className={`wq-cmp-reveal ${inClass} rounded-2xl border border-[color:var(--wq-border)] bg-[color:var(--wq-card)] p-4`}
            >
              <p className="font-bold">{row.title}</p>
              <p className="mt-1 text-[11px] leading-5 text-[color:var(--wq-muted-foreground)]">{row.subtitle}</p>
              <dl className="mt-3 space-y-2">
                {columns.map((c, i) => {
                  const cell = row.cells[i]!;
                  return (
                    <div
                      key={c}
                      className={`rounded-lg px-3 py-2 text-xs ${
                        i === 3 ? 'bg-[color:var(--wq-surface-soft)]' : ''
                      }`}
                    >
                      <dt
                        className={`font-semibold ${
                          i === 3 ? 'text-[color:var(--wq-brand)]' : 'text-[color:var(--wq-muted-foreground)]'
                        }`}
                      >
                        {c}
                      </dt>
                      <dd className={`mt-1 leading-6 ${levelClass(cell.level, i === 3)}`}>{cell.text}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};