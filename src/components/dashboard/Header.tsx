import { useState, useRef, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import type { FC } from 'react';
import {
  Search,
  Bell,
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
  Moon,
  Sun,
  BellRing,
  X,
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
import { useTheme } from '../../context/ThemeContext';

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
  searchPlaceholder = 'ابحث باسم العميل أو العملية...',
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

  const { setTheme, isDarkMode } = useTheme();

  // Logout modal states
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Notifications state from API
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback((isMountedCheck?: () => boolean) => {
    Promise.all([
      getNotifications().catch(() => []),
      getUnreadNotificationsCount().catch(() => 0),
    ])
      .then(([list, count]) => {
        if (isMountedCheck && !isMountedCheck()) return;
        setNotifications(list);
        const calculatedUnread = list.filter((n) => !n.isRead).length;
        setUnreadCount(count > 0 ? count : calculatedUnread);
      })
      .finally(() => {
        if (isMountedCheck && !isMountedCheck()) return;
        setIsLoadingNotifs(false);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    const isActive = () => isMounted;

    fetchNotifications(isActive);

    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(() => fetchNotifications(isActive), 30000);

    // Listen for app-level activity events (e.g. debt added, payment registered)
    const handleActivity = () => {
      fetchNotifications(isActive);
    };
    window.addEventListener('watheq:activity-updated', handleActivity);
    window.addEventListener('focus', handleActivity);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('watheq:activity-updated', handleActivity);
      window.removeEventListener('focus', handleActivity);
    };
  }, [fetchNotifications]);

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
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'debt':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/60 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      case 'customer':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/60 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4" />
          </div>
        );
      case 'report':
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <>
      <header
        className={`w-full h-16 bg-white/95 dark:bg-[#0F1623]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/90 px-4 sm:px-7 flex items-center justify-between gap-4 sticky top-0 z-30 ${className}`}
        dir="rtl"
      >
        {/* Right Side in RTL: Mobile Toggle & Search Bar / Title */}
        <div className="flex items-center gap-3 flex-1 max-w-md min-w-0">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 transition-colors cursor-pointer shrink-0"
            aria-label="فتح القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </button>

          {title ? (
            <h1 className="text-lg sm:text-xl font-bold font-cairo text-slate-900 dark:text-white tracking-tight truncate">
              {title}
            </h1>
          ) : !hideSearch ? (
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-9 bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 text-[13px] rounded-lg pr-9 pl-8 outline-hidden focus:border-slate-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-800 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 font-cairo"
              />
              {searchQuery && onSearchChange && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                  aria-label="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : null}
        </div>

        {/* Left Side in RTL: Theme, Notifications & Merchant Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 relative shrink-0">
          {/* Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              const isDark = !isDarkMode;
              const x = e.clientX;
              const y = e.clientY;
              const endRadius = Math.hypot(
                Math.max(x, innerWidth - x),
                Math.max(y, innerHeight - y)
              );

              if (!document.startViewTransition) {
                setTheme(isDark ? 'dark' : 'light');
                return;
              }

              document.documentElement.classList.add('is-transitioning');

              const transition = document.startViewTransition(() => {
                flushSync(() => {
                  setTheme(isDark ? 'dark' : 'light');
                });
              });

              transition.ready.then(() => {
                const clipPath = [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ];

                document.documentElement.animate(
                  {
                    clipPath: isDark ? clipPath : [...clipPath].reverse(),
                  },
                  {
                    duration: 500,
                    easing: 'ease-in-out',
                    fill: 'forwards',
                    pseudoElement: isDark
                      ? '::view-transition-new(root)'
                      : '::view-transition-old(root)',
                  }
                );
              });

              transition.finished.finally(() => {
                document.documentElement.classList.remove('is-transitioning');
              });
            }}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200/70 dark:hover:border-slate-700/70 transition-colors cursor-pointer"
            title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            aria-label="تبديل المظهر"
          >
            {isDarkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          {/* Notification Bell Dropdown Container */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              type="button"
              onClick={() => {
                const nextOpen = !isNotifOpen;
                setIsNotifOpen(nextOpen);
                setIsProfileOpen(false);
                if (nextOpen) {
                  setIsLoadingNotifs(true);
                  fetchNotifications();
                }
              }}
              className={`relative w-9 h-9 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                isNotifOpen
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200/70 dark:hover:border-slate-700/70'
              }`}
              title="الإشعارات"
              aria-label="الإشعارات"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 min-w-4 h-4 px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full ring-2 ring-white dark:ring-[#0F1623] flex items-center justify-center tabular-nums">
                  {unreadCount > 9 ? '+9' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {isNotifOpen && (
              <div
                className="absolute left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#111827] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden z-50"
                dir="rtl"
              >
                {/* Panel Header */}
                <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold font-cairo text-slate-900 dark:text-white text-sm">
                      الإشعارات والتنبيهات
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/60 rounded-md tabular-nums">
                        {unreadCount} غير مقروء
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
                    >
                      تحديد الكل كمقروء
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex border-b border-slate-200/80 dark:border-slate-800 px-4 pt-2 gap-5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <button
                    type="button"
                    onClick={() => setNotifFilter('all')}
                    className={`pb-2 border-b-2 transition-colors cursor-pointer tabular-nums ${
                      notifFilter === 'all'
                        ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold'
                        : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    الكل ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifFilter('unread')}
                    className={`pb-2 border-b-2 transition-colors cursor-pointer tabular-nums ${
                      notifFilter === 'unread'
                        ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold'
                        : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    غير مقروءة ({unreadCount})
                  </button>
                </div>

                {/* Notifications List */}
                <div className="max-h-84 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoadingNotifs && notifications.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                      <span className="text-xs font-medium font-cairo">جاري تحميل الإشعارات...</span>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 dark:text-slate-500">
                      <Bell className="w-7 h-7 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                      <p className="text-xs font-medium">لا توجد إشعارات حالياً</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                        className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                          notif.isRead
                            ? 'bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            : 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30'
                        }`}
                      >
                        {getNotifIcon(notif.type)}

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-[13px] truncate ${
                                notif.isRead
                                  ? 'font-medium text-slate-700 dark:text-slate-300'
                                  : 'font-bold text-slate-900 dark:text-white'
                              }`}
                            >
                              {notif.title}
                            </p>
                            {!notif.isRead ? (
                              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" title="غير مقروء" />
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

                          <div className="flex items-center pt-0.5 text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
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
                  <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium tabular-nums">
                      {unreadCount === 0 ? 'جميع الإشعارات مقروءة' : `${unreadCount} غير مقروءة`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-slate-700 dark:text-slate-300 font-semibold hover:underline cursor-pointer"
                    >
                      إغلاق
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" aria-hidden="true" />

          {/* User Profile Dropdown Container */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotifOpen(false);
              }}
              className="flex items-center gap-2.5 py-1 pr-1 pl-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200/70 dark:hover:border-slate-700/70 focus:outline-hidden transition-colors cursor-pointer"
              aria-expanded={isProfileOpen}
              aria-label="قائمة المستخدم"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#0A1D37] dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs font-cairo shrink-0 border border-slate-200/40 dark:border-slate-600">
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

              <div className="hidden md:flex flex-col items-start text-right leading-tight max-w-[130px]">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate w-full">
                  {profile.fullName || 'حساب التاجر'}
                </span>
                <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 truncate w-full">
                  {profile.businessName || 'المتجر'}
                </span>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 hidden sm:block ${
                  isProfileOpen ? 'rotate-180 text-slate-700 dark:text-slate-200' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div
                className="absolute left-0 mt-2 w-72 bg-white dark:bg-[#111827] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden z-50"
                dir="rtl"
              >
                {/* User Info Header */}
                <div className="p-4 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-[#0A1D37] dark:bg-slate-700 text-white flex items-center justify-center font-bold text-sm font-cairo border border-slate-200/40 dark:border-slate-600">
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
                        {profile.fullName || 'حساب التاجر'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-cairo">
                        {profile.businessName || 'متجر وثّق'}
                      </p>
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Check className="w-3 h-3" />
                        <span>حساب موثّق</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-1.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate(PATHS.SETTINGS);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-right"
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
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-right"
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
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-right"
                  >
                    <BarChart3 className="w-4 h-4 text-slate-400" />
                    <span>التقارير المالية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate(PATHS.REMINDERS);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-right"
                  >
                    <BellRing className="w-4 h-4 text-slate-400" />
                    <span>إعدادات التذكيرات</span>
                  </button>
                </div>

                {/* Logout Button */}
                <div className="p-1.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer text-right"
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
