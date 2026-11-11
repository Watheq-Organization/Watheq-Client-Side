import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Send, ExternalLink, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getTelegramLink, regenerateTelegramLink, getCustomers } from '../../services/customerService';
import type { GenerateTelegramLinkResponse } from '../../services/customerService';

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

export const TelegramLinkModal: React.FC<TelegramLinkModalProps> = ({
  isOpen,
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
  const [telegramLink, setTelegramLink] = useState<string | null>(initialLink || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialLink);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  /** Tracks whether the backend actually delivered the link via WhatsApp */
  const [whatsAppSent, setWhatsAppSent] = useState<boolean>(false);
  /** Tracks whether the user successfully clicked Start in Telegram and linked */
  const [isSuccessLinked, setIsSuccessLinked] = useState<boolean>(false);

  const lastFetchedKeyRef = React.useRef<string | null>(null);
  const isFetchingRef = React.useRef<boolean>(false);

  useEffect(() => {
    const currentKey = `${linkType}:${customerId || 'merchant'}:${mode}:${Boolean(sendViaWhatsApp)}`;
    if (initialLink && !telegramLink) {
      setTelegramLink(initialLink);
      setIsLoading(false);
      lastFetchedKeyRef.current = currentKey;
      return;
    }
    const shouldFetch = isOpen && (customerId || linkType === 'Merchant') && lastFetchedKeyRef.current !== currentKey && !initialLink;
    if (shouldFetch) {
      lastFetchedKeyRef.current = currentKey;
      fetchLink();
    }
  }, [isOpen, customerId, mode, linkType, sendViaWhatsApp, initialLink]);

  useEffect(() => {
    if (!isOpen) {
      lastFetchedKeyRef.current = null;
      setTelegramLink(null);
      setWhatsAppSent(false);
      setIsSuccessLinked(false);
    }
  }, [isOpen]);

  // Polling to detect when customer clicks Start in Telegram bot
  useEffect(() => {
    if (!isOpen || !customerId || linkType !== 'Customer' || isSuccessLinked) return;

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
  }, [isOpen, customerId, linkType, isSuccessLinked, onLinked]);

  const fetchLink = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    setWhatsAppSent(false);
    try {
      let link: string;
      if (mode === 'regenerate' && customerId) {
        link = await regenerateTelegramLink(customerId);
        setWhatsAppSent(false);
      } else {
        const result: GenerateTelegramLinkResponse = await getTelegramLink(customerId, {
          linkType,
          sendViaWhatsApp,
        });

        if (!result.success) {
          throw new Error(result.message || 'فشل إنشاء رابط Telegram.');
        }

        link = result.telegramLink;

        // Track actual WhatsApp delivery status from backend (independent from success)
        setWhatsAppSent(result.whatsAppSent);
      }
      setTelegramLink(link);
    } catch (err: any) {
      let errorMsg = err?.message || 'Unknown error';
      if (err?.body) {
        errorMsg += ' - ' + JSON.stringify(err.body);
      }
      setError(`تعذر جلب رابط تيليجرام. (${errorMsg})`);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (telegramLink) {
      navigator.clipboard.writeText(telegramLink);
      setToastMessage('تم نسخ الرابط بنجاح');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleSendWhatsApp = () => {
    if (!telegramLink) return;
    
    // Clean phone number: remove non-digits
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
    const message = linkType === 'Merchant'
      ? `${greeting}،\n\nتفضل رابط تفعيل بوت تيليجرام الخاص بمتجرك في منصة وثّق:\n${telegramLink}\n\nيرجى الضغط على الرابط أعلاه ثم النقر على "بدء" (Start) في تطبيق تيليجرام لإتمام ربط المتجر وتفعيل التنبيهات وإدارة الحساب.`
      : `${greeting}،\n\nتفضل رابط تفعيل الإشعارات وتأكيد المعاملات عبر تيليجرام الخاص بك:\n${telegramLink}\n\nيرجى الضغط على الرابط أعلاه ثم النقر على "بدء" (Start) في تطبيق تيليجرام لإتمام الربط.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = digits
      ? `https://wa.me/${digits}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative">
        {/* Toast Overlay */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold z-10 animate-fade-in flex items-center gap-2">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-xl font-bold font-cairo text-[#0c2444] dark:text-blue-400">
              {linkType === 'Merchant' ? 'ربط حساب التاجر بـ تيليجرام' : 'ربط حساب الزبون بـ تيليجرام'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col items-center">
          {isSuccessLinked ? (
            <div className="py-8 flex flex-col items-center justify-center text-center animate-scale-up">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-cairo mb-2">
                تم ربط حساب Telegram بنجاح!
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-cairo max-w-xs">
                تم تفعيل استلام الإشعارات وكشف الحساب والعمليات عبر روبوت وثّق.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer"
              >
                تم / إغلاق
              </button>
            </div>
          ) : (
            <>
              {linkType === 'Merchant' ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-3 max-w-sm">
                  امسح الكود لتفعيل استلام التنبيهات وإدارة المتجر عبر بوت تيليجرام.
                </p>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-3 max-w-sm">
                  امسح الكود لتفعيل استلام الإشعارات وتأكيد المعاملات لـ <strong className="text-slate-700 dark:text-slate-200">{customerName}</strong>.
                </p>
              )}

              {/* Helpful note clarifying how WhatsApp delivery relates to Telegram Bot linking */}
              <div className="w-full bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl p-2.5 text-xs text-blue-800 dark:text-blue-300 text-center mb-3 leading-relaxed font-cairo">
                <span className="font-bold">تنويه:</span> رابط التفعيل يفتح بوت <strong>Telegram</strong> (@WatheqBot). يتم تسليم الرابط عبر WhatsApp لسهولة الوصول، وتكتمل عملية الربط فور الضغط على <strong>Start</strong> في تطبيق تيليجرام.
              </div>

              {/* WhatsApp delivery status — based on actual backend response or initial creation delivery */}
              {!isLoading && !error && telegramLink && (sendViaWhatsApp || initialLink) && (
                whatsAppSent || initialLink ? (
                  <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold border border-emerald-200 dark:border-emerald-800 animate-fade-in">
                    <span>✓ تم إرسال رابط التفعيل عبر واتساب تلقائياً</span>
                  </div>
                ) : (
                  <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full text-xs font-semibold border border-amber-200 dark:border-amber-800 animate-fade-in">
                    <span>⚠ تم إنشاء الرابط لكن تعذر إرساله عبر واتساب</span>
                  </div>
                )
              )}

              <div className="min-h-[220px] flex items-center justify-center w-full mb-6 relative">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <span className="text-sm font-medium">جاري إنشاء رمز الاستجابة...</span>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="text-rose-500 bg-rose-50 p-4 rounded-full">
                      <X className="w-8 h-8" />
                    </div>
                    <p className="text-sm text-rose-600 font-medium">{error}</p>
                    <button
                      onClick={fetchLink}
                      className="flex items-center gap-2 px-4 py-2 mt-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      إعادة المحاولة
                    </button>
                  </div>
                ) : telegramLink ? (
                  <div className="flex flex-col items-center animate-scale-up">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                      <QRCodeSVG
                        value={telegramLink}
                        size={200}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <div className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-bold animate-pulse">
                      وجّه كاميرا الهاتف نحو الكود واضغط Start
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-3 mt-auto">
                {telegramLink && !isLoading && !error && (
                  <>
                    <button
                      onClick={handleSendWhatsApp}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-xl font-bold shadow-sm transition-colors active:scale-95"
                    >
                      <Send className="w-5 h-5" />
                      <span>إرسال الرابط عبر واتساب</span>
                    </button>

                    <div className="flex gap-3">
                      <button
                        onClick={handleCopyLink}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-colors text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        <span>نسخ الرابط</span>
                      </button>
                      
                      <a
                        href={telegramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-xl font-semibold transition-colors text-sm border border-blue-200 dark:border-blue-800/50"
                      >
                        <span>فتح في تيليجرام</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-colors"
          >
            تم / إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
