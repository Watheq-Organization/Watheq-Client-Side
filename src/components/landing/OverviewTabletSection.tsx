import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Check,
  ArrowLeft,
  ShieldCheck,
  Play,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import wireBg from '/landing.jpg';

/* ------------------------------------------------------------------ */
/* "Watheq" handwriting-style wireframe (viewBox 400 x 440)            */
/* Each letter is a single-stroke path, drawn one after another.       */
/* Local letter space: baseline y=0, x-height y=-60, ascender y=-100,  */
/* descender y=40. The whole word is scaled/centered by WORD_TRANSFORM.*/
/* ------------------------------------------------------------------ */

const LETTERS: { key: string; d: string }[] = [
  { key: 'W', d: 'M0,-100L27,0L55,-62L83,0L110,-100' },
  {
    key: 'a',
    d: 'M180,-30C180,-47 169,-60 155,-60C141,-60 130,-47 130,-30C130,-13 141,0 155,0C169,0 180,-13 180,-30Z M180,-60L180,0',
  },
  { key: 't', d: 'M215,-100L215,-12C215,-4 222,0 232,0 M200,-60L235,-60' },
  {
    key: 'h',
    d: 'M255,-100L255,0 M255,-38C255,-54 267,-60 280,-60C296,-60 305,-52 305,-36L305,0',
  },
  {
    key: 'e',
    d: 'M325,-30L375,-30C375,-48 365,-60 350,-60C335,-60 325,-47 325,-30C325,-13 335,0 351,0C361,0 369,-5 373,-13',
  },
  {
    key: 'q',
    d: 'M445,-30C445,-47 434,-60 420,-60C406,-60 395,-47 395,-30C395,-13 406,0 420,0C434,0 445,-13 445,-30Z M445,-60L445,40',
  },
];

const WORD_TRANSFORM = 'translate(26 243) scale(0.78)';

/** Typography guide lines (ascender, x-height, baseline, descender). */
const GUIDES_PATH = 'M-20,-100L465,-100 M-20,-60L465,-60 M-20,0L465,0 M-20,40L465,40';

/** Keyframes: letter i starts drawing at (6 + i*10)% of the loop and takes 14%. */
const LETTER_KEYFRAMES = LETTERS.map((_, i) => {
  const s = 6 + i * 10;
  const e = s + 14;
  return `@keyframes wq-w-letter-${i} {
  0%, ${s}% { stroke-dashoffset: 1; animation-timing-function: cubic-bezier(0.45, 0, 0.25, 1); }
  ${e}% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 0; }
}`;
}).join('\n');

const LETTER_RULES = LETTERS.map(
  (_, i) => `  .wq-wire .wq-l-${i} { animation: wq-w-letter-${i} var(--wq-wire-dur) linear infinite both; }`,
).join('\n');

/**
 * Code 2 (Lovable) design system tokens, scoped to this section.
 * Light values are the exact Code 2 oklch tokens. Dark values are derived from the
 * same system and switch with the project's `.dark` class.
 */

