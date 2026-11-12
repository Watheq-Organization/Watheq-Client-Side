import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  BookOpenCheck,
  Landmark,
  Mic,
  Receipt,
  Boxes,
  Users,
  CheckCircle2,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { PATHS } from '../../routes/paths';

/** Timing constants for the orbital showcase. */
const AUTO_MS = 4000;
const INTRO_MS = 2000;
const SPIN_MS = 900;
const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

const features: {
  id: string;
  title: string;
  shortTitle: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge: string;
  description: string;
  previewHighlight: string;
  previewStatus: string;
  meta: string;
}[] = [
  {
    id: 'debts',
    title: 'إدارة الديون والتوثيق',
    shortTitle: 'الديون والتوثيق',
    icon: BookOpenCheck,
    badge: 'توثيق ثنائي فوري',
    description: 'سجّل معاملات الدين والدفعات بالصوت أو النص، وأرسل رابط توثيق لحظي عبر تليجرام وواتساب مع زر إقرار معتمد.',
    previewHighlight: '✓ تم تأكيد المعاملة عبر تليجرام — أحمد العبد (45 ₪)',
    previewStatus: 'مُقرّ وموثق ',
    meta: 'كشف حساب PDF مشفر • QR Code مباشر',
  },
  {
    id: 'reconciliation',
    title: 'مطابقة التحويلات البنكية',
    shortTitle: 'التحويلات البنكية',
    icon: Landmark,
    badge: 'مطابقة آلية ذكية',
    description: 'قارن إشعارات الحسابات البنكية (بنك فلسطين، الإسلامي، القدس) بالمبيعات المسجلة لكشف أي تحويل وهمي أو مفقود.',
    previewHighlight: '✓ مطابقة فورية: تحويل بنكي (450 ₪) مطابق للبيع مسجّل #1042',
    previewStatus: 'مطابق ومقيد ✓',
    meta: 'كشف فوري للحوالات العالقة والمعلقة',
  },
  {
    id: 'voice',
    title: 'الإدخال الصوتي بالذكاء الاصطناعي',
    shortTitle: 'الإدخال الصوتي',
    icon: Mic,
    badge: 'لهجة فلسطينية وعربية',
    description: 'تحدث بالعامية: "سجل دين على أبو خالد كرتونة زيت 120 شيكل" ليحولها الذكاء الاصطناعي إلى قيد مالي دقيق في ثانية.',
    previewHighlight: ' "سجل دين على أبو خالد 120 ₪" ➔ تم القيد والتوثيق',
    previewStatus: 'معالجة فورية ',
    meta: 'دقة لغوية 100% • بدون الحاجة للكتابة',
  },
  {
    id: 'pos',
    title: 'المبيعات والكاشير أوفلاين',
    shortTitle: 'المبيعات والكاشير',
    icon: Receipt,
    badge: 'يعمل بدون إنترنت (Offline-First)',
    description: 'كاشير سريع متوافق مع قارئ الباركود والطابعات الحرارية، يعمل بانسيابية تامة حتى لو انقطعت الكهرباء والإنترنت.',
    previewHighlight: ' معاملة كاشير #8843 تمت بدون اتصال وحفظت محلياً بنجاح',
    previewStatus: 'مزامنة معلقة (أوفلاين) ',
    meta: 'قاعدة بيانات محلية مشفرة SQLite3',
  },
  {
    id: 'inventory',
    title: 'إدارة المخزون الذكية',
    shortTitle: 'إدارة المخزون',
    icon: Boxes,
    badge: 'فصل الأرباح عن رأس المال',
    description: 'تتبع حركة الأصناف، الوارد والمنصرف، وتلقَّ تنبيهات تلقائية عندما توشك بضائعك على النفاد مع حساب دقيق للأرباح.',
    previewHighlight: ' تنبيه نقص: صنف حليب المراعي متبقي 4 علب فقط بالمستودع',
    previewStatus: 'تنبيه إعادة طلب ',
    meta: 'جرد فوري • حساب متوسط التكلفة',
  },
  {
    id: 'branches',
    title: 'الموظفين والفروع المتعددة',
    shortTitle: 'الموظفين والفروع',
    icon: Users,
    badge: 'صلاحيات مركزية وموحدة',
    description: 'أدر طاقم عملك، حدد صلاحيات الكاشير والمحاسب، وشاهد تقارير مبيعات الفروع الموحدة من شاشة واحدة.',
    previewHighlight: ' ملخص موحد: فرع المركز + فرع الشمال في تقرير مالي لحظي',
    previewStatus: '3 فروع نشطة ',
    meta: 'صلاحيات محكمة • مراقبة إغلاق الدرج',
  },
];

