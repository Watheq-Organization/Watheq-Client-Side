import type { FC } from 'react';
import { ShieldCheck, Eye, Scale, RefreshCw, Lightbulb, Search } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const AboutPage: FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] text-slate-800 font-cairo antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-16 space-y-12">
        {/* Top Hero Section: Title + Security Illustration */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-100 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Visual Column */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-inner bg-slate-50 group">
                <img
                  src="/about-security.jpg"
                  alt="الأمان والتوثيق المالي"
                  className="w-full h-auto object-cover transform group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/60 shadow-xs text-xs font-semibold text-[#0c2444]">
                  حول النظام - وثّق
                </div>
              </div>
            </div>

            {/* Text Column */}
            <div className="lg:col-span-6 order-1 lg:order-2 text-right space-y-5">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0c2444] font-tajawal tracking-tight leading-tight">
                نبني بيئة مالية{' '}
                <span className="text-emerald-500 font-bold">آمنة وموثوقة</span>
              </h1>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                نظام &quot;وثّق&quot; هو الحل الرائد لإدارة الديون والتحصيل الرقمي. نحن نهدف إلى تمكين
                التجار والشركات من إدارة مستحقاتهم المالية بكفاءة عالية، شفافية مطلقة، وأمان لا يضاهى.
              </p>
            </div>
          </div>
        </section>

        {/* Second Row: Vision (Navy) + Conflict Reduction (White) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Card 1: Vision (Dark Navy) */}
          <div className="bg-[#0c2444] text-white rounded-3xl p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden shadow-lg hover:shadow-xl transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-sky-400 mb-6">
                <Eye className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold font-tajawal text-white mb-4">
                رؤيتنا
              </h2>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                أن نكون المنصة القياسية لإدارة وتوثيق المعاملات المالية الآجلة، مما يساهم في بناء
                اقتصاد رقمي يعتمد على الثقة المتبادلة والتوثيق الدقيق.
              </p>
            </div>
          </div>

          {/* Card 2: Reduce Disputes (White) */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
                <Scale className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold font-tajawal text-[#0c2444] mb-4">
                تقليل النزاعات
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                نوفر سجلات مالية غير قابلة للتلاعب تضمن حقوق جميع الأطراف، وتحد من الخلافات.
              </p>
            </div>
          </div>
        </section>

        {/* Third Row: Laptop Tech Image Overlay + Collection Automation */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Card 1: Core Values (Image with Overlay) */}
          <div className="relative rounded-3xl overflow-hidden min-h-[260px] sm:min-h-[300px] flex flex-col justify-end p-8 sm:p-10 border border-slate-100 shadow-sm group">
            <img
              src="/about-dashboard.jpg"
              alt="قيمنا الأساسية المترسخة"
              className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c2444]/95 via-[#0c2444]/60 to-transparent" />
            <div className="relative z-10 text-right space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-tajawal">
                قيمنا الأساسية المترسخة
              </h2>
              <p className="text-slate-200 text-sm sm:text-base">
                الأسس التي نبني عليها كل ميزة في نظامنا.
              </p>
            </div>
          </div>

          {/* Card 2: Collection Automation */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-6">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold font-tajawal text-[#0c2444] mb-4">
                أتمتة التحصيل
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                تسريع دورة التحصيل من خلال تنبيهات ذكية وجدولة تلقائية للمدفوعات المستحقة.
              </p>
            </div>
          </div>
        </section>

        {/* Fourth Row: 3 Values (Security, Innovation, Transparency) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Value 1: Security */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold font-tajawal text-[#0c2444] mb-3">
              الأمان
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              تشفير متقدم وحماية متعددة الطبقات لضمان سرية البيانات المالية القصوى.
            </p>
          </div>

          {/* Value 2: Innovation */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-6">
              <Lightbulb className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold font-tajawal text-[#0c2444] mb-3">
              الابتكار
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              تطوير مستمر للأدوات المالية الرقمية لتواكب احتياجات السوق المتغيرة بسرعة.
            </p>
          </div>

          {/* Value 3: Transparency */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-[#0c2444] text-white flex items-center justify-center shadow-lg shadow-[#0c2444]/20 mb-6">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold font-tajawal text-[#0c2444] mb-3">
              الشفافية
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              وضوح تام في عرض السجلات والتقارير المالية لجميع الأطراف المعنية بصلاحيات.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
