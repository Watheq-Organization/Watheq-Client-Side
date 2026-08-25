import { useState, useRef, useEffect } from 'react';
import type { FormEvent, FC, KeyboardEvent, ClipboardEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Smartphone } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { LoadingButton } from '../components/ui/LoadingButton';
import { PATHS } from '../routes/paths';
import { verifyResetOtp, forgotPassword } from '../services/authService';

export const VerifyResetOtpPage: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state?.email as string | undefined) || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  // Countdown Timer (2 minutes = 120 seconds)
  const [timeLeft, setTimeLeft] = useState(120);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    // If no email was provided, redirect back to forgot-password
    if (!email) {
      navigate(PATHS.FORGOT_PASSWORD, { replace: true });
      return;
    }
    // Auto-focus first input on load
    inputRefs[0].current?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleResend = async () => {
    if (timeLeft > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    setResendNotice(null);

    const result = await forgotPassword(email);
    setIsResending(false);

    if (result.success) {
      setTimeLeft(120);
      setResendNotice('تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني.');
      setOtp(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim().slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6) newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs[focusIndex].current?.focus();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');

    if (fullOtp.length < 6) {
      setErrorMessage('يرجى إدخال رمز التحقق بالكامل (6 أرقام).');
      return;
    }

    setErrorMessage(null);
    setResendNotice(null);
    setIsSubmitting(true);

    const result = await verifyResetOtp({ email, otp: fullOtp });
    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate(PATHS.RESET_PASSWORD, { state: { email } });
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
          
          {/* Left Side - Visual Banner */}
          <div className="hidden lg:flex lg:w-1/2 bg-[#102a4e] p-10 flex-col justify-between relative overflow-hidden text-white">
            {/* Ambient Backgrounds */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

            {/* Top Brand Tag */}
            <div className="relative z-10">
              <span className="font-tajawal text-xl font-bold tracking-wider text-white">
                Watheq
              </span>
            </div>

            {/* Center Phone Graphic Card */}
            <div className="relative z-10 my-auto flex flex-col items-center justify-center">
              <div className="w-full max-w-xs bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center border border-slate-100">
                <div className="text-slate-800 font-bold text-sm mb-4 font-tajawal">
                  التحقق من الحد - تأكيد السجل المالي
                </div>
                
                {/* Phone Graphic with Shield */}
                <div className="relative w-28 h-44 bg-slate-900 rounded-3xl border-4 border-slate-700 shadow-xl flex flex-col items-center justify-center p-2">
                  <div className="w-8 h-1 bg-slate-700 rounded-full mb-3" />
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-pulse">
                    <ShieldCheck className="w-9 h-9 text-white" />
                  </div>
                  <div className="mt-3 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
                  نظام حماية التحقق الثنائي المتقدم لحماية حسابك ومعاملاتك
                </p>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="relative z-10 text-center text-xs text-slate-300 flex items-center justify-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>رمز التحقق صالح للاستخدام لمرة واحدة فقط</span>
            </div>
          </div>

          {/* Right Side - OTP Form */}
          <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto">
              
              {/* Back link */}
              <div className="mb-6 text-right">
                <button
                  type="button"
                  onClick={() => navigate(PATHS.FORGOT_PASSWORD)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#0c2444] transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
                  <span>تغيير البريد الإلكتروني</span>
                </button>
              </div>

              {/* Title & Subtitle */}
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0c2444] font-tajawal tracking-tight mb-2">
                  التحقق من الرمز
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  الرجاء إدخال رمز التحقق المرسل إلى البريد الإلكتروني الخاص بك
                </p>
                {email && (
                  <div className="mt-3">
                    <span className="inline-block bg-slate-50 text-[#0c2444] font-semibold text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-sans" dir="ltr">
                      {email}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Alerts */}
              {isSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-sm animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="font-medium text-sm">
                    تم التحقق من الرمز بنجاح! جاري تحويلك...
                  </span>
                </div>
              )}

              {resendNotice && (
                <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-3 shadow-sm animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-sm">{resendNotice}</span>
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 shadow-sm animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="font-medium text-sm">{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 6 OTP Inputs */}
                <div className="flex justify-center gap-2 sm:gap-3" dir="ltr">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-bold text-[#0c2444] bg-slate-50/70 border-2 border-slate-200 rounded-xl focus:border-[#0c2444] focus:bg-white focus:ring-4 focus:ring-[#0c2444]/10 transition-all outline-none"
                    />
                  ))}
                </div>

                {/* Resend Timer & Action */}
                <div className="text-center text-xs sm:text-sm font-medium">
                  {timeLeft > 0 ? (
                    <div className="text-slate-500 flex items-center justify-center gap-1.5">
                      <span>إعادة الإرسال بعد</span>
                      <span className="text-[#0c2444] font-bold tracking-widest font-sans" dir="ltr">
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline transition-colors disabled:opacity-50"
                    >
                      {isResending ? 'جاري إعادة الإرسال...' : 'إعادة إرسال الرمز'}
                    </button>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <LoadingButton
                    isLoading={isSubmitting}
                    loadingLabel="جاري التحقق..."
                    className="bg-[#0c2444] hover:bg-[#123663] shadow-md shadow-[#0c2444]/20 text-white font-bold h-12"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>تأكيد</span>
                  </LoadingButton>
                </div>
              </form>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
