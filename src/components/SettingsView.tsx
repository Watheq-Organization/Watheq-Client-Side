import React, { useState } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Sliders, 
  MessageSquare, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Crown,
  ChevronLeft
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'security' | 'preferences'>('profile');
  
  // Profile Form State
  const [institutionName, setInstitutionName] = useState('مؤسسة الأفق التجاري');
  const [managerName, setManagerName] = useState('أحمد محمد');
  const [email, setEmail] = useState('info@alufoq.com');
  const [phone, setPhone] = useState('+966 50 123 4567');
  const [address, setAddress] = useState('الرياض، طريق الملك فهد');

  // WhatsApp Settings State
  const [autoReminder, setAutoReminder] = useState(true);
  const [messageTemplate, setMessageTemplate] = useState(
    'مرحباً {اسم_العميل}، نذكركم بقرب موعد سداد الدفعة المستحقة بقيمة {المبلغ} لمؤسسة {اسم_المؤسسة}. شكراً لتعاونكم.'
  );

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMsg('تم حفظ التغييرات وإعدادات الملف الشخصي بنجاح!');
    setTimeout(() => setToastMsg(null), 3500);
  };

  const insertVariable = (variableStr: string) => {
    setMessageTemplate((prev) => `${prev} ${variableStr}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* PAGE TITLE */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 font-alexandria tracking-tight">
          الإعدادات
        </h1>
        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-xl">
          إدارة حساب المؤسسة والتذكيرات
        </span>
      </div>

      {/* TOP INSTITUTION CARD & SIDE TABS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* RIGHT COLUMN IN RTL (4 cols): Profile Card & Tab Navigation */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Top Institution Card (مؤسسة الأفق التجاري) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col items-center text-center">
            
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-3xl flex items-center justify-center shadow-lg border-4 border-white">
                أ
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 font-alexandria">
              مؤسسة الأفق التجاري
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5 mb-4">
              أحمد محمد
            </p>

            {/* Current Plan Box */}
            <div className="w-full bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 mb-4 text-right">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-emerald-600" />
                  الباقة الحالية
                </span>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                  باقة الأعمال (المتقدمة)
                </span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>تاريخ الانتهاء:</span>
                  <span className="font-bold text-slate-800">2024/05/15</span>
                </div>
                <div className="flex justify-between">
                  <span>العداد المستخدم:</span>
                  <span className="font-bold text-slate-800">15 / 2024</span>
                </div>
              </div>
            </div>

            <button className="w-full bg-[#0b1d3a] hover:bg-[#0f2a54] text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>ترقية الباقة</span>
            </button>
          </div>

          {/* Settings Sub-navigation Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2 space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-slate-100 text-emerald-700 border-r-4 border-emerald-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-slate-500" />
                <span>الملف الشخصي</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-slate-100 text-emerald-700 border-r-4 border-emerald-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <SettingsIcon className="w-4 h-4 text-slate-500" />
                <span>إعدادات الحساب</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-slate-100 text-emerald-700 border-r-4 border-emerald-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <span>الأمان والوصول</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'preferences'
                  ? 'bg-slate-100 text-emerald-700 border-r-4 border-emerald-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-slate-500" />
                <span>تفضيلات النظام</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          </div>

        </div>

        {/* LEFT COLUMN IN RTL (8 cols): Personal Profile Form & WhatsApp Settings */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SECTION 1: Personal Profile Form (إعدادات الملف الشخصي) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <h2 className="text-lg font-bold text-slate-900 font-alexandria border-b border-slate-100 pb-4 mb-6">
              إعدادات الملف الشخصي
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Institution Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اسم المؤسسة
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Manager Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اسم المسؤول
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    رقم الهاتف
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none text-left font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none text-left font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>

              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  العنوان
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-[#0b1d3a] hover:bg-[#0f2a54] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ التغييرات</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: WhatsApp & Reminders Settings (إعدادات واتساب والتذكير) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900 font-alexandria">
                  إعدادات واتساب والتذكير
                </h2>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                مفعل
              </span>
            </div>

            {/* Toggle Switch: Automatic Reminders */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-slate-900">
                  التذكير التلقائي
                </span>
                <span className="text-[11px] text-slate-500">
                  إرسال رسائل تذكير للعملاء تلقائياً قبل موعد السداد.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setAutoReminder(!autoReminder)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  autoReminder ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    autoReminder ? '-translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Reminder Message Template Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                قالب رسالة التذكير
              </label>
              <textarea
                rows={4}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 leading-relaxed font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
              />

              {/* Dynamic Variable Pills */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-400 font-semibold">المتغيرات المتاحة:</span>
                <button
                  type="button"
                  onClick={() => insertVariable('{اسم_العميل}')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer transition-colors"
                >
                  {'{اسم_العميل}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('{المبلغ}')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer transition-colors"
                >
                  {'{المبلغ}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('{اسم_المؤسسة}')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer transition-colors"
                >
                  {'{اسم_المؤسسة}'}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
