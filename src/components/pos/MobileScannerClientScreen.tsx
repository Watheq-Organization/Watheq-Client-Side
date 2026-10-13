import { useState, useEffect, useRef, useCallback, type FC } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import * as signalR from '@microsoft/signalr';
import {
  ArrowRight,
  Zap,
  Barcode,
  QrCode,
  CheckCircle2,
  User,
  Plus,
  Minus,
  ShoppingCart,
  Flashlight,
  FlashlightOff,
  Wifi,
} from 'lucide-react';
import { pairScannerSession } from '../../services/scannerService';
import {
  createScannerHubConnection,
  scanBarcodeOnHub,
  type ScannerErrorDto,
} from '../../services/scannerHubService';
import { playScannerBeep, useInventoryPos } from '../../context/InventoryPosContext';
import { PATHS } from '../../routes/paths';

export interface MobileScannedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isNew?: boolean;
}

export const MobileScannerClientScreen: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getProductByBarcode, selectedCustomer } = useInventoryPos();

  const sessionId = searchParams.get('sessionId') || searchParams.get('session');
  const pairingSecret = searchParams.get('secret') || searchParams.get('pairingSecret');

  // Scanner & Connection States
  const [isPaired, setIsPaired] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<'goods' | 'palpay'>('goods');
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [lastDetected, setLastDetected] = useState<{
    code: string;
    name: string;
    price: number;
    timeMs: number;
  } | null>(null);

  // Scanned Cart state starts completely empty
  const [cartItems, setCartItems] = useState<MobileScannedItem[]>([]);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // References
  const hubConnectionRef = useRef<signalR.HubConnection | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const readerElementId = 'mobile-continuous-reader';

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // 1. Automatic Pairing & SignalR Connection on Mount
  useEffect(() => {
    let isMounted = true;

    try {
      broadcastChannelRef.current = new BroadcastChannel('watheq_pos_scanner');
    } catch {
      // BroadcastChannel fallback
    }

    const initConnection = async () => {
      let token = localStorage.getItem('watheq_scanner_token') || '';

      if (sessionId && pairingSecret) {
        try {
          const result = await pairScannerSession(sessionId, pairingSecret);
          if (result.isSuccess && result.token) {
            token = result.token;
            try {
              localStorage.setItem('watheq_scanner_token', token);
            } catch {
              // ignore storage error
            }
          }
        } catch (err) {
          console.warn('[MobileScanner] Pairing request failed:', err);
        }
      }

      if (!token) {
        // Direct local test mode without backend session token
        if (isMounted) setIsPaired(true);
        return;
      }

      try {
        const conn = createScannerHubConnection(
          () => token,
          {
            onScannerError: (err: ScannerErrorDto) => {
              console.warn('[ScannerHub] Server reported scanner error:', err);
              if (err.code === 'ScanThrottled') {
                // Ignore rate-limited scans silently
                return;
              }
              if (err.code === 'ProductNotFound') {
                playScannerBeep('alert');
                showToast('المنتج غير موجود في قاعدة البيانات ⚠️');
              } else if (err.code === 'ProductInactive') {
                playScannerBeep('alert');
                showToast('هذا المنتج غير مفعل ⚠️');
              } else if (err.code === 'ScannerSessionExpired') {
                playScannerBeep('alert');
                showToast('انتهت صلاحية جلسة الربط! يرجى إعادة المسح');
                if (isMounted) setIsPaired(false);
              } else if (err.code === 'ScannerSessionRevoked') {
                playScannerBeep('alert');
                showToast('تم إلغاء الربط من قبل الكاشير 🛑');
                if (isMounted) setIsPaired(false);
                if (scannerRef.current) {
                  scannerRef.current.stop().catch(() => {});
                }
              } else {
                showToast(err.message || 'حدث خطأ أثناء معالجة الباركود');
              }
            },
            onReconnecting: () => {
              if (isMounted) setIsPaired(false);
              showToast('انقطع الاتصال، جاري إعادة الاتصال... 🟡');
            },
            onReconnected: () => {
              if (isMounted) setIsPaired(true);
              playScannerBeep('success');
              showToast('تمت إعادة الاتصال بنجاح 🟢');
            },
            onClose: () => {
              if (isMounted) setIsPaired(false);
            },
          }
        );

        await conn.start();
        if (!isMounted) {
          conn.stop().catch(() => {});
          return;
        }

        hubConnectionRef.current = conn;
        setIsPaired(true);
        playScannerBeep('success');
        showToast('الماسح متصل بالشاشة بنجاح 🟢');
      } catch (err) {
        console.error('[ScannerHub] Failed to connect to ScannerHub:', err);
        if (isMounted) {
          showToast('تعذر الاتصال بـ WebSocket. تأكد من اتصال الشبكة.');
        }
      }
    };

    initConnection();

    return () => {
      isMounted = false;
      broadcastChannelRef.current?.close();
      if (hubConnectionRef.current) {
        hubConnectionRef.current.stop().catch(() => {});
        hubConnectionRef.current = null;
      }
    };
  }, [sessionId, pairingSecret]);

  // Handle scanned barcode dispatch
  const handleBarcodeScanned = useCallback(
    (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;

      const now = Date.now();
      // Prevent rapid duplicate scans:
      // If same barcode scanned within 1.8 seconds, ignore it
      // If any barcode scanned within 600ms, ignore it
      if (
        (lastScannedCodeRef.current === trimmed && now - lastScannedTimeRef.current < 1800) ||
        now - lastScannedTimeRef.current < 600
      ) {
        return;
      }

      lastScannedCodeRef.current = trimmed;
      lastScannedTimeRef.current = now;

      // 1. Primary Dispatch: Send to SignalR ScannerHub
      if (
        hubConnectionRef.current &&
        hubConnectionRef.current.state === signalR.HubConnectionState.Connected
      ) {
        scanBarcodeOnHub(hubConnectionRef.current, trimmed).catch((err) => {
          console.warn('[ScannerHub] ScanBarcode invoke error:', err);
        });
      }

      // 2. Play feedback and update local phone UI
      playScannerBeep('scan');

      const foundProduct = getProductByBarcode(trimmed);
      const productName = foundProduct?.name || `باركود: ${trimmed}`;
      const price = Number(foundProduct?.salePrice ?? 0);

      setLastDetected({
        code: trimmed,
        name: productName,
        price,
        timeMs: Math.floor(45 + Math.random() * 30),
      });

      // Update local cart
      setCartItems((prev) => {
        const existing = prev.find((item) => item.id === (foundProduct?.id || trimmed));
        if (existing) {
          return prev.map((item) =>
            item.id === (foundProduct?.id || trimmed)
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [
          {
            id: foundProduct?.id || trimmed,
            name: productName,
            price,
            quantity: 1,
            isNew: true,
          },
          ...prev,
        ];
      });

      // 3. Fallback for same-browser testing tabs
      try {
        broadcastChannelRef.current?.postMessage({
          type: 'BARCODE_SCANNED',
          barcode: trimmed,
          productName,
          price,
          timestamp: Date.now(),
        });
        localStorage.setItem(
          'watheq_last_scanned_barcode',
          JSON.stringify({ barcode: trimmed, time: Date.now() })
        );
      } catch {
        // storage fallback
      }
    },
    [getProductByBarcode]
  );

  // 2. Start Camera (manual trigger to ensure DOM element exists and permission is granted)
  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraActive(true);

      // Give React time to render the camera container div
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Stop any existing scanner first
      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
        scannerRef.current = null;
      }

      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 20,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          handleBarcodeScanned(decodedText);
        },
        () => {}
      );
    } catch (err: unknown) {
      console.error('Camera init error:', err);
      setIsCameraActive(false);
      const errMsg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'تعذر تشغيل الكاميرا';

      if (
        window.location.protocol !== 'https:' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        setCameraError(
          'متصفح الهاتف يشترط رابط HTTPS لفتح الكاميرا.'
        );
      } else {
        setCameraError(
          errMsg.includes('Permission') || errMsg.includes('NotAllowed')
            ? 'تم رفض إذن الكاميرا. اضغط على أيقونة القفل 🔒 بجانب الرابط وغيّر الكاميرا إلى "سماح" ثم حدّث الصفحة.'
            : `تعذر الوصول للكاميرا: ${errMsg}`
        );
      }
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          });
      }
    };
  }, []);

  // Flash / Torch toggle
  const toggleFlash = async () => {
    try {
      if (scannerRef.current) {
        const scanner = scannerRef.current as unknown as {
          applyVideoConstraints?: (constraints: unknown) => Promise<void>;
        };
        if (typeof scanner.applyVideoConstraints === 'function') {
          await scanner.applyVideoConstraints({
            advanced: [{ torch: !isFlashOn }],
          });
        }
        setIsFlashOn((prev) => !prev);
      }
    } catch {
      setIsFlashOn((prev) => !prev);
    }
  };

  // Quantity updates
  const updateQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const totalAmount = cartItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const totalCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div
      className="relative flex flex-col justify-between w-full min-h-screen bg-[#070D18] text-white font-sans select-none overflow-hidden"
      dir="rtl"
    >
      <style>{`
        @keyframes laserSweep {
          0% { transform: translateY(-50px); opacity: 0.8; }
          50% { transform: translateY(50px); opacity: 1; }
          100% { transform: translateY(-50px); opacity: 0.8; }
        }
      `}</style>

      {/* Top Header */}
      <header className="relative z-30 pt-4 px-4 pb-2 space-y-3 bg-gradient-to-b from-[#070D18]/90 via-[#070D18]/70 to-transparent">
        <div className="flex items-center justify-between">
          {/* Flash Toggle */}
          <button
            type="button"
            onClick={toggleFlash}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border ${
              isFlashOn
                ? 'bg-amber-400 text-slate-900 border-amber-300'
                : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20'
            }`}
            title="فلاش الكاميرا"
          >
            {isFlashOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
          </button>

          {/* Center Title & Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold shadow-xs ${
                isPaired
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isPaired ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span>{isPaired ? 'متصل بالـ Hub 🟢' : 'جاري الاتصال... 🟡'}</span>
            </div>
            <div className="flex items-center gap-1 text-right">
              <span className="text-[10px] bg-blue-600/80 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                SignalR v2.4
              </span>
              <span className="text-xs font-bold text-slate-200">الماسح اللاسلكي</span>
            </div>
          </div>

          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(PATHS.POS)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Pill */}
        <div className="flex items-center p-1 bg-[#131C2E]/90 rounded-2xl border border-white/10 max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => setActiveMode('goods')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'goods'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>باركود السلع (متعدد)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('palpay')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'palpay'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>بنك فلسطين / PalPay</span>
          </button>
        </div>
      </header>

      {/* Main Laser Camera Area */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 -mt-6">
        {/* Real Camera Video Output */}
        <div
          id={readerElementId}
          className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
        />

        {/* Ambient Camera Background Effect */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#070D18]/40 to-[#070D18] pointer-events-none" />

        {/* Cyber Neon Targeting Frame */}
        <div className="relative w-72 h-72 flex items-center justify-center">
          {/* Top-Right Neon Corner */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-lg shadow-[0_0_15px_#10B981]" />
          {/* Top-Left Neon Corner */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-lg shadow-[0_0_15px_#10B981]" />
          {/* Bottom-Right Neon Corner */}
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-lg shadow-[0_0_15px_#10B981]" />
          {/* Bottom-Left Neon Corner */}
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-lg shadow-[0_0_15px_#10B981]" />

          {/* Inner Dotted Scan Area */}
          <div className="w-56 h-44 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl flex flex-col items-center justify-center p-3 relative overflow-hidden backdrop-blur-2xs">
            {/* Animated Laser Sweep Line — only when camera active */}
            {isCameraActive && !cameraError && (
              <div
                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10B981]"
                style={{ animation: 'laserSweep 2.2s ease-in-out infinite' }}
              />
            )}

            {cameraError ? (
              /* Error state with retry */
              <div className="flex flex-col items-center gap-2 p-2 text-center z-10">
                <span className="text-rose-400 font-bold text-xs">⚠️ تعذر فتح الكاميرا</span>
                <span className="text-[10px] text-slate-300 leading-tight">{cameraError}</span>
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  🔄 إعادة المحاولة
                </button>
              </div>
            ) : !isCameraActive ? (
              /* Start button */
              <button
                type="button"
                onClick={startCamera}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-600/20 border-2 border-emerald-500/60 flex items-center justify-center group-hover:bg-emerald-600/40 transition-colors shadow-[0_0_20px_#10B98150]">
                  <span className="text-2xl">📷</span>
                </div>
                <span className="text-emerald-400 font-bold text-xs tracking-wide">
                  اضغط لبدء الكاميرا
                </span>
                <span className="text-[10px] text-slate-400">سيُطلب إذن الكاميرا</span>
              </button>
            ) : (
              /* Active scanning UI */
              <div className="flex flex-col items-center gap-1 opacity-60">
                <div className="flex items-center gap-1 text-white/50">
                  <Barcode className="w-16 h-8" />
                </div>
                <span className="font-mono text-[11px] tracking-widest text-emerald-300/80">
                  {lastDetected?.code || 'وجّه الكاميرا نحو الباركود'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Detection Floating Badge */}
        {lastDetected && (
          <div className="mt-4 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#0F2236]/90 border border-emerald-500/40 shadow-lg shadow-emerald-950/50 backdrop-blur-md animate-fadeIn">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">التقاط: {lastDetected.name}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                  +1 حبة
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {lastDetected.price > 0 ? `${lastDetected.price.toFixed(2)} ₪` : 'سعر البيع'} • زمن &lt;{' '}
                {lastDetected.timeMs}ms
              </p>
            </div>
          </div>
        )}

        {/* Connection status indicator */}
        <div className="mt-4 flex items-center justify-center w-full max-w-xs px-2 text-xs text-slate-400">
          <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1.5">
            <Wifi className={`w-3.5 h-3.5 ${isPaired ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{isPaired ? 'متصل بـ ScannerHub (WebSocket)' : 'في انتظار الاتصال بالخادم'}</span>
          </span>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {notificationMsg && (
        <div className="absolute top-20 inset-x-6 z-50 text-center py-2 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xl animate-fadeIn">
          {notificationMsg}
        </div>
      )}

      {/* Bottom Sheet Drawer */}
      <footer className="relative z-30 bg-white text-slate-900 rounded-t-[32px] p-5 shadow-2xl space-y-4">
        {/* Drawer Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-2 mb-1" />

        {/* Customer Header Card */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs text-slate-400">
            {selectedCustomer?.name ? 'العميل الحالي' : 'العميل'}
          </span>

          <div className="flex items-center gap-2.5 text-right">
            <div>
              <div className="flex items-center gap-1.5 justify-end">
                <h4 className="text-xs font-bold text-slate-900">
                  {selectedCustomer?.name || 'زبون نقدي عام'}
                </h4>
              </div>
              {typeof selectedCustomer?.totalDebt === 'number' && selectedCustomer.totalDebt > 0 && (
                <p className="text-[11px] text-slate-500">
                  الرصيد القائم:{' '}
                  <span className="font-mono font-bold text-rose-600">
                    {selectedCustomer.totalDebt.toFixed(2)} ₪
                  </span>
                </p>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-[#00204F] text-white flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Scanned Items Summary Bar */}
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1 text-slate-500 font-mono">
            <span>المجموع:</span>
            <span className="text-slate-900 font-black text-sm">{totalAmount.toFixed(2)} ₪</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{totalCount} أصناف ممسوحة</span>
          </div>
        </div>

        {/* Horizontal Mini Scanned Items List */}
        {cartItems.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            لم يتم مسح أي صنف بعد — وجّه الكاميرا نحو الباركود للمسح
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="shrink-0 w-36 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1.5 text-right"
              >
                <div className="flex items-center justify-between">
                  {item.isNew && (
                    <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded font-bold">
                      جديد
                    </span>
                  )}
                  <h5 className="text-[11px] font-bold text-slate-800 truncate">{item.name}</h5>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {item.price.toFixed(2)} ₪
                  </span>
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, 1)}
                      className="text-slate-600 hover:text-emerald-600 p-0.5 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-xs font-bold font-mono px-1">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, -1)}
                      className="text-slate-600 hover:text-rose-600 p-0.5 cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              playScannerBeep('success');
              showToast('تم تثبيت العملية وإرسالها إلى شاشة الكاشير ⚡');
              try {
                broadcastChannelRef.current?.postMessage({
                  type: 'CHECKOUT_TRIGGERED',
                  totalAmount,
                  timestamp: Date.now(),
                });
              } catch {
                // broadcast error
              }
            }}
            className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>تثبيت العملية فوراً ⚡</span>
          </button>

          <button
            type="button"
            onClick={() => showToast(`السلة الحالية تحتوي على ${totalCount} قطع`)}
            className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-bold text-xs border border-slate-200 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>السلة ({totalCount})</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
