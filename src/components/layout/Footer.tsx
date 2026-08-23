import type { FC } from 'react';
import { Logo } from '../Logo';

/**
 * Extracted verbatim (same classNames/structure) from the original
 * RegisterScreen footer. The terms/privacy/contact links have no
 * corresponding pages anywhere in this project, so — per project
 * instructions not to invent missing pages — they remain the same
 * placeholder anchors they were before extraction.
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
        <div className="flex items-center gap-4 text-xs">
          <a href="#contact" className="hover:text-slate-800 transition">
            اتصل بنا
          </a>
          <span className="text-slate-300">|</span>
          <a href="#terms" className="hover:text-slate-800 transition">
            شروط الاستخدام
          </a>
          <span className="text-slate-300">|</span>
          <a href="#privacy" className="hover:text-slate-800 transition">
            سياسة الخصوصية
          </a>
        </div>
      </div>
    </footer>
  );
};
