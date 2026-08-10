import React from 'react';
import { ScreenType } from './Header';
import { Play, LogIn, UserPlus, PhoneCall, ShieldCheck, Scale, LayoutDashboard, Settings, Users, UserCheck } from 'lucide-react';

interface ScreenSwitcherProps {
  currentScreen: ScreenType;
  onChangeScreen: (screen: ScreenType) => void;
}

export const ScreenSwitcher: React.FC<ScreenSwitcherProps> = ({
  currentScreen,
  onChangeScreen
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white backdrop-blur-lg px-3 py-2 rounded-full border border-slate-700/80 shadow-2xl flex items-center gap-1.5 text-xs max-w-[95vw] overflow-x-auto">
      <span className="text-slate-400 font-semibold px-2 border-l border-slate-700 whitespace-nowrap hidden sm:inline">
        تنقل الشاشات:
      </span>

      {/* Screen 1: Splash */}
      <button
        onClick={() => onChangeScreen('splash')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium whitespace-nowrap ${
          currentScreen === 'splash'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'hover:bg-slate-800 text-slate-300'
        }`}
      >
        <Play className="w-3.5 h-3.5" />
        <span>1. التحميل</span>
      </button>

      {/* Screen 2: Login */}
      <button
        onClick={() => onChangeScreen('login')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium whitespace-nowrap ${
          currentScreen === 'login'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'hover:bg-slate-800 text-slate-300'
        }`}
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>2. الدخول</span>
      </button>

      {/* Screen 3: Signup */}
      <button
        onClick={() => onChangeScreen('signup')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium whitespace-nowrap ${
          currentScreen === 'signup'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'hover:bg-slate-800 text-slate-300'
        }`}
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>3. إنشاء حساب</span>
      </button>

      {/* Screen 4: Contact */}
      <button
        onClick={() => onChangeScreen('contact')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium whitespace-nowrap ${
          currentScreen === 'contact'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'hover:bg-slate-800 text-slate-300'
        }`}
      >
        <PhoneCall className="w-3.5 h-3.5" />
        <span>4. اتصل بنا</span>
      </button>

      {/* Screen 5: Privacy */}
      <button
        onClick={() => onChangeScreen('privacy')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium whitespace-nowrap ${
          currentScreen === 'privacy'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'hover:bg-slate-800 text-slate-300'
        }`}
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>5. الخصوصية</span>
      </button>

      {/* Screen 6: Terms */}
      <button
        onClick={() => onChangeScreen('terms')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium whitespace-nowrap ${
          currentScreen === 'terms'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'hover:bg-slate-800 text-slate-300'
        }`}
      >
        <Scale className="w-3.5 h-3.5" />
        <span>6. الشروط</span>
      </button>

      {/* Screen 7: Dashboard */}
      <button
        onClick={() => onChangeScreen('dashboard')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium whitespace-nowrap ${
          currentScreen === 'dashboard'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'hover:bg-slate-800 text-slate-300'
        }`}
      >
        <LayoutDashboard className="w-3.5 h-3.5" />
        <span>7. لوحة القيادة</span>
      </button>

      {/* Screen 8: Settings */}
      <button
        onClick={() => onChangeScreen('settings')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium whitespace-nowrap ${
          currentScreen === 'settings'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'hover:bg-slate-800 text-slate-300'
        }`}
      >
        <Settings className="w-3.5 h-3.5" />
        <span>8. الإعدادات</span>
      </button>

      {/* Screen 9: Clients List */}
      <button
        onClick={() => onChangeScreen('clients')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium whitespace-nowrap ${
          currentScreen === 'clients'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'hover:bg-slate-800 text-slate-300'
        }`}
      >
        <Users className="w-3.5 h-3.5" />
        <span>9. قائمة العملاء</span>
      </button>

      {/* Screen 10: Client Detail */}
      <button
        onClick={() => onChangeScreen('client-detail')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium whitespace-nowrap ${
          currentScreen === 'client-detail'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'hover:bg-slate-800 text-slate-300'
        }`}
      >
        <UserCheck className="w-3.5 h-3.5" />
        <span>10. ملف العميل</span>
      </button>
    </div>
  );
};
