import { useEffect } from 'react';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  useEffect(() => {
    // Initialize Language
    const root = document.documentElement;
    const lang = localStorage.getItem('app_language') || 'ar';
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    root.lang = lang;
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-100 dark:bg-slate-700 font-cairo">
      <AppRoutes />
    </div>
  );
}

export default App;
