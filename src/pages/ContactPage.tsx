import { useState } from 'react';
import type { FormEvent, FC } from 'react';
import { Mail, Phone, Clock, User, Send, Check, AlertCircle } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { IconInput, ICON_INPUT_FONT_SANS_CLASSNAME } from '../components/ui/IconInput';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { LoadingButton } from '../components/ui/LoadingButton';
import { submitContactForm } from '../services/contactService';
import { INQUIRY_TYPES } from '../types/contact';
import type { ContactFormData } from '../types/contact';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ContactPage: FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    inquiryType: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!EMAIL_PATTERN.test(formData.email)) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }

    if (!formData.inquiryType) {
      setErrorMessage('يرجى اختيار نوع الاستفسار.');
      return;
    }

    setIsSubmitting(true);
    const result = await submitContactForm(formData);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message);
      setFormData({ fullName: '', email: '', inquiryType: '', message: '' });
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-slate-800 font-cairo antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-14">
        {/* Page Title & Description */}
        <div className="text-right mb-8 lg:mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0c2444] font-tajawal tracking-tight">
            تواصل معنا
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed max-w-2xl">
            نحن هنا لمساعدتك. يرجى ملء النموذج أدناه أو استخدام معلومات الاتصال المباشرة للوصول إلى
            فريق الدعم لدينا.
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-sm animate-fade-in">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium text-sm">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 shadow-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="font-medium text-sm">{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Left: Contact Information Cards */}
          
          {/* Right: Contact Form Card */}
          <div className="lg:col-span-2 w-full">
            <div className="bg-white rounded-2xl p-6 sm:p-9 shadow-xl shadow-slate-200/70 border border-slate-100">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <IconInput
                    label="الاسم الكامل"
                    icon={<User className="w-4 h-4" />}
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="أدخل اسمك الكامل"
                  />

                  <IconInput
                    label="البريد الإلكتروني"
                    icon={<Mail className="w-4 h-4" />}
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="example@domain.com"
                    className={ICON_INPUT_FONT_SANS_CLASSNAME}
                  />
                </div>

                <Select
                  label="نوع الاستفسار"
                  name="inquiryType"
                  required
                  value={formData.inquiryType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, inquiryType: e.target.value }))}
                  placeholder="اختر نوع الاستفسار"
                  options={INQUIRY_TYPES}
                />

                <Textarea
                  label="الرسالة"
                  name="message"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="كيف يمكننا مساعدتك؟"
                />

                <div className="pt-2">
                  <LoadingButton isLoading={isSubmitting} loadingLabel="جاري الإرسال...">
                    <Send className="w-5 h-5" />
                    <span>إرسال الرسالة</span>
                  </LoadingButton>
                </div>
              </form>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-5">
            
            {/* Card 1: Technical Support */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-start gap-4 transition-all duration-200 hover:shadow-md hover:border-slate-200">
              <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <Mail className="w-6 h-6" />
              </div>
              <div className="space-y-1 text-right">
                <h3 className="font-bold text-[#0c2444] text-base">الدعم الفني</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  تواصل معنا عبر البريد الإلكتروني لأي استفسارات تقنية.
                </p>
                <a
                  href="mailto:support@watheq.com"
                  dir="ltr"
                  className="inline-block text-sm font-semibold text-emerald-700 hover:underline font-sans"
                >
                  support@watheq.com
                </a>
              </div>
            </div>

            {/* Card 2: Phone Support */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-start gap-4 transition-all duration-200 hover:shadow-md hover:border-slate-200">
              <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <Phone className="w-6 h-6" />
              </div>
              <div className="space-y-1 text-right">
                <h3 className="font-bold text-[#0c2444] text-base">رقم الهاتف</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  متاحون للرد على مكالماتك خلال ساعات العمل.
                </p>
                <a
                  href="tel:+966500000000"
                  dir="ltr"
                  className="inline-block text-sm font-semibold text-[#0c2444] hover:underline font-sans"
                >
                  +966 50 000 0000
                </a>
              </div>
            </div>

            {/* Card 3: Working Hours */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-start gap-4 transition-all duration-200 hover:shadow-md hover:border-slate-200">
              <div className="w-11 h-11 rounded-xl bg-[#0c2444] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1 text-right">
                <h3 className="font-bold text-[#0c2444] text-base">ساعات العمل</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">الأحد - الخميس</p>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans" dir="ltr">
                  9:00 صباحاً - 5:00 مساءً
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
