import { useState } from 'react';
import type { FormEvent, FC } from 'react';
import { Mail, ArrowLeft, AlertCircle, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { IconInput, ICON_INPUT_FONT_SANS_CLASSNAME } from '../components/ui/IconInput';
import { LoadingButton } from '../components/ui/LoadingButton';
import { forgotPassword } from '../services/authService';
import { PATHS } from '../routes/paths';

export const ForgotPasswordPage: FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    setIsSubmitting(true);
    const result = await forgotPassword(trimmedEmail);
    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate(PATHS.VERIFY_RESET_OTP, { state: { email: trimmedEmail } });
      }, 1200);
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-slate-800 font-cairo antialiased selection:bg-[#0c2444] selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-14 flex items-center justify-center">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100 min-h-[580px]">
          
          {/* Left Side: Security Illustration & Branding */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0c2444] via-[#123663] to-[#0a1b32] p-10 flex-col justify-between relative overflow-hidden text-white">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            {/* Small Top Tag */}
            <div className="relative z-10 flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-white/10 px-3 py-1.5 rounded-full w-fit backdrop-blur-sm border border-white/10">
              <Lock className="w-3.5 h-3.5" />
              <span>استعادة كلمة المرور بأمان</span>
            </div>

            {/* Center Graphic */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto py-6">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Outer animated pulses */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-blue-500/30 blur-xl transform rotate-6 scale-95" />
                <div className="absolute inset-2 rounded-2xl bg-[#091a30]/80 border border-emerald-500/30 backdrop-blur-md shadow-2xl flex items-center justify-center">
                  <div className="relative flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/40 flex items-center justify-center">
                      <div className="w-full h-full bg-[#0c2444] rounded-[14px] flex items-center justify-center">
                        <ShieldCheck className="w-11 h-11 text-emerald-400" />
                      </div>
                    </div>
                    {/* Glowing Accent Dots */}
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-medium text-emerald-200/90">تشفير عالي الأمان 256-bit</span>
                    </div>
                  </div>
                </div>

                {/* Floating Micro Nodes */}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-md backdrop-blur-sm">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="absolute -bottom-2 -left-2 w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-md backdrop-blur-sm">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Bottom Content */}
            <div className="relative z-10 text-center space-y-2">
              <h3 className="text-xl font-bold font-tajawal text-white flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>نظام إدارة الديون الذكي</span>
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto font-normal">
                أمان بياناتك المالي أولويتنا القصوى، نستخدم أحدث تقنيات التشفير لضمان سرية معلوماتك.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 bg-black/20 px-3 py-1 rounded-lg border border-white/5">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  نظام الحماية والأمان الأكثر موثوقية
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Forgot Password Form */}
          <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto">
              
              {/* Back to Login link */}
              <div className="mb-6 text-right">
                <button
                  type="button"
                  onClick={() => navigate(PATHS.LOGIN)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#0c2444] transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
                  <span>العودة لتسجيل الدخول</span>
                </button>
              </div>

              {/* Header Title */}
              <div className="text-right mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0c2444] font-tajawal tracking-tight mb-2">
                  استعادة كلمة المرور
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  أدخل بريدك الإلكتروني المسجل لدينا لإرسال رمز التحقق وإعادة تعيين كلمة المرور.
                </p>
              </div>

              {/* Status Alerts */}
              {isSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-sm animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="font-medium text-sm">
                    تم إرسال رمز التحقق بنجاح! جاري تحويلك...
                  </span>
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 shadow-sm animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="font-medium text-sm">{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <IconInput
                  label="البريد الإلكتروني"
                  icon={<Mail className="w-4 h-4" />}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  className={ICON_INPUT_FONT_SANS_CLASSNAME}
                />

                <div className="pt-2">
                  <LoadingButton
                    isLoading={isSubmitting}
                    loadingLabel="جاري إرسال الرمز..."
                    className="bg-[#0c2444] hover:bg-[#123663] shadow-md shadow-[#0c2444]/20 text-white font-bold h-12"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>إرسال رمز التحقق</span>
                  </LoadingButton>
                </div>
              </form>

              {/* Help tip */}
              <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
                <span>تواجه صعوبة في الاستعادة؟ </span>
                <a href="#help" className="text-emerald-700 font-semibold hover:underline">
                  تواصل مع الدعم الفني
                </a>
              </div>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