const OVERVIEW_STYLES = `
.wq-overview {
  --wq-foreground: #18332d;
  --wq-background: #f8fbf9;
  --wq-card: #ffffff;

  --wq-primary: #0f8069;
  --wq-primary-foreground: #ffffff;

  --wq-muted-foreground: #647871;
  --wq-border: #e2ebe7;
  --wq-ring: #0f8069;

  --wq-brand: #0f8069;
  --wq-brand-deep: #096653;
  --wq-surface-soft: #f0f6f3;

  --wq-warn: #b7791f;
  --wq-warn-soft: #fff7e6;

  --wq-shadow-card:
    0 1px 2px rgba(15, 65, 52, 0.04),
    0 12px 32px -16px rgba(15, 65, 52, 0.16);

  --wq-shadow-float:
    0 30px 60px -24px rgba(15, 65, 52, 0.25);

  /* Fixed deep palette */
  --wq-deep: #18181b;
  --wq-deep-2: #202023;
  --wq-deep-3: #27272a;
  --wq-on-deep: #f4f4f5;
  --wq-on-deep-muted: #a1a1aa;

  --wq-accent: #0f8069;
  --wq-accent-warn: #e5a83b;

  color: var(--wq-foreground);
}

.dark .wq-overview {
  --wq-foreground: #f4f4f5;
  --wq-background: #18181b;
  --wq-card: #27272A;

  --wq-primary: #0f8069;
  --wq-primary-foreground: #ffffff;

  --wq-muted-foreground: #a1a1aa;
  --wq-border: #333338;
  --wq-ring: #0f8069;

  --wq-brand: #0f8069;
  --wq-brand-deep: #0b6957;
  --wq-surface-soft: #27272a;

  --wq-warn: #e5b454;
  --wq-warn-soft: #3a3020;

  --wq-shadow-card:
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 12px 32px -16px rgba(0, 0, 0, 0.5);

  --wq-shadow-float:
    0 30px 60px -24px rgba(0, 0, 0, 0.7);
}

.wq-overview {
  --wq-brand-30: color-mix(in oklab, var(--wq-brand) 30%, transparent);
  --wq-accent-10: color-mix(in oklab, var(--wq-accent) 10%, transparent);
  --wq-accent-30: color-mix(in oklab, var(--wq-accent) 30%, transparent);
  --wq-surface-soft-60: color-mix(in oklab, var(--wq-surface-soft) 60%, transparent);
}

.wq-ov-deep-gradient {
  background: linear-gradient(160deg, #27272a, #18181b);
}

.wq-ov-wire-tint {
  background: linear-gradient(160deg, rgba(15, 128, 105, 0.62) 0%, rgba(9, 102, 83, 0.72) 55%, rgba(6, 74, 60, 0.85) 100%);
}

@keyframes wq-ov-copy-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: no-preference) {
  .wq-ov-reveal { opacity: 0; }

  .wq-ov-reveal.is-in {
    animation: wq-ov-copy-in 700ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
    animation-delay: var(--d, 0ms);
  }
}

/* ------------------------------------------------------------------ */
/* "Watheq" line-drawing scene (left column)                           */
/* One 14s timeline: guides > letters W-a-t-h-e-q > scan sweep > hold  */
/* > fade, then loops seamlessly. The default (static) state is the    */
/* finished word, so reduced-motion users get a calm still image.      */
/* ------------------------------------------------------------------ */
.wq-wire {
  --wq-wire-line: rgba(255, 255, 255, 0.95);
  --wq-wire-dur: 14s;
}

.wq-wire .wq-w-d {
  fill: none;
  stroke-linejoin: round;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
}

.wq-wire .wq-w-ink {
  stroke: var(--wq-wire-line);
  stroke-width: 4.4;
}

.wq-wire .wq-w-word {
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.35));
}

.wq-wire .wq-w-dim {
  fill: none;
  stroke: rgba(255, 255, 255, 0.7);
  stroke-width: 1;
  stroke-dasharray: 3 4;
  opacity: 0.45;
}

.wq-wire .wq-w-scan { opacity: 0; }

${LETTER_KEYFRAMES}

@keyframes wq-w-fade-in-early {
  0%   { opacity: 0; }
  10%  { opacity: 0.45; }
  100% { opacity: 0.45; }
}
@keyframes wq-w-scan {
  0%, 72% { opacity: 0; transform: translateX(-130px); }
  75%  { opacity: 1; }
  88%  { opacity: 1; transform: translateX(470px); }
  89%, 100% { opacity: 0; transform: translateX(470px); }
}
@keyframes wq-w-stage {
  0%, 90% { opacity: 1; }
  97%, 100% { opacity: 0; }
}
@keyframes wq-w-ring {
  0%   { transform: scale(1); opacity: 0.45; }
  100% { transform: scale(1.75); opacity: 0; }
}

@media (prefers-reduced-motion: no-preference) {
  .wq-wire .wq-w-stage { animation: wq-w-stage var(--wq-wire-dur) linear infinite both; }
  .wq-wire .wq-w-dim { animation: wq-w-fade-in-early var(--wq-wire-dur) linear infinite both; }
${LETTER_RULES}
  .wq-wire .wq-w-scan {
    animation: wq-w-scan var(--wq-wire-dur) linear infinite both;
  }

  .wq-play-ring {
    animation: wq-w-ring 2.6s ease-out infinite;
  }
}
`;

/**
 * Animated line drawing of the word "Watheq". Pure SVG + CSS, no external assets.
 * Styles live in OVERVIEW_STYLES (the `.wq-wire` scope).
 */
