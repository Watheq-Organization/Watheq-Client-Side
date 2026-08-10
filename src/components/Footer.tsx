import React from 'react';
import { ScreenType } from './Header';

interface FooterProps {
  brandName?: string;
  theme?: 'light' | 'dark';
  onNavigate?: (screen: ScreenType) => void;
}

export const Footer: React.FC<FooterProps> = ({
  brandName = 'Watheq',
  theme = 'light',
  onNavigate
}) => {
  const bgClass = theme === 'dark' ? 'bg-[#0B1324] text-slate-400 border-slate-800' : 'bg-white text-slate-500 border-slate-100';
  const brandClass = theme === 'dark' ? 'text-white' : 'text-slate-700';

  return (
    <footer className={`w-full border-t py-6 px-4 lg:px-12 text-xs mt-auto ${bgClass}`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Right side brand name */}
        <div className={`font-bold text-sm tracking-wide font-alexandria ${brandClass}`}>
          {brandName}
        </div>

        {/* Center copyright text */}
        <div className="text-center opacity-80">
          © 2026 وثق - نظام إدارة الديون الذكي. جميع الحقوق محفوظة.
        </div>

        {/* Left side policy links */}
        <div className="flex items-center gap-5 opacity-90">
          <button 
            onClick={() => onNavigate && onNavigate('contact')}
            className="hover:text-emerald-500 transition-colors cursor-pointer"
          >
            اتصل بنا
          </button>
          <span className="opacity-30">•</span>
          <button 
            onClick={() => onNavigate && onNavigate('terms')}
            className="hover:text-emerald-500 transition-colors cursor-pointer"
          >
            شروط الاستخدام
          </button>
          <span className="opacity-30">•</span>
          <button 
            onClick={() => onNavigate && onNavigate('privacy')}
            className="hover:text-emerald-500 transition-colors cursor-pointer"
          >
            سياسة الخصوصية
          </button>
        </div>

      </div>
    </footer>
  );
};