/** Resting position of each node on the ring (first node at the top, then clockwise). */
const ORBIT_RADIUS_PERCENT = 42;
const POS = features.map((_, i) => {
  const a = ((i * 360) / features.length - 90) * (Math.PI / 180);
  return {
    left: `${(50 + ORBIT_RADIUS_PERCENT * Math.cos(a)).toFixed(2)}%`,
    top: `${(50 + ORBIT_RADIUS_PERCENT * Math.sin(a)).toFixed(2)}%`,
  };
});

/**
 * Code 2 (Lovable) design system tokens, scoped to the hero (text column + showcase).
 * Light values are the exact Code 2 oklch tokens. Dark values are derived from the
 * same system (brand-deep / on-deep) and switch with the project's `.dark` class.
 */

const SHOWCASE_STYLES = `
.wq-showcase {
  --wq-foreground: #18332d;
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
  --wq-shadow-card:
    0 1px 2px rgba(15, 65, 52, 0.04),
    0 12px 32px -16px rgba(15, 65, 52, 0.16);
  --wq-glow-ring: rgba(15, 128, 105, 0.12);
  --wq-glow-drop: rgba(15, 128, 105, 0.35);

  color: var(--wq-foreground);
}

.dark .wq-showcase {
  --wq-foreground: #e8f3ef;
  --wq-card: #172c27;
  --wq-primary: #36b99a;
  --wq-primary-foreground: #092e25;
  --wq-muted-foreground: #a1b9b0;
  --wq-border: #30483f;
  --wq-input: #3a554a;
  --wq-ring: #36b99a;
  --wq-brand: #36b99a;
  --wq-brand-deep: #55c9a9;
  --wq-surface-soft: #203a32;
  --wq-shadow-card:
    0 1px 2px rgba(0, 0, 0, 0.25),
    0 12px 32px -16px rgba(0, 0, 0, 0.5);
  --wq-glow-ring: rgba(54, 185, 154, 0.16);
  --wq-glow-drop: rgba(54, 185, 154, 0.3);
}

.wq-showcase {
  --wq-brand-10: color-mix(in oklab, var(--wq-brand) 10%, transparent);
  --wq-brand-25: color-mix(in oklab, var(--wq-brand) 25%, transparent);
  --wq-brand-40: color-mix(in oklab, var(--wq-brand) 40%, transparent);
  --wq-brand-60: color-mix(in oklab, var(--wq-brand) 60%, transparent);
  --wq-surface-soft-70: color-mix(in oklab, var(--wq-surface-soft) 70%, transparent);
}

.wq-shadow-card {
  box-shadow: var(--wq-shadow-card);
}

.wq-glow-brand {
  box-shadow:
    0 0 0 6px var(--wq-glow-ring),
    0 14px 34px -12px var(--wq-glow-drop);
}

@keyframes wq-orbit-node-in {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes wq-orbit-copy-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes wq-orbit-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@keyframes wq-hero-in {
  from { opacity: 0; transform: translateY(18px); filter: blur(4px); }
  to { opacity: 1; transform: none; filter: none; }
}

@media (prefers-reduced-motion: no-preference) {
  .wq-hero-in {
    animation: wq-hero-in 900ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
    animation-delay: var(--d, 0ms);
  }
}
`;

