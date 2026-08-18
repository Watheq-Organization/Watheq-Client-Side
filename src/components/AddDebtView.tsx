import React, { useState } from 'react';
import { ScreenType } from './Header';
import { Client } from '../types/client';
import { 
  PlusCircle, 
  Search, 
  Calendar, 
  Mic, 
  MicOff, 
  MessageSquare, 
  CheckCircle2, 
  Shield, 
  Lock, 
  ArrowLeft, 
  X,
  User,
  Building,
  Sparkles,
  Loader2
} from 'lucide-react';

interface AddDebtViewProps {
  onNavigate: (screen: ScreenType) => void;
  clients?: Client[];
  selectedClient?: Client;
  onSelectClient?: (client: Client) => void;
  onAddDebt?: (debtData: {
    clientId: string;
    clientName: string;
    amount: number;
    dueDate: string;
    notes: string;
    sendWhatsapp: boolean;
  }) => void;
}

export const AddDebtView: React.FC<AddDebtViewProps> = ({ 
  onNavigate, 
  clients = [],
  selectedClient: initialSelectedClient,
  onSelectClient,
  onAddDebt 
}) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(
    initialSelectedClient || clients[0] || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [customClientName, setCustomClientName] = useState('');
  
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 30);
    return today.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [sendWhatsapp, setSendWhatsapp] = useState(true);

  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter clients by search query
  const searchResults = searchQuery.trim() 
    ? clients.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.idNum.includes(searchQuery) ||
        c.phone.includes(searchQuery)
      )
    : [];

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setSearchQuery('');
    setIsSearching(false);
    if (onSelectClient) onSelectClient(client);
  };

  // Voice AI Input Simulation
  const handleToggleVoice = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setVoiceTranscript('جاري الاستماع... (تحدث بالاسم والمبلغ)');
      
      setTimeout(() => {
        setVoiceTranscript('تم التعرف: دين بقيمة 2,500 ريال على أحمد الراجحي');
        setAmount('2500');
        if (clients.length > 0) {
          setSelectedClient(clients[0]);
        }
        setNotes('فاتورة بضائع ومستلزمات مكتبية إضافية');
        setIsRecording(false);
      }, 2500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      alert('يرجى إدخال مبلغ صحيح.');
      return;
    }

    const clientName = selectedClient ? selectedClient.name : customClientName || 'عميل جديد';
    const clientId = selectedClient ? selectedClient.id : `c-${Date.now()}`;

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      if (onAddDebt) {
        onAddDebt({
          clientId,
          clientName,
          amount: numericAmount,
          dueDate,
          notes,
          sendWhatsapp,
        });
      }

      setSuccessToast(`تم تسجيل دين جديد بقيمة ${numericAmount.toLocaleString()} ر.س على (${clientName}) بنجاح!`);
      
      setTimeout(() => {
        setSuccessToast(null);
        onNavigate('clients');
      }, 1800);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-10">
      
      {/* Toast Alert Notification */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="text-center pt-2 pb-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-alexandria tracking-tight">
          إضافة دين جديد
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
          قم بإدخال تفاصيل الدين للعميل الجديد أو الحالي.
        </p>
      </div>

      {/* MAIN FORM CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 md:p-10 space-y-6">
        
        {/* 1. Voice Input Feature Card */}
        <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
          isRecording 
            ? 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500/20' 
            : 'bg-gradient-to-r from-slate-50 to-emerald-50/40 border-slate-200/80 text-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md cursor-pointer ${
                isRecording 
                  ? 'bg-rose-600 text-white animate-pulse' 
                  : 'bg-[#0b1d3a] hover:bg-[#0f2a54] text-white hover:scale-105'
              }`}
              title="اضغط للتحدث"
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm font-alexandria text-slate-900">
                  إدخال صوتي سريع
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  ذكاء اصطناعي
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {voiceTranscript || 'تحدث وسنقوم بملء النموذج تلقائياً (مثال: دين 2500 على أحمد الراجحي)'}
              </p>
            </div>
          </div>

          {isRecording && (
            <span className="text-xs font-bold text-rose-600 font-mono animate-pulse hidden sm:inline">
              ● تسجيل نشط...
            </span>
          )}
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 2. Client Selection / Search */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              بحث عن عميل <span className="text-emerald-600">*</span>
            </label>

            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="رقم الهوية أو رقم الجوال أو الاسم..."
                value={searchQuery}
                onFocus={() => setIsSearching(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearching(true);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isSearching && searchResults.length > 0 && (
              <div className="absolute top-full right-0 left-0 mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectClient(c)}
                    className="p-3 hover:bg-emerald-50/50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${c.avatarColor}`}>
                        {c.initial}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{c.name}</span>
                        <span className="text-[10px] text-slate-400">{c.idNum} • {c.phone}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 font-mono">{c.debt} ر.س</span>
                  </div>
                ))}
              </div>
            )}

            {/* Active Selected Client Badge */}
            {selectedClient && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">اسم العميل:</span>
                  <span className="font-bold text-slate-900 font-alexandria">{selectedClient.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    هوية: {selectedClient.idNum}
                  </span>
                </div>
                <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  عميل محدد
                </span>
              </div>
            )}
          </div>

          {/* 3. Amount & Due Date (Two-Column Split) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                المبلغ (ريال سعودي) <span className="text-emerald-600">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="1"
                  step="any"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all pl-12"
                />
                <div className="absolute left-3.5 text-xs font-bold text-slate-500 pointer-events-none">
                  ر.س
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تاريخ الاستحقاق <span className="text-emerald-600">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

          </div>

          {/* 4. Notes Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ملاحظات (اختياري)
            </label>
            <textarea
              rows={3}
              placeholder="أضف تفاصيل إضافية حول هذا الدين..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* 5. Send WhatsApp Notification Switch */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                  إرسال تأكيد عبر واتساب
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  سيتم إشعار العميل فور تسجيل الدين بتفاصيل الفاتورة والمبلغ.
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sendWhatsapp}
                onChange={(e) => setSendWhatsapp(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* 6. Form Submit Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:flex-1 bg-[#0b1d3a] hover:bg-[#0f2a54] disabled:opacity-75 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-99 flex items-center justify-center gap-2 cursor-pointer font-alexandria text-xs sm:text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>جاري تسجيل الدين...</span>
                </>
              ) : (
                <>
                  <span>💾 حفظ وتسجيل الدين</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('clients')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>

        </form>

        {/* Bottom Security Guarantee Note */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>جميع البيانات مشفرة ومحفوظة بأمان في نظام وثق</span>
        </div>

      </div>

    </div>
  );
};
