import React from 'react';

interface WatheqBrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  lightText?: boolean;
}

export const WatheqBrandLogo: React.FC<WatheqBrandLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
  lightText = false,
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: { title: 'text-lg', en: 'text-xs', sub: 'text-[10px]' },
    md: { title: 'text-xl sm:text-2xl', en: 'text-xs sm:text-sm', sub: 'text-xs' },
    lg: { title: 'text-2xl sm:text-3xl', en: 'text-sm sm:text-base', sub: 'text-xs sm:text-sm' },
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Watheq 3D Shield Emblem */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105`}>
        <img
          src="/logo-hd.png"
          alt="شعار وثّق"
          className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,214,133,0.3)]"
        />
        {/* Subtle ambient glow behind emblem */}
        <div className="absolute -inset-1 bg-[#00D685]/15 rounded-full blur-md -z-10 animate-pulse-glow pointer-events-none"></div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center text-right leading-tight">
        <div className="flex items-center gap-2">
          <span
            className={`font-black font-cairo tracking-tight ${textSizes[size].title} ${
              lightText ? 'text-white' : 'text-[#0F172A] dark:text-white'
            }`}
          >
            وثَّـق
          </span>
          <span className="text-[#00D685] font-bold text-sm">|</span>
          <span
            className={`font-bold font-jakarta tracking-wide ${textSizes[size].en} ${
              lightText ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'
            }`}
          >
            Watheq
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`font-medium mt-0.5 ${textSizes[size].sub} ${
              lightText ? 'text-emerald-300/80' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            المنظومة الرقمية للتوثيق المالي
          </span>
        )}
      </div>
    </div>
  );
};
