import { useEffect, useRef, useState, type FC } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export const CameraScannerModal: FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'مسح الباركود بالكاميرا',
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'html5-camera-reader';

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
          setIsScanning(false);
        });
      }
      setScannedCode(null);
      setErrorMessage(null);
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      try {
        setErrorMessage(null);
        setScannedCode(null);

        await new Promise((resolve) => setTimeout(resolve, 300));
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.333333,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText: string) => {
            if (!isMounted) return;
            setScannedCode(decodedText);
            html5QrCode.stop().catch(() => {}).finally(() => {
              html5QrCode.clear();
              scannerRef.current = null;
              setIsScanning(false);
              setTimeout(() => {
                onScan(decodedText);
                onClose();
              }, 400);
            });
          },
          () => {}
        );

        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setErrorMessage('لم يتم منح إذن الوصول إلى الكاميرا. يرجى تفعيل الكاميرا من إعدادات المتصفح.');
        } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFoundError')) {
          setErrorMessage('لم يتم العثور على كاميرا موصولة بالجهاز.');
        } else {
          setErrorMessage('تعذر تشغيل الكاميرا. يمكنك استخدام المسح التجريبي أو إدخال الباركود يدوياً.');
        }
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        });
      }
    };
  }, [isOpen, onClose, onScan]);

  if (!isOpen) return null;

  const testBarcodes = [
    { code: '6251001234567', label: 'حليب رغد 1 لتر' },
    { code: '6252003344556', label: 'زيت زيتون بلدي' },
    { code: '6254005566778', label: 'قهوة بن النجار' },
    { code: '5449000000996', label: 'كوكا كولا 1.5 لتر' },
    { code: '9998887771234', label: 'صنف غير معرف (جديد)' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                وجّه الكاميرا نحو الباركود لقرائته تلقائياً
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video feed container */}
        <div className="p-4 sm:p-6 flex flex-col items-center">
          <div className="relative w-full max-w-[360px] aspect-4/3 bg-slate-950 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-inner flex items-center justify-center">
            <div id={readerElementId} className="w-full h-full" />

            {/* Scanning Laser HUD Overlay */}
            {isScanning && !scannedCode && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-[80%] h-[55%] border-2 border-dashed border-emerald-400/80 rounded-lg relative">
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,1)] animate-pulse" />
                  <span className="absolute -bottom-6 inset-x-0 text-center text-[11px] text-emerald-300 font-mono tracking-wider">
                    ضع الباركود داخل الإطار
                  </span>
                </div>
              </div>
            )}

            {scannedCode && (
              <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
                <span className="text-sm font-bold">تم التعرف على الباركود بنجاح!</span>
                <span className="font-mono text-xs text-emerald-300 mt-1">{scannedCode}</span>
              </div>
            )}

            {errorMessage && (
              <div className="absolute inset-0 bg-slate-900/90 p-5 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                <p className="text-xs text-amber-200 leading-relaxed max-w-xs">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Quick simulator buttons */}
          <div className="mt-4 w-full">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>أزرار محاكاة سريعة (للتجربة السريعة):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {testBarcodes.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setScannedCode(item.code);
                    setTimeout(() => {
                      onScan(item.code);
                      onClose();
                    }, 300);
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-900/30 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition-all font-mono"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
