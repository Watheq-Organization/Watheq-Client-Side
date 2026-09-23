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
  const isLoginPage = location.pathname === PATHS.LOGIN;
  const isRegisterPage = location.pathname === PATHS.REGISTER;

  return (
    <header className="w-full bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Logo Right in RTL */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Link to={PATHS.REGISTER} className="flex items-center gap-2 flex-shrink-0">
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
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
            }`}
          >
            الرئيسية
          </Link>
          <Link
            to={PATHS.HELP}
            className={`transition-colors duration-200 py-1.5 ${
              isHelpActive
                ? 'text-emerald-600 font-bold border-b-2 border-emerald-500'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
            }`}
          >
            المساعدة
          </Link>
          <Link
            to={PATHS.ABOUT}
            className={`transition-colors duration-200 py-1.5 ${
              isAboutActive
                ? 'text-emerald-600 font-bold border-b-2 border-emerald-500'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
            }`}
          >
            حول النظام
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Register Button: hidden when on RegisterPage, shown on LoginPage & other pages */}
          {!isRegisterPage && (
            <button
              type="button"
              onClick={() => navigate(PATHS.REGISTER)}
              className={`whitespace-nowrap px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                isLoginPage
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50'
              }`}
            >
              إنشاء حساب
            </button>
          )}

          {/* Login Button: hidden when on LoginPage, shown on RegisterPage & other pages */}
          {!isLoginPage && (
            <button
              type="button"
              onClick={() => navigate(PATHS.LOGIN)}
              className="whitespace-nowrap bg-[#0c2444] hover:bg-[#123663] text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
            >
              تسجيل الدخول
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

