import { useState, useRef, useEffect } from 'react';
import type { FormEvent, FC, KeyboardEvent, ClipboardEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './layout/Navbar';
import { Footer } from './layout/Footer';
import { LoadingButton } from './ui/LoadingButton';
import { PATHS } from '../routes/paths';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { verifyOtp, resendVerificationCode } from '../services/authService';

export const VerifyOtpScreen: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email as string | undefined;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Countdown Timer (5 minutes = 300 seconds)
  const [timeLeft, setTimeLeft] = useState(300);
  
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    // If no email was passed, redirect back to register
    if (!email) {
      navigate(PATHS.REGISTER, { replace: true });
      return;
    }
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
    if (timeLeft > 0 || isResending || !email) return;
    setIsResending(true);
    setErrorMessage(null);
    setResendNotice(null);

    const result = await resendVerificationCode(email);
    setIsResending(false);

    if (result.success) {
      setTimeLeft(300);
      setResendNotice('تمت إعادة إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح.');
      setOtp(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple chars
    
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
      // Auto-focus previous input on backspace if current is empty
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim().slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return; // Only allow numbers

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6) newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    // Focus the next empty input or the last one
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs[focusIndex].current?.focus();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    
    if (fullOtp.length < 6) {
      setErrorMessage('يرجى إدخال رمز التحقق بالكامل.');
      return;
    }
    
    setErrorMessage(null);
    setIsSubmitting(true);
    
    // TODO: Connect to real API
    const result = await verifyOtp({ email: email!, otp: fullOtp });
    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => navigate(PATHS.LOGIN), 1500);
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-slate-800 font-cairo antialiased selection:bg-[#0c2444] selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-[1400px] w-full mx-auto p-4 sm:p-6 lg:p-10 flex items-center justify-center">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100">
          
          {/* Left Side - Illustration / Branding */}
          <div className="hidden lg:flex lg:w-1/2 bg-[#1a365d] p-12 flex-col items-center justify-center relative overflow-hidden">
             {/* Abstract background elements */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
             <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#008744]/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
             
             {/* Simplified custom illustration instead of generic image */}
             <div className="relative z-10 w-full max-w-sm aspect-video bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-2xl flex flex-col items-center justify-center gap-6">
                <div className="text-white font-bold text-xl font-tajawal text-center">
                   التحقق من الرمز - وثّق (سطح المكتب)
                </div>
                <div className="w-24 h-40 bg-white rounded-3xl border-8 border-slate-800 shadow-inner flex flex-col items-center justify-center relative">
                   <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                   </div>
                   <div className="absolute bottom-2 w-10 h-1 bg-slate-200 rounded-full"></div>
                </div>
                <p className="text-white/60 text-sm text-center">
                   عملية التحقق تمت بنجاح. بياناتكم آمنة ومشفرة.
                </p>
             </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
            
            <div className="max-w-md w-full mx-auto">
              <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0c2444] font-tajawal tracking-tight mb-3">
                  التحقق من الرمز
                </h1>
                <p className="text-slate-500 text-sm sm:text-base">
                  الرجاء إدخال رمز التحقق المرسل إلى البريد الالكتروني الخاص بك
                </p>
                {email && (
                   <p className="text-[#0c2444] font-semibold text-sm mt-2 bg-slate-50 p-2 rounded-lg inline-block mx-auto border border-slate-100">
                      {email}
                   </p>
                )}
              </div>

              {isSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-sm animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="font-medium text-sm">
                    تم التحقق بنجاح! جاري تحويلك إلى صفحة تسجيل الدخول...
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

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* OTP Inputs */}
                <div className="flex justify-center gap-2 sm:gap-3 md:gap-5" dir="ltr">
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
                      className="w-10 h-12 sm:w-12 sm:h-14 md:w-16 md:h-16 text-center text-xl sm:text-2xl font-bold text-[#0c2444] bg-white border-2 border-slate-200 rounded-xl focus:border-[#0c2444] focus:ring-4 focus:ring-[#0c2444]/10 transition-all outline-none"
                    />
                  ))}
                </div>

                {/* Resend Timer */}
                <div className="text-center text-sm font-medium">
                  {timeLeft > 0 ? (
                    <div className="text-slate-500 flex items-center justify-center gap-1.5 flex-row-reverse">
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
                      className="text-[#008744] hover:text-[#006834] font-bold hover:underline transition-colors disabled:opacity-50"
                    >
                      {isResending ? 'جاري إعادة الإرسال...' : 'إعادة إرسال الرمز'}
                    </button>
                  )}
                </div>

                {/* Submit Button */}
                <LoadingButton isLoading={isSubmitting} loadingLabel="جاري التحقق..." className="h-14 text-lg">
                  <CheckCircle2 className="w-5 h-5 ml-2" />
                  <span>تأكيد</span>
                </LoadingButton>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
