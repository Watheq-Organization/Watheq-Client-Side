import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../Logo';
import { PATHS } from '../../routes/paths';

/**
 * Single shared Footer used across every page. Originally extracted
 * verbatim (same classNames/structure) from the RegisterScreen footer.
 * All navigation links now route through the app's real routing system
 * (react-router-dom `Link` + `PATHS`) instead of `#` placeholder anchors.
 * The terms-of-use link still has no corresponding page anywhere in this
 * project, so — per project instructions not to invent missing pages — it
 * remains a placeholder anchor. The privacy-policy link now routes to the
 * real PrivacyPolicyPage.
 */
export const Footer: FC = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-100 py-6 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        {/* Logo on Left/Start in RTL */}
        <div className="flex items-center gap-2">
          <Logo variant="dark" size="sm" />
        </div>

        {/* Copyright in Center */}
        <div className="text-center font-normal">
          © 2024 وثّق - تطبيق إدارة الديون والتوثيق. جميع الحقوق محفوظة.
        </div>

        {/* Footer Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <Link to={PATHS.CONTACT} className="hover:text-slate-800 transition">
            اتصل بنا
          </Link>
        
          <span className="text-slate-300">|</span>
          <a href="#terms" className="hover:text-slate-800 transition">
            شروط الاستخدام
          </a>
          <span className="text-slate-300">|</span>
          <Link to={PATHS.PRIVACY_POLICY} className="hover:text-slate-800 transition">
            سياسة الخصوصية
          </Link>
        </div>
      </div>
    </footer>
  );
};