const WireframeWord: React.FC = () => {
  const uid = useId().replace(/:/g, '');
  const gridId = `wqgrid${uid}`;
  const scanId = `wqscan${uid}`;

  return (
    <svg
      viewBox="0 0 400 440"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="رسم متحرك لكلمة Watheq"
      className="wq-wire absolute inset-0 h-full w-full"
    >
      <defs>
        <pattern id={gridId} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20,0H0V20" fill="none" stroke="#ffffff" strokeOpacity="0.045" strokeWidth="1" />
        </pattern>
        <linearGradient id={scanId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="400" height="440" fill={`url(#${gridId})`} />

      <g className="wq-w-stage">
        <g transform={WORD_TRANSFORM}>
          {/* Typography guide lines */}
          <path className="wq-w-dim" d={GUIDES_PATH} />

          {/* The word, one stroke per letter */}
          <g className="wq-w-word">
            {LETTERS.map(({ key, d }, i) => (
              <path key={key} className={`wq-w-d wq-w-ink wq-l-${i}`} pathLength={1} d={d} />
            ))}
          </g>
        </g>

        {/* Light sweep across the word */}
        <rect className="wq-w-scan" x="0" y="0" width="90" height="440" fill={`url(#${scanId})`} />
      </g>
    </svg>
  );
};

/** Three stacked zig-zag strokes, used as a small decorative accent. */
const ZigZag: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 64 34" width="64" height="34" fill="none" aria-hidden className={className}>
    {[6, 17, 28].map((y) => (
      <path
        key={y}
        d={`M2,${y}l6,-5l6,5l6,-5l6,5l6,-5l6,5l6,-5l6,5l6,-5`}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ))}
  </svg>
);

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
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as React.CSSProperties;

const highlightCards = [
  {
    icon: Wallet,
    title: 'حسابات أوضح وتوثيق متبادل',
    desc: 'تابع الديون والمدفوعات وأرسل إشعارات تأكيد فورية لزبائنك عبر تليجرام وواتساب.',
  },
  {
    icon: TrendingUp,
    title: 'متابعة أدق بدون انقطاع',
    desc: 'راقب المبيعات وحركة الكاشير والمخزون في مكان واحد مع دعم كامل للعمل أوفلاين.',
  },
];

const points = [
  'متابعة معاملاتك المالية وتوثيقها بسهولة.',
  'رؤية أوضح لحركة المبيعات ورأس المال والأرباح.',
  'تنظيم أفضل لتفاصيل تجارتك بدون خوف من ضياع الدفاتر.',
];