/** Primary button */
const btnPrimary =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[color:var(--wq-primary)] px-6 py-3 text-sm font-semibold text-[color:var(--wq-primary-foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[color:var(--wq-brand-deep)] hover:shadow-[var(--wq-shadow-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--wq-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-0';

/** Ghost button */
const btnGhost =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[color:var(--wq-input)] bg-[color:var(--wq-card)] px-6 py-3 text-sm font-semibold text-[color:var(--wq-foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--wq-primary)] hover:text-[color:var(--wq-primary)] hover:bg-[color:var(--wq-brand-10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--wq-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-0';

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as React.CSSProperties;

export const HeroOrbitalSection: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isAutoCycle, setIsAutoCycle] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isOnScreen, setIsOnScreen] = useState(true);

  const rootRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<number | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastWheel = useRef(0);
  const touchStart = useRef({ x: 0, y: 0 });

  const count = features.length;
  const activeFeatureIndex = ((step % count) + count) % count;
  const angle = -step * (360 / count);
  const spin = reducedMotion ? 0 : SPIN_MS;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Give the headline its moment before anything starts moving.
  useEffect(() => {
    const t = window.setTimeout(() => setIsIntroComplete(true), reducedMotion ? 0 : INTRO_MS);
    return () => window.clearTimeout(t);
  }, [reducedMotion]);

  // Pause the carousel while it is off-screen or the tab is hidden.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => setIsOnScreen(entries[0]?.isIntersecting ?? true), {
      threshold: 0.2,
    });
    io.observe(el);
    const onVisibility = () => setIsOnScreen(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Autoplay: restarts the clock after every change and stands down while the user is active.
  useEffect(() => {
    if (!isIntroComplete || !isAutoCycle || isUserInteracting || !isOnScreen || reducedMotion) return;
    const t = window.setTimeout(() => setStep((s) => s + 1), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [isIntroComplete, isAutoCycle, isUserInteracting, isOnScreen, reducedMotion, step]);

  useEffect(
    () => () => {
      window.clearTimeout(holdTimer.current);
      void audioContextRef.current?.close();
    },
    [],
  );

  const hold = useCallback(() => {
    window.clearTimeout(holdTimer.current);
    setIsUserInteracting(true);
    holdTimer.current = window.setTimeout(() => setIsUserInteracting(false), AUTO_MS);
  }, []);

  const go = useCallback(
    (delta: number) => {
      setStep((s) => s + delta);
      hold();
    },
    [hold],
  );

  const goTo = useCallback(
    (index: number) => {
      setStep((s) => {
        const current = ((s % count) + count) % count;
        let delta = (index - current + count) % count;
        if (delta > count / 2) delta -= count;
        return s + delta;
      });
      hold();
    },
    [count, hold],
  );

  // Play a subtle tech chime whenever the active feature changes and sound is enabled.
  useEffect(() => {
    if (step === 0 || !isSoundEnabled) return;
    const ctx = audioContextRef.current;
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio autoplay policy fallback
    }
  }, [step, isSoundEnabled]);

  const toggleSound = async () => {
    if (isSoundEnabled) {
      setIsSoundEnabled(false);
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    try {
      const ctx = audioContextRef.current ?? new Ctor();
      if (ctx.state === 'suspended') await ctx.resume();
      audioContextRef.current = ctx;
      setIsSoundEnabled(true);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // The wheel is never captured: the page keeps scrolling, we only read the direction.
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const now = performance.now();
    if (Math.abs(e.deltaY) < 20 || now - lastWheel.current < 320) return;
    lastWheel.current = now;
    go(e.deltaY > 0 ? 1 : -1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
    }
  };

  const activeFeature = features[activeFeatureIndex] ?? features[0]!;

  const controlClass =
    'inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[color:var(--wq-border)] bg-[color:var(--wq-card)] px-3 py-1.5 text-[11px] font-semibold text-[color:var(--wq-muted-foreground)] transition hover:border-[color:var(--wq-brand-40)] hover:text-[color:var(--wq-brand)]';

  return (
    <section id="top" className="relative pt-10 pb-20 lg:pt-16 lg:pb-28 overflow-hidden">
      <style>{SHOWCASE_STYLES}</style>

      {/* Background radial emerald glow */}
      <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[radial-gradient(circle_at_center,rgba(0,214,133,0.12)_0%,transparent_70%)] pointer-events-none blur-2xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Right Column: Value Proposition & CTAs (RTL Desktop) */}
          <div className="wq-showcase lg:col-span-7 text-right">

            {/* Eyebrow Pill Badge
            <span
              style={delay(0)}
              className="wq-hero-in inline-flex items-center gap-2 rounded-full bg-[color:var(--wq-surface-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--wq-brand)]"
            >
              <span className="size-1.5 rounded-full bg-[color:var(--wq-brand)]" />
              المنظومة الرقمية للتوثيق المالي وإدارة معاملات المحلات
            </span> */}

            {/* Main Headline */}
            <h1 className="mt-6 font-cairo text-3xl font-extrabold leading-[1.6] text-[color:var(--wq-foreground)] sm:text-4xl lg:text-[3.1rem] lg:leading-[1.45]">
              <span style={delay(120)} className="wq-hero-in inline-block">
                محلك بحكي أرقام...
              </span>
              <br />
              <span style={delay(300)} className="wq-hero-in inline-block text-[color:var(--wq-brand)]">
                وثّق بخليك تفهمها وتوثقها.
              </span>
            </h1>

            {/* Subheadline */}
            <p
              style={delay(480)}
              className="wq-hero-in mt-6 max-w-xl text-base leading-8 text-[color:var(--wq-muted-foreground)]"
            >
              الديون، المبيعات، الكاشير، المخزون، التحويلات البنكية، والتوثيق الفوري مع الزبائن — كلها بمكان واحد ويعمل بدون إنترنت{' '}
              ، عشان تشوف وضع محلك بوضوح وتحفظ حقك وحق زبونك.
            </p>

            {/* CTA Group */}
            <div style={delay(620)} className="wq-hero-in mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate(PATHS.REGISTER)} className={`${btnPrimary} group`}>
                ابدأ مع وثّق
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              </button>

              <a href="#download" className={btnGhost}>
                <Download className="size-4" />
                حمّل التطبيق
              </a>
            </div>

            {/* Trust Indicators Row */}
            <div
              style={delay(760)}
              className="wq-hero-in mt-10 flex max-w-xl flex-wrap gap-x-6 gap-y-3 border-t border-[color:var(--wq-border)] pt-6"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--wq-muted-foreground)] sm:text-sm">
                <ShieldCheck className="size-4 shrink-0 text-[color:var(--wq-brand)]" />
                <span>بدون أي رسوم خفية</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--wq-muted-foreground)] sm:text-sm">
                <WifiOff className="size-4 shrink-0 text-[color:var(--wq-brand)]" />
                <span>يعمل 100% أوفلاين</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--wq-muted-foreground)] sm:text-sm">
                <CheckCircle2 className="size-4 shrink-0 text-[color:var(--wq-brand)]" />
                <span>توثيق فوري ملزم</span>
              </div>
            </div>

          </div>

          {/* Left Column: Interactive Orbital Showcase */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div
              ref={rootRef}
              role="group"
              aria-label="استعراض مزايا وثّق"
              tabIndex={0}
              onWheel={onWheel}
              onKeyDown={onKeyDown}
              onTouchStart={(e) => {
                const t = e.changedTouches[0];
                if (t) touchStart.current = { x: t.clientX, y: t.clientY };
              }}
              onTouchEnd={(e) => {
                const t = e.changedTouches[0];
                if (!t) return;
                const dx = t.clientX - touchStart.current.x;
                const dy = t.clientY - touchStart.current.y;
                if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
              }}
              className="wq-showcase mx-auto w-full max-w-[22rem] select-none rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--wq-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:max-w-[26rem]"
            >
              {/* Orbit */}
              <div className="relative aspect-square">
                <div className="absolute inset-[20%] rounded-full bg-[color:var(--wq-surface-soft-70)] blur-2xl" aria-hidden />
                <div className="absolute inset-[8%] rounded-full border border-dashed border-[color:var(--wq-border)]" aria-hidden />
                <div className="absolute inset-[26%] rounded-full border border-[color:var(--wq-border)]" aria-hidden />

                <div
                  className="absolute inset-0"
                  style={{ transform: `rotate(${angle}deg)`, transition: `transform ${spin}ms ${EASE}` }}
                >
                  <div
                    className="absolute inset-[8%] rounded-full border-2 border-transparent border-r-[color:var(--wq-brand-10)] border-t-[color:var(--wq-brand-25)]"
                    aria-hidden
                  />
                  {features.map((feat, idx) => {
                    const IconComponent = feat.icon;
                    const isSelected = idx === activeFeatureIndex;
                    return (
                      <div
                        key={feat.id}
                        className="absolute"
                        style={{
                          ...POS[idx],
                          transform: `translate(-50%, -50%) rotate(${-angle}deg)`,
                          transition: `transform ${spin}ms ${EASE}`,
                        }}
                      >
                        <div
                          style={
                            reducedMotion
                              ? undefined
                              : {
                                  animation: `wq-orbit-node-in 620ms ${EASE} both`,
                                  animationDelay: `${600 + idx * 140}ms`,
                                }
                          }
                        >
                          <button
                            type="button"
                            onClick={() => goTo(idx)}
                            aria-pressed={isSelected}
                            aria-label={feat.title}
                            title={feat.shortTitle}
                            className={`grid h-11 w-11 sm:h-14 sm:w-14 cursor-pointer place-items-center rounded-2xl border transition-all duration-500 ${
                              isSelected
                                ? 'wq-glow-brand border-[color:var(--wq-brand)] bg-[color:var(--wq-primary)] text-[color:var(--wq-primary-foreground)]'
                                : 'border-[color:var(--wq-border)] bg-[color:var(--wq-card)] text-[color:var(--wq-muted-foreground)] hover:-translate-y-0.5 hover:border-[color:var(--wq-brand-40)] hover:text-[color:var(--wq-brand)]'
                            }`}
                          >
                            <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.6} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Central Watheq mark */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div
                    className="wq-shadow-card grid h-28 w-28 sm:h-32 sm:w-32 place-items-center rounded-full border border-[color:var(--wq-border)] bg-[color:var(--wq-card)]"
                    style={reducedMotion ? undefined : { animation: `wq-orbit-node-in 720ms ${EASE} both` }}
                  >
                    <img src="/logo-hd.png" alt="وثّق Watheq" className="w-16 sm:w-20 object-contain" />
                  </div>
                </div>
              </div>

              {/* Active feature copy (title + description, no box) */}
              <div className="mt-6 min-h-[112px] text-center sm:min-h-[96px]">
                <div
                  key={activeFeature.id}
                  style={reducedMotion ? undefined : { animation: `wq-orbit-copy-in 480ms ${EASE} both` }}
                >
                  <h3 className="text-base font-bold text-[color:var(--wq-foreground)] sm:text-lg">
                    {activeFeature.title}
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-[color:var(--wq-muted-foreground)]">
                    {activeFeature.description}
                  </p>
                </div>
              </div>

              {/* Step indicator dots */}
              <div className="mt-4 flex items-center justify-center gap-2">
                {features.map((feat, i) => (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={feat.title}
                    aria-current={i === activeFeatureIndex}
                    className={`h-1.5 cursor-pointer rounded-full transition-all duration-500 ${
                      i === activeFeatureIndex
                        ? 'w-7 bg-[color:var(--wq-brand)]'
                        : 'w-2.5 bg-[color:var(--wq-border)] hover:bg-[color:var(--wq-brand-40)]'
                    }`}
                  />
                ))}
              </div>

              {/* Autoplay progress */}
              {!reducedMotion && (
                <div className="mx-auto mt-3 h-0.5 w-40 overflow-hidden rounded-full bg-[color:var(--wq-border)]">
                  <div
                    key={step}
                    className="h-full origin-right rounded-full bg-[color:var(--wq-brand-60)]"
                    style={{
                      animation: `wq-orbit-progress ${AUTO_MS}ms linear both`,
                      animationPlayState:
                        isAutoCycle && !isUserInteracting && isIntroComplete ? 'running' : 'paused',
                    }}
                  />
                </div>
              )}

              {/* Playback & sound controls */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAutoCycle((v) => !v)}
                  aria-pressed={!isAutoCycle}
                  title={isAutoCycle ? 'إيقاف التبديل التلقائي' : 'تشغيل التبديل التلقائي'}
                  className={controlClass}
                >
                  {isAutoCycle ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {isAutoCycle ? 'إيقاف العرض التلقائي' : 'تشغيل العرض التلقائي'}
                </button>
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-pressed={isSoundEnabled}
                  title={isSoundEnabled ? 'صوت التفاعل مفعّل' : 'تفعيل صوت التفاعل'}
                  className={controlClass}
                >
                  {isSoundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  الصوت
                </button>
              </div>

             
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};