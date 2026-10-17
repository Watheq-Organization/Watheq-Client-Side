import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, ArrowLeft } from 'lucide-react';
import { WatheqBrandLogo } from './WatheqBrandLogo';
import { PATHS } from '../../routes/paths';

interface LandingNavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ theme, onToggleTheme }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'المزايا', href: '#features' },
    { label: 'كيف يعمل', href: '#how-it-works' },
    { label: 'المقارنة', href: '#comparison' },
    { label: 'الخطط', href: '#pricing' },
    { label: 'الأسئلة', href: '#faq' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-[#0B132B]/80 border-b border-slate-200/80 dark:border-white/10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Right Side: Logo (In RTL, this is start) */}
          <div
            className="flex-shrink-0 cursor-pointer"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <WatheqBrandLogo size="md" />
          </div>

          {/* Center Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#00D685] dark:hover:text-[#00D685] transition-colors relative py-1 group"
              >
                {link.label}
                <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-[#00D685] transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </nav>

          {/* Left Side Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-3.5">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/10"
              aria-label="تبديل المظهر"
              title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Secondary CTA: Login */}
            <button
              onClick={() => navigate(PATHS.LOGIN)}
              className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-full transition-all hover:-translate-y-0.5"
            >
              تسجيل الدخول
            </button>

            {/* Primary CTA: Start with Watheq */}
            <button
              onClick={() => navigate(PATHS.REGISTER)}
              className="px-6 py-2.5 text-sm font-extrabold text-[#0B132B] bg-[#00D685] hover:bg-[#00C875] active:bg-[#00B368] rounded-full shadow-[0_8px_24px_-4px_rgba(0,214,133,0.4)] transition-all hover:-translate-y-0.5 flex items-center gap-2 group cursor-pointer"
            >
              <span>ابدأ مع وثّق</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </button>
          </div>

          {/* Mobile Actions & Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10"
              aria-label="تبديل المظهر"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10"
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-5 pt-3 pb-6 space-y-3 shadow-2xl transition-all">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(PATHS.LOGIN);
              }}
              className="w-full py-3 text-center text-sm font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full"
            >
              تسجيل الدخول
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(PATHS.REGISTER);
              }}
              className="w-full py-3 text-center text-sm font-extrabold text-[#0B132B] bg-[#00D685] hover:bg-[#00C875] rounded-full shadow-[0_8px_24px_-4px_rgba(0,214,133,0.4)] flex items-center justify-center gap-2"
            >
              <span>ابدأ مع وثّق</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
