import { useState } from 'react';
import type { FormEvent, FC } from 'react';
import {
  User,
  Store,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { Logo } from './Logo';

interface RegisterScreenProps {
  onGoToSplash?: () => void;
}

export const RegisterScreen: FC<RegisterScreenProps> = ({ onGoToSplash }) => {
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      alert('يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 4000);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-slate-800 font-cairo antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Header / Navbar */}
      <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between">
          {/* Logo Right in RTL */}
          <div className="flex items-center gap-3">
            <Logo variant="dark" size="md" />
          </div>

          {/* Center / Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a
              href="#home"
              className="hover:text-emerald-600 transition-colors duration-200"
            >
              الرئيسية
            </a>
            <a
              href="#about"
              className="hover:text-emerald-600 transition-colors duration-200"
            >
              حول النظام
            </a>
            <a
              href="#help"
              className="hover:text-emerald-600 transition-colors duration-200"
            >
              المساعدة
            </a>
          </nav>

          {/* Login Button */}
          <div className="flex items-center gap-3">
            {onGoToSplash && (
              <button
                type="button"
                onClick={onGoToSplash}
                className="hidden sm:inline-flex text-xs text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                title="عرض شاشة البداية"
              >
                شاشة البداية ↺
              </button>
            )}
            <button
              type="button"
              className="bg-[#0c2444] hover:bg-[#123663] text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 active:scale-95"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Hero & Form Section */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-14">
        {isSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-sm animate-fade-in">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium text-sm">
              تم تسجيل الحساب بنجاح! جاري تحويلك إلى لوحة التحكم...
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Column (In visual layout): Registration Form Card */}
          <div className="lg:col-span-6 w-full max-w-xl mx-auto lg:mx-0">
            <div className="bg-white rounded-2xl p-6 sm:p-9 shadow-xl shadow-slate-200/70 border border-slate-100">
              {/* Form Heading */}
              <div className="text-right mb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0c2444] font-tajawal tracking-tight">
                  إنشاء حساب جديد
                </h2>
                <p className="text-sm text-slate-500 mt-1.5 font-normal">
                  ابدأ إدارة ديون متجرك بكل ثقة وأمان
                </p>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 2-Columns: Full Name & Store Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Store / Merchant Name */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700">
                      اسم المتجر / التاجر
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                        <Store className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="اسم النشاط التجاري"
                        className="w-full pr-10 pl-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right"
                      />
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700">
                      الاسم الكامل
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="أدخل اسمك الثلاثي"
                        className="w-full pr-10 pl-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700">
                    رقم الجوال
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      dir="rtl"
                      className="w-full pr-10 pl-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right font-sans"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700">
                    كلمة المرور
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pr-10 pl-11 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="flex items-center gap-2 pt-1 text-right justify-start select-none">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <label
                    htmlFor="terms"
                    className="text-xs sm:text-sm text-slate-600 cursor-pointer"
                  >
                    أوافق على{' '}
                    <a
                      href="#terms"
                      className="text-slate-800 font-semibold underline hover:text-emerald-700"
                    >
                      شروط الاستخدام
                    </a>{' '}
                    و{' '}
                    <a
                      href="#privacy"
                      className="text-slate-800 font-semibold underline hover:text-emerald-700"
                    >
                      سياسة الخصوصية
                    </a>
                  </label>
                </div>

                {/* Submit CTA Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#007a3d] hover:bg-[#006633] text-white py-3 px-6 rounded-lg font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-800/15 hover:shadow-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-75 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                        جاري الإنشاء...
                      </span>
                    ) : (
                      <>
                        <ArrowLeft className="w-5 h-5" />
                        <span>إنشاء حساب جديد</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sign In Redirect */}
                <div className="text-center pt-3 text-xs sm:text-sm text-slate-500">
                  <span>لديك حساب بالفعل؟ </span>
                  <a
                    href="#login"
                    className="text-[#0c2444] font-bold hover:underline hover:text-emerald-700 transition-colors"
                  >
                    تسجيل الدخول
                  </a>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Hero Content & Value Props */}
          <div className="lg:col-span-6 space-y-6 text-right">
            {/* Title & Description */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0c2444] font-tajawal tracking-tight leading-tight">
                بناء الثقة يبدأ من{' '}
                <span className="text-[#008744]">هنا</span>
              </h1>
              <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
                انضم إلى آلاف المتاجر التي تعتمد على وثّق في إدارة وتوثيق العمليات المالية بكل شفافية وموثوقية.
              </p>
            </div>

            {/* Feature Card 1: أمان تام */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-start gap-4 transition-all duration-200 hover:shadow-md hover:border-slate-200">
              <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-[#0c2444] text-base">
                  أمان تام
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  تشفير متطور لجميع بياناتك وديونك مع حماية كاملة للخصوصية.
                </p>
              </div>
            </div>

            {/* Feature Card 2: إدارة سريعة */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-start gap-4 transition-all duration-200 hover:shadow-md hover:border-slate-200">
              <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-[#0c2444] text-base">
                  إدارة سريعة
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  واجهة مستخدم ذكية تسهل عليك إضافة ومتابعة الديون في ثوانٍ معدودة.
                </p>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-100 group">
              <img
                src="/hero-business.jpg"
                alt="فريق عمل وثّق"
                className="w-full h-48 sm:h-56 object-cover object-center transform transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="w-full bg-white border-t border-slate-100 py-6 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          {/* Logo on Left/Start in RTL */}
          <div className="flex items-center gap-2">
            <Logo variant="dark" size="sm" />
          </div>

          {/* Copyright in Center */}
          <div className="text-center font-normal">
            © 2024 وثّق - تطبيق إدارة الديون والتوثيق. جميع الحقوق محفوظة.
          </div>

          {/* Footer Links */}
          <div className="flex items-center gap-4 text-xs">
            <a href="#contact" className="hover:text-slate-800 transition">
              اتصل بنا
            </a>
            <span className="text-slate-300">|</span>
            <a href="#terms" className="hover:text-slate-800 transition">
              شروط الاستخدام
            </a>
            <span className="text-slate-300">|</span>
            <a href="#privacy" className="hover:text-slate-800 transition">
              سياسة الخصوصية
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
