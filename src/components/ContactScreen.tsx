import React, { useState } from 'react';
import { Header, ScreenType } from './Header';
import { Footer } from './Footer';
import { Mail, Phone, Clock, Send, CheckCircle2 } from 'lucide-react';

interface ContactScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

export const ContactScreen: React.FC<ContactScreenProps> = ({ onNavigate }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryType, setInquiryType] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFullName('');
      setEmail('');
      setInquiryType('');
      setMessage('');
    }, 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header Navigation */}
      <Header currentScreen="contact" onNavigate={onNavigate} brandText="ar" />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10 lg:py-14">
        
        {/* Page Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-alexandria mb-3">
            تواصل معنا
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            نحن هنا لمساعدتك. يرجى ملء النموذج أدناه أو استخدام معلومات الاتصال المباشرة للوصول إلى فريق الدعم لدينا.
          </p>
        </div>

        {/* Two-Column Grid: Contact Info Cards (Left) & Form Card (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT COLUMN: 3 Contact Info Cards */}
          <div className="space-y-4">
            
            {/* Card 1: Technical Support */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:border-emerald-200 transition-all flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-alexandria mb-1">
                  الدعم الفني
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  تواصل معنا عبر البريد الإلكتروني لأي استفسارات تقنية.
                </p>
                <a
                  href="mailto:support@watheq.com"
                  className="text-xs font-bold text-emerald-600 hover:underline dir-ltr inline-block"
                >
                  support@watheq.com
                </a>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Phone Number */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:border-emerald-200 transition-all flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-alexandria mb-1">
                  رقم الهاتف
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  مباشر من، على مدار 24 ساعة لتلقي البلاغات.
                </p>
                <a
                  href="tel:+966550000000"
                  className="text-xs font-bold text-emerald-600 hover:underline dir-ltr inline-block"
                >
                  +966 55 000 0000
                </a>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Working Hours */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:border-emerald-200 transition-all flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-alexandria mb-1">
                  ساعات العمل
                </h3>
                <p className="text-xs text-slate-500 mb-2">
                  الأحد - الخميس
                </p>
                <span className="text-xs font-semibold text-slate-700 dir-ltr inline-block">
                  9:00 صباحاً - 5:00 مساءً
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Contact Form Card (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm border border-slate-200/80">
            
            {/* Alert on Success */}
            {isSubmitted && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>تم إرسال رسالتك بنجاح! سيتواصل معك فريق الدعم في أقرب وقت.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Row 1: Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    الاسم الكامل <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="أدخل اسمك الكامل"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    البريد الإلكتروني <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@domain.com"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Inquiry Type Select Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  نوع الاستفسار <span className="text-emerald-600">*</span>
                </label>
                <select
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                >
                  <option value="" disabled>اختر نوع الاستفسار</option>
                  <option value="tech">دعم فني وتقني</option>
                  <option value="subscription">استفسار عن الاشتراكات والحسابات</option>
                  <option value="verification">توثيق العمليات والديون</option>
                  <option value="other">استفسار عام</option>
                </select>
              </div>

              {/* Row 3: Message Textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  الرسالة <span className="text-emerald-600">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="كيف يمكننا مساعدتك؟"
                  required
                  rows={5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-[#15803D] hover:bg-[#166534] text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-99 flex items-center justify-center gap-2 cursor-pointer font-alexandria text-sm"
                >
                  <span>إرسال الرسالة</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </form>

          </div>

        </div>

      </main>

      {/* Dark Navy Footer Bar */}
      <Footer brandName="Watheq" theme="dark" />
    </div>
  );
};
