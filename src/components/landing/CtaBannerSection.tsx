import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '../../routes/paths';

/**
 * Code 2 (Lovable) design system tokens, scoped to this section.
 * Light values are the exact Code 2 oklch tokens. Dark values are derived from the
 * same system and switch with the project's `.dark` class.
 */

const CTA_STYLES = `
.wq-cta {
  --wq-foreground: #18332d;
  --wq-background: #f8fbf9;
  --wq-card: #ffffff;
  --wq-muted-foreground: #647871;
  --wq-border: #e2ebe7;
  --wq-brand: #0f8069;
  --wq-surface-soft: #f0f6f3;
  --wq-warn: #b7791f;

  /* Fixed green palette (banner, identical in light and dark) */
  --wq-on-deep: #ffffff;
  --wq-on-deep-muted: #e0f2ec;
  --wq-phone-frame: #18181b;
  --wq-store-badge: #050505;

  color: var(--wq-foreground);
}

.dark .wq-cta {
  --wq-foreground: #f4f4f5;
  --wq-background: #18181b;
  --wq-card: #202023;
  --wq-muted-foreground: #a1a1aa;
  --wq-border: #333338;
  --wq-brand: #0f8069;
  --wq-surface-soft: #27272a;
  --wq-warn: #e5b454;
}

.wq-cta {
  --wq-on-deep-10: color-mix(in oklab, var(--wq-on-deep) 10%, transparent);
  --wq-on-deep-30: color-mix(in oklab, var(--wq-on-deep) 30%, transparent);
}

.wq-cta-deep-gradient {
  background: #0f8069;
}

@keyframes wq-cta-up {
  from { opacity: 0; transform: translate3d(0, 28px, 0); }
  to { opacity: 1; transform: none; }
}

@keyframes wq-cta-scale {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: none; }
}

@keyframes wq-cta-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@media (prefers-reduced-motion: no-preference) {
  .wq-cta-up, .wq-cta-scale { opacity: 0; }

  .wq-cta-up.is-in {
    animation: wq-cta-up 800ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
    animation-delay: var(--d, 0ms);
  }

  .wq-cta-scale.is-in {
    animation: wq-cta-scale 800ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
  }

  .wq-cta-float { animation: wq-cta-float 8s ease-in-out infinite; }
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

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as React.CSSProperties;

const recentActivity = [
  { title: 'سداد دين — متجر الأنوار', time: 'قبل 4 د', amount: '+650 ₪' },
  { title: 'تحويل بنكي مطابق للبيع #1042', time: 'قبل 10 د', amount: '450 ₪' },
  { title: 'تأكيد دين عبر تليجرام', time: 'قبل 25 د', amount: '45 ₪' },
];

const tabs = ['الرئيسية', 'الديون', 'الكاشير', 'المخزون'];

/** Small iPhone 17 mockup showing the Watheq app. */
const PhoneMockup: React.FC = () => (
  <div
    aria-hidden
    className="relative mx-auto h-[470px] w-[232px] rounded-[2.6rem] bg-[color:var(--wq-phone-frame)] p-[7px] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.6)] ring-1 ring-white/15"
  >
    {/* Side buttons */}
    <span className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-s bg-[color:var(--wq-phone-frame)]" />
    <span className="absolute -left-[3px] top-36 h-10 w-[3px] rounded-s bg-[color:var(--wq-phone-frame)]" />
    <span className="absolute -right-[3px] top-32 h-16 w-[3px] rounded-e bg-[color:var(--wq-phone-frame)]" />

    {/* Screen */}
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.1rem] bg-[color:var(--wq-background)] text-right">
      {/* Dynamic Island */}
      <span className="absolute left-1/2 top-2 z-10 h-[22px] w-[74px] -translate-x-1/2 rounded-full bg-[color:var(--wq-phone-frame)]" />

      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pt-3 text-[9px] font-semibold">
        <span className="font-mono">9:41</span>
        <span className="font-mono text-[color:var(--wq-muted-foreground)]">98%</span>
      </div>

      {/* App header */}
      <div className="mt-5 px-4">
        <div className="text-[9px] text-[color:var(--wq-muted-foreground)]">لوحة المتابعة اللحظية</div>
        <div className="text-[12px] font-bold">سوبرماركت البركة</div>
      </div>

      {/* Metrics */}
      <div className="mt-3 grid grid-cols-2 gap-2 px-4">
        <div className="rounded-xl border border-[color:var(--wq-border)] bg-[color:var(--wq-card)] p-2.5">
          <div className="text-[8px] text-[color:var(--wq-muted-foreground)]">الديون الموثقة</div>
          <div className="mt-0.5 font-mono text-[13px] font-bold">142,850</div>
        </div>
        <div className="rounded-xl border border-[color:var(--wq-border)] bg-[color:var(--wq-card)] p-2.5">
          <div className="text-[8px] text-[color:var(--wq-muted-foreground)]">مبيعات اليوم</div>
          <div className="mt-0.5 font-mono text-[13px] font-bold text-[color:var(--wq-brand)]">8,420</div>
        </div>
      </div>

      {/* Mini chart */}
      <div className="mx-4 mt-2 rounded-xl border border-[color:var(--wq-border)] bg-[color:var(--wq-card)] p-2.5">
        <div className="flex items-center justify-between text-[8px] text-[color:var(--wq-muted-foreground)]">
          <span>حركة الأسبوع</span>
          <span className="font-mono text-[color:var(--wq-brand)]">+18.4%</span>
        </div>
        <div className="mt-2 flex h-10 items-end gap-1">
          {[40, 65, 50, 85, 70, 95, 80].map((h, i) => (
            <span
              key={i}
              style={{ height: `${h}%` }}
              className={`flex-1 rounded-t-sm ${
                i === 5 ? 'bg-[color:var(--wq-brand)]' : 'bg-[color:var(--wq-surface-soft)]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-2 flex-1 px-4">
        <div className="mb-1 text-[9px] font-bold">آخر العمليات</div>
        <ul className="space-y-1.5">
          {recentActivity.map((a) => (
            <li
              key={a.title}
              className="flex items-center justify-between gap-2 rounded-lg bg-[color:var(--wq-card)] px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <div className="truncate text-[8.5px] font-semibold">{a.title}</div>
                <div className="text-[7.5px] text-[color:var(--wq-muted-foreground)]">{a.time}</div>
              </div>
              <span className="shrink-0 font-mono text-[9px] font-bold text-[color:var(--wq-brand)]">
                {a.amount}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-1.5 rounded-lg border border-[color:var(--wq-warn)] px-2.5 py-1.5 text-[8px] text-[color:var(--wq-warn)]">
          زيت ذرة 3 لتر: باقي 3 قطع فقط
        </div>
      </div>

      {/* Tab bar */}
      <div className="mt-1 flex items-center justify-around border-t border-[color:var(--wq-border)] bg-[color:var(--wq-card)] px-2 pb-4 pt-2 text-[8px]">
        {tabs.map((t, i) => (
          <span
            key={t}
            className={i === 0 ? 'font-bold text-[color:var(--wq-brand)]' : 'text-[color:var(--wq-muted-foreground)]'}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Home indicator */}
      <span className="absolute bottom-1.5 left-1/2 h-[3px] w-20 -translate-x-1/2 rounded-full bg-[color:var(--wq-foreground)] opacity-70" />
    </div>
  </div>
);

/**
 * Phone cluster from the reference: two overlapping tilted phones plus a faint
 * outlined "ghost" phone, all bleeding out of the banner's top edge and cut at its bottom.
 * Positions are physical (left/right) on purpose so the cluster mirrors the reference in RTL.
 */
const PhoneCluster: React.FC = () => (
  <div className="wq-cta-float absolute inset-x-0 top-0 mx-auto h-[520px] w-full max-w-[460px]">
    {/* Ghost outline phone (farthest from the pair, nearest the copy) */}
    <div
      aria-hidden
      className="absolute left-[270px] top-14 hidden h-[440px] w-[190px] rounded-[2.2rem] border border-[color:var(--wq-on-deep-30)] sm:block"
    />

    {/* Back phone */}
    <div
      className="absolute left-0 top-2 origin-top-left"
      style={{ transform: 'rotate(-7deg) scale(0.78)' }}
    >
      <PhoneMockup />
    </div>

    {/* Front phone */}
    <div
      className="absolute left-[120px] top-12 origin-top-left"
      style={{ transform: 'rotate(6deg) scale(0.9)' }}
    >
      <PhoneMockup />
    </div>
  </div>
);

export const CtaBannerSection: React.FC = () => {
  const navigate = useNavigate();
  const { ref, seen } = useInView<HTMLDivElement>();
  const inClass = seen ? 'is-in' : '';

  const storeBtn =
    'flex items-center gap-2.5 rounded-xl border border-[color:var(--wq-on-deep-30)] bg-[color:var(--wq-store-badge)] px-4 py-2 text-right text-white transition hover:-translate-y-0.5';

  return (
    <section id="download" className="wq-cta px-5 pb-20 pt-32 lg:pt-40">
      <style>{CTA_STYLES}</style>

      <div
        ref={ref}
        className={`wq-cta-scale ${inClass} wq-cta-deep-gradient relative mx-auto max-w-6xl rounded-[1.75rem] px-6 pt-12 text-[color:var(--wq-on-deep)] sm:px-12 lg:pt-0`}
      >
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-stretch lg:gap-6">
          {/* Copy */}
          <div className="text-center lg:self-center lg:py-12 lg:text-start">
            <p
              style={delay(100)}
              className={`wq-cta-up ${inClass} inline-block rounded-full border border-[color:var(--wq-on-deep-30)] px-4 py-1.5 text-xs font-semibold text-[color:var(--wq-on-deep-muted)]`}
            >
              انضم لمئات التجار الذين يحمون أموالهم يومياً
            </p>

            <h2
              style={delay(200)}
              className={`wq-cta-up ${inClass} mt-4 font-cairo text-2xl font-extrabold leading-[1.5] sm:text-4xl`}
            >
              خلّي أرقام محلك واضحة، وحقك دايماً محفوظ
            </h2>

            <p
              style={delay(300)}
              className={`wq-cta-up ${inClass} mx-auto mt-3 max-w-md text-sm leading-7 text-[color:var(--wq-on-deep-muted)] lg:mx-0`}
            >
              ابدأ اليوم مع وثّق وحوّل معاملاتك اليومية وديونك وتحويلاتك البنكية إلى سجل رقمي موثوق.
            </p>

            <div
              style={delay(400)}
              className={`wq-cta-up ${inClass} mt-6 flex flex-wrap justify-center gap-3 lg:justify-start`}
            >
              <button
                type="button"
                onClick={() => navigate(PATHS.REGISTER)}
                className="cursor-pointer rounded-full bg-[color:var(--wq-card)] px-7 py-2.5 text-sm font-semibold text-[color:var(--wq-brand)] transition hover:-translate-y-0.5 hover:bg-[color:var(--wq-surface-soft)]"
              >
                ابدأ مع وثّق مجاناً
              </button>
              <button
                type="button"
                onClick={() => navigate(PATHS.DASHBOARD)}
                className="cursor-pointer rounded-full border border-[color:var(--wq-on-deep-30)] px-7 py-2.5 text-sm font-semibold transition hover:bg-[color:var(--wq-on-deep-10)]"
              >
                تجربة نسخة الويب (PWA)
              </button>
            </div>

            {/* Store badges */}
            <div
              style={delay(500)}
              className={`wq-cta-up ${inClass} mt-5 flex flex-wrap items-center justify-center gap-3 lg:justify-start`}
            >
              <a href="#download-android" className={storeBtn}>
                <svg className="size-6 fill-current" viewBox="0 0 24 24" aria-hidden>
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.993 1.993 0 0 1-.61-1.414V3.228c0-.53.21-1.04.609-1.414zm11.603 11.604l2.585 2.585-11.89 6.865 9.305-9.45zm2.585-2.836l-2.585 2.585L5.907 3.717l11.89 6.865zm1.536.886l2.124 1.226c.725.419.725 1.101 0 1.52l-2.124 1.226-2.176-2.176 2.176-1.796z" />
                </svg>
                <span className="leading-tight">
                  <span className="block text-[10px] text-white/70">تحميل للأندرويد</span>
                  <span className="block text-xs font-bold">Google Play</span>
                </span>
              </a>

              <a href="#download-ios" className={storeBtn}>
                <svg className="size-6 fill-current" viewBox="0 0 24 24" aria-hidden>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.13.65-2.79 1.42-.58.67-1.1 1.74-1.01 2.78 1.08.08 2.18-.58 2.79-1.33z" />
                </svg>
                <span className="leading-tight">
                  <span className="block text-[10px] text-white/70">تحميل للآيفون</span>
                  <span className="block text-xs font-bold">App Store</span>
                </span>
              </a>
            </div>
          </div>

          {/* Phones: bleed out of the top edge, cut flush at the banner's bottom edge */}
          <div
            aria-hidden
            style={{ clipPath: 'inset(-300px -80px 0 -80px)' }}
            className="relative h-[300px] sm:h-[340px] lg:h-auto lg:min-h-[300px]"
          >
            <div className="absolute inset-x-0 top-0 lg:-top-24">
              <PhoneCluster />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};