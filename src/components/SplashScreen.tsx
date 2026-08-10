import React, { useState, useEffect } from 'react';
import wathiqLogoIcon from '../assets/wathiq_logo_icon.jpg';
import { Lock, RefreshCw, ArrowLeft, ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  onNavigateLogin?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  onNavigateLogin
}) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('جاري تأمين الاتصال...');

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          if (onComplete) onComplete();
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 15) + 5;
        
        if (next > 30 && next < 70) {
          setStatusText('تحميل التشفير والشهادات الرقمية...');
        } else if (next >= 70 && next < 100) {
          setStatusText('التحقق من أمان النظام...');
        } else if (next >= 100) {
          setStatusText('تم تأمين الاتصال بنجاح!');
        }
        
        return next > 100 ? 100 : next;
      });
    }, 250);

    return () => clearInterval(timer);
  }, [onComplete]);

  const handleReplay = () => {
    setProgress(0);
    setStatusText('جاري تأمين الاتصال...');
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0A1324] text-white flex flex-col justify-between items-center p-6 overflow-hidden selection:bg-emerald-500 selection:text-white">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header / Status bar simulation */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10 opacity-70 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>إصدار آمن v2.4.0</span>
        </div>
        {onNavigateLogin && (
          <button
            onClick={onNavigateLogin}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10"
          >
            <span>التخطي للدخول</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Center Logo & Progress Content */}
      <div className="my-auto flex flex-col items-center justify-center text-center z-10 w-full max-w-sm px-4">
        
        {/* Glowing Official Logo Emblem */}
        <div className="mb-6 animate-shield-pulse relative">
          <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/30 border-2 border-white/20 p-0.5 bg-white">
            <img
              src={wathiqLogoIcon}
              alt="Wathiq Official Logo"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
        </div>

        {/* Brand Titles */}
        <h1 className="text-4xl font-extrabold tracking-tight font-alexandria text-white mb-1">
          وثق
        </h1>
        <p className="text-sm font-medium text-slate-300 mb-10">
          نظام إدارة الديون الذكي
        </p>

        {/* Glowing Custom Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 p-0.5 overflow-hidden border border-slate-700/50 shadow-inner mb-4 relative">
          <div
            className="bg-gradient-to-l from-emerald-400 via-teal-400 to-blue-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(16,185,129,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status Text & Lock Icon */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>{statusText}</span>
          <span className="text-emerald-400 font-bold ml-1">{progress}%</span>
        </div>

        {/* Replay or Proceed Button */}
        {progress === 100 && (
          <div className="mt-8 animate-fade-in flex flex-col gap-2 w-full">
            {onNavigateLogin && (
              <button
                onClick={onNavigateLogin}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <span>متابعة إلى تسجيل الدخول</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleReplay}
              className="text-xs text-slate-400 hover:text-slate-200 py-1 flex items-center justify-center gap-1 mt-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>إعادة الفحص والتحميل</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Text */}
      <div className="z-10 text-center text-xs text-slate-500 font-medium pb-2">
        <span>* نظام تشفير عالي المتانة</span>
      </div>

    </div>
  );
};
