import type { FC } from 'react';

interface LogoProps {
  variant?: 'light' | 'dark' | 'emblem-only' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: FC<LogoProps> = ({
  variant = 'dark',
  size = 'md',
  showSubtitle = false,
  className = '',
}) => {
  const isLight = variant === 'light';

  // Dimension mapping for the emblem
  const iconDimensions = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24 sm:w-28 sm:h-28',
  };

  const textSizes = {
    sm: { en: 'text-xs', ar: 'text-base', sub: 'text-[10px]' },
    md: { en: 'text-sm', ar: 'text-xl', sub: 'text-xs' },
    lg: { en: 'text-lg', ar: 'text-2xl', sub: 'text-sm' },
    xl: { en: 'text-2xl', ar: 'text-4xl', sub: 'text-base' },
  };

  if (variant === 'emblem-only') {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <img
          src="/logo-hd.png"
          alt="شعار وثّق"
          className={`${iconDimensions[size]} object-contain drop-shadow-xl rounded-2xl transition-transform duration-300 hover:scale-105`}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* High-Definition Logo Icon */}
      <img
        src="/logo-hd.png"
        alt="شعار وثّق"
        className={`${iconDimensions[size]} object-contain drop-shadow-md rounded-2xl transition-transform duration-200 hover:scale-105`}
      />

      {/* Brand Typography */}
      <div className="flex flex-col justify-center text-right leading-none">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-black font-tajawal tracking-tight ${
              textSizes[size].ar
            } ${isLight ? 'text-white' : 'text-[#0c2444]'}`}
          >
            وثَّـق
          </span>
          <span
            className={`font-bold font-sans tracking-wide ${
              textSizes[size].en
            } ${isLight ? 'text-blue-200' : 'text-[#1e3a8a]'}`}
          >
            Watheq
          </span>
        </div>

        {showSubtitle && (
          <span
            className={`font-medium mt-1 ${textSizes[size].sub} ${
              isLight ? 'text-blue-300/80' : 'text-slate-500'
            }`}
          >
            تطبيق إدارة الديون والتوثيق
          </span>
        )}
      </div>
    </div>
  );
};
