import { useEffect } from 'react';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  useEffect(() => {
    // Initialize Theme
    const theme = localStorage.getItem('app_theme') || 'light';
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Initialize Language
    const lang = localStorage.getItem('app_language') || 'ar';
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    root.lang = lang;
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-100 dark:bg-slate-700 font-cairo transition-colors duration-300">
      <AppRoutes />
    </div>
  );
}

export default App;
