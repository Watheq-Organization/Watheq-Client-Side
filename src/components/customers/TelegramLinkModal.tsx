import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Send, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { getTelegramLink, regenerateTelegramLink } from '../../services/customerService';

interface TelegramLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  customerPhone: string;
  mode?: 'generate' | 'regenerate';
}

export const TelegramLinkModal: React.FC<TelegramLinkModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  customerPhone,
  mode = 'generate',
}) => {
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const hasFetchedRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && customerId && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchLink();
    }
  }, [isOpen, customerId, mode]);

  useEffect(() => {
    if (!isOpen) {
      hasFetchedRef.current = false;
      setTelegramLink(null);
    }
  }, [isOpen]);

  const fetchLink = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let link: string;
      if (mode === 'regenerate') {
        link = await regenerateTelegramLink(customerId);
      } else {
        link = await getTelegramLink(customerId);
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
    let cleanPhone = customerPhone.replace(/\D/g, '');
    
    // Assume Palestinian format if no country code is present for whatsapp
    if (cleanPhone && cleanPhone.length === 9) {
      cleanPhone = `970${cleanPhone}`;
    }

    const message = `مرحباً ${customerName}،\n\nتفضل رابط تفعيل الإشعارات وتأكيد المعاملات عبر تيليجرام الخاص بك:\n${telegramLink}\n\nيرجى الضغط على الرابط ثم اختيار Start.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
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
              ربط حساب الزبون بـ تيليجرام
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
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 max-w-sm">
            امسح الكود لتفعيل استلام الإشعارات وتأكيد المعاملات لـ <strong className="text-slate-700 dark:text-slate-200">{customerName}</strong>.
          </p>

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
