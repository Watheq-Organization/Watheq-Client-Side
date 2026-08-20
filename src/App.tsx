import { useState } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { RegisterScreen } from './components/RegisterScreen';
// import { Sparkles, Monitor } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'splash' | 'register'>('register');

  return (
    <div className="relative min-h-screen bg-slate-100 font-cairo">
      {/* Floating Demo Switcher Toolbar */}
      {/* <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl border border-slate-200/80 flex items-center gap-2 text-xs font-semibold text-slate-700">
        <span className="text-slate-400 pl-1">التنقل بين الشاشتين:</span>
        <button
          type="button"
          onClick={() => setCurrentView('splash')}
          className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
            currentView === 'splash'
              ? 'bg-[#0e2a4d] text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>1. شاشة البداية (Splash)</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('register')}
          className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
            currentView === 'register'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>2. شاشة إنشاء الحساب (تسجيل)</span>
        </button>
      </div> */}

      {/* Screen Render */}
      {currentView === 'splash' ? (
        <SplashScreen onComplete={() => setCurrentView('register')} />
      ) : (
        <RegisterScreen onGoToSplash={() => setCurrentView('splash')} />
      )}
    </div>
    
  );
}

export default App;
