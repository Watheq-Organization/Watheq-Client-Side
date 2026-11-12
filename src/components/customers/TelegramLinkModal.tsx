import { useState, useEffect, useCallback, useRef, type FC } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Copy,
  Send,
  ExternalLink,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  QrCode,
} from 'lucide-react';
import {
  getTelegramLink,
  regenerateTelegramLink,
  getCustomers,
  toTelegramLinkErrorMessage,
  type GenerateTelegramLinkResponse,
} from '../../services/customerService';

interface TelegramLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  mode?: 'generate' | 'regenerate';
  linkType?: 'Customer' | 'Merchant';
  sendViaWhatsApp?: boolean;
  initialLink?: string;
  onLinked?: () => void;
}

const TelegramLinkModalContent: FC<Omit<TelegramLinkModalProps, 'isOpen'>> = ({
  onClose,
  customerId,
  customerName = '',
  customerPhone = '',
  mode = 'generate',
  linkType = 'Customer',
  sendViaWhatsApp = false,
  initialLink,
  onLinked,
}) => {
  const canFetchLink = Boolean(customerId || linkType === 'Merchant');
  const [telegramLink, setTelegramLink] = useState<string | null>(initialLink || null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !initialLink && canFetchLink);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  /** Tracks whether the backend actually delivered the link via WhatsApp */
  const [whatsAppSent, setWhatsAppSent] = useState<boolean>(false);
  /** Tracks whether the user successfully clicked Start in Telegram and linked */
  const [isSuccessLinked, setIsSuccessLinked] = useState<boolean>(false);

  const isFetchingRef = useRef<boolean>(false);

  const fetchLinkPayload = useCallback(async (): Promise<{ link: string; whatsAppSent: boolean }> => {
    if (mode === 'regenerate' && customerId) {
      const link = await regenerateTelegramLink(customerId);
      return { link, whatsAppSent: false };
    }

    const result: GenerateTelegramLinkResponse = await getTelegramLink(customerId, {
      linkType,
      sendViaWhatsApp,
    });

    if (!result.success) {
      throw new Error(result.message || 'فشل إنشاء رابط Telegram.');
    }

    return {
      link: result.telegramLink,
      whatsAppSent: result.whatsAppSent,
    };
  }, [customerId, linkType, mode, sendViaWhatsApp]);

  useEffect(() => {
    if (initialLink || !canFetchLink || isFetchingRef.current) return;
    let isCancelled = false;
    isFetchingRef.current = true;

    fetchLinkPayload()
      .then(({ link, whatsAppSent: sent }) => {
        if (isCancelled) return;
        setTelegramLink(link);
        setWhatsAppSent(sent);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(toTelegramLinkErrorMessage(err));
        }
      })
      .finally(() => {
        isFetchingRef.current = false;
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [initialLink, canFetchLink, fetchLinkPayload]);

  // Polling to detect when customer clicks Start in Telegram bot
  useEffect(() => {
    if (!customerId || linkType !== 'Customer' || isSuccessLinked) return;

    let isMounted = true;
    const intervalId = setInterval(async () => {
      try {
        const customers = await getCustomers();
        if (!isMounted) return;
        const current = customers.find((c) => String(c.id) === String(customerId));
        if (current?.isTelegramLinked) {
          setIsSuccessLinked(true);
          onLinked?.();
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [customerId, linkType, isSuccessLinked, onLinked]);

  const handleRetry = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    setWhatsAppSent(false);
    try {
      const { link, whatsAppSent: sent } = await fetchLinkPayload();
      setTelegramLink(link);
      setWhatsAppSent(sent);
    } catch (err: unknown) {
      setError(toTelegramLinkErrorMessage(err));
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleCopyLink = () => {
    if (!telegramLink) return;
    navigator.clipboard.writeText(telegramLink);
    setToastMessage('تم نسخ رابط التفعيل بنجاح.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendWhatsApp = () => {
    if (!telegramLink) return;

    let digits = (customerPhone || '').replace(/\D/g, '');
    if (digits.startsWith('00')) {
      digits = digits.slice(2);
    }
    if (digits.startsWith('0')) {
      digits = digits.replace(/^0+/, '');
      if (digits.length === 9) {
        digits = `970${digits}`;
      }
    } else if (digits.length === 9) {
      digits = `970${digits}`;
    }

    const greeting = customerName ? `مرحباً ${customerName}` : 'مرحباً';
    const message =
      linkType === 'Merchant'
        ? `${greeting}،\n\nتفضل رابط تفعيل بوت تيليجرام الخاص بمتجرك في منصة وثّق:\n${telegramLink}\n\nيرجى الضغط على الرابط أعلاه ثم النقر على "بدء" (Start) في تطبيق تيليجرام لإتمام ربط المتجر وتفعيل التنبيهات وإدارة الحساب.`
        : `${greeting}،\n\nتفضل رابط تفعيل الإشعارات وتأكيد المعاملات عبر تيليجرام الخاص بك:\n${telegramLink}\n\nيرجى الضغط على الرابط أعلاه ثم النقر على "بدء" (Start) في تطبيق تيليجرام لإتمام الربط.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = digits
      ? `https://wa.me/${digits}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="telegram-link-title"
    >
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-md shadow-xl border border-slate-300 dark:border-slate-700 overflow-hidden flex flex-col relative">
        {/* Toast Overlay */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-bold z-10 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
              <QrCode className="w-4.5 h-4.5" />
            </div>
            <h3
              id="telegram-link-title"
              className="text-base font-extrabold font-cairo text-[#09152B] dark:text-white"
            >
              {linkType === 'Merchant' ? 'ربط حساب التاجر بتيليجرام' : 'ربط حساب العميل بتيليجرام'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-[#09152B] dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 flex-1 flex flex-col items-center">
          {isSuccessLinked ? (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-extrabold text-[#09152B] dark:text-white font-cairo mb-1.5">
                تم ربط حساب Telegram بنجاح
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 font-cairo max-w-xs leading-relaxed">
                تم تفعيل استلام الإشعارات وكشف الحساب والعمليات عبر روبوت وثّق.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 text-center mb-3 max-w-sm leading-relaxed">
                {linkType === 'Merchant' ? (
                  'امسح الرمز لتفعيل استلام التنبيهات وإدارة المتجر عبر بوت تيليجرام.'
                ) : (
                  <>
                    امسح الرمز لتفعيل استلام الإشعارات وتأكيد المعاملات للعميل{' '}
                    <strong className="text-[#09152B] dark:text-white font-bold">{customerName}</strong>.
                  </>
                )}
              </p>

              {/* Clarification banner */}
              <div className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 text-center mb-4 leading-relaxed font-cairo">
                <span className="font-bold text-[#09152B] dark:text-white">ملاحظة:</span> يفتح الرابط بوت{' '}
                <strong className="font-jakarta">Telegram</strong>، وتكتمل عملية الربط فور ضغط العميل على{' '}
                <strong className="font-jakarta">Start</strong> داخل التطبيق.
              </div>

              {/* WhatsApp delivery status */}
              {!isLoading && !error && telegramLink && (sendViaWhatsApp || initialLink) && (
                whatsAppSent || initialLink ? (
                  <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>تم إرسال رابط التفعيل عبر واتساب تلقائياً</span>
                  </div>
                ) : (
                  <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-bold border border-amber-300 dark:border-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>تم إنشاء الرابط، لكن تعذر تسليمه تلقائياً عبر واتساب</span>
                  </div>
                )
              )}

              <div className="min-h-[220px] flex items-center justify-center w-full mb-5 relative">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3 text-slate-600 dark:text-slate-300">
                    <Loader2 className="w-8 h-8 animate-spin text-[#09152B] dark:text-slate-200" />
                    <span className="text-xs sm:text-sm font-semibold">جاري إنشاء رمز الاستجابة...</span>
                  </div>
                ) : error ? (
                  <div role="alert" className="flex flex-col items-center gap-3 text-center max-w-xs">
                    <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-semibold leading-relaxed">
                      {error}
                    </p>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex items-center gap-1.5 h-9 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[#09152B] dark:text-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>إعادة المحاولة</span>
                    </button>
                  </div>
                ) : telegramLink ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 shadow-2xs">
                      <QRCodeSVG
                        value={telegramLink}
                        size={196}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <p className="mt-4 inline-flex items-center justify-center px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#09152B] dark:text-slate-200 rounded-lg text-xs font-bold">
                      وجّه كاميرا الهاتف نحو الرمز ثم اضغط Start
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2.5 mt-auto">
                {telegramLink && !isLoading && !error && (
                  <>
                    <button
                      type="button"
                      onClick={handleSendWhatsApp}
                      className="w-full h-10 flex items-center justify-center gap-2 px-4 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>إرسال الرابط عبر واتساب</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="h-9 flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#09152B] dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl font-bold transition-colors text-xs cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ الرابط</span>
                      </button>

                      <a
                        href={telegramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 flex items-center justify-center gap-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 rounded-xl font-bold transition-colors text-xs"
                      >
                        <span>فتح في تيليجرام</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#09152B] dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export const TelegramLinkModal: FC<TelegramLinkModalProps> = ({ isOpen, ...props }) => {
  if (!isOpen) return null;
  const modalKey = `${props.linkType || 'Customer'}-${props.customerId || 'merchant'}-${props.mode || 'generate'}-${Boolean(props.sendViaWhatsApp)}`;
  return <TelegramLinkModalContent key={modalKey} {...props} />;
};
