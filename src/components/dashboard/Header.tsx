import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import {
  Search,
  Bell,
  HelpCircle,
  Menu,
  Settings,
  CreditCard,
  BarChart3,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserPlus,
  FileText,
  Trash2,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMerchantProfile } from '../../services/merchantProfileService';
import { PATHS } from '../../routes/paths';
import { LogoutModal } from './LogoutModal';
import { logoutUser } from '../../services/authService';

interface HeaderProps {
  onMenuClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'payment' | 'debt' | 'customer' | 'report';
}

const NOTIFICATIONS_STORAGE_KEY = 'watheq_notifications_list';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'دفعة جديدة مستلمة',
    message: 'قام العميل خالد السعد بسداد مبلغ 1,200 ريال عبر التحويل البنكي.',
    time: 'منذ 15 دقيقة',
    isRead: false,
    type: 'payment',
  },
  {
    id: 'n-2',
    title: 'تذكير باستحقاق دين',
    message: 'يستحق اليوم دين بقيمة 4,500 ريال على مؤسسة النور للتجارة.',
    time: 'منذ ساعتين',
    isRead: false,
    type: 'debt',
  },
  {
    id: 'n-3',
    title: 'إضافة عميل جديد',
    message: 'تم إضافة العميل "شركة التقنية الحديثة" بنجاح إلى قاعدة البيانات.',
    time: 'أمس',
    isRead: false,
    type: 'customer',
  },
  {
    id: 'n-4',
    title: 'تقرير مالي جاهز',
    message: 'تم إنشاء تقرير التحصيل الأسبوعي وجاهز للتصدير كملف PDF.',
    time: 'منذ يومين',
    isRead: true,
    type: 'report',
  },
];

