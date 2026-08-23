import { useState } from 'react';
import type { FormEvent, ChangeEvent, FC } from 'react';
import {
  User,
  Store,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { registerUser } from '../services/authService';
import { PATHS } from '../routes/paths';
import type { RegisterFormData } from '../types/auth';

export const RegisterScreen: FC = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    fullName: '',
    storeName: '',
    phone: '',
    email: '',
    password: '',
    agreeTerms: false,
    showPassword: false,
    isSubmitting: false,
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formState.agreeTerms) {
      setErrorMessage('يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة.');
      return;
    }

    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    const formData: RegisterFormData = {
      storeName: formState.storeName,
      fullName: formState.fullName,
      phone: formState.phone,
      email: formState.email,
      password: formState.password,
    };

    const result = await registerUser(formData);
    setFormState((prev) => ({ ...prev, isSubmitting: false }));

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => navigate(PATHS.VERIFY_OTP, { state: { email: formState.email } }), 1500);
    } else {
      setErrorMessage(result.message);
    }
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
            {/* {onGoToSplash && (
              // <button
              //   type="button"
              //   onClick={onGoToSplash}
              //   className="hidden sm:inline-flex text-xs text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              //   title="عرض شاشة البداية"
              // >
              //   شاشة البداية ↺
              // </button>
            )} */}
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
              تم تسجيل الحساب بنجاح! جاري تحويلك لصفحة التحقق من البريد...
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 shadow-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="font-medium text-sm">{errorMessage}</span>
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
                        name="storeName"
                        required
                        value={formState.storeName}
                        onChange={handleChange}
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
                        name="fullName"
                        required
                        value={formState.fullName}
                        onChange={handleChange}
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
                      name="phone"
                      required
                      value={formState.phone}
                      onChange={handleChange}
                      placeholder="05xxxxxxxx"
                      dir="rtl"
                      className="w-full pr-10 pl-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right font-sans"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700">
                    البريد الالكتروني
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formState.email}
                      onChange={handleChange}
                      placeholder="user@gmail.com"
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
                      type={formState.showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formState.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pr-10 pl-11 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right font-sans"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          showPassword: !prev.showPassword,
                        }))
                      }
                      className="absolute left-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {formState.showPassword ? (
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
                    name="agreeTerms"
                    checked={formState.agreeTerms}
                    onChange={handleChange}
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
                    disabled={formState.isSubmitting}
                    className="w-full bg-[#007a3d] hover:bg-[#006633] text-white py-3 px-6 rounded-lg font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-800/15 hover:shadow-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-75 cursor-pointer"
                  >
                    {formState.isSubmitting ? (
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
