import React, { useState } from 'react';
import { Header, ScreenType } from './Header';
import { Footer } from './Footer';
import heroBusinesswoman from '../assets/hero_businesswoman.png';
import { User, Building, Phone, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowLeft, Layers } from 'lucide-react';

interface SignupScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ onNavigate }) => {
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) {
      alert('يرجى الموافقة على الشروط والأحكام والمتابعة.');
      return;
    }
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header Bar */}
      <Header currentScreen="signup" onNavigate={onNavigate} brandText="en" />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 lg:py-12 flex items-center justify-center">
        
        {/* Two-Column Split Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* LEFT COLUMN: Registration Form Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div>
              {/* Card Title & Subtitle */}
              <h2 className="text-2xl font-bold text-slate-900 font-alexandria mb-1">
                إنشاء حساب جديد
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium">
                ابدأ إدارة ديونك مجاناً بكل سهولة وأمان.
              </p>

              {/* Success Notification Alert */}
              {isSubmitted && (
                <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>تم إنشاء الحساب بنجاح! مرحباً بك في وثق.</span>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Field 1: Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    الاسم الكامل <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all pl-10"
                    />
                    <div className="absolute left-3 text-slate-400 pointer-events-none">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Field 2: Business / Store Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    اسم المتجر / التجاري <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="اسم النشاط التجاري"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all pl-10"
                    />
                    <div className="absolute left-3 text-slate-400 pointer-events-none">
                      <Building className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Field 3: Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    رقم الجوال <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="050 xxxxxxx"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all pl-10"
                    />
                    <div className="absolute left-3 text-slate-400 pointer-events-none">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Field 4: Password */}
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
                      minLength={6}
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

                {/* Terms and Privacy Checkbox */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      required
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                    <span>
                      أوافق على <button type="button" onClick={() => onNavigate('terms')} className="text-emerald-600 underline font-semibold">الشروط والأحكام</button> و <button type="button" onClick={() => onNavigate('privacy')} className="text-emerald-600 underline font-semibold">سياسة الخصوصية</button>
                    </span>
                  </label>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  className="w-full mt-4 bg-[#15803D] hover:bg-[#166534] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-99 flex items-center justify-center gap-2 cursor-pointer font-alexandria"
                >
                  <span>إنشاء حساب جديد</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Bottom Link to Login Screen */}
            <div className="mt-8 pt-4 text-center border-t border-slate-100 text-xs">
              <span className="text-slate-500">لديك حساب بالفعل؟ </span>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-emerald-600 font-bold hover:underline transition-colors ml-1 cursor-pointer"
              >
                تسجيل الدخول
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Hero & Features Display */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm border border-slate-200/80 flex flex-col justify-between">
            
            {/* Top Text & Value Proposition */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-alexandria leading-snug mb-3">
                بناء الثقة يبدأ من هنا
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                انضم إلى آلاف التجار الذين يعتمدون على وثق في إدارة وتوثيق العمليات المالية بكل شفافية وموثوقية.
              </p>

              {/* Feature Cards Grid */}
              <div className="space-y-3 mb-6">
                
                {/* Feature 1: Complete Security */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-alexandria">أمان تام</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                      تشفير متقدم وحماية عالية لبياناتك وحساباتك لمنع الاختراق والتسريب.
                    </p>
                  </div>
                </div>

                {/* Feature 2: Convenient Management */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-alexandria">إدارة مريحة</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                      واجهة مستخدم سلسة لتتبع وإضافة مستحقات الديون في أي وقت وبمنتهى البساطة.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom High Quality Hero Image Banner */}
            <div className="relative rounded-xl overflow-hidden border border-slate-200/60 group shadow-xs mt-auto">
              <img
                src={heroBusinesswoman}
                alt="Wathiq Business Management"
                className="w-full h-44 object-cover object-center group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-3">
                <span className="text-[11px] font-semibold text-white/90 drop-shadow-sm">
                  منصة موثوقة لأكثر من +10,000 تاجر ومؤسسة
                </span>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Footer Bar */}
      <Footer brandName="Watheq" onNavigate={onNavigate} />
    </div>
  );
};
