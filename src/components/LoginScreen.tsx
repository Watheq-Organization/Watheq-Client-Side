import React, { useState } from 'react';
import { Header, ScreenType } from './Header';
import { Footer } from './Footer';
import { Mail, Lock, Eye, EyeOff, Shield, Zap, ArrowLeft, CheckCircle2 } from 'lucide-react';
import wathiqLogoIcon from '../assets/wathiq_logo_icon.jpg';

interface LoginScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Header currentScreen="login" onNavigate={onNavigate} brandText="ar" />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 lg:py-12 flex items-center justify-center">
        
        {/* Two-Column Split Card Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* LEFT COLUMN: Login Form Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div>
              {/* Form Title & Subtitle */}
              <h2 className="text-2xl font-bold text-slate-900 font-alexandria mb-1">
                تسجيل الدخول
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium">
                مرحباً بك مجدداً! أدخل بياناتك للوصول إلى لوحة التحكم
              </p>

              {/* Success Notification Alert */}
              {isSubmitted && (
                <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>تم تسجيل الدخول بنجاح! جاري تحويلك...</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Input 1: Email or Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    البريد الإلكتروني أو رقم الجوال <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="example@domain.com"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all pl-10"
                    />
                    <div className="absolute left-3 text-slate-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Input 2: Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    كلمة المرور <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all pr-10 pl-10"
                    />
                    <div className="absolute right-3 text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Options Row: Forgot password & Remember me */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => alert('سيتم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني')}
                    className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                  >
                    نسيت كلمة السر؟
                  </button>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                    <span>تذكرني على هذا الجهاز</span>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  className="w-full mt-2 bg-[#15803D] hover:bg-[#166534] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-99 flex items-center justify-center gap-2 cursor-pointer font-alexandria"
                >
                  <span>تسجيل الدخول</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </form>

              {/* Social Login Divider */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-3 text-xs text-slate-400 font-medium">
                  أو الدخول السريع عبر
                </span>
              </div>

              {/* Social Login Buttons: Apple & Google */}
              <div className="grid grid-cols-2 gap-3">
                {/* Apple Button */}
                <button
                  type="button"
                  onClick={() => alert('تسجيل الدخول باستخدام Apple')}
                  className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.61.71-1.14 1.86-1 2.97 1.08.08 2.16-.57 2.81-1.37z"/>
                  </svg>
                  <span>Apple</span>
                </button>

                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => alert('تسجيل الدخول باستخدام Google')}
                  className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.13C3.26 21.3 7.31 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.63H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.37l3.99-3.13z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.63l3.99 3.13c.95-2.85 3.6-4.96 6.72-4.96z"/>
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            </div>

            {/* Bottom Link to Signup */}
            <div className="mt-8 pt-4 text-center border-t border-slate-100 text-xs">
              <span className="text-slate-500">ليس لديك حساب؟ </span>
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="text-emerald-600 font-bold hover:underline transition-colors ml-1 cursor-pointer"
              >
                إنشاء حساب جديد
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Info & Feature Display Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm border border-slate-200/80 flex flex-col items-center justify-between text-center">
            
            {/* Top Official Logo Emblem */}
            <div className="my-auto pt-4 flex flex-col items-center">
              <div className="mb-6 w-32 h-32 rounded-3xl overflow-hidden shadow-lg border border-slate-100 p-0.5 bg-white">
                <img
                  src={wathiqLogoIcon}
                  alt="Watheq Logo Emblem"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>

              {/* Title & Description */}
              <h3 className="text-2xl font-bold text-slate-900 font-alexandria mb-3">
                نظام إدارة الديون الذكي
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mb-8">
                وثق يوفر لك منصة آمنة وموثوقة لتوثيق ومتابعة التعهدات والعمليات المالية بكل سهولة وبساطة، مصمم لآلاف التجار والمؤسسات.
              </p>
            </div>

            {/* Bottom Two Feature Highlight Cards */}
            <div className="w-full grid grid-cols-2 gap-4 mt-auto pt-6 border-t border-slate-100">
              
              {/* Feature 1: High Security */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 flex flex-col items-center justify-center transition-all hover:bg-emerald-50/50 hover:border-emerald-200">
                <Shield className="w-6 h-6 text-emerald-600 mb-2" />
                <span className="text-xs font-bold text-slate-900 font-alexandria">أمان عالي</span>
              </div>

              {/* Feature 2: Speed of Execution */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 flex flex-col items-center justify-center transition-all hover:bg-emerald-50/50 hover:border-emerald-200">
                <Zap className="w-6 h-6 text-emerald-600 mb-2" />
                <span className="text-xs font-bold text-slate-900 font-alexandria">سرعة التنفيذ</span>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* Bottom Footer Bar */}
      <Footer brandName="Watheq" onNavigate={onNavigate} />
    </div>
  );
};
