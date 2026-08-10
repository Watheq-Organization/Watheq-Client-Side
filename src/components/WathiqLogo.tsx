import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  theme?: 'dark' | 'light';
  variant?: 'icon' | 'full';
}

export const WathiqLogo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  textColor,
  theme = 'light',
  variant = 'icon'
}) => {
  // Size mapping
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return { img: 'h-10 w-auto', text: 'text-xl', subText: 'text-[10px]' };
      case 'md': return { img: 'h-14 w-auto', text: 'text-2xl', subText: 'text-xs' };
      case 'lg': return { img: 'h-24 w-auto', text: 'text-3xl', subText: 'text-xs' };
      case 'xl': return { img: 'h-36 w-auto', text: 'text-4xl', subText: 'text-sm' };
    }
  };

  const dim = getSizeClasses();
  const titleColor = textColor || (theme === 'dark' ? 'text-white' : 'text-slate-900');
  const subColor = theme === 'dark' ? 'text-slate-300' : 'text-slate-500';

  if (variant === 'full') {
    return (
      <div className="inline-flex flex-col items-center justify-center select-none group cursor-pointer">
        <img
          src="/assets/wathiq_logo_full.jpg"
          alt="Wathiq Official Logo"
          className={`${dim.img} object-contain transition-transform duration-300 group-hover:scale-105 rounded-xl`}
        />
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-center justify-center select-none group cursor-pointer">
      {/* Official Emblem Icon with Smooth Rounding */}
      <div className="relative rounded-2xl overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 border border-slate-100/20">
        <img
          src="/assets/wathiq_logo_icon.jpg"
          alt="شعار وثق الرسمي"
          className={`${dim.img} object-cover`}
        />
      </div>

      {/* Typography: "وثق" + "نظام إدارة الديون الذكي" */}
      {showText && (
        <div className="text-center mt-3">
          <h1 className={`font-extrabold tracking-tight font-alexandria ${titleColor} ${dim.text}`}>
            وثق
          </h1>
          {(size === 'lg' || size === 'xl') && (
            <p className={`mt-1 font-medium ${subColor} ${dim.subText}`}>
              نظام إدارة الديون الذكي
            </p>
          )}
        </div>
      )}
    </div>
  );
};
