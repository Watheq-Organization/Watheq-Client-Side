import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, Minus } from 'lucide-react';
import { PATHS } from '../../routes/paths';

/**
 * Code 2 (Lovable) design system tokens, scoped to this section.
 * Light values are the exact Code 2 oklch tokens. Dark values are derived from the
 * same system and switch with the project's `.dark` class.
 */

const CUSTOM_STYLES = `
.wq-custom {
  --wq-foreground: #18332d;
  --wq-card: #ffffff;
  --wq-primary: #0f8069;
  --wq-primary-foreground: #ffffff;
  --wq-muted-foreground: #647871;
  --wq-border: #e2ebe7;
  --wq-input: #dce7e2;
  --wq-brand: #0f8069;
  --wq-surface-soft: #f0f6f3;

  /* Fixed green palette (summary panel, identical in light and dark) */
  --wq-on-deep: #ffffff;
  --wq-on-deep-muted: #e0f2ec;

  color: var(--wq-foreground);
}

.dark .wq-custom {
  --wq-foreground: #f4f4f5;
  --wq-card: #202023;
  --wq-primary: #0f8069;
  --wq-primary-foreground: #ffffff;
  --wq-muted-foreground: #a1a1aa;
  --wq-border: #333338;
  --wq-input: #3f3f46;
  --wq-brand: #0f8069;
  --wq-surface-soft: #27272a;
}

.wq-custom {
  --wq-on-deep-15: color-mix(in oklab, var(--wq-on-deep) 15%, transparent);
  --wq-on-deep-30: color-mix(in oklab, var(--wq-on-deep) 30%, transparent);
}

.wq-custom-deep-gradient {
  background: #0f8069;
}

@keyframes wq-cu-up {
  from { opacity: 0; transform: translate3d(0, 28px, 0); }
  to { opacity: 1; transform: none; }
}

@keyframes wq-cu-right {
  from { opacity: 0; transform: translate3d(36px, 0, 0); }
  to { opacity: 1; transform: none; }
}

@keyframes wq-cu-left {
  from { opacity: 0; transform: translate3d(-36px, 0, 0); }
  to { opacity: 1; transform: none; }
}

@keyframes wq-cu-price {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: no-preference) {
  .wq-cu-up, .wq-cu-right, .wq-cu-left { opacity: 0; }

  .wq-cu-up.is-in {
    animation: wq-cu-up 800ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
    animation-delay: var(--d, 0ms);
  }

  .wq-cu-right.is-in {
    animation: wq-cu-right 800ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
    animation-delay: var(--d, 0ms);
  }

  .wq-cu-left.is-in {
    animation: wq-cu-left 800ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
    animation-delay: var(--d, 0ms);
  }

  .wq-cu-price { animation: wq-cu-price 300ms ease-out both; }
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

interface StepperProps {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ label, hint, value, min, max, onChange }) => (
  <div className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--wq-border)] bg-[color:var(--wq-card)] p-4">
    <div>
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-0.5 text-[11px] leading-5 text-[color:var(--wq-muted-foreground)]">{hint}</div>
    </div>
    <div className="flex shrink-0 items-center gap-3">
      <button
        type="button"
        aria-label="زيادة"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="grid size-9 cursor-pointer place-items-center rounded-full border border-[color:var(--wq-border)] transition hover:border-[color:var(--wq-primary)] hover:text-[color:var(--wq-brand)] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Plus className="size-4" />
      </button>
      <span className="w-6 text-center font-bold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="إنقاص"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="grid size-9 cursor-pointer place-items-center rounded-full border border-[color:var(--wq-border)] transition hover:border-[color:var(--wq-primary)] hover:text-[color:var(--wq-brand)] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Minus className="size-4" />
      </button>
    </div>
  </div>
);

export const CustomPlanBuilderSection: React.FC = () => {
  const navigate = useNavigate();
  const { ref, seen } = useInView<HTMLDivElement>();
  const inClass = seen ? 'is-in' : '';

  // Interactive modules
  const availableModules = [
    { id: 'debts', name: 'الديون والتوثيق', basePrice: 40, isCore: true },
    { id: 'pos', name: 'المبيعات والكاشير', basePrice: 30, isCore: false },
    { id: 'inventory', name: 'إدارة المخزون', basePrice: 25, isCore: false },
    { id: 'reconciliation', name: 'مطابقة التحويلات البنكية', basePrice: 35, isCore: false },
    { id: 'roles', name: 'الموظفين والصلاحيات', basePrice: 20, isCore: false },
    { id: 'branches', name: 'إدارة الفروع', basePrice: 45, isCore: false },
  ];

  const [selectedModules, setSelectedModules] = useState<string[]>(['debts', 'pos', 'reconciliation']);
  const [branchCount, setBranchCount] = useState<number>(1);
  const [userCount, setUserCount] = useState<number>(2);

  const toggleModule = (id: string) => {
    // Keep 'debts' always selected as core
    if (id === 'debts') return;
    if (selectedModules.includes(id)) {
      setSelectedModules(selectedModules.filter((m) => m !== id));
    } else {
      setSelectedModules([...selectedModules, id]);
    }
  };

  // Price Calculation formula
  // Sum of module prices
  // + Extra branches (35 ₪ per branch beyond 1)
  // + Extra users (10 ₪ per user beyond 1)
  const modulesSum = selectedModules.reduce((acc, mId) => {
    const found = availableModules.find((m) => m.id === mId);
    return acc + (found ? found.basePrice : 0);
  }, 0);
  const extraBranches = Math.max(0, branchCount - 1) * 35;
  const extraUsers = Math.max(0, userCount - 1) * 10;
  const totalPrice = modulesSum + extraBranches + extraUsers;

  return (
    <section id="custom" className="wq-custom py-20 lg:py-28">
      <style>{CUSTOM_STYLES}</style>

      <div ref={ref} className="mx-auto max-w-6xl px-5">
        {/* Header */}
        <div className="max-w-2xl text-right">
          <p
            style={delay(0)}
            className={`wq-cu-up ${inClass} text-xs font-bold tracking-wide text-[color:var(--wq-brand)]`}
          >
            مُفصّل على مقاسك
          </p>
          <h2
            style={delay(90)}
            className={`wq-cu-up ${inClass} mt-3 font-cairo text-2xl font-bold leading-[1.6] sm:text-3xl lg:text-4xl lg:leading-[1.5]`}
          >
            خطة مخصصة: ركّب الخطة على قدّ محلك
          </h2>
          <p
            style={delay(180)}
            className={`wq-cu-up ${inClass} mt-4 leading-8 text-[color:var(--wq-muted-foreground)]`}
          >
            اختَر الوحدات التي يحتاجها متجرك وحدد عدد الفروع والمستخدمين لتفصيل باقتك بدقة وبدون دفع فلس واحد لميزات لا تحتاجها.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Right Column (Controls) */}
          <div style={delay(150)} className={`wq-cu-right ${inClass} space-y-8 text-right`}>
            {/* Modules Grid */}
            <div>
              <p className="mb-4 text-sm font-bold">1. حدد الوحدات والمزايا المطلوبة</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {availableModules.map((mod) => {
                  const on = selectedModules.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      aria-pressed={on}
                      className={`relative flex cursor-pointer flex-col items-start gap-1 rounded-2xl border-2 p-4 text-right transition ${
                        on
                          ? 'border-[color:var(--wq-primary)] bg-[color:var(--wq-surface-soft)]'
                          : 'border-transparent bg-[color:var(--wq-card)] hover:border-[color:var(--wq-input)]'
                      }`}
                    >
                      <span className="ps-0 pt-5 text-sm font-semibold">{mod.name}</span>
                      {mod.isCore && (
                        <span className="text-[10px] font-semibold text-[color:var(--wq-brand)]">
                          وحدة أساسية إلزامية
                        </span>
                      )}
                      {on && (
                        <span className="absolute left-3 top-3 grid size-5 place-items-center rounded-full bg-[color:var(--wq-primary)] text-[color:var(--wq-primary-foreground)]">
                          <Check className="size-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Steppers: Branches & Users */}
            <div>
              <p className="mb-4 text-sm font-bold">2. حدد حجم النشاط (الفروع والموظفين)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Stepper
                  label="عدد الفروع"
                  hint="الفرع الأول مشمول، +35 ₪ لكل فرع إضافي"
                  value={branchCount}
                  min={1}
                  max={10}
                  onChange={setBranchCount}
                />
                <Stepper
                  label="عدد المستخدمين / الموظفين"
                  hint="مستخدم أول مشمول، +10 ₪ لكل موظف إضافي"
                  value={userCount}
                  min={1}
                  max={25}
                  onChange={setUserCount}
                />
              </div>
            </div>
          </div>

          {/* Left Column (Summary Panel) */}
          <aside
            style={delay(250)}
            className={`wq-cu-left ${inClass} wq-custom-deep-gradient h-fit rounded-3xl p-7 text-right text-[color:var(--wq-on-deep)] lg:sticky lg:top-24`}
          >
            <p className="text-sm text-[color:var(--wq-on-deep-muted)]">ملخص خطتك المخصصة</p>
            <h3 className="mt-1 text-lg font-bold">الباقة الشهرية التقديرية</h3>

            <ul className="mt-5 space-y-2.5 text-sm">
              {selectedModules.length === 0 && (
                <li className="text-[color:var(--wq-on-deep-muted)]">ما اخترت أي وحدة بعد.</li>
              )}
              {availableModules
                .filter((m) => selectedModules.includes(m.id))
                .map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0" /> {m.name}
                  </li>
                ))}
            </ul>

            <div className="my-6 h-px bg-[color:var(--wq-on-deep-15)]" />

            {/* Price Calculation breakdown */}
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[color:var(--wq-on-deep-muted)]">
                  الوحدات المختارة ({selectedModules.length})
                </dt>
                <dd className="font-mono font-bold">{modulesSum} ₪</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[color:var(--wq-on-deep-muted)]">الفروع ({branchCount})</dt>
                <dd className="font-mono font-bold">{extraBranches} ₪</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[color:var(--wq-on-deep-muted)]">المستخدمين ({userCount})</dt>
                <dd className="font-mono font-bold">{extraUsers} ₪</dd>
              </div>
            </dl>

            <div className="mt-6 rounded-2xl border border-dashed border-[color:var(--wq-on-deep-30)] p-4">
              <div className="text-xs text-[color:var(--wq-on-deep-muted)]">الإجمالي الشهري</div>
              <div className="mt-1 flex items-baseline gap-1 font-mono">
                <span key={totalPrice} className="wq-cu-price inline-block text-4xl font-bold">
                  {totalPrice}
                </span>
                <span className="font-cairo text-sm font-bold">₪ / شهرياً</span>
              </div>
              <div className="mt-1 text-[11px] text-[color:var(--wq-on-deep-muted)]">بدون عقود طويلة الأجل</div>
            </div>

            {/* Included perks */}
            <ul className="mt-6 space-y-2 text-[11px] leading-5 text-[color:var(--wq-on-deep-muted)]">
              <li className="flex items-center gap-2">
                <Check className="size-3.5 shrink-0" />
                دعم كامل للعمل بدون إنترنت أوفلاين
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 shrink-0" />
                رسائل توثيق غير محدودة عبر تليجرام وواتساب
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 shrink-0" />
                نسخ احتياطي سحابي مشفر يومياً
              </li>
            </ul>

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => navigate(PATHS.REGISTER)}
              className="mt-6 w-full cursor-pointer rounded-full bg-[color:var(--wq-card)] py-3 text-sm font-semibold text-[color:var(--wq-brand)] transition hover:bg-[color:var(--wq-surface-soft)]"
            >
              اطلب هذه الخطة
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
};