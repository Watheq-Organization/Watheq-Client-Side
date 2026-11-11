import { useState, type FC, type FormEvent } from 'react';
import {
  X,
  QrCode,
  CheckCircle2,
  Copy,
  RefreshCw,
  Check,
  Building2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toPosErrorMessage } from '../../services/posService';

interface BankPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDue: number;
  customerName: string;
  onConfirm: (bankRefCode: string, provider: string) => Promise<void> | void;
}

type ProviderId = 'palpay' | 'bop' | 'jawwal_pay' | 'islamic';

const PAYMENT_OPTIONS: Array<{ id: ProviderId; name: string; account: string; tag: string }> = [
  { id: 'palpay', name: 'PalPay (بال باي)', account: '970599123456', tag: 'محفظة فورية' },
  { id: 'jawwal_pay', name: 'Jawwal Pay (جوال باي)', account: '0599123456', tag: 'دفع بالباركود' },
  { id: 'bop', name: 'بنك فلسطين (BOP)', account: 'PS040001000000000123456789', tag: 'حوالة آيبان' },
  { id: 'islamic', name: 'البنك الإسلامي العربي', account: 'PS880002000000000987654321', tag: 'تحويل بنكي' },
];

const BankPaymentModalContent: FC<Omit<BankPaymentModalProps, 'isOpen'>> = ({
  onClose,
  totalDue,
  customerName,
  onConfirm,
}) => {
  const [provider, setProvider] = useState<ProviderId>('palpay');
  const [refCode, setRefCode] = useState('');
  const [copiedIban, setCopiedIban] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentOption = PAYMENT_OPTIONS.find((p) => p.id === provider) || PAYMENT_OPTIONS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentOption.account);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = refCode.trim();
    if (!trimmed) {
      setError('يرجى إدخال رقم الحوالة أو الكود المرجعي للتحقق.');
      return;
    }
    if (trimmed.length < 3) {
      setError('الرقم المرجعي للعملية قصير جداً؛ يرجى إدخال الكود كاملاً.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(trimmed, currentOption.name);
      onClose();
    } catch (err) {
      setError(toPosErrorMessage(err, 'تعذر تسجيل الدفعة البنكية؛ يرجى المحاولة مرة أخرى.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  تحويل بنكي / PalPay فوري
                </h3>
                <kbd className="text-[10px] font-jakarta font-semibold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700">
                  F11
                </kbd>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                العميل: {customerName} · متاح للمطابقة في سجل &quot;ميزان&quot;
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Bar */}
          <div className="p-4 rounded-xl bg-[#09152B] dark:bg-slate-950 text-white flex items-center justify-between border border-slate-800">
            <div>
              <span className="text-xs text-slate-300 font-medium block">
                مبلغ التحويل المطلوب
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-jakarta tabular-nums text-indigo-300 mt-0.5 block" dir="ltr">
                ₪{totalDue.toFixed(2)}
              </span>
            </div>
            <span className="text-[11px] text-slate-200 font-medium px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 inline-flex items-center gap-1.5 shrink-0">
              <RefreshCw className="w-3 h-3 text-emerald-400" />
              <span>مطابقة ميزان</span>
            </span>
          </div>

          {/* Provider Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              بوابة الدفع أو المحفظة البنكية
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProvider(opt.id)}
                  className={`p-3 rounded-xl border text-right transition-colors cursor-pointer ${
                    provider === opt.id
                      ? 'bg-slate-50 dark:bg-slate-800 border-[#09152B] dark:border-slate-300 ring-1 ring-[#09152B]/20 dark:ring-slate-300/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {opt.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 block">
                    {opt.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Account Details */}
          <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                رقم الحساب / المحفظة لاستقبال الدفع
              </span>
              <div className="flex items-center gap-2">
                <span className="font-jakarta tabular-nums font-bold text-xs sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 truncate" dir="ltr">
                  {currentOption.account}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="نسخ الحساب"
                >
                  {copiedIban ? (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 flex items-center justify-center shrink-0">
              <QrCode className="w-8 h-8 text-slate-700 dark:text-slate-300" />
            </div>
          </div>

          {/* Reference Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              الرقم المرجعي للعملية من إشعار الزبون *
            </label>
            <input
              type="text"
              value={refCode}
              onChange={(e) => {
                setRefCode(e.target.value);
                setError(null);
              }}
              placeholder="مثال: PLP-9842105 أو رقم الحوالة"
              dir="ltr"
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-jakarta font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-slate-500/20 outline-hidden text-left ${
                error
                  ? 'border-rose-400 dark:border-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500'
              }`}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="h-10 px-4 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 rounded-lg bg-[#09152B] hover:bg-[#12264B] dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تأكيد التحويل...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد الاستلام البنكي (Enter)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BankPaymentModal: FC<BankPaymentModalProps> = ({ isOpen, ...props }) => {
  if (!isOpen) return null;
  return <BankPaymentModalContent {...props} />;
};
