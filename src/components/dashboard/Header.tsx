import { useState, useRef, useEffect, useCallback } from 'react';
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
  Check,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMerchantProfile } from '../../services/merchantProfileService';
import { PATHS } from '../../routes/paths';
import { LogoutModal } from './LogoutModal';
import { logoutUser } from '../../services/authService';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/notificationService';
import type { AppNotification } from '../../types/notification';

interface HeaderProps {
  onMenuClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  title?: string;
  hideSearch?: boolean;
  className?: string;
}

export const Header: FC<HeaderProps> = ({
  onMenuClick,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'البحث في العمليات...',
  title,
  hideSearch = false,
  className = '',
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

  // Notifications state from API
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoadingNotifs(true);
      const [list, count] = await Promise.all([
        getNotifications().catch(() => []),
        getUnreadNotificationsCount().catch(() => 0),
      ]);
      setNotifications(list);
      // If count from API is 0 but list has unread items, calculate from list
      const calculatedUnread = list.filter((n) => !n.isRead).length;
      setUnreadCount(count > 0 ? count : calculatedUnread);
    } catch {
      // ignore
    } finally {
      setIsLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);

    // Listen for app-level activity events (e.g. debt added, payment registered)
    const handleActivity = () => {
      loadNotifications();
    };
    window.addEventListener('watheq:activity-updated', handleActivity);
    window.addEventListener('focus', handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('watheq:activity-updated', handleActivity);
      window.removeEventListener('focus', handleActivity);
    };
  }, [loadNotifications]);

  // Refresh notifications immediately when opening dropdown
  useEffect(() => {
    if (isNotifOpen) {
      loadNotifications();
    }
  }, [isNotifOpen, loadNotifications]);

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

  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(id);
    } catch {
      // ignore network errors for notification read status
    }
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
    } catch {
      // ignore
    }
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

  const getNotifIcon = (type: AppNotification['type']) => {
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
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <>
      <header
        className={`w-full bg-white dark:bg-slate-800 border-b border-slate-100/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs ${className}`}
        dir="rtl"
      >
        {/* Right Side in RTL: Mobile Toggle & Search Bar / Title */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600 dark:bg-slate-700 transition-colors cursor-pointer"
            aria-label="فتح القائمة الجانبية"
          >
            <Menu className="w-6 h-6" />
          </button>

          {title ? (
            <h1 className="text-xl sm:text-2xl font-extrabold font-cairo text-slate-900 dark:text-white tracking-tight">
              {title}
            </h1>
          ) : !hideSearch ? (
            /* Search Input Bar */
            <div className="relative w-full max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/90 text-slate-800 dark:text-slate-200 text-sm rounded-xl pr-10 pl-4 py-2.5 outline-hidden focus:border-[#051838] focus:bg-white dark:bg-slate-800 transition-all duration-200 placeholder:text-slate-400 font-cairo"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : null}
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
                  ? 'bg-slate-100 dark:bg-slate-700 text-[#051838] dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#051838] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50'
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
                className="absolute left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
                dir="rtl"
              >
                {/* Panel Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold font-cairo text-slate-900 dark:text-white text-base">
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
                      onClick={handleMarkAllAsRead}
                      className="text-xs font-semibold text-[#051838] dark:text-white hover:underline cursor-pointer"
                    >
                      تحديد الكل كمقروء
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex border-b border-slate-100 dark:border-slate-700 px-4 pt-2 gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <button
                    type="button"
                    onClick={() => setNotifFilter('all')}
                    className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                      notifFilter === 'all'
                        ? 'border-[#051838] text-[#051838] dark:text-white font-bold'
                        : 'border-transparent hover:text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    الكل ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifFilter('unread')}
                    className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                      notifFilter === 'unread'
                        ? 'border-[#051838] text-[#051838] dark:text-white font-bold'
                        : 'border-transparent hover:text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    غير مقروءة ({unreadCount})
                  </button>
                </div>

                {/* Notifications List */}
                <div className="max-h-84 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                  {isLoadingNotifs && notifications.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#051838] dark:text-white" />
                      <span className="text-xs font-medium font-cairo">جاري تحميل الإشعارات...</span>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-medium">لا توجد إشعارات حالياً</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                        className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors cursor-pointer group relative ${
                          notif.isRead ? 'bg-white dark:bg-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-700/80' : 'bg-blue-50/30 hover:bg-blue-50/60'
                        }`}
                      >
                        {getNotifIcon(notif.type)}

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-sm font-semibold truncate ${
                                notif.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white font-bold'
                              }`}
                            >
                              {notif.title}
                            </p>
                            {!notif.isRead ? (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="غير مقروء" />
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400 shrink-0 flex items-center gap-0.5">
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span>مقروء</span>
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-cairo">
                            {notif.message}
                          </p>

                          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{notif.time}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Panel Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 bg-slate-50/70 dark:bg-slate-800/70 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      {unreadCount === 0 ? 'جميع الإشعارات مقروءة' : `${unreadCount} إشعار غير مقروء`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-[#051838] dark:text-white font-bold hover:underline cursor-pointer"
                    >
                      إغلاق
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>


          {/* User Profile Dropdown Container */}
          <div className="relative pr-1 sm:pr-2 border-r border-slate-100 dark:border-slate-700" ref={profileDropdownRef}>
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
              <div className="relative w-10 h-10 rounded-full ring-2 ring-slate-100 overflow-hidden shadow-xs group-hover:ring-[#051838]/20 transition-all duration-200 bg-[#051838] text-white flex items-center justify-center font-bold text-sm font-cairo">
                {profile.profileImagePath && !profile.profileImagePath.includes('merchant-avatar') ? (
                  <img
                    src={profile.profileImagePath}
                    alt={profile.fullName || 'صورة التاجر'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{profile.fullName?.trim()?.charAt(0) || 'ت'}</span>
                )}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:text-slate-300 transition-transform duration-200 hidden sm:block ${
                  isProfileOpen ? 'rotate-180 text-[#051838] dark:text-white' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div
                className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
                dir="rtl"
              >
                {/* User Info Header */}
                <div className="p-4 bg-slate-50/7 dark:bg-slate-800/70 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl ring-1 ring-slate-200 overflow-hidden shrink-0 shadow-2xs bg-[#051838] text-white flex items-center justify-center font-bold text-base font-cairo">
                      {profile.profileImagePath && !profile.profileImagePath.includes('merchant-avatar') ? (
                        <img
                          src={profile.profileImagePath}
                          alt={profile.fullName || 'صورة التاجر'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span>{profile.fullName?.trim()?.charAt(0) || 'ت'}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold font-cairo text-slate-900 dark:text-white truncate">
                        {profile.fullName || 'أحمد محمد'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-cairo">
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
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[#051838] dark:hover:text-white transition-colors cursor-pointer text-right"
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
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[#051838] dark:hover:text-white transition-colors cursor-pointer text-right"
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
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[#051838] dark:hover:text-white transition-colors cursor-pointer text-right"
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
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[#051838] dark:hover:text-white transition-colors cursor-pointer text-right"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>مركز المساعدة</span>
                  </button>
                </div>

                {/* Logout Button */}
                <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/4 dark:bg-slate-800/40 dark:bg-slate-800/40">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer text-right"
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

