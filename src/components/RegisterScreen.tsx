import { useState } from 'react';
import type { FormEvent, FC } from 'react';
import { User, Store, Phone, Mail, ShieldCheck, Zap, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from './layout/Navbar';
import { Footer } from './layout/Footer';
import { IconInput, ICON_INPUT_FONT_SANS_CLASSNAME } from './ui/IconInput';
import { PasswordInput } from './ui/PasswordInput';
import { LoadingButton } from './ui/LoadingButton';
import { registerUser } from '../services/authService';
import { PATHS } from '../routes/paths';
import type { RegisterFormData } from '../types/auth';

export const RegisterScreen: FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterFormData>({
    storeName: '',
    fullName: '',
    phone: '',
    email: '',
    password: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateField = (field: keyof RegisterFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!agreeTerms) {
      setErrorMessage('يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة.');
      return;
    }

    setIsSubmitting(true);
    const result = await registerUser(formData);
    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => navigate(PATHS.LOGIN), 1500);
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-slate-800 font-cairo antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      {/* Main Hero & Form Section */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-14">
        {isSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-sm animate-fade-in">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium text-sm">
              تم تسجيل الحساب بنجاح! جاري تحويلك إلى صفحة تسجيل الدخول...
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
                  <IconInput
                    label="اسم المتجر / التاجر"
                    icon={<Store className="w-4 h-4" />}
                    type="text"
                    required
                    value={formData.storeName}
                    onChange={(e) => updateField('storeName')(e.target.value)}
                    placeholder="اسم النشاط التجاري"
                  />

                  <IconInput
                    label="الاسم الكامل"
                    icon={<User className="w-4 h-4" />}
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName')(e.target.value)}
                    placeholder="أدخل اسمك الثلاثي"
                  />
                </div>

                <IconInput
                  label="رقم الجوال"
                  icon={<Phone className="w-4 h-4" />}
                  type="tel"
                  required
                  dir="rtl"
                  value={formData.phone}
                  onChange={(e) => updateField('phone')(e.target.value)}
                  placeholder="05xxxxxxxx"
                  className={ICON_INPUT_FONT_SANS_CLASSNAME}
                />

                <IconInput
                  label="البريد الالكتروني"
                  icon={<Mail className="w-4 h-4" />}
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => updateField('email')(e.target.value)}
                  placeholder="user@gmail.com"
                  className={ICON_INPUT_FONT_SANS_CLASSNAME}
                />

                <PasswordInput
                  label="كلمة المرور"
                  required
                  value={formData.password}
                  onChange={(e) => updateField('password')(e.target.value)}
                  placeholder="••••••••"
                />

                {/* Terms Agreement Checkbox */}
                <div className="flex items-center gap-2 pt-1 text-right justify-start select-none">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <label htmlFor="terms" className="text-xs sm:text-sm text-slate-600 cursor-pointer">
                    أوافق على{' '}
                    <a href="#terms" className="text-slate-800 font-semibold underline hover:text-emerald-700">
                      شروط الاستخدام
                    </a>{' '}
                    و{' '}
                    <a href="#privacy" className="text-slate-800 font-semibold underline hover:text-emerald-700">
                      سياسة الخصوصية
                    </a>
                  </label>
                </div>

                {/* Submit CTA Button */}
                <div className="pt-2">
                  <LoadingButton isLoading={isSubmitting} loadingLabel="جاري الإنشاء...">
                    <ArrowLeft className="w-5 h-5" />
                    <span>إنشاء حساب جديد</span>
                  </LoadingButton>
                </div>

                {/* Sign In Redirect */}
                <div className="text-center pt-3 text-xs sm:text-sm text-slate-500">
                  <span>لديك حساب بالفعل؟ </span>
                  <button
                    type="button"
                    onClick={() => navigate(PATHS.LOGIN)}
                    className="text-[#0c2444] font-bold hover:underline hover:text-emerald-700 transition-colors"
                  >
                    تسجيل الدخول
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Hero Content & Value Props */}
          <div className="lg:col-span-6 space-y-6 text-right">
            {/* Title & Description */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0c2444] font-tajawal tracking-tight leading-tight">
                بناء الثقة يبدأ من <span className="text-[#008744]">هنا</span>
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
                <h3 className="font-bold text-[#0c2444] text-base">أمان تام</h3>
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
                <h3 className="font-bold text-[#0c2444] text-base">إدارة سريعة</h3>
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

      <Footer />
    </div>
  );
};
