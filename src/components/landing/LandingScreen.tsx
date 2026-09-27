import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  XCircle, 
  ShieldCheck, 
  Clock, 
  MessageCircle, 
  FileText, 
  BarChart, 
  Lock, 
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  Maximize,
  Volume2,
  WifiOff,
  Smartphone,
  ArrowLeft,
  Mic,
  Send,
  CheckCheck,
  Check,
  Star
} from 'lucide-react';
import { Logo } from '../Logo';
import { PATHS } from '../../routes/paths';

export const LandingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  };

  const faqs = [
    {
      num: '01',
      badgeColor: 'text-emerald-400 bg-emerald-500/10',
      question: 'هل يحتاج الزبون إلى تحميل أي تطبيق لتأكيد الدين؟',
      answer: <><span className="font-bold text-white">إطلاقاً!</span> هذه هي الميزة الجوهرية لمنظومة وثّق؛ يستلم العميل رسالة واتساب رسمية ومباشرة تحتوي على تفاصيل القيد مع زر تفاعلي للإقرار بالدين أو مراجعة الفاتورة بدون أي تعقيد تقني أو تنزيل برامج إضافية.</>
    },
    {
      num: '02',
      badgeColor: 'text-teal-400 bg-teal-500/10',
      question: 'كيف يعمل النظام في حال انقطاع خدمة الإنترنت في المحل؟',
      answer: 'تم بناء "وثّق" وفق معمارية Offline-First كاملة؛ حيث تُحفظ كافة المعاملات والديون والدفعات المسجلة محلياً على جهازك، وتوضع رسائل التوثيق في قائمة انتظار تلقائية (Queue)، ثم تُزامن تلقائياً مع السحابة وتُرسل رسائل الواتساب فور استعادة اتصال الإنترنت.'
    },
    {
      num: '03',
      badgeColor: 'text-cyan-400 bg-cyan-500/10',
      question: 'هل هناك أي تكاليف أو رسوم خفية على إرسال رسائل الواتساب؟',
      answer: 'لا توجد أي رسوم خفية. تكلفة رسائل التوثيق والتذكيرات الآلية مشمولة بالكامل ضمن قيمة الاشتراك الشهري المعلن للباقة دون أي رسوم إضافية لكل رسالة.'
    },
    {
      num: '04',
      badgeColor: 'text-indigo-400 bg-indigo-500/10',
      question: 'ما مدى أمان وسرية بيانات حساباتي وديون عملائي؟',
      answer: 'تخضع كافة البيانات لأعلى معايير التشفير المصرفي المتقدم (256-bit SSL) مع بصمة مشفرة (SHA-256) لكل قيد مالي لمنع أي تلاعب، مع نسخ احتياطي دوري سحابي لا يمكن لأي طرف ثالث الاطلاع عليه إلا التاجر المعتمد.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#070b14] text-slate-800 dark:text-slate-200 font-cairo selection:bg-emerald-500/30 selection:text-emerald-700 dark:selection:text-emerald-300" dir="rtl">
      
      {/* --- Navbar --- */}
      <nav className="absolute top-0 w-full z-50 bg-white/80 dark:bg-transparent backdrop-blur-md dark:backdrop-blur-none border-b border-slate-200 dark:border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate(PATHS.HOME)}>
              <Logo size="lg" />
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8 lg:gap-10">
              <a href="#features" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">المميزات الرئيسية</a>
              <a href="#how" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">كيف يعمل؟</a>
              <a href="#pricing" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">الباقات والأسعار</a>
              <a href="#faq" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">الأسئلة الشائعة</a>
            </div>

            {/* Auth Buttons & Theme Toggle */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={toggleTheme}
                className="text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={() => navigate(PATHS.LOGIN)}
                className="text-sm font-bold text-slate-700 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
              >
                تسجيل الدخول
              </button>
              <button 
                onClick={() => navigate(PATHS.REGISTER)}
                className="px-6 py-3 text-sm font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-500 rounded-xl transition-all flex items-center gap-2"
              >
                <div className="w-4 h-4 text-slate-900">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                </div>
                جرب النظام مجاناً
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#070b14] border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-6 space-y-1 shadow-2xl absolute w-full">
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">المميزات الرئيسية</a>
            <a href="#how" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">كيف يعمل؟</a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">الباقات والأسعار</a>
            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">الأسئلة الشائعة</a>
            <div className="mt-4 flex flex-col gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => { setIsMobileMenuOpen(false); navigate(PATHS.LOGIN); }}
                className="w-full px-5 py-3 text-sm font-bold text-center text-slate-700 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                تسجيل الدخول
              </button>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); navigate(PATHS.REGISTER); }}
                className="w-full px-5 py-3 text-sm font-bold text-center text-slate-900 bg-emerald-400 hover:bg-emerald-500 rounded-xl flex items-center justify-center gap-2"
              >
                <div className="w-4 h-4 text-slate-900">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                </div>
                جرب النظام مجاناً
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* --- Hero Section --- */}
      <section id="hero" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50 dark:bg-[#070b14] min-h-screen flex items-center">
        {/* Glow Effects */}
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[30%] left-[10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8">
            
            {/* Hero Text (Right Side) */}
            <div className="w-full lg:w-1/2 text-right space-y-8 order-1">
              
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-emerald-400 text-sm font-semibold mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                الجيل الجديد لتوثيق ديون التجار والمحلات التجارية
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.3] lg:leading-[1.3] tracking-tight font-cairo">
                احمِ ديونك وسجّل مستحقاتك <br />
                <span className="text-emerald-500 dark:text-emerald-400">بتوثيق رسمي عبر الواتساب</span>
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                منظومة <span className="text-slate-900 dark:text-white font-bold">"وثّق"</span> تُنهي عشوائية الدفاتر الورقية ومتاعب النسيان والنزاعات. 
                سجّل الدين في ثوانٍ، ليصل إشعار توثيق فوري لزبونك عبر الواتساب للإقرار، مع دعم كامل للعمل 
                <span className="text-emerald-600 dark:text-emerald-400 font-bold mx-1">بدون إنترنت (Offline-First)</span>
                ومزامنة سحابية مشفرة.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <button 
                  onClick={() => navigate(PATHS.REGISTER)}
                  className="w-full sm:w-auto px-8 py-4 text-base font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-500 shadow-xl shadow-emerald-500/10 rounded-2xl transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  ابدأ النسخة التجريبية مجانا
                  <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
                <button className="w-full sm:w-auto px-8 py-4 text-base font-bold text-slate-700 dark:text-white bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 backdrop-blur-md rounded-2xl transition-all flex items-center justify-center gap-3">
                  شاهد كيف يعمل (60 ثانية)
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-400/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                    <Play className="w-4 h-4 fill-emerald-500 dark:fill-emerald-400" />
                  </div>
                </button>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-8 mt-12 text-center lg:text-right w-full sm:w-11/12 gap-4">
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono flex items-baseline justify-end gap-1">0.0 <span className="text-sm font-cairo">ر.س</span></div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">رسوم إضافية على واتساب</div>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-slate-800"></div>
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">100%</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">عمل دون إنترنت أوفلاين</div>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-slate-800"></div>
                <div>
                  <div className="text-xl font-black text-emerald-500 dark:text-emerald-400 mb-1">فوري</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">إقرار إلكتروني ملزم</div>
                </div>
              </div>

            </div>

            {/* Hero Mockup Graphic (Left Side) */}
            <div className="w-full lg:w-1/2 relative order-2 flex justify-center lg:justify-end">
              
              {/* Main Dashboard Card */}
              <div className="w-[480px] max-w-full bg-white dark:bg-[#0a111a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative z-10 flex flex-col font-cairo">
                {/* Browser Top Bar */}
                <div className="h-12 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 bg-slate-50 dark:bg-[#0a111a]">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400 dark:bg-rose-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400 dark:bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400 dark:bg-emerald-500/80"></div>
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-mono tracking-wider">watheq.app/dashboard</div>
                  <div className="opacity-0">...</div>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 space-y-6">
                  
                  {/* Cloud Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    متصل سحابيا
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">إجمالي الديون القائمة</div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white font-mono flex items-baseline justify-end gap-1 mb-2">124,500 <span className="text-sm font-cairo">ر.س</span></div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                        42 عميل نشط <div className="w-3 h-3 bg-slate-200 dark:bg-slate-800 rounded-sm"></div>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">تحصيلات الشهر الحالي</div>
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono flex items-baseline justify-end gap-1 mb-2">45,200 <span className="text-sm font-cairo text-emerald-600 dark:text-emerald-400">ر.س</span></div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-500/70 flex items-center justify-end gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        18%+ عن الشهر الماضي
                      </div>
                    </div>
                  </div>

                  {/* Recent Transactions List */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">آخر المعاملات المسجلة</span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer hover:underline">عرض السجل</span>
                    </div>
                    <div className="space-y-3">
                      
                      {/* Debt Row */}
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">أم</div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">أحمد المحمد</div>
                            <div className="text-[10px] text-slate-500">فاتورة رقم #8821</div>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-baseline gap-1 justify-end">450.00 <span className="text-[10px] font-cairo text-slate-400">ر.س</span></div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end mt-0.5">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            موثق واتساب
                          </div>
                        </div>
                      </div>

                      {/* Payment Row */}
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">سع</div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">سعد العتيبي</div>
                            <div className="text-[10px] text-slate-500">سند قبض دفعة #402-REC</div>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono flex items-baseline gap-1 justify-end">-300.00 <span className="text-[10px] font-cairo text-emerald-600 dark:text-emerald-400">ر.س</span></div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-500 flex items-center gap-1 justify-end mt-0.5">
                            مسدد نقداً
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>

              {/* Floating WhatsApp Card Overlay */}
              <div className="absolute -bottom-12 sm:-left-12 left-0 right-0 sm:right-auto z-20 w-[90%] mx-auto sm:w-[340px]">
                {/* Security Tag */}
                <div className="absolute -top-3 right-6 bg-emerald-400 text-slate-900 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-emerald-300 z-30 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  موثق رقمياً SHA-256
                </div>
                
                <div className="bg-[#e8faed] dark:bg-[#0f1b14] border border-emerald-200 dark:border-emerald-900/50 rounded-2xl shadow-2xl p-4 pt-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" clipRule="evenodd"></path></svg>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">منظومة وثّق | WhatsApp Verified</div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">الآن • رسالة تفاعلية مشفرة</div>
                      </div>
                    </div>
                    <div className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-400/20">إشعار قيد مالي</div>
                  </div>

                  {/* Body */}
                  <div className="text-right space-y-3 mb-4">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">مرحباً أ. أحمد المحمد 👋</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      قام <span className="text-emerald-600 dark:text-emerald-400 font-bold">"متجر الوفاء للتوريدات"</span> بتسجيل قيد دين آجل بذمتكم:
                    </div>
                    <div className="bg-white dark:bg-[#1a2821] border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-3 flex justify-between items-center">
                      <div className="text-sm font-black text-slate-900 dark:text-white font-mono flex items-baseline gap-1">450.00 <span className="text-[10px] font-cairo font-normal text-slate-500">ريال سعودي</span></div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">المبلغ المستحق:</div>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">نرجو التكرم بالضغط على تأكيد القيد لتوثيق كشف الحساب رسمياً.</div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button className="py-2.5 rounded-xl bg-emerald-500 dark:bg-emerald-400 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white dark:text-slate-900 text-xs font-bold transition-colors">
                      تأكيد الدين ✅
                    </button>
                    <button className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors">
                      اعتراض / استفسار ❌
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Video Section */}
          <div className="mt-24 lg:mt-32 max-w-5xl mx-auto w-full relative z-20">
            <div className="bg-slate-50 dark:bg-[#0b1320] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative group">
              {/* Top Bar */}
              <div className="h-10 bg-slate-100 dark:bg-[#060b13] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 font-mono tracking-wider">HD 1080P</span>
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 font-cairo">جولة تعريفية بالنظام: من تسجيل المعاملة إلى السداد (02:45)</div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>
              </div>
              
              {/* Video Area */}
              <div className="aspect-video relative bg-slate-200 dark:bg-[#0a111a] flex items-center justify-center overflow-hidden">
                {/* Mock screenshot of dashboard inside the video player */}
                <div className="absolute inset-0 opacity-10 dark:opacity-40 mix-blend-multiply dark:mix-blend-screen" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
                <div className="absolute inset-0 flex flex-col p-4 sm:p-8 opacity-30 dark:opacity-50 pointer-events-none">
                   <div className="w-full h-full border border-slate-300 dark:border-slate-700/50 rounded-xl bg-white/50 dark:bg-[#0a111a]/80 shadow-inner flex p-4 gap-4">
                     <div className="w-48 bg-slate-200 dark:bg-[#0d1624] rounded-lg border border-slate-300 dark:border-slate-700/50 hidden md:block"></div>
                     <div className="flex-1 space-y-4">
                       <div className="h-10 bg-slate-300 dark:bg-slate-800 rounded-lg w-1/3"></div>
                       <div className="grid grid-cols-3 gap-4">
                          <div className="h-24 bg-slate-300 dark:bg-slate-800 rounded-lg"></div>
                          <div className="h-24 bg-slate-300 dark:bg-slate-800 rounded-lg"></div>
                          <div className="h-24 bg-slate-300 dark:bg-slate-800 rounded-lg"></div>
                       </div>
                       <div className="h-48 bg-slate-300 dark:bg-slate-800 rounded-lg"></div>
                     </div>
                   </div>
                </div>

                {/* Big Play Button */}
                <button className="relative z-10 w-20 h-14 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-400 dark:hover:bg-emerald-500 hover:scale-105 transition-all rounded-xl flex items-center justify-center shadow-2xl shadow-emerald-500/50">
                  <Play className="w-8 h-8 fill-white dark:fill-slate-900 text-white dark:text-slate-900 ml-1" />
                </button>
              </div>

              {/* Bottom Control Bar */}
              <div className="h-12 bg-slate-100 dark:bg-[#060b13] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <Maximize className="w-4 h-4 text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white" />
                  <div className="flex items-center gap-1.5 cursor-pointer">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-cairo">جودة فائقة الوضوح 1080p</span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="flex-1 mx-4 sm:mx-8 relative flex items-center group cursor-pointer" dir="ltr">
                  <div className="w-full h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 dark:bg-emerald-400 w-[45%]"></div>
                  </div>
                  <div className="w-3 h-3 bg-white border border-slate-300 dark:border-transparent rounded-full absolute left-[45%] -translate-x-1/2 shadow-md transition-transform scale-100 sm:scale-0 sm:group-hover:scale-100"></div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400" dir="ltr">01:15 / 02:45</div>
                  <Volume2 className="w-4 h-4 text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- Comparison Section --- */}
      <section id="why" className="py-24 bg-white dark:bg-[#070b14] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight font-cairo">
              الدفاتر الورقية العتيقة أم منظومة وثّق الذكية؟
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              تعرف كيف يحول "وثّق" أكبر معضلة تواجه تجار التجزئة والتوريدات إلى عملية مالية رقمية شفافة وخالية من النزاعات.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
            
            {/* Smart Way Card (Watheq) */}
            <div className="bg-emerald-50/50 dark:bg-[#0a111a] border border-emerald-200 dark:border-emerald-900/50 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-emerald-500/5 transition-all hover:border-emerald-400/50 group">
              <div className="absolute top-0 right-0 w-full h-1 bg-emerald-500"></div>
              <div className="absolute -left-32 -bottom-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1">حلول منظومة "وثّق" المؤتمتة</h3>
                    <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-bold">حماية الحقوق وتسريع التحصيل بضغطة زر</p>
                  </div>
                </div>
                <div className="hidden sm:flex px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20">
                  الحل المعتمد
                </div>
              </div>

              <ul className="space-y-6 relative z-10">
                {[
                  {
                    title: 'سجل رقمي محمي ومزامن:',
                    desc: 'نسخ احتياطي تلقائي لا يضيع، مع إمكانية الوصول من أي هاتف أو حاسوب.'
                  },
                  {
                    title: 'إقرار الزبون التفاعلي عبر الواتساب:',
                    desc: 'رسالة توثيق فورية مع زر تأكيد يقطع دابر أي نزاع محاسبي لاحق.'
                  },
                  {
                    title: 'تذكيرات آلية مؤدبة ومجدولة:',
                    desc: 'النظام يرسل تذكيرات تلقائية بمواعيد الاستحقاق دون أي إحراج للتاجر.'
                  },
                  {
                    title: 'كفاءة 100% بدون إنترنت (Offline-First):',
                    desc: 'واصل البيع والتسجيل في متجرك بكل سلاسة حتى مع انقطاع الشبكة.'
                  }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div>
                      <span className="text-slate-900 dark:text-white font-bold ml-1">{item.title}</span>
                      <span className="text-slate-600 dark:text-slate-400 text-sm">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bad Way Card (Traditional) */}
            <div className="bg-rose-50/50 dark:bg-[#110e13] border border-rose-200 dark:border-rose-900/30 rounded-3xl p-8 relative overflow-hidden transition-all hover:border-rose-500/30">
              <div className="absolute top-0 right-0 w-full h-1 bg-rose-500/50"></div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-500">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1">الطريقة التقليدية (فوضى الدفاتر)</h3>
                  <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-bold">خسائر مالية ونزاعات مستمرة مع العملاء</p>
                </div>
              </div>

              <ul className="space-y-6">
                {[
                  {
                    title: 'تلف وضياع السجلات:',
                    desc: 'تلف الأوراق أو نسيانها أثناء حركة البيع يضيع آلاف الريالات سنوياً.'
                  },
                  {
                    title: 'إنكار المديونية وخلافات الحساب:',
                    desc: 'صعوبة إثبات تفاصيل كل قيد عند المطالبة بالسداد لغياب الدليل المتبادل.'
                  },
                  {
                    title: 'حرج وإحراج التحصيل:',
                    desc: 'اتصالات يدوية مزعجة تسبب توتراً في علاقة التاجر بزبائنه الدائمين.'
                  },
                  {
                    title: 'الشلل عند انقطاع الإنترنت:',
                    desc: 'البرامج السحابية العادية تتوقف كلياً عن العمل إذا انقطعت الشبكة.'
                  }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-rose-200 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
                      <X className="w-3 h-3 text-rose-600 dark:text-rose-500" strokeWidth={3} />
                    </div>
                    <div>
                      <span className="text-slate-900 dark:text-rose-100 font-bold ml-1">{item.title}</span>
                      <span className="text-slate-600 dark:text-slate-400 text-sm">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* --- Features Grid Section --- */}
      <section id="features" className="py-24 relative overflow-hidden bg-white dark:bg-[#0b121c] border-y border-slate-200 dark:border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight font-cairo">
              كل ما يحتاجه متجرك لإحكام دورة الديون
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
              صُممت خصائص "وثّق" المبتكرة بعناية فائقة لتتطابق مع واقع وتحديات الأسواق المحلية والمتاجر السريعة.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: MessageCircle,
                iconColor: 'text-emerald-500 dark:text-emerald-400',
                iconBg: 'bg-emerald-50 dark:bg-emerald-400/10 border-emerald-100 dark:border-emerald-400/20',
                title: 'توثيق واتساب التفاعلي الذكي',
                desc: 'تأكيد الديون فورياً بدون إجبار الزبون على تحميل أي تطبيق! يستلم العميل إشعاراً به تفاصيل السند مع أزرار الإقرار المباشر.',
                link: 'تأكيد بنقرة واحدة',
                linkColor: 'text-emerald-600 dark:text-emerald-400'
              },
              {
                icon: WifiOff,
                iconColor: 'text-teal-500 dark:text-teal-400',
                iconBg: 'bg-teal-50 dark:bg-teal-400/10 border-teal-100 dark:border-teal-400/20',
                title: 'معمارية أوفلاين حقيقية (Offline-First)',
                desc: 'اعمل في المستودع أو السوق بدون إنترنت عبر قاعدة بيانات محلية (SQLite3) تتزامن تلقائياً وتضع رسائل الواتساب في قائمة الانتظار فور استعادة الاتصال.',
                link: 'استمرارية عمل 100%',
                linkColor: 'text-teal-600 dark:text-teal-400'
              },
              {
                icon: Clock,
                iconColor: 'text-cyan-500 dark:text-cyan-400',
                iconBg: 'bg-cyan-50 dark:bg-cyan-400/10 border-cyan-100 dark:border-cyan-400/20',
                title: 'أتمتة التذكيرات ومواعيد السداد',
                desc: 'جدولة رسائل تذكير مهذبة واحترافية تُرسل تلقائياً قبل حلول الأجل بيومين، ويوم الاستحقاق، وبعده بدون أن تضطر للاتصال بالعميل بنفسك.',
                link: 'تسريع دورة التحصيل 3x',
                linkColor: 'text-cyan-600 dark:text-cyan-400'
              },
              {
                icon: FileText,
                iconColor: 'text-indigo-500 dark:text-indigo-400',
                iconBg: 'bg-indigo-50 dark:bg-indigo-400/10 border-indigo-100 dark:border-indigo-400/20',
                title: 'كشوف حساب وفواتير PDF رسمية',
                desc: 'توليد كشوف حساب مالي مفصلة ومختومة بشعار متجرك مع رمز QR للتحقق المباشر من صحة الفاتورة ومشاركتها بلمسة زر عبر واتساب.',
                link: 'كشوفات جاهزة للطباعة',
                linkColor: 'text-indigo-600 dark:text-indigo-400'
              },
              {
                icon: BarChart,
                iconColor: 'text-amber-500 dark:text-amber-400',
                iconBg: 'bg-amber-50 dark:bg-amber-400/10 border-amber-100 dark:border-amber-400/20',
                title: 'تحليلات مالية وتدفقات نقدية دقيقة',
                desc: 'لوحة قيادة تفاعلية توضح إجمالي الديون المستحقة، معدلات التحصيل، العملاء الأكثر التزاماً بالسداد، والتنبيه التلقائي للمدفوعات المتأخرة.',
                link: 'رؤية مالية واضحة',
                linkColor: 'text-amber-600 dark:text-amber-400'
              },
              {
                icon: Smartphone,
                iconColor: 'text-emerald-500 dark:text-emerald-400',
                iconBg: 'bg-emerald-50 dark:bg-emerald-400/10 border-emerald-100 dark:border-emerald-400/20',
                title: 'تطبيق متجاوب ومتكامل لكافة الأجهزة',
                desc: 'استمتع بنفس تجربة الاستخدام السلسة والفاخرة سواء عبر متصفح جهاز الكمبيوتر المكتبي أو من خلال تطبيق الجوال السريع (PWA) على iOS و Android.',
                link: 'تزامن فوري بين الأجهزة',
                linkColor: 'text-emerald-600 dark:text-emerald-400'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-slate-50 dark:bg-[#0f1724] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-8 hover:border-slate-300 dark:hover:border-slate-600 transition-all group flex flex-col justify-between">
                <div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mb-8 ${feature.iconBg}`}>
                    <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-4">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm font-medium mb-8">{feature.desc}</p>
                </div>
                <div className="flex justify-end">
                  <a href="#features" className={`inline-flex items-center gap-1.5 text-xs font-bold ${feature.linkColor} hover:opacity-80 transition-opacity`}>
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {feature.link}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- How it works --- */}
      <section className="py-24 bg-white dark:bg-[#070b14] border-y border-slate-200 dark:border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight font-cairo">
              كيف يعمل نظام "وثّق" في 3 خطوات بسيطة؟
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
              لا يحتاج النظام لأي أجهزة مخصصة أو تدريب معقد؛ دقيقة واحدة تكفي للبدء بتوثيق أول دين.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="bg-slate-50 dark:bg-[#0f1724] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-8 text-center shadow-sm flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-400/10 border border-teal-100 dark:border-teal-400/20 flex items-center justify-center text-xl font-black text-teal-600 dark:text-teal-400 mb-8 font-mono">
                  01
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-4">سجّل عملية الدين</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
                  أدخل اسم العميل، المبلغ، والأصناف المباعة سواء بالكتابة السريعة أو عبر الإملاء الصوتي الذكي في 5 ثوانٍ فقط (حتى بدون إنترنت).
                </p>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-auto">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400">
                  <Mic className="w-4 h-4" />
                  يدعم الإدخال الصوتي السريع
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 dark:bg-[#0f1724] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-8 text-center shadow-sm flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-400/10 border border-teal-100 dark:border-teal-400/20 flex items-center justify-center text-xl font-black text-teal-600 dark:text-teal-400 mb-8 font-mono">
                  02
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-4">إرسال إشعار WhatsApp</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
                  يُرسل النظام رسالة تفاعلية فورية تلقائية إلى رقم واتساب العميل متضمنة تفاصيل الفاتورة وقيمتها وزر الإقرار بالمديونية.
                </p>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-auto">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400">
                  <Send className="w-4 h-4" />
                  تنبيه آلي فوري دون تدخل يدوي
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-emerald-50 dark:bg-[#0f1724] border-2 border-emerald-500/50 dark:border-emerald-500/50 rounded-3xl p-8 text-center shadow-lg shadow-emerald-500/10 flex flex-col justify-between relative overflow-hidden group">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-xl font-black text-emerald-600 dark:text-emerald-400 mb-8 font-mono shadow-inner shadow-emerald-500/20">
                  03
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-4">التأكيد وتحديث الحالة</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
                  بمجرد نقر العميل على "تأكيد الدين"، تتحول حالة الفاتورة في لوحة تحكمك إلى "موثق رسمياً" مع حفظ البصمة الرقمية كمرجع قاطع.
                </p>
              </div>
              <div className="border-t border-emerald-200 dark:border-emerald-900/50 pt-6 mt-auto relative z-10">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCheck className="w-4 h-4" />
                  توثيق رقمي وحساب مبرأ
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- Pricing --- */}
      <section id="pricing" className="py-24 relative bg-slate-50 dark:bg-[#0b121c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight font-cairo">
              استثمر في حماية أموالك وسرعة تحصيلها
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
              اختر الخطة المناسبة لحجم أعمالك. كافة الخطط تشمل فترة تجريبية مجانية لمدة 14 يوماً بدون بطاقة ائتمانية.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-center">
            
            {/* Starter (Right Card in Arabic RTL -> order-1 or default if grid is RTL) */}
            <div className="bg-white dark:bg-[#0f1724] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-8 order-3 lg:order-3 relative">
              <div className="flex justify-start mb-6">
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-full">للمحلات الصغيرة</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">باقة المتاجر الناشئة</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-6">الحل الأساسي لأصحاب البقالات والمتاجر الفردية لتوثيق الديون.</p>
              
              <div className="flex items-baseline justify-start gap-2 mb-8">
                <span className="text-5xl font-black text-slate-900 dark:text-white">49</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">ر.س / شهرياً</span>
              </div>
              
              <ul className="space-y-4 mb-8 text-sm font-medium text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> حتى 200 عميل نشط</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> أتمتة إشعارات الواتساب الأساسية</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> دعم كامل للعمل بدون إنترنت (Offline)</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> إصدار سندات القبض الإلكترونية</li>
                <li className="flex items-center gap-3 text-slate-400 dark:text-slate-600"><X className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" /> تصدير كشوف الحساب PDF مخصصة</li>
              </ul>
              <button 
                onClick={() => navigate(PATHS.REGISTER)}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold transition-colors"
              >
                اختر باقة المتاجر الناشئة
              </button>
            </div>

            {/* Pro - Highlighted (Middle Card) */}
            <div className="bg-white dark:bg-[#0f1724] border-2 border-emerald-500 rounded-3xl p-8 order-2 lg:order-2 relative shadow-2xl shadow-emerald-500/10 scale-100 lg:scale-105 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-900 text-xs font-black px-4 py-1.5 rounded-full flex items-center gap-1.5 whitespace-nowrap shadow-lg shadow-emerald-500/20">
                الخيار الأكثر طلباً والتجربة الكاملة
                <Star className="w-3.5 h-3.5 fill-slate-900" />
              </div>
              
              <div className="flex justify-start mb-6 mt-2">
                <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">موصى به</span>
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">باقة التاجر المحترف</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-6">الحل المتكامل لتجار التجزئة والتوريدات لتأمين التحصيل بالكامل.</p>
              
              <div className="flex items-baseline justify-start gap-2 mb-8">
                <span className="text-6xl font-black text-emerald-600 dark:text-emerald-400">99</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">ر.س / شهرياً</span>
              </div>
              
              <ul className="space-y-4 mb-8 text-sm font-medium text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> عدد عملاء وديون غير محدود</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> ربط بوت الواتساب التفاعلي مع زر الإقرار</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> ميزة الإدخال والتسجيل الصوتي الذكي</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> تصدير كشوف حساب PDF مفصلة ومختومة</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> جدولة تذكيرات السداد الآلية</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> دعم فني ذو أولوية على مدار الساعة</li>
              </ul>
              
              <button 
                onClick={() => navigate(PATHS.REGISTER)}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black transition-all hover:shadow-lg hover:shadow-emerald-500/25"
              >
                ابدأ تجربة باقة المحترف مجاناً (14 يوم)
              </button>
            </div>

            {/* Enterprise (Left Card) */}
            <div className="bg-white dark:bg-[#0f1724] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-8 order-1 lg:order-1 relative">
              <div className="flex justify-start mb-6">
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-full">الفروع المتعددة</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">باقة الشركات والموزعين</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-6">للشركات ومستودعات الجملة التي تدير شبكة مندوبي مبيعات.</p>
              
              <div className="flex items-baseline justify-start gap-2 mb-8">
                <span className="text-5xl font-black text-slate-900 dark:text-white">199</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">ر.س / شهرياً</span>
              </div>
              
              <ul className="space-y-4 mb-8 text-sm font-medium text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> كافة ميزات باقة المحترف بالكامل</li>
                <li className="flex items-center gap-3 font-bold text-slate-900 dark:text-white"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> دعم الفروع المتعددة والمستودعات</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> إدارة صلاحيات المحاسبين والمحصلين</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> سجل تدقيق كامل للحركات (Audit Log)</li>
                <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> تكامل برمجي (API) مع الأنظمة المحاسبية</li>
              </ul>
              
              <button 
                onClick={() => navigate(PATHS.CONTACT)}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold transition-colors"
              >
                تواصل لتفعيل باقة الشركات
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section id="faq" className="py-24 bg-white dark:bg-[#0b121c] border-t border-slate-200 dark:border-[#1e293b]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 font-cairo">
              الأسئلة الشائعة حول منظومة وثّق
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
              إليك أبرز الاستفسارات التي يطرحها التجار قبل الاعتماد على المنظومة في أعمالهم اليومية.
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                  openFaq === index 
                    ? 'border-emerald-500 bg-white dark:border-slate-600 dark:bg-[#121c2b] shadow-lg shadow-emerald-500/5' 
                    : 'border-slate-200 bg-slate-50 dark:border-[#1e293b] dark:bg-[#0f1724] hover:border-slate-300 hover:bg-white dark:hover:border-slate-700 dark:hover:bg-[#121c2b]'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-6 text-right flex items-center justify-between focus:outline-none group"
                >
                  <div className="flex items-center gap-6">
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-emerald-500 dark:text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 dark:group-hover:text-slate-300'}`} />
                    <span className={`text-lg sm:text-xl font-bold leading-relaxed transition-colors ${openFaq === index ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-white group-hover:text-slate-900'}`}>{faq.question}</span>
                  </div>
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-mono ml-2 ${faq.badgeColor}`}>
                    {faq.num}
                  </div>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaq === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="border-t border-slate-100 dark:border-slate-700/50 mx-6 pt-5 pb-6">
                    <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base font-medium leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-slate-50 dark:bg-[#0b121c] border-t border-slate-200 dark:border-[#1e293b] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 mb-16">
            
            {/* Column 1: Logo & Info */}
            <div className="md:col-span-1 flex flex-col justify-start text-right">
              <div className="flex items-center justify-start mb-6 cursor-pointer" onClick={() => navigate(PATHS.HOME)}>
                <Logo size="lg" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8 text-right">
                المنظومة السحابية الأولى لإدارة وتوثيق ديون المتاجر والشركات مع الإقرار المتبادل عبر الواتساب ودعم وضع العمل بدون اتصال بالإنترنت.
              </p>
              <div className="flex gap-3 justify-start">
                {/* Social icons placeholders */}
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#121c2b] border border-slate-200 dark:border-[#1e293b] hover:border-emerald-500 dark:hover:border-slate-600 transition-colors cursor-pointer flex items-center justify-center text-slate-400">
                  <X className="w-4 h-4" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#121c2b] border border-slate-200 dark:border-[#1e293b] hover:border-emerald-500 dark:hover:border-slate-600 transition-colors cursor-pointer flex items-center justify-center text-slate-400">
                  <span className="font-bold font-serif">f</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#121c2b] border border-slate-200 dark:border-[#1e293b] hover:border-emerald-500 dark:hover:border-slate-600 transition-colors cursor-pointer flex items-center justify-center text-slate-400">
                  <span className="font-bold text-xs">in</span>
                </div>
              </div>
            </div>

            {/* Column 2: المنتج */}
            <div className="text-right">
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">المنتج</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#features" className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors">المميزات الرئيسية</a></li>
                <li><a href="#how" className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors">آلية العمل التفاعلية</a></li>
                <li><a href="#pricing" className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors">الأسعار والباقات</a></li>
                <li><a href="#features" className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors">تطبيق الجوال (PWA)</a></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors">تحديثات النظام</a></li>
              </ul>
            </div>

            {/* Column 3: الأمان والمطابقة */}
            <div className="text-right">
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">الأمان والمطابقة</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors">حماية وتشفير البيانات</a></li>
                <li><span onClick={() => navigate(PATHS.TERMS)} className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors cursor-pointer">شروط الخدمة والاستخدام</span></li>
                <li><span onClick={() => navigate(PATHS.PRIVACY_POLICY)} className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors cursor-pointer">سياسة الخصوصية</span></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors">الإقرار القانوني المالي</a></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors">شهادات الامتثال</a></li>
              </ul>
            </div>

            {/* Column 4: الدعم الفني */}
            <div className="text-right">
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">الدعم الفني</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#faq" className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors">مركز المساعدة والأسئلة</a></li>
                <li><span onClick={() => navigate(PATHS.CONTACT)} className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors cursor-pointer">الدعم عبر الواتساب</span></li>
                <li><span onClick={() => navigate(PATHS.CONTACT)} className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors cursor-pointer">البريد الإلكتروني المباشر</span></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors">حالة الخوادم والشبكة</a></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-[#1e293b] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center md:text-right order-2 md:order-1">
              © 2026 منظومة وثّق (Watheq System). جميع الحقوق محفوظة لرواد الأعمال والمتاجر المعتمدة.
            </p>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 order-1 md:order-2">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">اتصال مشفر وآمن بمعايير SSL 256-bit</span>
              <Lock className="w-4 h-4" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
