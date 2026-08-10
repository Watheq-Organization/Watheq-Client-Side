import React, { useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ShieldCheck, Lock, Database, FileText, Cookie } from 'lucide-react';

interface PrivacyScreenProps {
  onNavigate: (screen: 'splash' | 'login' | 'signup' | 'contact' | 'privacy' | 'terms') => void;
}

export const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState<string>('collect');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Header currentScreen="privacy" onNavigate={onNavigate} brandText="ar" />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 lg:py-12">
        
        {/* Layout Grid: Content (Left 8 cols) & Sidebar Index (Right 4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* LEFT CONTENT AREA */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm border border-slate-200/80">
            
            {/* Header Header */}
            <div className="border-b border-slate-100 pb-6 mb-8">
              <h1 className="text-3xl font-extrabold text-slate-900 font-alexandria mb-2">
                سياسة الخصوصية
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                آخر تحديث: 24 أكتوبر 2024
              </p>
            </div>

            {/* Intro paragraph */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
              تعتبر في <strong>"وثق"</strong> الالتزام بحماية خصوصيتك. عندما تستخدم منصة إدارة الديون، نقوم بجمع أنواع معينة من المعلومات لضمان تقديم وتطوير خدماتنا ومساعدة التجار والمؤسسات في توثيق المعاملات المالية بدقة وأمان.
            </div>

            {/* Section 1: Data Collection */}
            <section id="collect" className="scroll-mt-24 mb-10">
              <div className="flex items-center gap-2.5 mb-3 text-slate-900">
                <Database className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold font-alexandria">1. جمع البيانات والمعلومات</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                نقوم بجمع المعلومات والبيانات لتقديم خدمات توثيق الديون وتحسين أداء المنصة:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 pr-5 list-disc">
                <li><strong>المعلومات الشخصية:</strong> الاسم الكامل، البريد الإلكتروني، ورقم الهاتف.</li>
                <li><strong>بيانات المعاملات:</strong> تفاصيل ومبالغ التعهدات والالتزامات المالية المستحقة.</li>
                <li><strong>بيانات السجل:</strong> تفاصيل الدخول وأجهزة الاستخدام.</li>
              </ul>
            </section>

            {/* Section 2: Use of Information */}
            <section id="use" className="scroll-mt-24 mb-10">
              <div className="flex items-center gap-2.5 mb-3 text-slate-900">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold font-alexandria">2. استخدام المعلومات</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                نستخدم المعلومات التي نجمعها لضمان تشغيل منصة "وثق" بصورة آمنة وفعالة:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 pr-5 list-disc">
                <li>توفير وتحديث وتطوير خدمات توثيق وإدارة الديون.</li>
                <li>التواصل معك بشأن تحديثات الحساب وتنبيهات الأمان.</li>
                <li>منع الاحتيال وضمان الامتثال للقوانين واللوائح التنظيمية.</li>
                <li>عدم بيع أو تأجير بياناتك الشخصية لأي طرف ثالث نهائياً.</li>
              </ul>
            </section>

            {/* Section 3: Data Protection */}
            <section id="protection" className="scroll-mt-24 mb-10">
              <div className="flex items-center gap-2.5 mb-3 text-slate-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold font-alexandria">3. حماية البيانات والأمان</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                نحن نطبق أعلى المعايير الأمنية لحماية معلوماتك وحساباتك المالية:
              </p>
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 text-xs text-emerald-900 leading-relaxed flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>تشفير عالي المتانة (256-bit Encryption):</strong> يتم تشفير جميع البيانات الحساسة أثناء النقل والتخزين لمنع أي وصول غير مصرح به أو تسريب، مع التدقيق الأمني الدائم.
                </span>
              </div>
            </section>

            {/* Section 4: Cookies */}
            <section id="cookies" className="scroll-mt-24">
              <div className="flex items-center gap-2.5 mb-3 text-slate-900">
                <Cookie className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold font-alexandria">4. ملفات تعريف الارتباط (Cookies)</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                نستخدم ملفات تعريف الارتباط لتسهيل تسجيل الدخول، وتخصيص تجربتك، وتحسين سرعة استجابة المنصة. يمكنك خيار تعطيل ملفات تعريف الارتباط من خلال إعدادات المتصفح الخاص بك، ولكن قد يؤثر ذلك على بعض وظائف المنصة.
              </p>
            </section>

          </div>

          {/* RIGHT SIDEBAR: Table of Contents Index */}
          <div className="lg:sticky lg:top-24 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 font-alexandria">
              فهرس المحتويات
            </h3>
            <nav className="space-y-1.5 text-xs font-medium">
              <button
                onClick={() => scrollToSection('collect')}
                className={`w-full text-right px-3 py-2 rounded-lg transition-colors cursor-pointer block ${
                  activeSection === 'collect'
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                1. جمع البيانات والمعلومات
              </button>
              <button
                onClick={() => scrollToSection('use')}
                className={`w-full text-right px-3 py-2 rounded-lg transition-colors cursor-pointer block ${
                  activeSection === 'use'
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                2. استخدام المعلومات
              </button>
              <button
                onClick={() => scrollToSection('protection')}
                className={`w-full text-right px-3 py-2 rounded-lg transition-colors cursor-pointer block ${
                  activeSection === 'protection'
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                3. حماية البيانات والأمان
              </button>
              <button
                onClick={() => scrollToSection('cookies')}
                className={`w-full text-right px-3 py-2 rounded-lg transition-colors cursor-pointer block ${
                  activeSection === 'cookies'
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                4. ملفات تعريف الارتباط
              </button>
            </nav>
          </div>

        </div>

      </main>

      {/* Footer */}
      <Footer  brandName="Watheq" theme="dark" />
    </div>
  );
};