export const Header: FC<HeaderProps> = ({
  onMenuClick,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'البحث في العمليات...',
}) => {
  const navigate = useNavigate();
  const profile = useMerchantProfile();

  // Dropdown states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  // Logout modal states
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Notifications state with localStorage persistence
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_NOTIFICATIONS;
  });

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Persist notifications on change
  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    await logoutUser();
    setIsLoggingOut(false);
    setIsLogoutModalOpen(false);
    setIsProfileOpen(false);
    navigate(PATHS.LOGIN, { replace: true });
  };

  const filteredNotifications =
    notifFilter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'payment':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'debt':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      case 'customer':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4" />
          </div>
        );
      case 'report':
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <>
      <header
        className="w-full bg-white border-b border-slate-100/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs"
        dir="rtl"
      >
        {/* Right Side in RTL: Mobile Toggle & Search Bar */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="فتح القائمة الجانبية"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search Input Bar */}
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-[#f8fafc] border border-slate-200/90 text-slate-800 text-sm rounded-xl pr-10 pl-4 py-2.5 outline-hidden focus:border-[#051838] focus:bg-white transition-all duration-200 placeholder:text-slate-400 font-cairo"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Left Side in RTL: Actions & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 relative">
          {/* Notification Bell Dropdown Container */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsProfileOpen(false);
              }}
              className={`relative p-2 rounded-xl transition-colors duration-200 cursor-pointer ${
                isNotifOpen
                  ? 'bg-slate-100 text-[#051838]'
                  : 'text-slate-600 hover:text-[#051838] hover:bg-slate-50'
              }`}
              title="التنبيهات"
              aria-label="التنبيهات"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 left-1.5 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white flex items-center justify-center animate-in zoom-in-50">
                  {unreadCount > 9 ? '+9' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {isNotifOpen && (
              <div
                className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
                dir="rtl"
              >
                {/* Panel Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold font-tajawal text-slate-900 text-base">
                      الإشعارات والتنبيهات
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 rounded-full">
                        {unreadCount} جديدة
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs font-semibold text-[#051838] hover:underline cursor-pointer"
                    >
                      تحديد الكل كمقروء
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex border-b border-slate-100 px-4 pt-2 gap-4 text-xs font-medium text-slate-500">
                  <button
                    type="button"
                    onClick={() => setNotifFilter('all')}
                    className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                      notifFilter === 'all'
                        ? 'border-[#051838] text-[#051838] font-bold'
                        : 'border-transparent hover:text-slate-800'
                    }`}
                  >
                    الكل ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifFilter('unread')}
                    className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                      notifFilter === 'unread'
                        ? 'border-[#051838] text-[#051838] font-bold'
                        : 'border-transparent hover:text-slate-800'
                    }`}
                  >
                    غير مقروءة ({unreadCount})
                  </button>
                </div>

                {/* Notifications List */}
                <div className="max-h-84 overflow-y-auto divide-y divide-slate-100">
                  {filteredNotifications.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-medium">لا توجد إشعارات حالياً</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors cursor-pointer group relative ${
                          notif.isRead ? 'bg-white hover:bg-slate-50/80' : 'bg-blue-50/30 hover:bg-blue-50/60'
                        }`}
                      >
                        {getNotifIcon(notif.type)}

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-sm font-semibold truncate ${
                                notif.isRead ? 'text-slate-700' : 'text-slate-900 font-bold'
                              }`}
                            >
                              {notif.title}
                            </p>
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                            )}
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-cairo">
                            {notif.message}
                          </p>

                          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{notif.time}</span>
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif.id);
                              }}
                              title="حذف التنبيه"
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Panel Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={clearAllNotifications}
                      className="text-slate-500 hover:text-rose-600 font-medium transition-colors cursor-pointer"
                    >
                      مسح كافة الإشعارات
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-[#051838] font-bold hover:underline cursor-pointer"
                    >
                      إغلاق
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Help Center Icon Button */}
          <button
            type="button"
            onClick={() => navigate(PATHS.HELP)}
            className="p-2 rounded-xl text-slate-600 hover:text-[#051838] hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
            title="مركز المساعدة"
            aria-label="مركز المساعدة"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* User Profile Dropdown Container */}
          <div className="relative pr-1 sm:pr-2 border-r border-slate-100" ref={profileDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotifOpen(false);
              }}
              className="flex items-center gap-2 rounded-full focus:outline-hidden group cursor-pointer"
              aria-expanded={isProfileOpen}
              aria-label="قائمة المستخدم"
            >
              <div className="relative w-10 h-10 rounded-full ring-2 ring-slate-100 overflow-hidden shadow-xs group-hover:ring-[#051838]/20 transition-all duration-200">
                <img
                  src={profile.profileImagePath || '/merchant-avatar.jpg'}
                  alt={profile.fullName || 'صورة التاجر'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 hidden sm:block ${
                  isProfileOpen ? 'rotate-180 text-[#051838]' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div
                className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
                dir="rtl"
              >
                {/* User Info Header */}
                <div className="p-4 bg-slate-50/70 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl ring-1 ring-slate-200 overflow-hidden shrink-0 shadow-2xs">
                      <img
                        src={profile.profileImagePath || '/merchant-avatar.jpg'}
                        alt={profile.fullName || 'صورة التاجر'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold font-tajawal text-slate-900 truncate">
                        {profile.fullName || 'أحمد محمد'}
                      </h4>
                      <p className="text-xs text-slate-500 truncate font-cairo">
                        {profile.businessName || 'مؤسسة الأفق التجاري'}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <Check className="w-3 h-3" />
                        <span>تاجر موثّق</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate(PATHS.SETTINGS);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#051838] transition-colors cursor-pointer text-right"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>إعدادات الحساب</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate(PATHS.SUBSCRIPTIONS);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#051838] transition-colors cursor-pointer text-right"
                  >
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span>باقات الاشتراك</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate(PATHS.REPORTS);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#051838] transition-colors cursor-pointer text-right"
                  >
                    <BarChart3 className="w-4 h-4 text-slate-400" />
                    <span>التقارير المالية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate(PATHS.HELP);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#051838] transition-colors cursor-pointer text-right"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>مركز المساعدة</span>
                  </button>
                </div>

                {/* Logout Button */}
                <div className="p-2 border-t border-slate-100 bg-slate-50/40">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-right"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />
    </>
  );
};

