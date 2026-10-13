import { useState, useEffect, useRef, useCallback, useMemo, type FC } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Smartphone,
  Wifi,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Unplug,
} from 'lucide-react';
import {
  createScannerSession,
  revokeScannerSession,
  getScannerSessionStatus,
  toScannerErrorMessage,
  type CreateScannerSessionData,
} from '../../services/scannerService';
import {
  cashierScannerManager,
  type ScannedProductDto,
  type CashierScannerStatus,
} from '../../services/scannerHubService';
import { playScannerBeep } from '../../context/InventoryPosContext';

interface MobileScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateBarcode: (barcode: string) => void;
  onProductScanned?: (product: ScannedProductDto) => void;
}

export const MobileScannerModal: FC<MobileScannerModalProps> = ({
  isOpen,
  onClose,
  onSimulateBarcode,
  onProductScanned,
}) => {
  const [session, setSession] = useState<CreateScannerSessionData | null>(null);
  const [status, setStatus] = useState<CashierScannerStatus>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const [lanHost, setLanHost] = useState<string>(() => {
    return localStorage.getItem('watheq_dev_lan_ip') || '10.5.50.23';
  });

  const activeSessionIdRef = useRef<string | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const statusPollTimerRef = useRef<number | null>(null);
  const autoCloseTimerRef = useRef<number | null>(null);

  // Subscribe to CashierScannerManager status and set callbacks
  useEffect(() => {
    const unsubscribe = cashierScannerManager.subscribeStatus((newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'connected' || newStatus === 'paired') {
        playScannerBeep('success');
        if (statusPollTimerRef.current) {
          window.clearInterval(statusPollTimerRef.current);
          statusPollTimerRef.current = null;
        }
        if (!autoCloseTimerRef.current) {
          autoCloseTimerRef.current = window.setTimeout(() => {
            onClose();
          }, 1500);
        }
      }
    });

    cashierScannerManager.setCallbacks({
      onProductScanned: (prod) => {
        playScannerBeep('scan');
        onProductScanned?.(prod);
        if (prod.barcode) {
          onSimulateBarcode(prod.barcode);
        }
      },
      onBarcodeScanned: (data) => {
        if (data.product) {
          onProductScanned?.(data.product);
        }
        if (data.barcode) {
          onSimulateBarcode(data.barcode);
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [onProductScanned, onSimulateBarcode, onClose]);

  // Network origin configuration
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const resolvedOrigin = useMemo(() => {
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
    const isVirtualOrLocal =
      isLocalhost ||
      currentHost === 'localhost' ||
      currentHost === '127.0.0.1' ||
      currentHost.startsWith('172.') ||
      currentHost.startsWith('192.168.') ||
      currentHost.startsWith('10.');

    if (isVirtualOrLocal && lanHost.trim()) {
      const port = window.location.port ? `:${window.location.port}` : '';
      return `${window.location.protocol}//${lanHost.trim()}${port}`;
    }
    return typeof window !== 'undefined' ? window.location.origin : '';
  }, [isLocalhost, lanHost]);

  const pairingUrl =
    session?.sessionId && session?.pairingSecret
      ? `${resolvedOrigin}/scan?sessionId=${encodeURIComponent(
          session.sessionId
        )}&secret=${encodeURIComponent(session.pairingSecret)}`
      : '';

  const clearTimers = useCallback(() => {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (statusPollTimerRef.current) {
      window.clearInterval(statusPollTimerRef.current);
      statusPollTimerRef.current = null;
    }
    if (autoCloseTimerRef.current) {
      window.clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, []);

  // Initialize or renew a scanner session
  const initSession = useCallback(async () => {
    clearTimers();
    setIsLoading(true);
    setError(null);

    try {
      const data = await createScannerSession();
      if (!data || !data.sessionId) {
        throw new Error('لم يتم استلام بيانات الجلسة من الخادم.');
      }

      setSession(data);
      activeSessionIdRef.current = data.sessionId;

      // Start SignalR Hub connection + WebRTC P2P Host asynchronously
      cashierScannerManager.startSession(data.sessionId).catch((hubErr) => {
        console.warn('[MobileScannerModal] Hub/P2P connection error:', hubErr);
      });

      // Start active polling to detect when phone scans QR and pairs with server
      statusPollTimerRef.current = window.setInterval(async () => {
        if (!activeSessionIdRef.current) return;
        try {
          const check = await getScannerSessionStatus(activeSessionIdRef.current);
          if (check.status === 'Paired' || check.status === 'Connected') {
            console.info('[MobileScannerModal] Mobile scan paired detected via polling:', check.sessionId);
            cashierScannerManager.setManualStatus('connected');
            setStatus('connected');
            playScannerBeep('success');
            if (statusPollTimerRef.current) {
              window.clearInterval(statusPollTimerRef.current);
              statusPollTimerRef.current = null;
            }
            if (!autoCloseTimerRef.current) {
              autoCloseTimerRef.current = window.setTimeout(() => {
                onClose();
              }, 1200);
            }
          }
        } catch {
          // ignore transient poll error
        }
      }, 1500);

      // Calculate countdown in seconds from expiresAt
      const expiry = data.expiresAt ? new Date(data.expiresAt).getTime() : Date.now() + 600000;
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((expiry - now) / 1000));
      setRemainingSeconds(diffSec > 0 ? diffSec : 600);

      // Start countdown timer
      countdownTimerRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearTimers();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(toScannerErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [clearTimers, onClose]);

  useEffect(() => {
    if (isOpen) {
      // If there is already an active session connected or connecting, keep it
      const currentSessionId = cashierScannerManager.getSessionId();
      const currentStatus = cashierScannerManager.getStatus();

      if (currentSessionId && (currentStatus === 'connected' || currentStatus === 'paired')) {
        // Already active
      } else {
        initSession();
      }
    } else {
      clearTimers();
    }

    return () => {
      clearTimers();
    };
  }, [isOpen, initSession, clearTimers]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!pairingUrl) return;
    navigator.clipboard.writeText(pairingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    clearTimers();
    // If closed while still connecting/idle (never paired), revoke session
    if (status === 'connecting' || status === 'idle') {
      if (activeSessionIdRef.current) {
        revokeScannerSession(activeSessionIdRef.current).catch(() => {});
      }
      cashierScannerManager.stopSession().catch(() => {});
    }
    // If paired or connected, keep active in background!
    onClose();
  };

  const handleDisconnect = async () => {
    clearTimers();
    if (activeSessionIdRef.current) {
      try {
        await revokeScannerSession(activeSessionIdRef.current);
      } catch {
        // ignore
      }
    }
    await cashierScannerManager.stopSession();
    setSession(null);
    activeSessionIdRef.current = null;
    onClose();
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                ربط ماسح الجوال اللاسلكي 📲
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اتصال فوري مشفر عبر SignalR WebSocket
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="py-14 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold">جاري إنشاء جلسة ربط آمنة عبر SignalR Hub...</p>
            </div>
          ) : error ? (
            <div className="py-8 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
              <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold">{error}</p>
              <button
                type="button"
                onClick={initSession}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                إعادة المحاولة
              </button>
            </div>
          ) : status === 'connected' || status === 'paired' ? (
            <div className="py-6 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                {status === 'connected' ? 'الماسح متصل وجاهز للعمل! 🟢' : 'تم اقتران الماسح بنجاح! 🟢'}
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                تم الربط بهاتفك بنجاح! سيتم نقلك لشاشة الكاشير لمسح المنتجات فوراً...
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  العودة لنقاط البيع ومتابعة المسح
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Unplug className="w-3.5 h-3.5" />
                  <span>قطع الاتصال</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* QR Code Container */}
              <div
                className="relative mx-auto w-56 bg-white rounded-3xl p-3 border-2 border-dashed shadow-lg flex flex-col items-center justify-center group min-h-[14rem]"
                style={{ borderColor: isLocalhost && !lanHost.trim() ? '#f59e0b' : '#10b981' }}
              >
                {isLocalhost && !lanHost.trim() ? (
                  <div className="w-full text-center space-y-3 p-2">
                    <div className="text-3xl">📶</div>
                    <p className="text-sm font-bold text-amber-700">أدخل IP اللابتوب أولاً</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      الرمز سيشير إلى <span className="font-mono font-bold text-rose-500">localhost</span> وهو لا يعمل على الجوال. أدخل IP اللابتوب على الشبكة:
                    </p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="مثال: 10.5.50.23"
                        value={lanHost}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setLanHost(val);
                          localStorage.setItem('watheq_dev_lan_ip', val);
                        }}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border-2 border-amber-400 rounded-lg text-slate-800 font-mono text-left focus:outline-none focus:ring-2 focus:ring-amber-400"
                        autoFocus
                      />
                    </div>
                  </div>
                ) : pairingUrl ? (
                  <>
                    <QRCodeSVG
                      value={pairingUrl}
                      size={168}
                      level="M"
                      includeMargin={false}
                      className="rounded-lg"
                    />
                    <div className="absolute inset-x-0 bottom-2 text-[10px] font-bold text-emerald-600 bg-white/95 py-0.5 rounded-full mx-4 shadow-xs flex items-center justify-center gap-1 border border-emerald-100">
                      <Wifi className="w-3 h-3 animate-pulse text-emerald-500" />
                      <span>امسح بكاميرا الجوال الآن</span>
                    </div>
                  </>
                ) : (
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                )}
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  صلاحية الجلسة:
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {formatCountdown(remainingSeconds)}
                </span>
                {remainingSeconds === 0 && (
                  <button
                    type="button"
                    onClick={initSession}
                    className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    تجديد
                  </button>
                )}
              </div>

              {/* Show current QR target URL */}
              {resolvedOrigin && (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <p
                    className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-left truncate text-[11px]"
                    dir="ltr"
                  >
                    🌐 {resolvedOrigin}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const newIp = window.prompt(
                        'أدخل IP جهازك على شبكة الواي فاي:',
                        lanHost || '10.5.50.23'
                      );
                      if (newIp !== null) {
                        const trimmed = newIp.trim();
                        setLanHost(trimmed);
                        if (trimmed) {
                          localStorage.setItem('watheq_dev_lan_ip', trimmed);
                        } else {
                          localStorage.removeItem('watheq_dev_lan_ip');
                        }
                      }
                    }}
                    className="text-[10px] font-bold text-slate-500 hover:text-emerald-700 underline cursor-pointer shrink-0 mr-2"
                  >
                    تعديل الـ IP
                  </button>
                </div>
              )}

              {/* Secret Key Display */}
              {session?.pairingSecret && (
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    سر الربط (Pairing Secret):
                  </span>
                  <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 max-w-full">
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[240px]">
                      {session.pairingSecret}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-1 text-slate-400 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                      title="نسخ رابط الربط"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                امسح الكود بكاميرا هاتفك ليفتح ماسح وثّق مباشرة، أو أرسل الرابط لمساعدك في المحل. أي
                باركود يتم مسحه بالهاتف سيسقط في شاشة الكاشير لحظياً عبر SignalR!
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    window.open(pairingUrl || '/scan', '_blank');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800/60 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>معاينة واجهة كاميرا الجوال الآن (نافذة جديدة) 📲</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          <button
            type="button"
            onClick={initSession}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث الجلسة
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
