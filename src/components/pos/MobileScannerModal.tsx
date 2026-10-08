import { useState, type FC } from 'react';
import { X, Smartphone, QrCode, Wifi, Copy, Check, Sparkles } from 'lucide-react';

interface MobileScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateBarcode: (barcode: string) => void;
}

export const MobileScannerModal: FC<MobileScannerModalProps> = ({
  isOpen,
  onClose,
  onSimulateBarcode,
}) => {
  const [copied, setCopied] = useState(false);
  const [terminalCode] = useState(() => `WTQ-${Math.floor(100 + Math.random() * 900)}`);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://watheq.app/scan?code=${terminalCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleProducts = [
    { code: '6251001234567', label: 'حليب رغد 1 لتر' },
    { code: '5449000000996', label: 'كوكا كولا 1.5 لتر' },
    { code: '7622210850021', label: 'بسكويت أوريو' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
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
                تحويل كاميرا الهاتف إلى قارئ باركود فائق السرعة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="relative mx-auto w-48 h-48 bg-white dark:bg-slate-800 rounded-3xl p-3 border-2 border-dashed border-emerald-500/60 shadow-lg flex items-center justify-center group">
            <QrCode className="w-36 h-36 text-slate-900 dark:text-white" />
            <div className="absolute inset-x-0 bottom-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-white/90 dark:bg-slate-900/90 py-0.5 rounded-full mx-4 shadow-xs flex items-center justify-center gap-1">
              <Wifi className="w-3 h-3 animate-pulse text-emerald-500" />
              <span>جاهز للاقتران الفوري</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">رمز ربط الكاشير (Terminal Code):</span>
            <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-mono text-lg font-black tracking-widest text-emerald-600 dark:text-emerald-400">
                {terminalCode}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                title="نسخ الرابط"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            امسح الكود بكاميرا هاتفك ليفتح ماسح وثّق مباشرة، أو أرسل الرابط لمساعدك في المحل. أي باركود
            يتم مسحه بالهاتف سيسقط في شاشة الكاشير في أقل من 50 مللي ثانية!
          </p>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-right space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>محاكاة مسح قادم من الجوال الآن:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sampleProducts.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => {
                    onSimulateBarcode(p.code);
                    onClose();
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20 transition-all text-right"
                >
                  مسح: {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