export const OverviewTabletSection: React.FC = () => {
  const clipId = useId().replace(/:/g, '');
  const { ref, seen } = useInView<HTMLDivElement>();
  // Bumping the key remounts the scene, which restarts the animation timeline.
  const [runKey, setRunKey] = useState(0);

  const reveal = `wq-ov-reveal ${seen ? 'is-in' : ''}`;

  return (
    <section
      id="intro"
      className="wq-overview relative overflow-hidden bg-[color:var(--wq-card)] py-20 lg:py-28"
    >
      <style>{OVERVIEW_STYLES}</style>

      {/* Frame shape: rounded left corners, top edge rising to the right, right edge leaning in at the bottom. */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d="M0.07,0.055 C0.025,0.065 0,0.09 0,0.13 L0,0.89 C0,0.94 0.03,0.975 0.075,0.972 L0.93,0.915 C0.97,0.912 1,0.89 1,0.85 L1,0.045 C1,0.015 0.98,0 0.95,0.005 Z" />
          </clipPath>
        </defs>
      </svg>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full border border-[color:var(--wq-border)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 top-24 size-40 rounded-full bg-[color:var(--wq-surface-soft-60)] blur-2xl"
      />

      <div
        ref={ref}
        className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1fr_1fr] lg:gap-16"
      >
        {/* Right Column: Copy, Highlights, Bullets, and CTA */}
        <div className="text-right">
          {/* Eyebrow */}
          <p
            style={delay(0)}
            className={`${reveal} text-xs font-bold tracking-wide text-[color:var(--wq-brand)]`}
          >
            تعرّف على وثّق
          </p>

          {/* Section Heading */}
          <h2
            style={delay(80)}
            className={`${reveal} mt-3 font-cairo text-2xl font-bold leading-[1.6] sm:text-3xl lg:text-4xl lg:leading-[1.5]`}
          >
            كل تفاصيل تجارتك…{' '}
            <span className="text-[color:var(--wq-brand)]">في صورة أوضح وموثقة</span>
          </h2>

          {/* Description */}
          <p
            style={delay(160)}
            className={`${reveal} mt-5 leading-8 text-[color:var(--wq-muted-foreground)]`}
          >
            من الديون والمبيعات الفورية إلى حركة الكاشير والمخزون ومطابقة التحويلات البنكية وتأكيد الزبون اللحظي،
            يجمع وثّق تفاصيل تجارتك في مكان واحد لتتابع أرقامك بثقة وتتخذ قرارات أفضل حتى عند انقطاع الإنترنت.
          </p>

          {/* 2 Mini Highlight Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {highlightCards.map(({ icon: Icon, title, desc }, idx) => (
              <div
                key={title}
                style={delay(240 + idx * 90)}
                className={`${reveal} rounded-2xl border border-[color:var(--wq-border)] bg-[color:var(--wq-background)] p-5 transition hover:border-[color:var(--wq-brand-30)]`}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-[color:var(--wq-surface-soft)] text-[color:var(--wq-brand)]">
                  <Icon className="size-5" strokeWidth={1.7} />
                </span>
                <p className="mt-4 font-bold">{title}</p>
                <p className="mt-1.5 text-sm leading-7 text-[color:var(--wq-muted-foreground)]">{desc}</p>
              </div>
            ))}
          </div>

          {/* Shield + Checkmark Bullets */}
          <div
            style={delay(420)}
            className={`${reveal} mt-8 flex flex-col gap-5 border-t border-[color:var(--wq-border)] pt-6 sm:flex-row sm:items-center`}
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[color:var(--wq-primary)] text-[color:var(--wq-primary-foreground)]">
              <ShieldCheck className="size-7" strokeWidth={1.6} />
            </span>
            <ul className="space-y-2">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0 text-[color:var(--wq-brand)]" /> {p}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Link/Button */}
          <a
            href="#how-it-works"
            style={delay(500)}
            className={`${reveal} group mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[color:var(--wq-primary)] px-6 py-3 text-sm font-semibold text-[color:var(--wq-primary-foreground)] transition hover:bg-[color:var(--wq-brand-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--wq-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent`}
          >
            اكتشف كيف يعمل وثّق
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          </a>
        </div>

        {/* Left Column: image frame with the animated "Watheq" drawing */}
        <div
          style={delay(120)}
          className={`${reveal} relative mx-auto w-full max-w-md pb-2 lg:max-w-none`}
        >
          {/* Decorative zig-zag, top-left corner of the frame */}
          <ZigZag className="pointer-events-none absolute -top-5 left-1 z-10 text-[color:var(--wq-brand)] opacity-70 sm:left-0 lg:-left-4" />

          {/* Frame with the background image and the animated drawing */}
          <div
            className="relative aspect-[10/11] w-full overflow-hidden"
            style={{ clipPath: `url(#${clipId})` }}
          >
            <img
              src={wireBg}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover object-[58%_50%]"
            />
            <div className="wq-ov-wire-tint absolute inset-0" />
            <WireframeWord key={runKey} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </div>

          {/* Play button: replays the drawing from the start */}
          <button
            type="button"
            onClick={() => setRunKey((k) => k + 1)}
            aria-label="إعادة تشغيل العرض المتحرك"
            className="group absolute right-4 top-1/2 z-20 grid size-14 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white text-[color:var(--wq-brand)] shadow-[0_14px_30px_-6px_rgba(6,74,60,0.55),0_6px_12px_-2px_rgba(0,0,0,0.3)] ring-4 ring-white/40 transition hover:scale-105 hover:shadow-[0_18px_36px_-6px_rgba(6,74,60,0.65),0_8px_16px_-2px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-[color:var(--wq-ring)] lg:-right-7"
          >
            <span
              aria-hidden
              className="wq-play-ring pointer-events-none absolute inset-0 rounded-full border border-white/70"
            />
            <Play className="size-5 fill-current" strokeWidth={0} />
          </button>
        </div>
      </div>
    </section>
  );
};