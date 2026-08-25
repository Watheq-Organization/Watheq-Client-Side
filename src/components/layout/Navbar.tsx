import type { FC } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '../Logo';
import { PATHS } from '../../routes/paths';

/**
 * Extracted verbatim (same classNames/structure) from the original
 * RegisterScreen header so it can be shared across Register and Login
 * without duplicating markup. Visual design is unchanged; the CTA button
 * now performs real navigation and switches label/destination based on
 * the current route (register ⇄ login), matching the reference Login
 * screenshot which shows "إنشاء حساب جديد" instead of "تسجيل الدخول"
 * when already on the Login page.
 */
export const Navbar: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isLoginPage = location.pathname === PATHS.LOGIN;
  const ctaLabel = isLoginPage ? 'إنشاء حساب جديد' : 'تسجيل الدخول';
  const ctaDestination = isLoginPage ? PATHS.REGISTER : PATHS.LOGIN;

  return (
    <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between">
        {/* Logo Right in RTL */}
        <div className="flex items-center gap-3">
          <Logo variant="dark" size="md" />
        </div>

        {/* Center / Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#home" className="hover:text-emerald-600 transition-colors duration-200">
            الرئيسية
          </a>
          <a href="#about" className="hover:text-emerald-600 transition-colors duration-200">
            حول النظام
          </a>
          <a href="#help" className="hover:text-emerald-600 transition-colors duration-200">
            المساعدة
          </a>
          <Link to={PATHS.CONTACT} className="hover:text-emerald-600 transition-colors duration-200">
            اتصل بنا
          </Link>
        </nav>

        {/* Login Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(ctaDestination)}
            className="bg-[#0c2444] hover:bg-[#123663] text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 active:scale-95"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </header>
  );
};
