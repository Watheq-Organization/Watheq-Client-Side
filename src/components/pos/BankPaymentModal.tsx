import { useState, type FC, type FormEvent } from 'react';
import {
  X,
  QrCode,
  CheckCircle,
  Copy,
  RefreshCw,
  Sparkles,
  Check,
  Building2,
} from 'lucide-react';

interface BankPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDue: number;
  customerName: string;
  onConfirm: (bankRefCode: string, provider: string) => void;
}

export const BankPaymentModal: FC<BankPaymentModalProps> = ({
  isOpen,
  onClose,
  totalDue,
  customerName,
  onConfirm,
}) => {
  const [provider, setProvider] = useState<'palpay' | 'bop' | 'jawwal_pay' | 'islamic' | 'other'>(
    'palpay'
  );
  const [refCode, setRefCode] = useState('');
  const [copiedIban, setCopiedIban] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const paymentOptions = [
    { id: 'palpay', name: 'PalPay (بال باي)', account: '970599123456', tag: 'محفظة فورية' },
    { id: 'jawwal_pay', name: 'Jawwal Pay (جوال باي)', account: '0599123456', tag: 'دفع بالباركود' },
    { id: 'bop', name: 'بنك فلسطين (BOP)', account: 'PS040001000000000123456789', tag: 'حوالة آيبان' },
    { id: 'islamic', name: 'البنك الإسلامي العربي', account: 'PS880002000000000987654321', tag: 'تطبيق إسلامي' },
  ];

  const currentOption = paymentOptions.find((p) => p.id === provider) || paymentOptions[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentOption.account);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2000);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!refCode.trim()) {
      setError('يرجى إدخال رقم الحوالة أو الكود المرجعي للتحقق');
      return;
    }
    onConfirm(refCode.trim(), currentOption.name);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-indigo-500/30">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-lg">
                  تحويل بنكي / PalPay فوري
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold">
                  F11
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                العميل: {customerName} • مطابقة تلقائية في نظام &quot;ميزان&quot;
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-inner">
            <div>
              <span className="text-xs text-slate-400 font-medium block">
                مبلغ التحويل المطلوب
              </span>
              <span className="text-3xl font-black font-mono text-indigo-400">
                ₪{totalDue.toFixed(2)}
              </span>
            </div>
            <div className="text-left">
              <span className="text-[10px] text-indigo-300 font-bold px-2 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>ربط مع ميزان (Mizan)</span>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              اختر بوابة الدفع أو المحفظة البنكية:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paymentOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProvider(opt.id as any)}
                  className={`p-3 rounded-2xl border text-right transition-all ${
                    provider === opt.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    {opt.name}
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    {opt.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                رقم الحساب / المحفظة لاستقبال الدفع:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  {currentOption.account}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                  title="نسخ الحساب"
                >
                  {copiedIban ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-800 p-1 flex items-center justify-center shrink-0">
              <QrCode className="w-10 h-10 text-indigo-700 dark:text-indigo-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              رقم العملية المرجعي من إشعار الزبون (Ref / Transaction ID) *
            </label>
            <input
              type="text"
              value={refCode}
              onChange={(e) => {
                setRefCode(e.target.value);
                setError(null);
              }}
              placeholder="مثال: PLP-9842105 أو رقم الحوالة"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-rose-500 font-semibold">{error}</p>}
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              سيتم إدراج هذه الفاتورة تلقائياً في شاشة &quot;ميزان&quot; لمطابقتها مع كشف حساب البنك بنهاية اليوم.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-lg shadow-indigo-600/30 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <CheckCircle className="w-5 h-5" />
              <span>تأكيد الاستلام البنكي (Enter)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
