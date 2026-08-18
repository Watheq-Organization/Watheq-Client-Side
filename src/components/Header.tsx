import React from 'react';
import wathiqLogoIcon from '../assets/wathiq_logo_icon.jpg';

export type ScreenType = 
  | 'splash' 
  | 'login' 
  | 'signup' 
  | 'forgot-password' 
  | 'contact' 
  | 'privacy' 
  | 'terms' 
  | 'dashboard' 
  | 'settings' 
  | 'clients' 
  | 'client-detail' 
  | 'add-debt' 
  | 'record-payment'
  | 'payment-log'
  | 'reports'
  | 'reminders'
  | 'subscriptions';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  brandText?: 'ar' | 'en';
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  brandText = 'ar'
}) => {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-4 lg:px-12 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Right Side: Official Brand Logo */}
        <div 
          onClick={() => onNavigate('splash')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img
            src={wathiqLogoIcon}
            alt="Wathiq Logo"
            className="w-10 h-10 object-cover rounded-xl shadow-xs border border-slate-100 group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-xl text-slate-900 tracking-tight font-alexandria">
              {brandText === 'ar' ? 'وثق' : 'Watheq'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium -mt-0.5">
              إدارة الديون والتوثيق
            </span>
          </div>
        </div>

        {/* Middle Navigation Links */}
        <nav className=" hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button 
            onClick={() => onNavigate('splash')}
            className={`hover:text-emerald-600 transition-colors cursor-pointer py-1 ${
              currentScreen === 'splash' ? 'text-emerald-600 font-bold' : ''
            }`}
          >
            الرئيسية
          </button>
          <button 
            onClick={() => onNavigate('login')}
            className={`hover:text-emerald-600 transition-colors cursor-pointer py-1 ${
              currentScreen === 'login' ? 'text-emerald-600 font-bold' : ''
            }`}
          >
            من نحن
          </button>
          <button 
            onClick={() => onNavigate('contact')}
            className={`hover:text-emerald-600 transition-colors cursor-pointer py-1 ${
              currentScreen === 'contact' ? 'text-emerald-600 font-bold' : ''
            }`}
          >
            اتصل بنا
          </button>
          <button 
            onClick={() => onNavigate('terms')}
            className={`hover:text-emerald-600 transition-colors cursor-pointer py-1 ${
              currentScreen === 'terms' ? 'text-emerald-600 font-bold' : ''
            }`}
          >
            الشروط
          </button>
          <button 
            onClick={() => onNavigate('privacy')}
            className={`hover:text-emerald-600 transition-colors cursor-pointer py-1 ${
              currentScreen === 'privacy' ? 'text-emerald-600 font-bold' : ''
            }`}
          >
            الخصوصية
          </button>
        </nav>

        {/* Left Side: Login & Signup Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('login')}
            className={` px-4 py-1.5 rounded-lg text-sm transition-all cursor-pointer border ${
              currentScreen === 'login' 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold' 
                : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => onNavigate('signup')}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-xs cursor-pointer"
          >
            إنشاء حساب
          </button>
        </div>

      </div>
    </header>
  );
};
