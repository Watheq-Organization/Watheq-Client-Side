import React, { useState, useEffect, useRef } from 'react';
import { Header, ScreenType } from './Header';
import { Footer } from './Footer';
import wathiqLogoIcon from '../assets/wathiq_logo_icon.jpg';
import { 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  RefreshCw, 
  Smartphone, 
  KeyRound, 
  AlertCircle, 
  Loader2, 
  Check, 
  Shield
} from 'lucide-react';

interface ForgotPasswordScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

type Step = 'phone' | 'otp' | 'reset' | 'success';

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState<Step>('phone');

  // Step 1: Phone
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isLoadingPhone, setIsLoadingPhone] = useState(false);

  // Step 2: OTP
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [otpTimer, setOtpTimer] = useState<number>(119); // 1:59 = 119s
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3: New Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isLoadingReset, setIsLoadingReset] = useState(false);

  // OTP Countdown Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (currentStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, otpTimer]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ── Step 1 Submit: Request Code ─────────────────────────────
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);

    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setPhoneError('يرجى إدخال رقم جوال صحيح.');
      return;
    }

    setIsLoadingPhone(true);
    setTimeout(() => {
      setIsLoadingPhone(false);
      setOtpTimer(119);
      setCanResend(false);
      setOtp(['', '', '', '']);
      setCurrentStep('otp');
    }, 900);
  };

  // ── Step 2 OTP Handling ─────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError(null);

    // Auto move to next box
    if (value && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = () => {
    if (!canResend) return;
    setOtpTimer(119);
    setCanResend(false);
    setOtp(['', '', '', '']);
    setOtpError(null);
    otpInputRefs.current[0]?.focus();
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length < 4) {
      setOtpError('يرجى إدخال رمز التحقق المكوّن من 4 أرقام كاملاً.');
      return;
    }

    setIsLoadingOtp(true);
    setTimeout(() => {
      setIsLoadingOtp(false);
      setCurrentStep('reset');
    }, 800);
  };

  // ── Step 3 Password Validation ──────────────────────────────
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[@#$%^&*!_~-]/.test(newPassword);
  const isMatching = newPassword && newPassword === confirmPassword;

  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial && isMatching;

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!hasMinLength) {
      setResetError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
      return;
    }
    if (!hasUppercase) {
      setResetError('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل (A-Z).');
      return;
    }
    if (!hasNumber) {
      setResetError('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل (0-9).');
      return;
    }
    if (!hasSpecial) {
      setResetError('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل (@ # $ %).');
      return;
    }
    if (!isMatching) {
      setResetError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setIsLoadingReset(true);
    setTimeout(() => {
      setIsLoadingReset(false);
      setCurrentStep('success');
      setTimeout(() => {
        onNavigate('login');
      }, 2500);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header Bar */}
      <Header currentScreen="forgot-password" onNavigate={onNavigate} brandText="ar" />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 lg:py-12 flex items-center justify-center">
        
        {/* Two-Column Split Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Interactive Dynamic Form Card */}
          {/* ======================================================== */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm border border-slate-200/80 flex flex-col justify-between order-2 lg:order-1">
            
            {/* Step Indicators Top Pill */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    currentStep === 'phone' ? 'bg-[#0b1d3a] text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {currentStep === 'phone' ? '1' : '✓'}
                  </div>
                  <div className={`w-8 h-1 rounded-full ${
                    currentStep === 'otp' || currentStep === 'reset' || currentStep === 'success' ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                  <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    currentStep === 'otp' ? 'bg-[#0b1d3a] text-white' : 
                    currentStep === 'reset' || currentStep === 'success' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {currentStep === 'reset' || currentStep === 'success' ? '✓' : '2'}
                  </div>
                  <div className={`w-8 h-1 rounded-full ${
                    currentStep === 'reset' || currentStep === 'success' ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                  <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    currentStep === 'reset' ? 'bg-[#0b1d3a] text-white' : 
                    currentStep === 'success' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {currentStep === 'success' ? '✓' : '3'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>العودة لتسجيل الدخول</span>
                </button>
              </div>

              {/* ──────────────────────────────────────────────────────── */}
              {/* STEP 1: Phone Number Input */}
              {/* ──────────────────────────────────────────────────────── */}
              {currentStep === 'phone' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-2xl font-bold text-slate-900 font-alexandria mb-1">
                    استعادة كلمة المرور
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                    أدخل رقم جوالك المسجل لدينا لإرسال رمز التحقق وإعادة تعيين كلمة المرور.
                  </p>

                  {phoneError && (
                    <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 font-medium">{phoneError}</div>
                    </div>
                  )}

                  <form onSubmit={handlePhoneSubmit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        رقم الجوال <span className="text-emerald-600">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="05X XXX XXXX"
                          required
                          dir="ltr"
                          disabled={isLoadingPhone}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all pl-10 text-right"
                        />
                        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                          <Phone className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoadingPhone}
                      className="w-full bg-[#0b1d3a] hover:bg-[#0f2a54] disabled:opacity-75 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-99 flex items-center justify-center gap-2 cursor-pointer font-alexandria text-xs sm:text-sm"
                    >
                      {isLoadingPhone ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>جاري إرسال الرمز...</span>
                        </>
                      ) : (
                        <>
                          <span>إرسال رمز التحقق</span>
                          <ArrowLeft className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* STEP 2: OTP Verification */}
              {/* ──────────────────────────────────────────────────────── */}
              {currentStep === 'otp' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-2xl font-bold text-slate-900 font-alexandria mb-1">
                    التحقق من الرمز
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                    الرجاء إدخال رمز التحقق المكوّن من 4 أرقام المرسل إلى جوالك ({phoneNumber || '05XXXXXXXX'}).
                  </p>

                  {otpError && (
                    <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 font-medium">{otpError}</div>
                    </div>
                  )}

                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                    {/* 4 Boxes Grid */}
                    <div className="flex items-center justify-center gap-3 sm:gap-4 my-6" dir="ltr">
                      {[0, 1, 2, 3].map((index) => (
                        <input
                          key={index}
                          ref={(el) => { otpInputRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={otp[index]}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          autoFocus={index === 0}
                          className={`w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-extrabold rounded-2xl border transition-all focus:outline-none ${
                            otp[index]
                              ? 'border-emerald-500 bg-emerald-50/40 text-slate-900 ring-2 ring-emerald-500/20'
                              : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-[#0b1d3a] focus:ring-2 focus:ring-slate-900/20'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Timer & Resend */}
                    <div className="text-center text-xs">
                      {otpTimer > 0 ? (
                        <div className="text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                          <span>إعادة الإرسال بعد</span>
                          <span className="font-bold text-[#0b1d3a] font-mono bg-slate-100 px-2 py-0.5 rounded-lg">
                            {formatTimer(otpTimer)}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>إعادة إرسال الرمز الآن</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoadingOtp}
                      className="w-full bg-[#0b1d3a] hover:bg-[#0f2a54] disabled:opacity-75 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-99 flex items-center justify-center gap-2 cursor-pointer font-alexandria text-xs sm:text-sm"
                    >
                      {isLoadingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>جاري التحقق...</span>
                        </>
                      ) : (
                        <>
                          <span>تأكيد</span>
                          <ArrowLeft className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* STEP 3: Reset New Password */}
              {/* ──────────────────────────────────────────────────────── */}
              {currentStep === 'reset' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-2xl font-bold text-slate-900 font-alexandria mb-1">
                    تعيين كلمة مرور جديدة
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                    أدخل كلمة المرور الجديدة لحسابك، وتأكد من اختيار كلمة مرور قوية وآمنة.
                  </p>

                  {resetError && (
                    <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 font-medium">{resetError}</div>
                    </div>
                  )}

                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    {/* Input 1: New Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        كلمة المرور الجديدة <span className="text-emerald-600">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          disabled={isLoadingReset}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all pr-10 pl-10"
                        />
                        <div className="absolute right-3 text-slate-400 pointer-events-none">
                          <Lock className="w-4 h-4" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute left-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Input 2: Confirm Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        تأكيد كلمة المرور <span className="text-emerald-600">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          disabled={isLoadingReset}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all pr-10 pl-10"
                        />
                        <div className="absolute right-3 text-slate-400 pointer-events-none">
                          <Lock className="w-4 h-4" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Password Checklist */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2 text-slate-600">
                      <span className="font-semibold text-slate-700 block mb-1">
                        يجب أن تحتوي كلمة المرور على:
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          hasMinLength ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                        }`}>
                          ✓
                        </div>
                        <span className={hasMinLength ? 'text-emerald-700 font-semibold' : ''}>8 أحرف على الأقل</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          hasUppercase ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                        }`}>
                          ✓
                        </div>
                        <span className={hasUppercase ? 'text-emerald-700 font-semibold' : ''}>حرف كبير واحد على الأقل (A-Z)</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          hasNumber ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                        }`}>
                          ✓
                        </div>
                        <span className={hasNumber ? 'text-emerald-700 font-semibold' : ''}>رقم واحد على الأقل (0-9)</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          hasSpecial ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                        }`}>
                          ✓
                        </div>
                        <span className={hasSpecial ? 'text-emerald-700 font-semibold' : ''}>رمز خاص واحد (@ # $ % ^ & *)</span>
                      </div>

                      {confirmPassword && (
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                            isMatching ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                          }`}>
                            {isMatching ? '✓' : '✕'}
                          </div>
                          <span className={isMatching ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>
                            {isMatching ? 'كلمتا المرور متطابقتان' : 'كلمتا المرور غير متطابقتين'}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoadingReset || !isPasswordValid}
                      className="w-full mt-2 bg-[#0b1d3a] hover:bg-[#0f2a54] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-99 flex items-center justify-center gap-2 cursor-pointer font-alexandria text-xs sm:text-sm"
                    >
                      {isLoadingReset ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>جاري تحديث كلمة المرور...</span>
                        </>
                      ) : (
                        <>
                          <span>تحديث كلمة المرور</span>
                          <ArrowLeft className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* STEP 4: Success Message */}
              {/* ──────────────────────────────────────────────────────── */}
              {currentStep === 'success' && (
                <div className="text-center py-6 animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 font-alexandria mb-2">
                    تم تغيير كلمة المرور بنجاح!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mb-6 max-w-sm mx-auto">
                    يمكنك الآن تسجيل الدخول إلى حسابك باستخدام كلمة المرور الجديدة. جاري تحويلك تلقائياً...
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 font-alexandria text-xs sm:text-sm cursor-pointer"
                  >
                    <span>تسجيل الدخول الآن</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>

            {/* Bottom Back to Login Link */}
            <div className="mt-8 pt-4 text-center border-t border-slate-100 text-xs">
              <span className="text-slate-500">تذكرت كلمة المرور؟ </span>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-emerald-600 font-bold hover:underline transition-colors ml-1 cursor-pointer"
              >
                تسجيل الدخول
              </button>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Matching Visual Banner per Step */}
          {/* ======================================================== */}
          <div className="bg-[#0b1d3a] rounded-2xl p-6 sm:p-8 md:p-10 shadow-lg flex flex-col items-center justify-between text-center text-white relative overflow-hidden order-1 lg:order-2">
            
            {/* Background glowing gradients */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Step 1 Visual Banner */}
            {currentStep === 'phone' && (
              <div className="my-auto flex flex-col items-center animate-in fade-in duration-300">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-md">
                  <Shield className="w-14 h-14 text-emerald-400 drop-shadow-md" />
                </div>
                <h3 className="text-2xl font-bold font-alexandria text-white mb-3">
                  نظام إدارة الديون الذكي
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mb-6">
                  أمان بياناتك المالي أولويتنا، نحن نستخدم أحدث تقنيات التشفير لضمان سرية معلوماتك وحماية حساباتك في كل خطوة.
                </p>
                <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-300 border border-white/10">
                  <ShieldCheck className="w-4 h-4" />
                  <span>نظام استعادة آمن وموثوق</span>
                </div>
              </div>
            )}

            {/* Step 2 Visual Banner */}
            {currentStep === 'otp' && (
              <div className="my-auto flex flex-col items-center animate-in fade-in duration-300">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-blue-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-md">
                  <Smartphone className="w-14 h-14 text-blue-400 drop-shadow-md" />
                </div>
                <h3 className="text-2xl font-bold font-alexandria text-white mb-3">
                  التحقق من الرمز - وثق
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mb-6">
                  حماية إضافية لحسابك من خلال التحقق الثنائي (2FA) لضمان عدم وصول أي شخص غير مصرح له إلى بياناتك المالية.
                </p>
                <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold text-blue-300 border border-white/10">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>أمان وموثوقية عالية</span>
                </div>
              </div>
            )}

            {/* Step 3 & 4 Visual Banner */}
            {(currentStep === 'reset' || currentStep === 'success') && (
              <div className="my-auto flex flex-col items-center animate-in fade-in duration-300">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-md">
                  <KeyRound className="w-14 h-14 text-emerald-400 drop-shadow-md" />
                </div>
                <h3 className="text-2xl font-bold font-alexandria text-white mb-3">
                  أمان بياناتك أولويتنا
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mb-6">
                  نحن نستخدم أحدث تقنيات التشفير لضمان سرية وأمان معلوماتك المالية في جميع الأوقات.
                </p>
                <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-300 border border-white/10">
                  <ShieldCheck className="w-4 h-4" />
                  <span>تشفير 256-bit متقدم</span>
                </div>
              </div>
            )}

            {/* Bottom Security Footer */}
            <div className="w-full pt-6 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>منصة وثق المالية</span>
              <span className="text-emerald-400 font-medium">اتصال مشفر 100% 🔒</span>
            </div>

          </div>

        </div>

      </main>

      {/* Bottom Footer Bar */}
      <Footer brandName="Watheq" onNavigate={onNavigate} />
    </div>
  );
};
