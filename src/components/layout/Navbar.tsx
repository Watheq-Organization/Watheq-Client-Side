import type { FC } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Logo } from '../Logo';
import { PATHS } from '../../routes/paths';

export const Navbar: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAboutActive = location.pathname === PATHS.ABOUT;
  const isHelpActive = location.pathname === PATHS.HELP;
  const isHomeActive =
    location.pathname === PATHS.HOME ||
    location.pathname === PATHS.REGISTER ||
    location.pathname === PATHS.SPLASH;

  return (
    <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between">
        {/* Logo Right in RTL */}
        <div className="flex items-center gap-3">
          <Link to={PATHS.REGISTER} className="flex items-center gap-2">
            <Logo variant="dark" size="md" />
          </Link>
        </div>

        {/* Center / Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            to={PATHS.REGISTER}
            className={`transition-colors duration-200 py-1.5 ${
              isHomeActive
                ? 'text-emerald-600 font-bold border-b-2 border-emerald-500'
                : 'text-slate-600 hover:text-emerald-600'
            }`}
          >
            الرئيسية
          </Link>
          <Link
            to={PATHS.HELP}
            className={`transition-colors duration-200 py-1.5 ${
              isHelpActive
                ? 'text-emerald-600 font-bold border-b-2 border-emerald-500'
                : 'text-slate-600 hover:text-emerald-600'
            }`}
          >
            المساعدة
          </Link>
          <Link
            to={PATHS.ABOUT}
            className={`transition-colors duration-200 py-1.5 ${
              isAboutActive
                ? 'text-emerald-600 font-bold border-b-2 border-emerald-500'
                : 'text-slate-600 hover:text-emerald-600'
            }`}
          >
            حول النظام
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(PATHS.REGISTER)}
            className="border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 px-4 sm:px-5 py-2 rounded-lg text-sm font-medium shadow-2xs transition-all duration-200 active:scale-95 cursor-pointer"
          >
            إنشاء حساب
          </button>
          <button
            type="button"
            onClick={() => navigate(PATHS.LOGIN)}
            className="bg-[#0c2444] hover:bg-[#123663] text-white px-5 sm:px-6 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    </header>
  );
};

