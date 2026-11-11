import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PATHS } from '../../routes/paths';

/**
 * Code 2 (Lovable) design system tokens, scoped to this section.
 * Light values are the exact Code 2 oklch tokens. Dark values are derived from the
 * same system and switch with the project's `.dark` class.
 */

const PRICING_STYLES = `
.wq-pricing {
  --wq-foreground: #18332d;
  --wq-background: #f8fbf9;
  --wq-card: #ffffff;

  --wq-primary: #0f8069;
  --wq-primary-foreground: #ffffff;

  --wq-muted: #f0f6f3;
  --wq-muted-foreground: #647871;

  --wq-border: #e2ebe7;
  --wq-input: #dce7e2;

  --wq-brand: #0f8069;
  --wq-surface-soft: #f0f6f3;

  --wq-shadow-float: 0 30px 60px -24px rgba(15, 65, 52, 0.25);

  /* Fixed deep palette (featured plan, identical in light and dark) */
  --wq-on-deep: #f4f4f5;
  --wq-on-deep-muted: #a1a1aa;
  --wq-on-brand: #0f8069;

  color: var(--wq-foreground);
}

.dark .wq-pricing {
  --wq-foreground: #f4f4f5;
  --wq-background: #18181b;
  --wq-card: #202023;

  --wq-primary: #0f8069;
  --wq-primary-foreground: #ffffff;

  --wq-muted: #27272a;
  --wq-muted-foreground: #a1a1aa;

  --wq-border: #333338;
  --wq-input: #3f3f46;

  --wq-brand: #0f8069;
  --wq-surface-soft: #27272a;

  --wq-shadow-float: 0 30px 60px -24px rgba(0, 0, 0, 0.7);
}

.wq-pricing {
  --wq-on-deep-15: color-mix(in oklab, var(--wq-on-deep) 15%, transparent);
  --wq-on-deep-30: color-mix(in oklab, var(--wq-on-deep) 30%, transparent);
}

.wq-pricing-deep-gradient {
  background: #0f8069;
}

@keyframes wq-pr-up {
  from {
    opacity: 0;
    transform: translate3d(0, 28px, 0);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes wq-pr-scale {
  from {
    opacity: 0;
    transform: scale(0.94);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .wq-pr-reveal {
    opacity: 0;
  }

  .wq-pr-reveal.is-in {
    animation: wq-pr-up 800ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
    animation-delay: var(--d, 0ms);
  }

  .wq-pr-reveal.scale.is-in {
    animation-name: wq-pr-scale;
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

export const PricingSection: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { ref, seen } = useInView<HTMLDivElement>();
  const inClass = seen ? 'is-in' : '';

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
    <section id="pricing" className="wq-pricing bg-[color:var(--wq-card)] py-20 lg:py-28">
      <style>{PRICING_STYLES}</style>

      <div ref={ref} className="mx-auto max-w-6xl px-5">
        {/* Section Header */}
        <div className="text-center">
          <p
            style={delay(0)}
            className={`wq-pr-reveal ${inClass} text-xs font-bold tracking-wide text-[color:var(--wq-brand)]`}
          >
            الخطط والأسعار
          </p>
          <h2
            style={delay(90)}
            className={`wq-pr-reveal ${inClass} mt-3 font-cairo text-2xl font-bold leading-[1.6] sm:text-3xl lg:text-4xl lg:leading-[1.5]`}
          >
            خطط مرنة تناسب حجم تجارتك
          </h2>
          <p
            style={delay(180)}
            className={`wq-pr-reveal ${inClass} mx-auto mt-4 max-w-2xl leading-8 text-[color:var(--wq-muted-foreground)]`}
          >
            استثمر في راحة بالك ووثّق كل حركة مالية بأسعار شفافة وبدون أي تكاليف خفية.
          </p>

          {/* Billing Cycle Toggle */}
          <div
            style={delay(240)}
            className={`wq-pr-reveal ${inClass} mt-8 inline-flex rounded-full border border-[color:var(--wq-border)] bg-[color:var(--wq-card)] p-1`}
          >
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              aria-pressed={billingCycle === 'monthly'}
              className={`cursor-pointer rounded-full px-6 py-2 text-sm font-semibold transition ${
                billingCycle === 'monthly'
                  ? 'bg-[color:var(--wq-primary)] text-[color:var(--wq-primary-foreground)]'
                  : 'text-[color:var(--wq-muted-foreground)]'
              }`}
            >
              الدفع الشهري
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              aria-pressed={billingCycle === 'yearly'}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full px-6 py-2 text-sm font-semibold transition ${
                billingCycle === 'yearly'
                  ? 'bg-[color:var(--wq-primary)] text-[color:var(--wq-primary-foreground)]'
                  : 'text-[color:var(--wq-muted-foreground)]'
              }`}
            >
              <span>الدفع السنوي</span>
              <span className="text-[11px] font-bold opacity-80">وفّر 20%</span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-3">
          {plans.map((plan, idx) => {
            const hi = plan.isFeatured;
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            const period = billingCycle === 'monthly' ? '/ شهرياً' : '/ سنوياً';

            return (
              <div
                key={plan.id}
                style={delay(hi ? 120 : 220 + idx * 60)}
                className={`wq-pr-reveal ${hi ? 'scale' : ''} ${inClass} flex flex-col rounded-3xl p-8 text-right transition duration-300 hover:-translate-y-1 ${
                  hi
                    ? 'wq-pricing-deep-gradient text-[color:var(--wq-on-deep)] shadow-[var(--wq-shadow-float)] lg:-my-4'
                    : 'border border-[color:var(--wq-border)] bg-[color:var(--wq-background)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      hi
                        ? 'bg-[color:var(--wq-on-deep-15)]'
                        : 'bg-[color:var(--wq-surface-soft)] text-[color:var(--wq-brand)]'
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>

                <p
                  className={`mt-3 text-sm leading-7 ${
                    hi ? 'text-[color:var(--wq-on-deep-muted)]' : 'text-[color:var(--wq-muted-foreground)]'
                  }`}
                >
                  {plan.subtitle}
                </p>

                {/* Price */}
                <div
                  className={`mt-6 rounded-xl border border-dashed px-4 py-3 ${
                    hi ? 'border-[color:var(--wq-on-deep-30)]' : 'border-[color:var(--wq-input)]'
                  }`}
                >
                  <p className="flex items-baseline gap-1 font-mono">
                    <span className="text-3xl font-bold">{price}</span>
                    <span className="text-base font-bold">₪</span>
                    <span
                      className={`font-cairo text-[11px] ${
                        hi ? 'text-[color:var(--wq-on-deep-muted)]' : 'text-[color:var(--wq-muted-foreground)]'
                      }`}
                    >
                      {period}
                    </span>
                  </p>
                </div>

                {/* Features List */}
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        className={`mt-1 size-4 shrink-0 ${
                          hi ? 'text-[color:var(--wq-on-deep)]' : 'text-[color:var(--wq-brand)]'
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Card Button */}
                <button
                  type="button"
                  onClick={() => navigate(PATHS.REGISTER)}
                  className={`mt-8 w-full cursor-pointer rounded-full py-3 text-center text-sm font-semibold transition ${
                    hi
                      ? 'bg-[color:var(--wq-card)] text-[color:var(--wq-brand)] hover:bg-[color:var(--wq-surface-soft)]'
                      : 'border border-[color:var(--wq-primary)] text-[color:var(--wq-brand)] hover:bg-[color:var(--wq-primary)] hover:text-[color:var(--wq-primary-foreground)]'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-[color:var(--wq-muted-foreground)]">
          الأسعار بالشيكل، ويمكنك تغيير الخطة في أي وقت.
        </p>
      </div>
    </section>
  );
};