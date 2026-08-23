import { useState } from 'react';
import type { FormEvent, FC } from 'react';
import { Phone, ShieldCheck, Zap, Lock, ArrowLeft, AlertCircle, Apple } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { IconInput, ICON_INPUT_FONT_SANS_CLASSNAME } from '../components/ui/IconInput';
import { PasswordInput } from '../components/ui/PasswordInput';
import { LoadingButton } from '../components/ui/LoadingButton';
import { SocialAuthButton } from '../components/auth/SocialAuthButton';
import { GoogleIcon } from '../components/icons/GoogleIcon';
import { Logo } from '../components/Logo';
import { loginUser } from '../services/authService';
import { PATHS } from '../routes/paths';
import type { LoginFormData } from '../types/auth';

export const LoginPage: FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginFormData>({
    phone: '',
    password: '',
    rememberMe: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoNotice(null);

    setIsSubmitting(true);
    const result = await loginUser(formData);
    setIsSubmitting(false);

    // Login API isn't available yet (see services/authService.ts) — surface
    // that clearly instead of pretending the request succeeded.
    setErrorMessage(result.message);
  };

  const handleForgotPassword = () => {
    // No forgot-password flow (page or backend) exists anywhere in this
    // project. Per project instructions, we don't invent one — just
    // report that it needs to be built.
    setInfoNotice('ميزة استعادة كلمة المرور تتطلب صفحة وواجهة خلفية غير متوفرة حالياً.');
  };

  const handleSocialAuth = (provider: 'Google' | 'Apple') => {
    // No OAuth integration exists in this project for either provider.
    // Per project instructions, we don't fabricate credentials or
    // endpoints — just report that it's not connected yet.
    setInfoNotice(`تسجيل الدخول عبر ${provider} غير متاح حالياً — يتطلب إعداد OAuth من الخادم.`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-slate-800 font-cairo antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-14">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 shadow-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="font-medium text-sm">{errorMessage}</span>
          </div>
        )}

        {infoNotice && (
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-3 shadow-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 text-slate-500 flex-shrink-0" />
            <span className="font-medium text-sm">{infoNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Column (In visual layout): Login Card */}
          <div className="lg:col-span-6 w-full max-w-xl mx-auto lg:mx-0">
            <div className="bg-white rounded-2xl p-6 sm:p-9 shadow-xl shadow-slate-200/70 border border-slate-100">
              {/* Form Heading */}
              <div className="text-right mb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0c2444] font-tajawal tracking-tight">
                  تسجيل الدخول
                </h2>
                <p className="text-sm text-slate-500 mt-1.5 font-normal">
                  مرحباً بك مجدداً، أدخل بياناتك للوصول إلى لوحة التحكم
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <IconInput
                  label="رقم الجوال"
                  icon={<Phone className="w-4 h-4" />}
                  type="tel"
                  required
                  dir="rtl"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="أدخل رقمك"
                  className={ICON_INPUT_FONT_SANS_CLASSNAME}
                />

                <PasswordInput
                  label="كلمة المرور"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  labelExtra={
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs sm:text-sm text-emerald-700 font-semibold hover:underline"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  }
                />

                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-2 pt-1 text-right justify-start select-none">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, rememberMe: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <label htmlFor="rememberMe" className="text-xs sm:text-sm text-slate-600 cursor-pointer">
                    تذكرني على هذا الجهاز
                  </label>
                </div>

                {/* Submit CTA Button */}
                <div className="pt-2">
                  <LoadingButton isLoading={isSubmitting} loadingLabel="جاري تسجيل الدخول...">
                    <ArrowLeft className="w-5 h-5" />
                    <span>تسجيل الدخول</span>
                  </LoadingButton>
                </div>

                {/* Social Login Divider */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 whitespace-nowrap">أو سجل الدخول عبر</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Social Auth Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <SocialAuthButton
                    label="Google"
                    icon={<GoogleIcon className="w-4 h-4" />}
                    onClick={() => handleSocialAuth('Google')}
                  />
                  <SocialAuthButton
                    label="Apple"
                    icon={<Apple className="w-4 h-4" />}
                    onClick={() => handleSocialAuth('Apple')}
                  />
                </div>

                {/* Sign Up Redirect */}
                <div className="text-center pt-3 text-xs sm:text-sm text-slate-500">
                  <span>ليس لديك حساب؟ </span>
                  <button
                    type="button"
                    onClick={() => navigate(PATHS.REGISTER)}
                    className="text-[#0c2444] font-bold hover:underline hover:text-emerald-700 transition-colors"
                  >
                    إنشاء حساب جديد
                  </button>
                </div>

                {/* Security Info */}
                <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-400">
                  <Lock className="w-3 h-3" />
                  <span>اتصال مشفر وآمن 256-بت</span>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Brand Section */}
          <div className="lg:col-span-6 space-y-6 text-center flex flex-col items-center">
            <Logo variant="emblem-only" size="xl" />

            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0c2444] font-tajawal tracking-tight leading-tight">
                نظام إدارة الديون الذكي
              </h1>
              <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed max-w-md mx-auto">
                وثّق يوفر لك منصة آمنة وموثوقة لتوثيق ومتابعة التحصيلات المالية بكل سهولة وكفاءة. انضم الآن لآلاف التجار والمؤسسات.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col items-center gap-2 text-center transition-all duration-200 hover:shadow-md hover:border-slate-200">
                <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-[#0c2444] text-sm sm:text-base">سرعة التنفيذ</h3>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col items-center gap-2 text-center transition-all duration-200 hover:shadow-md hover:border-slate-200">
                <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-[#0c2444] text-sm sm:text-base">أمان عالٍ</h3>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
