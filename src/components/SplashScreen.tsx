import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Lock, Shield } from 'lucide-react';
import { Logo } from './Logo';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('جاري تأمين الاتصال...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(45);
      setStatusText('التحقق من شهادات الأمان...');
    }, 800);

    const timer2 = setTimeout(() => {
      setProgress(78);
      setStatusText('جاري تشفير البيانات وتجهيز النظام...');
    }, 1600);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('تم الاتصال بنجاح ✓');
    }, 2400);

    const timer4 = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between bg-gradient-to-b from-[#0e2749] via-[#102d53] to-[#0c203b] text-white select-none overflow-hidden p-6">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Top Placeholder for balance */}
      <div className="w-full h-8" />

      {/* Center Brand & Progress Area */}
      <div className="flex flex-col items-center max-w-sm w-full z-10 text-center animate-fade-in">
        {/* HD Shield Emblem */}
        <div className="relative mb-5 transform transition duration-500 hover:scale-105">
          <Logo variant="emblem-only" size="xl" />
        </div>

        {/* English & Arabic Brand Title */}
        <div className="flex flex-col items-center gap-1 mb-2">
          <h1 className="text-4xl sm:text-5xl font-black font-tajawal tracking-tight text-white drop-shadow-md">
            وثَّـق
          </h1>
          <span className="text-xl sm:text-2xl font-bold font-sans tracking-wide text-blue-200">
            Watheq
          </span>
        </div>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-blue-200/90 font-medium mb-9 tracking-wide">
          تطبيق إدارة الديون والتوثيق
        </p>

        {/* Progress Bar Container */}
        <div className="w-full max-w-[280px] sm:max-w-xs flex flex-col items-center gap-3">
          <div className="w-full h-1.5 bg-[#1e4270]/80 rounded-full overflow-hidden p-[1px] shadow-inner">
            <div
              className="h-full bg-gradient-to-l from-emerald-400 via-teal-300 to-white rounded-full transition-all duration-500 ease-out shadow-sm shadow-teal-300/50"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Loading status */}
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-blue-200/90 font-normal">
            <Shield className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
            <span>{statusText}</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="w-full max-w-md flex flex-col items-center gap-4 z-10 pb-4">
        <div className="w-48 sm:w-64 h-[1px] bg-blue-400/15" />
        <div className="flex items-center gap-2 text-xs text-blue-300/75 font-light">
          <Lock className="w-3 h-3 text-blue-300/80" />
          <span>نظام تشفير مالي متكامل</span>
        </div>
      </div>
    </div>
  );
};
