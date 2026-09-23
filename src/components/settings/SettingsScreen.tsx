import { useState, useEffect, useRef } from 'react';
import type { FC, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '../../routes/paths';
import {
  Pencil,
  Award,
  User,
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
  ChevronLeft,
  Check,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
  Lock,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import {
  getMerchantProfile,
  updateMerchantProfile,
  getStoredReminderSettings,
  setStoredReminderSettings,
  DEFAULT_MERCHANT_PROFILE,
} from '../../services/merchantProfileService';
import type { MerchantProfile } from '../../services/merchantProfileService';

export const SettingsScreen: FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'whatsapp' | 'security' | 'preferences'>('profile');

  // Profile state
  const [profile, setProfile] = useState<MerchantProfile>(DEFAULT_MERCHANT_PROFILE);
  const [formData, setFormData] = useState<MerchantProfile>(DEFAULT_MERCHANT_PROFILE);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reminder & WhatsApp state
  const [autoReminder, setAutoReminder] = useState(true);
  const [messageTemplate, setMessageTemplate] = useState(
    'مرحباً [اسم_العميل]، نذكركم بقرب موعد سداد الدفعة المستحقة بقيمة [المبلغ] لمؤسسة [اسم_المؤسسة]. شكراً لتعاونكم.'
  );

  // Preferences state
  const [language, setLanguage] = useState<'ar' | 'en'>(() => {
    return (localStorage.getItem('app_language') as 'ar' | 'en') || 'ar';
  });
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('app_theme') as 'light' | 'dark' | 'system') || 'light';
  });

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // UI status
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    // Apply Language Direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('app_language', language);
  }, [language]);

  useEffect(() => {
    // Apply Theme
    const root = document.documentElement;
    localStorage.setItem('app_theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  useEffect(() => {
    // 1. Load reminder settings
    const storedReminders = getStoredReminderSettings();
    setAutoReminder(storedReminders.autoReminderEnabled);
    setMessageTemplate(storedReminders.messageTemplate);

    // 2. Load merchant profile (from backend or local registered data)
    setIsLoadingProfile(true);
    getMerchantProfile()
      .then((data) => {
        setProfile(data);
        setFormData(data);
        if (data.profileImagePath) {
          setAvatarPreview(data.profileImagePath);
        }
      })
      .catch(() => {
        // Fallback already handled inside getMerchantProfile
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setAvatarPreview(base64);
          setFormData((prev) => ({ ...prev, profileImagePath: base64 }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Update merchant profile through the API
      const updated = await updateMerchantProfile(formData, selectedFile);
      setProfile(updated);

      // 2. Save reminder settings
      setStoredReminderSettings({
        autoReminderEnabled: autoReminder,
        messageTemplate: messageTemplate,
      });

      showToast('تم حفظ التغييرات بنجاح!');
    } catch {
      showToast('حدث خطأ أثناء حفظ التغييرات. يرجى المحاولة لاحقاً.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReminderSettings = () => {
    setStoredReminderSettings({
      autoReminderEnabled: autoReminder,
      messageTemplate: messageTemplate,
    });
    showToast('تم تحديث إعدادات التذكير بنجاح!');
  };

  const handleSaveSecurity = (e: FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      showToast('كلمة المرور الجديدة غير متطابقة', 'error');
      return;
    }
    showToast('تم تحديث إعدادات الأمان بنجاح!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSavePreferences = () => {
    showToast('تم تحديث تفضيلات النظام بنجاح!');
  };

  return (
    <div
      className="min-h-screen bg-[#f4f7fb] dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-cairo antialiased flex"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-bold text-white transition-all ${
              toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <Check className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <AlertCircle className="w-5 h-5 stroke-[2.5]" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main App Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="settings"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        {/* Unified Top Header */}
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title="الإعدادات"
          hideSearch
        />

        {/* Settings Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          {/* Main Grid: Left content (forms) + Right column (profile, plan, tabs) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Section in visual layout (8 cols in desktop): Dynamic Content based on active tab */}
            <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
              
              {/* Tab 1: Profile Settings */}
              {activeSettingsTab === 'profile' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Card Title */}
                  <div className="text-center mb-8 pb-4 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="text-xl sm:text-2xl font-bold font-cairo text-slate-900 dark:text-white">
                      إعدادات الملف الشخصي
                    </h2>
                  </div>

                  {isLoadingProfile ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin text-[#0c2444] dark:text-blue-400" />
                      <span className="text-sm font-medium font-cairo">جاري تحميل بيانات الملف الشخصي...</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                    {/* Row 1: اسم المؤسسة + اسم المسؤول */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 font-cairo text-right">
                          اسم المؤسسة
                        </label>
                        <input
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          placeholder="مؤسسة الأفق التجاري"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-hidden focus:border-[#051838] focus:ring-1 focus:ring-[#051838] dark:focus:ring-blue-500 transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 font-cairo text-right">
                          اسم المسؤول
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="أحمد محمد"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-hidden focus:border-[#051838] focus:ring-1 focus:ring-[#051838] dark:focus:ring-blue-500 transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Row 2: البريد الإلكتروني + رقم الهاتف */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 font-cairo text-right">
                          البريد الإلكتروني
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="info@alufuq.com"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-hidden focus:border-[#051838] focus:ring-1 focus:ring-[#051838] dark:focus:ring-blue-500 transition-all"
                          dir="ltr"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 font-cairo text-right">
                          رقم الهاتف
                        </label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="+966 50 123 4567"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-hidden focus:border-[#051838] focus:ring-1 focus:ring-[#051838] dark:focus:ring-blue-500 transition-all text-right"
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>

                    {/* Row 3: العنوان */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 font-cairo text-right">
                        العنوان
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="الرياض، طريق الملك فهد"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-hidden focus:border-[#051838] focus:ring-1 focus:ring-[#051838] dark:focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 flex justify-start">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center justify-center gap-2 bg-[#0c2444] hover:bg-[#07172c] text-white px-7 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-70"
                      >
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>حفظ التغييرات</span>
                      </button>
                    </div>
                  </form>
                  )}
                </div>
              )}

              {/* Tab 2: WhatsApp Settings */}
              {activeSettingsTab === 'whatsapp' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-600">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>متصل</span>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <h2 className="text-lg sm:text-xl font-bold font-cairo text-slate-900 dark:text-white">
                        إعدادات واتساب والتذكير
                      </h2>
                      <div className="text-emerald-500">
                        <MessageSquare className="w-6 h-6 stroke-[2.2]" />
                      </div>
                    </div>
                  </div>

                  {/* Settings Box */}
                  <div className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/80 rounded-2xl p-5 space-y-6">
                    {/* Toggle Row */}
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setAutoReminder((prev) => !prev);
                          handleSaveReminderSettings();
                        }}
                        className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          autoReminder ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                        role="switch"
                        aria-checked={autoReminder}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white dark:bg-slate-800 shadow-lg ring-0 transition duration-200 ease-in-out ${
                            autoReminder ? '-translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <div className="text-right">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-cairo">
                          التذكير التلقائي
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 font-cairo">
                          إرسال رسائل تذكير تلقائية للعملاء قبل موعد السداد
                        </p>
                      </div>
                    </div>

                    {/* Template */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 font-cairo text-right">
                        قالب رسالة التذكير
                      </label>
                      <textarea
                        rows={3}
                        value={messageTemplate}
                        onChange={(e) => setMessageTemplate(e.target.value)}
                        onBlur={handleSaveReminderSettings}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed outline-hidden focus:border-[#051838] focus:ring-1 focus:ring-[#051838] dark:focus:ring-blue-500 transition-all font-cairo"
                      />
                      <p className="text-xs text-slate-400 font-cairo text-right">
                        المتغيرات المتاحة: [اسم_العميل]، [المبلغ]، [اسم_المؤسسة]
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Security & Access */}
              {activeSettingsTab === 'security' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="text-center mb-8 pb-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-[#0c2444] dark:text-blue-400" />
                    <h2 className="text-xl sm:text-2xl font-bold font-cairo text-slate-900 dark:text-white">
                      الأمان والوصول
                    </h2>
                  </div>

                  <form onSubmit={handleSaveSecurity} className="space-y-8">
                    {/* Password Change Section */}
                    <div className="space-y-5">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-cairo flex items-center gap-2">
                        <Lock className="w-5 h-5 text-slate-400" />
                        تغيير كلمة المرور
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 font-cairo text-right">
                          كلمة المرور الحالية
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-hidden focus:border-[#051838] focus:ring-1 focus:ring-[#051838] dark:focus:ring-blue-500 transition-all"
                          dir="ltr"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 font-cairo text-right">
                            كلمة المرور الجديدة
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-hidden focus:border-[#051838] focus:ring-1 focus:ring-[#051838] dark:focus:ring-blue-500 transition-all"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 font-cairo text-right">
                            تأكيد كلمة المرور الجديدة
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-hidden focus:border-[#051838] focus:ring-1 focus:ring-[#051838] dark:focus:ring-blue-500 transition-all"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-700" />

                    {/* 2FA Section */}
                    <div className="space-y-5">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-cairo flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-slate-400" />
                        التحقق بخطوتين (2FA)
                      </h3>
                      
                      <div className="flex items-center justify-between p-4 bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/80 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                          className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            twoFactorEnabled ? 'bg-blue-600' : 'bg-slate-300'
                          }`}
                          role="switch"
                          aria-checked={twoFactorEnabled}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white dark:bg-slate-800 shadow-lg ring-0 transition duration-200 ease-in-out ${
                              twoFactorEnabled ? '-translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        <div className="text-right">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-cairo">
                            تفعيل التحقق بخطوتين
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 font-cairo">
                            أضف طبقة حماية إضافية لحسابك باستخدام رمز التحقق المرسل لهاتفك.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 flex justify-start">
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 bg-[#0c2444] hover:bg-[#07172c] text-white px-7 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm cursor-pointer"
                      >
                        <span>تحديث إعدادات الأمان</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 4: System Preferences */}
              {activeSettingsTab === 'preferences' && (
                <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xs p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300 transition-colors">
                  <div className="text-center mb-8 pb-4 border-b border-slate-100 dark:border-slate-700 dark:border-slate-700 flex items-center justify-center gap-3">
                    <SlidersHorizontal className="w-6 h-6 text-[#0c2444] dark:text-blue-400 dark:text-blue-400" />
                    <h2 className="text-xl sm:text-2xl font-bold font-cairo text-slate-900 dark:text-white dark:text-white">
                      تفضيلات النظام
                    </h2>
                  </div>

                  <div className="space-y-8">
                    {/* Language Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 dark:border-slate-600 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 dark:text-slate-400 shadow-2xs transition-colors">
                          <Globe className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 dark:text-slate-100 font-cairo">لغة العرض</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 font-cairo mt-0.5">اختر اللغة المفضلة لواجهة المستخدم</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <button
                          type="button"
                          onClick={() => setLanguage('ar')}
                          className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer group ${
                            language === 'ar' 
                              ? 'border-[#0c2444] dark:border-blue-400 dark:border-blue-500 bg-[#f4f7fb] dark:bg-slate-900 dark:bg-blue-900/20 shadow-sm' 
                              : 'border-slate-200 dark:border-slate-700 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            language === 'ar' ? 'border-[#0c2444] dark:border-blue-400 bg-[#0c2444] dark:border-blue-500 dark:bg-blue-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-slate-400 dark:group-hover:border-slate-500'
                          }`}>
                            {language === 'ar' && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                          </div>
                          <div className="flex flex-col flex-1 text-start">
                            <span className="font-bold font-cairo text-slate-800 dark:text-slate-200 dark:text-slate-100 text-sm">العربية</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 font-cairo mt-0.5">Arabic</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setLanguage('en')}
                          className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer group ${
                            language === 'en' 
                              ? 'border-[#0c2444] dark:border-blue-400 dark:border-blue-500 bg-[#f4f7fb] dark:bg-slate-900 dark:bg-blue-900/20 shadow-sm' 
                              : 'border-slate-200 dark:border-slate-700 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            language === 'en' ? 'border-[#0c2444] dark:border-blue-400 bg-[#0c2444] dark:border-blue-500 dark:bg-blue-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-slate-400 dark:group-hover:border-slate-500'
                          }`}>
                            {language === 'en' && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                          </div>
                          <div className="flex flex-col flex-1 text-start">
                            <span className="font-bold font-cairo text-slate-800 dark:text-slate-200 dark:text-slate-100 text-sm">English</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 font-cairo mt-0.5">الإنجليزية</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-700 dark:border-slate-700" />

                    {/* Theme Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 dark:border-slate-600 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 dark:text-slate-400 shadow-2xs transition-colors">
                          <Monitor className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 dark:text-slate-100 font-cairo">المظهر</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 font-cairo mt-0.5">اختر الوضع الليلي أو النهاري للنظام</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        {/* Light Mode */}
                        <button
                          type="button"
                          onClick={() => setTheme('light')}
                          className={`relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer group ${
                            theme === 'light' 
                              ? 'border-[#0c2444] dark:border-blue-400 dark:border-blue-500 bg-[#f4f7fb] dark:bg-slate-900 dark:bg-blue-900/20 shadow-sm' 
                              : 'border-slate-200 dark:border-slate-700 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                            theme === 'light' ? 'bg-[#0c2444] dark:bg-blue-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 dark:bg-slate-700 text-slate-500 dark:text-slate-400 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 group-hover:text-slate-700 dark:text-slate-300 dark:group-hover:text-slate-200'
                          }`}>
                            <Sun className="w-6 h-6 stroke-[2]" />
                          </div>
                          <span className={`font-bold font-cairo text-sm transition-colors ${theme === 'light' ? 'text-[#0c2444] dark:text-blue-400 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 dark:text-slate-300'}`}>الوضع النهاري</span>
                          {theme === 'light' && (
                            <div className="absolute top-3 right-3">
                              <Check className="w-4 h-4 text-[#0c2444] dark:text-blue-400 dark:text-blue-500 stroke-[3]" />
                            </div>
                          )}
                        </button>

                        {/* Dark Mode */}
                        <button
                          type="button"
                          onClick={() => setTheme('dark')}
                          className={`relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer group ${
                            theme === 'dark' 
                              ? 'border-[#0c2444] dark:border-blue-400 dark:border-blue-500 bg-[#0c2444] dark:bg-slate-900 shadow-sm' 
                              : 'border-slate-200 dark:border-slate-700 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                            theme === 'dark' ? 'bg-white/10 dark:bg-blue-500/20 text-white dark:text-blue-400 shadow-inner' : 'bg-slate-100 dark:bg-slate-700 dark:bg-slate-700 text-slate-500 dark:text-slate-400 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 group-hover:text-slate-700 dark:text-slate-300 dark:group-hover:text-slate-200'
                          }`}>
                            <Moon className="w-6 h-6 stroke-[2]" />
                          </div>
                          <span className={`font-bold font-cairo text-sm transition-colors ${theme === 'dark' ? 'text-white dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 dark:text-slate-300'}`}>الوضع الليلي</span>
                          {theme === 'dark' && (
                            <div className="absolute top-3 right-3">
                              <Check className="w-4 h-4 text-white dark:text-blue-500 stroke-[3]" />
                            </div>
                          )}
                        </button>

                        {/* System Mode */}
                        <button
                          type="button"
                          onClick={() => setTheme('system')}
                          className={`relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer group ${
                            theme === 'system' 
                              ? 'border-[#0c2444] dark:border-blue-400 dark:border-blue-500 bg-[#f4f7fb] dark:bg-slate-900 dark:bg-blue-900/20 shadow-sm' 
                              : 'border-slate-200 dark:border-slate-700 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                            theme === 'system' ? 'bg-[#0c2444] dark:bg-blue-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 dark:bg-slate-700 text-slate-500 dark:text-slate-400 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 group-hover:text-slate-700 dark:text-slate-300 dark:group-hover:text-slate-200'
                          }`}>
                            <Monitor className="w-6 h-6 stroke-[2]" />
                          </div>
                          <span className={`font-bold font-cairo text-sm transition-colors ${theme === 'system' ? 'text-[#0c2444] dark:text-blue-400 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 dark:text-slate-300'}`}>حسب النظام</span>
                          {theme === 'system' && (
                            <div className="absolute top-3 right-3">
                              <Check className="w-4 h-4 text-[#0c2444] dark:text-blue-400 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 flex justify-start">
                      <button
                        type="button"
                        onClick={handleSavePreferences}
                        className="inline-flex items-center justify-center gap-2 bg-[#0c2444] hover:bg-[#07172c] text-white px-7 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm cursor-pointer"
                      >
                        <span>حفظ التفضيلات</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Section in visual layout (4 cols in desktop): Profile Box, Plan Card, Tabs */}
            <div className="lg:col-span-4 space-y-5 order-1 lg:order-2">
              {/* Box 1: Merchant Profile Card with Avatar & Edit Button */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex items-center justify-between">
                {/* Organization & Manager Info (Right in RTL) */}
                <div className="text-right">
                  <h2 className="text-base font-extrabold font-cairo text-slate-900 dark:text-white leading-tight">
                    {profile.businessName || 'مؤسسة الأفق التجاري'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-cairo mt-1">
                    {profile.fullName || 'أحمد محمد'}
                  </p>
                </div>

                {/* Avatar with Edit Pencil (Left in RTL) */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-slate-100 shadow-xs bg-[#0c2444] text-white flex items-center justify-center font-bold text-xl font-cairo">
                    {avatarPreview && !avatarPreview.includes('merchant-avatar') ? (
                      <img
                        src={avatarPreview}
                        alt={profile.fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span>{profile.fullName?.trim()?.charAt(0) || 'ت'}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#0c2444] text-white rounded-full flex items-center justify-center ring-2 ring-white hover:bg-[#07172c] transition-colors shadow-sm cursor-pointer"
                    title="تغيير الصورة الشخصية"
                    aria-label="تغيير الصورة الشخصية"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Box 2: Current Subscription Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                {/* Plan Title & Icon */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-2xs">
                    <Award className="w-5 h-5 stroke-[2.2]" />
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-cairo block">
                      الباقة الحالية
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600 font-cairo">
                      باقة الأعمال (نشط)
                    </span>
                  </div>
                </div>

                {/* Renewal & Customers Info - Clean, spaced, and beautiful */}
                <div className="flex items-center justify-between pt-3.5 border-t border-slate-100/90 text-xs">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-medium font-cairo block mb-1">
                      العملاء المتبقين
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-cairo text-xs sm:text-sm">
                      غير محدود
                    </span>
                  </div>

                  <div className="text-left">
                    <span className="text-[11px] text-slate-400 font-medium font-cairo block mb-1">
                      تاريخ التجديد
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-cairo text-xs sm:text-sm">
                      17 سبتمبر 2026
                    </span>
                  </div>
                </div>

                {/* Upgrade Button */}
                <button
                  type="button"
                  onClick={() => navigate(PATHS.SUBSCRIPTIONS)}
                  className="w-full bg-[#183462] hover:bg-[#0c2444] text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors duration-200 shadow-xs cursor-pointer"
                >
                  ترقية الباقة
                </button>
              </div>

              {/* Box 3: Navigation Tabs List */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                {/* Tab 1: الملف الشخصي */}
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('profile')}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-sm transition-all duration-150 cursor-pointer ${
                    activeSettingsTab === 'profile'
                      ? 'bg-[#eef4ff] text-blue-700 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 font-medium'
                  }`}
                >
                  <ChevronLeft
                    className={`w-4 h-4 ${
                      activeSettingsTab === 'profile' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <div className="flex items-center gap-3">
                    <span>الملف الشخصي</span>
                    <User className="w-4 h-4" />
                  </div>
                </button>

                {/* Tab 2: إعدادات واتساب */}
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('whatsapp')}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-sm transition-all duration-150 cursor-pointer ${
                    activeSettingsTab === 'whatsapp'
                      ? 'bg-[#eef4ff] text-blue-700 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 font-medium'
                  }`}
                >
                  <ChevronLeft
                    className={`w-4 h-4 ${
                      activeSettingsTab === 'whatsapp' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <div className="flex items-center gap-3">
                    <span>إعدادات واتساب</span>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </button>

                {/* Tab 3: الأمان والوصول */}
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('security')}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-sm transition-all duration-150 cursor-pointer ${
                    activeSettingsTab === 'security'
                      ? 'bg-[#eef4ff] text-blue-700 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 font-medium'
                  }`}
                >
                  <ChevronLeft
                    className={`w-4 h-4 ${
                      activeSettingsTab === 'security' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <div className="flex items-center gap-3">
                    <span>الأمان والوصول</span>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </button>

                {/* Tab 4: تفضيلات النظام */}
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('preferences')}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-sm transition-all duration-150 cursor-pointer ${
                    activeSettingsTab === 'preferences'
                      ? 'bg-[#eef4ff] text-blue-700 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 font-medium'
                  }`}
                >
                  <ChevronLeft
                    className={`w-4 h-4 ${
                      activeSettingsTab === 'preferences' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <div className="flex items-center gap-3">
                    <span>تفضيلات النظام</span>
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
