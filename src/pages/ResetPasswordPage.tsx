import { useState, useEffect } from 'react';
import type { FormEvent, FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, Circle, AlertCircle, ArrowLeft, Lock, Laptop } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { PasswordInput } from '../components/ui/PasswordInput';
import { LoadingButton } from '../components/ui/LoadingButton';
import { PATHS } from '../routes/paths';
import { resetPassword } from '../services/authService';

export const ResetPasswordPage: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state?.email as string | undefined) || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate(PATHS.FORGOT_PASSWORD, { replace: true });
    }
  }, [email, navigate]);

  // Live password validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]~`';]/.test(newPassword);
  const passwordsMatch = newPassword !== '' && newPassword === confirmPassword;

  const isFormValid = hasMinLength && hasUppercase && hasNumber && hasSpecialChar && passwordsMatch;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!hasMinLength) {
      setErrorMessage('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
      return;
    }
    if (!hasUppercase) {
      setErrorMessage('يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل (A-Z).');
      return;
    }
    if (!hasNumber) {
      setErrorMessage('يجب أن تحتوي كلمة المرور على رقم واحد على الأقل (0-9).');
      return;
    }
    if (!hasSpecialChar) {
      setErrorMessage('يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين.');
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword({
      email,
      newPassword,
      confirmPassword,
    });
    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate(PATHS.LOGIN);
      }, 1800);
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-slate-800 font-cairo antialiased selection:bg-[#0c2444] selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-14 flex items-center justify-center">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100 min-h-[600px]">
          
          {/* Left Side: Mockup & Security Note */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/40 p-10 flex-col justify-between relative overflow-hidden border-l border-slate-100">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#0c24440a_1px,transparent_1px)] [background-size:18px_18px] pointer-events-none" />

            {/* Top Badge */}
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 bg-emerald-100/80 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                تعيين كلمة مرور آمنة
              </span>
            </div>

            {/* Center Laptop / Isometric Graphic Mockup */}
            <div className="relative z-10 my-auto flex flex-col items-center justify-center py-4">
              <div className="relative w-64 h-48 bg-white rounded-2xl p-5 shadow-2xl shadow-slate-300/60 border border-slate-200 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-3 shadow-lg shadow-emerald-500/30 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-10 h-10 text-white" />
                </div>
                <div className="h-2 w-32 bg-slate-200 rounded-full mb-2" />
                <div className="h-2 w-20 bg-slate-100 rounded-full" />
                <div className="absolute bottom-2 right-2 text-slate-300">
                  <Laptop className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Bottom Card */}
            <div className="relative z-10 bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 shadow-md text-center">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="font-tajawal font-bold text-base text-[#0c2444]">
                  أمان بياناتك أولويتنا
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                نحن نستخدم أحدث تقنيات التشفير لضمان سرية وأمان معلوماتك المالية في جميع الأوقات.
              </p>
            </div>
          </div>

          {/* Right Side: Reset Password Form */}
          <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto">
              
              {/* Back to login */}
              <div className="mb-5 text-right">
                <button
                  type="button"
                  onClick={() => navigate(PATHS.LOGIN)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#0c2444] transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
                  <span>العودة لتسجيل الدخول</span>
                </button>
              </div>

              {/* Title & Subtitle */}
              <div className="text-right mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0c2444] font-tajawal tracking-tight mb-2">
                  تعيين كلمة مرور جديدة
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  الرجاء إدخال كلمة المرور الجديدة وتأكيدها. تأكد من اختيار كلمة مرور قوية وآمنة.
                </p>
              </div>

              {/* Status Alerts */}
              {isSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-sm animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="font-medium text-sm">
                    تم تحديث كلمة المرور بنجاح! جاري تحويلك لصفحة تسجيل الدخول...
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <PasswordInput
                  label="كلمة المرور الجديدة"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />

                <PasswordInput
                  label="تأكيد كلمة المرور"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />

                {/* Password Strength Checklist */}
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 text-right space-y-2 text-xs">
                  <p className="font-bold text-slate-700 mb-2">
                    يجب أن تحتوي كلمة المرور على:
                  </p>

                  <div className="flex items-center gap-2">
                    {hasMinLength ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                      8 أحرف على الأقل
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasUppercase ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={hasUppercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                      حرف كبير واحد على الأقل (A-Z)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasNumber ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                      رقم واحد على الأقل (0-9)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasSpecialChar ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={hasSpecialChar ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                      رمز خاص واحد (&quot;!@#$%^&amp;*&quot;)
                    </span>
                  </div>

                  {confirmPassword.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 mt-2">
                      {passwordsMatch ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      <span className={passwordsMatch ? 'text-emerald-700 font-medium' : 'text-red-500'}>
                        {passwordsMatch ? 'كلمتا المرور متطابقتان' : 'كلمتا المرور غير متطابقتين'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <LoadingButton
                    isLoading={isSubmitting}
                    disabled={!isFormValid && confirmPassword.length > 0}
                    loadingLabel="جاري التحديث..."
                    className="bg-[#0c2444] hover:bg-[#123663] shadow-md shadow-[#0c2444]/20 text-white font-bold h-12 disabled:opacity-50"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>تحديث كلمة المرور</span>
                  </LoadingButton>
                </div>
              </form>

              {/* Back to login button */}
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => navigate(PATHS.LOGIN)}
                  className="text-xs sm:text-sm text-slate-500 hover:text-[#0c2444] font-semibold hover:underline transition-colors"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
