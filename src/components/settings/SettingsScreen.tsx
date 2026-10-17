import { useState, useEffect, useRef } from 'react';
import type { FC, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '../../routes/paths';
import {
  Pencil,
  Award,
  User,
  ShieldCheck,
  SlidersHorizontal,
  ChevronLeft,
  Check,
  Loader2,
  AlertCircle,
  Lock,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Monitor,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { TelegramLinkModal } from '../customers/TelegramLinkModal';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { useTheme } from '../../context/ThemeContext';
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
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'telegram' | 'whatsapp' | 'security' | 'preferences'>('profile');

  // Telegram linking state
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [sendTelegramViaWhatsApp, setSendTelegramViaWhatsApp] = useState(false);
  const [isTelegramLinked, setIsTelegramLinked] = useState<boolean>(() => {
    return localStorage.getItem('watheq_merchant_telegram_linked') === 'true';
  });
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [isUnlinkingTelegram, setIsUnlinkingTelegram] = useState(false);

  const confirmUnlinkTelegram = async () => {
    setIsUnlinkingTelegram(true);
    try {
      localStorage.removeItem('watheq_merchant_telegram_linked');
      setIsTelegramLinked(false);
      setShowUnlinkConfirm(false);
      showToast('تم إلغاء ربط Telegram بنجاح!');
    } finally {
      setIsUnlinkingTelegram(false);
    }
  };

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
  const { theme, setTheme } = useTheme();

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
    localStorage.setItem('app_language', language);
    // Theme is already saved via ThemeContext
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

              {/* Tab 2: Telegram Linking Card (Matching Customer Telegram Interface) */}
              {(activeSettingsTab === 'telegram' || activeSettingsTab === 'whatsapp') && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-700 shadow-xs flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Header: Telegram Icon, Title & Subtitle, Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#2AABEE] shadow-2xs">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.46.93-4.12 2.73-.39.26-.74.39-1.06.38-.35-.01-1.02-.2-1.52-.36-.62-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <h2 className="text-lg sm:text-xl font-bold font-cairo text-[#0c2444] dark:text-slate-100">
                          ربط Telegram
                        </h2>
                        <p className="text-xs text-slate-400 font-medium font-cairo">
                          كشف الحساب وتنبيهات الديون
                        </p>
                      </div>
                    </div>

                    {isTelegramLinked ? (
                      <span className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        مرتبط
                      </span>
                    ) : (
                      <span className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        غير مرتبط
                      </span>
                    )}
                  </div>

                  {/* Description matching Customer Telegram Card style */}
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed text-center px-2 font-medium font-cairo">
                    {isTelegramLinked
                      ? 'تم ربط حساب المتجر بنجاح بروبوت وثّق على تيليجرام. تستلم التنبيهات وإشعارات العمليات وإدارة الحساب بشكل فوري.'
                      : 'عند إنشاء الرابط، يمكنك فتح Telegram أو مسح رمز QR لربط حساب متجرك وتلقي الإشعارات الفورية ومتابعة الديون.'}
                  </p>

                  {/* Send via WhatsApp Option per API specs */}
                  <div className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setSendTelegramViaWhatsApp((prev) => !prev)}
                      className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        sendTelegramViaWhatsApp ? 'bg-[#25D366]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      role="switch"
                      aria-checked={sendTelegramViaWhatsApp}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white dark:bg-slate-800 shadow-md ring-0 transition duration-200 ease-in-out ${
                          sendTelegramViaWhatsApp ? '-translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <div className="text-right">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-cairo">
                        إرسال الرابط عبر WhatsApp
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 font-cairo">
                        إرسال رابط التفعيل تلقائياً إلى رقم التاجر المسجل ({profile.phoneNumber || 'رقم هاتفك'})
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons matching Customer Telegram Card */}
                  {isTelegramLinked ? (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowUnlinkConfirm(true)}
                        className="py-3 px-4 rounded-xl text-rose-500 font-bold text-xs sm:text-sm border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>إلغاء الربط</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsTelegramModalOpen(true)}
                        className="py-3 px-4 rounded-xl text-[#2AABEE] font-bold text-xs sm:text-sm border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>تجديد الرابط</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsTelegramModalOpen(true)}
                      className="w-full py-3 px-4 bg-[#2AABEE] hover:bg-[#2299d6] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h8v8H3zm2 2v4h4V5zm8-2h8v8h-8zm2 2v4h4V5zM3 13h8v8H3zm2 2v4h4v-4zm13-2h3v2h-3zm-5 0h3v2h-3zm3 2h2v3h-2zm-3 3h3v2h-3zm3 2h2v3h-2zm-2 0h2v3h-2zm-1-2h2v2h-2zm-2-1h2v2h-2z" />
                      </svg>
                      <span>عرض رمز QR ورابط Telegram</span>
                    </button>
                  )}
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

                {/* Tab 2: ربط Telegram */}
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('telegram')}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-sm transition-all duration-150 cursor-pointer ${
                    activeSettingsTab === 'telegram' || activeSettingsTab === 'whatsapp'
                      ? 'bg-[#eef4ff] text-blue-700 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 font-medium'
                  }`}
                >
                  <ChevronLeft
                    className={`w-4 h-4 ${
                      activeSettingsTab === 'telegram' || activeSettingsTab === 'whatsapp' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <div className="flex items-center gap-3">
                    <span>ربط Telegram</span>
                    <svg className="w-4 h-4 text-[#2AABEE]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.46.93-4.12 2.73-.39.26-.74.39-1.06.38-.35-.01-1.02-.2-1.52-.36-.62-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z" />
                    </svg>
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

      {/* Telegram Link Modal */}
      {isTelegramModalOpen && (
        <TelegramLinkModal
          isOpen={true}
          onClose={() => setIsTelegramModalOpen(false)}
          customerName={profile.fullName || profile.businessName}
          customerPhone={profile.phoneNumber}
          mode={isTelegramLinked ? 'regenerate' : 'generate'}
          linkType="Merchant"
          sendViaWhatsApp={sendTelegramViaWhatsApp}
          onLinked={() => {
            localStorage.setItem('watheq_merchant_telegram_linked', 'true');
            setIsTelegramLinked(true);
          }}
        />
      )}

      {/* Telegram Unlink Confirmation Modal */}
      {showUnlinkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold font-cairo text-slate-900 dark:text-white mb-2">
              إلغاء ربط Telegram
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-cairo">
              هل أنت متأكد من فك ربط حساب Telegram لمتجرك؟ سيتم إيقاف استلام التنبيهات والإشعارات الفورية عبر الحساب الحالي.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={confirmUnlinkTelegram}
                disabled={isUnlinkingTelegram}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-[#fecaca] hover:bg-[#fca5a5] text-[#b91c1c] transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isUnlinkingTelegram ? 'جارٍ الإلغاء...' : 'نعم، إلغاء الربط'}
              </button>

              <button
                type="button"
                onClick={() => setShowUnlinkConfirm(false)}
                disabled={isUnlinkingTelegram}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
