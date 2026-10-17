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
      {/* Glassmorphic Security Shield Icon with Glowing Emerald Checkmark */}
      <div className={`relative ${iconSizes[size]} rounded-xl flex items-center justify-center bg-gradient-to-br from-[#00D685]/20 via-[#00D685]/10 to-transparent border border-[#00D685]/40 shadow-[0_0_15px_rgba(0,214,133,0.3)] overflow-hidden shrink-0 group`}>
        {/* Subtle grid lines background inside shield */}
        <div className="absolute inset-0 bg-[radial-gradient(#00D685_1px,transparent_1px)] [background-size:6px_6px] opacity-30"></div>
        
        {/* Shield Vector */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="w-5/6 h-5/6 text-[#00D685] relative z-10 drop-shadow-[0_0_8px_rgba(0,214,133,0.6)]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            d="m9 12 2 2 4-4"
          />
        </svg>

        {/* Ambient subtle glow pulse */}
        <div className="absolute inset-0 bg-[#00D685]/10 rounded-xl blur-sm animate-pulse-glow"></div>
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
