import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { WatheqBrandLogo } from './WatheqBrandLogo';
import { PATHS } from '../../routes/paths';

/**
 * Code 2 (Lovable) design system tokens, scoped to the navbar.
 * Light values are the exact Code 2 oklch tokens. Dark values are derived from the
 * same system and switch with the project's `.dark` class.
 */

const NAV_STYLES = `
.wq-nav {
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

  --wq-shadow-card:
    0 1px 2px rgba(15, 65, 52, 0.04),
    0 12px 32px -16px rgba(15, 65, 52, 0.16);

  color: var(--wq-foreground);
}

.dark .wq-nav {
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

  --wq-shadow-card:
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 12px 32px -16px rgba(0, 0, 0, 0.5);
}

.wq-nav-bg {
  background-color: color-mix(in oklab, var(--wq-background) 85%, transparent);
}

.wq-nav-progress {
  transform: scaleX(var(--page-p, 0));
  transform-origin: right;
}

@media (prefers-reduced-motion: reduce) {
  .wq-nav-progress {
    display: none;
  }
}
`;


interface LandingNavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

/** Button styles from Code 2 (btnPrimary / btnGhost), mapped to the scoped tokens. */
const btnPrimary =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[color:var(--wq-primary)] px-4 py-2 text-xs font-semibold text-[color:var(--wq-primary-foreground)] transition hover:-translate-y-0.5 hover:bg-[color:var(--wq-brand-deep)] hover:shadow-[var(--wq-shadow-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--wq-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:px-5 sm:text-sm';
const btnGhost =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[color:var(--wq-input)] bg-[color:var(--wq-card)] px-4 py-2 text-xs font-semibold text-[color:var(--wq-foreground)] transition hover:-translate-y-0.5 hover:border-[color:var(--wq-primary)] hover:text-[color:var(--wq-primary)] sm:px-5 sm:text-sm';

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ theme, onToggleTheme }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { label: 'المزايا', href: '#features' },
    { label: 'كيف يعمل', href: '#how-it-works' },
    { label: 'المقارنة', href: '#comparison' },
    { label: 'الخطط', href: '#pricing' },
    { label: 'الأسئلة', href: '#faq' },
  ];

  // Page scroll progress (replaces the --page-p variable set by Code 2's motion system).
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = progressRef.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.setProperty('--page-p', String(p));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const themeIcon =
    theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />;

  return (
    <header className="wq-nav wq-nav-bg sticky top-0 z-50 w-full border-b border-[color:var(--wq-border)] backdrop-blur">
      <style>{NAV_STYLES}</style>

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        {/* Logo (start in RTL) */}
        <div
          className="shrink-0 cursor-pointer"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <WatheqBrandLogo size="md" />
        </div>

        {/* Desktop links */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-sm text-[color:var(--wq-muted-foreground)] transition hover:text-[color:var(--wq-foreground)] after:absolute after:-bottom-1 after:right-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-[color:var(--wq-brand)] after:transition-transform after:duration-300 hover:after:scale-x-100"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="تبديل المظهر"
            title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
            className="grid size-10 cursor-pointer place-items-center rounded-full border border-[color:var(--wq-border)] text-[color:var(--wq-muted-foreground)] transition hover:border-[color:var(--wq-primary)] hover:text-[color:var(--wq-brand)]"
          >
            {themeIcon}
          </button>

          <button type="button" onClick={() => navigate(PATHS.LOGIN)} className={`${btnGhost} hidden md:inline-flex`}>
            تسجيل الدخول
          </button>

          <button type="button" onClick={() => navigate(PATHS.REGISTER)} className={`${btnPrimary} hidden md:inline-flex`}>
            ابدأ مع وثّق
          </button>

          <button
            type="button"
            className="grid size-10 cursor-pointer place-items-center rounded-full border border-[color:var(--wq-border)] md:hidden"
            aria-label="القائمة الرئيسية"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Page scroll progress */}
      <div
        ref={progressRef}
        aria-hidden
        className="wq-nav-progress absolute inset-x-0 bottom-0 h-0.5 bg-[color:var(--wq-brand)] opacity-70"
      />

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="border-t border-[color:var(--wq-border)] bg-[color:var(--wq-background)] px-5 py-3 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 text-sm"
            >
              {link.label}
            </a>
          ))}

          <div className="mt-2 flex flex-col gap-3 border-t border-[color:var(--wq-border)] pt-4">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(PATHS.LOGIN);
              }}
              className={`${btnGhost} w-full`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(PATHS.REGISTER);
              }}
              className={`${btnPrimary} w-full`}
            >
              ابدأ مع وثّق
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};