import { useState, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CustomerDto } from '../../types/customer';
import { getCustomers } from '../../services/customerService';
import {
  ChevronRight,
  ChevronDown,
  User,
  Phone,
  Banknote,
  Landmark,
  Smartphone,
  Receipt,
  CheckCircle2,
  Lock,
  Info,
  Check,
  Search,
  Loader2,
} from 'lucide-react';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { PATHS } from '../../routes/paths';
import { createInstantSale } from '../../services/instantSaleService';
import { Toast } from '../ui/Toast';

export const CashSaleScreen: FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [customerType, setCustomerType] = useState<'guest' | 'registered'>('guest');
  const [phonePrefix, setPhonePrefix] = useState<string>('+970');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos' | 'transfer' | 'wallet'>('cash');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  const [guestName, setGuestName] = useState<string>('زبون نقدي مباشر');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const numericAmount = parseFloat(amount) || 0;
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleString('en-GB', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      );
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | null>(null);

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
    (c.phoneNumber && c.phoneNumber.includes(customerSearchQuery))
  );

  useEffect(() => {
    if (customerType === 'registered' && customers.length === 0) {
      let isMounted = true;
      getCustomers()
        .then((data) => {
          if (!isMounted) return;
          setCustomers(data);
        })
        .catch((err) => console.error(err))
        .finally(() => {
          if (isMounted) setIsLoadingCustomers(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [customerType, customers.length]);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (numericAmount <= 0) {
      showToast('يرجى إدخال مبلغ صحيح أكبر من صفر', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createInstantSale({
        amount: numericAmount,
        description,
        paymentMethod: paymentMethod === 'cash' ? 1 : paymentMethod === 'transfer' ? 2 : 3,
        customerId: customerType === 'registered' && selectedCustomer?.id ? Number(selectedCustomer.id) : null,
        customerName: customerType === 'registered' ? selectedCustomer?.fullName : guestName,
        CustomerName: customerType === 'registered' ? selectedCustomer?.fullName : guestName,
        guestCustomerName: customerType === 'guest' ? guestName : null,
        GuestCustomerName: customerType === 'guest' ? guestName : null,
        
        phoneNumber: phoneNumber ? `${phonePrefix}${phoneNumber}` : null,
        PhoneNumber: phoneNumber ? `${phonePrefix}${phoneNumber}` : null,
        customerPhone: phoneNumber ? `${phonePrefix}${phoneNumber}` : null,
        CustomerPhone: phoneNumber ? `${phonePrefix}${phoneNumber}` : null,
        guestCustomerPhoneNumber: customerType === 'guest' && phoneNumber ? `${phonePrefix}${phoneNumber}` : null,
        GuestCustomerPhoneNumber: customerType === 'guest' && phoneNumber ? `${phonePrefix}${phoneNumber}` : null,
      });
      showToast('تم إنشاء الفاتورة النقدية بنجاح!', 'success');
      setTimeout(() => navigate(PATHS.PAYMENTS), 1500);
    } catch (error) {
      console.error(error);
      showToast('حدث خطأ أثناء حفظ الفاتورة', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F5F6F8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-cairo antialiased flex"
      dir="rtl"
    >
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab="cash-sale"
      />

      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 transition-all duration-300">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          searchQuery=""
          onSearchChange={() => {}}
          searchPlaceholder="البحث..."
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl mx-auto w-full">
          <Toast 
            message={toastMessage?.text || null} 
            type={toastMessage?.type} 
            onClose={() => setToastMessage(null)} 
          />

          {/* Breadcrumbs & Title */}
          <div className="space-y-3">
            <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400" aria-label="مسار التنقل">
              <button 
                type="button"
                onClick={() => navigate(PATHS.PAYMENTS)}
                className="hover:text-[#09152B] dark:hover:text-white transition-colors cursor-pointer"
              >
                سجل المدفوعات
              </button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-700 dark:text-slate-300 font-bold">تسجيل بيع نقدي فوري</span>
            </nav>
            
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#09152B] dark:text-white tracking-tight">
                تسجيل مبيعات / دفعة نقدية فورية
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                تسجيل حركة بيع نقدي مباشر، إصدار فاتورة فورية، وإرسال نسخة إلكترونية للزبون بدون فتح قيد دين أو مطالبات لاحقة.
              </p>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1">رقم الفاتورة المؤقت</p>
                <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm tracking-wide">يُولَّد تلقائياً عند الحفظ</p>
              </div>
              <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1">تاريخ وتوقيت البيع</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 font-jakarta tabular-nums text-sm">{currentDateTime || 'جاري التحميل...'}</p>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>سداد فوري غير آجل (مغلق محاسبياً)</span>
            </div>
          </div>

          {/* Main Grid: Form (2 cols) + Summary (1 col) */}
          <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Right Column (Inputs) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Section 1: Customer Details */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-extrabold text-[#09152B] dark:text-white">1. بيانات العميل / المشتري</h2>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg">
                    اختياري لمبيعات الزبائن العابرين
                  </span>
                </div>
                
                <div className="p-5 space-y-5">
                  {/* Customer Type Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="نوع العميل">
                    <label 
                      className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        customerType === 'guest' 
                          ? 'border-[#09152B] dark:border-blue-500 bg-slate-50 dark:bg-slate-800/50 shadow-xs' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="customerType" 
                        value="guest" 
                        checked={customerType === 'guest'} 
                        onChange={() => setCustomerType('guest')}
                        className="sr-only" 
                      />
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">زبون عابر / نقدي سريع</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${customerType === 'guest' ? 'border-[#09152B] dark:border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                          {customerType === 'guest' && <div className="w-2 h-2 rounded-full bg-[#09152B] dark:bg-blue-500" />}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">بدون تسجيل ملف مالي مسبق</span>
                    </label>

                    <label 
                      className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        customerType === 'registered' 
                          ? 'border-[#09152B] dark:border-blue-500 bg-slate-50 dark:bg-slate-800/50 shadow-xs' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="customerType" 
                        value="registered" 
                        checked={customerType === 'registered'} 
                        onChange={() => {
                          setCustomerType('registered');
                          if (customers.length === 0) setIsLoadingCustomers(true);
                        }}
                        className="sr-only" 
                      />
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">عميل مسجل بالقائمة</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${customerType === 'registered' ? 'border-[#09152B] dark:border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                          {customerType === 'registered' && <div className="w-2 h-2 rounded-full bg-[#09152B] dark:bg-blue-500" />}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">ربط بحساب العميل القائم</span>
                    </label>
                  </div>

                  {/* Customer Details Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-right">
                      <label htmlFor="cash-customer-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {customerType === 'registered' ? 'اختر العميل من السجل' : 'اسم المشتري / الزبون'}
                      </label>
                      <div className="relative">
                        {customerType === 'registered' ? (
                          <>
                            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                              <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                              id="cash-customer-input"
                              type="text"
                              value={isCustomerDropdownOpen ? customerSearchQuery : (selectedCustomer ? selectedCustomer.fullName : customerSearchQuery)}
                              onChange={(e) => {
                                setCustomerSearchQuery(e.target.value);
                                setIsCustomerDropdownOpen(true);
                                if (selectedCustomer) setSelectedCustomer(null);
                              }}
                              onFocus={() => setIsCustomerDropdownOpen(true)}
                              onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)}
                              placeholder={isLoadingCustomers ? 'جاري تحميل العملاء...' : 'ابحث بالاسم أو رقم الجوال...'}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-4 text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#09152B]/15 dark:focus:ring-blue-500/20 focus:border-[#09152B] dark:focus:border-blue-500 transition-all text-right"
                            />
                            {isCustomerDropdownOpen && !isLoadingCustomers && (
                              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                {filteredCustomers.length > 0 ? (
                                  filteredCustomers.map((c) => (
                                    <div
                                      key={c.id}
                                      onClick={() => {
                                        setSelectedCustomer(c);
                                        setCustomerSearchQuery(c.fullName);
                                        setIsCustomerDropdownOpen(false);
                                      }}
                                      className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b last:border-b-0 border-slate-100 dark:border-slate-800 flex flex-col text-right"
                                    >
                                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{c.fullName}</span>
                                      {c.phoneNumber && <span className="text-xs text-slate-400 font-jakarta tabular-nums" dir="ltr">{c.phoneNumber}</span>}
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-4 py-3 text-xs text-slate-400 text-center font-bold">لا توجد نتائج مطابقة</div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                              <User className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                              id="cash-customer-input"
                              type="text"
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-4 text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#09152B]/15 dark:focus:ring-blue-500/20 focus:border-[#09152B] dark:focus:border-blue-500 transition-all text-right"
                            />
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-right">
                      <label htmlFor="cash-phone-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        رقم الجوال (لإرسال إشعار الفاتورة الفوري)
                      </label>
                      {customerType === 'registered' ? (
                        <div className="relative" dir="ltr">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Phone className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            id="cash-phone-input"
                            type="text"
                            value={selectedCustomer ? (selectedCustomer.phoneNumber || 'لا يوجد رقم مسجل') : 'الرجاء اختيار عميل أولاً'}
                            disabled
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-10 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed text-center font-jakarta tabular-nums"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-[#09152B]/15 dark:focus-within:ring-blue-500/20 focus-within:border-[#09152B] dark:focus-within:border-blue-500 transition-all" dir="ltr">
                          <div className="relative shrink-0 h-full">
                            <select
                              value={phonePrefix}
                              onChange={(e) => setPhonePrefix(e.target.value)}
                              className="appearance-none bg-slate-100 dark:bg-slate-800 rounded-l-xl pl-2 pr-6 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer border-r border-slate-200 dark:border-slate-700 h-full w-[68px] font-jakarta tabular-nums text-center"
                            >
                              <option value="+970">+970</option>
                              <option value="+972">+972</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center pointer-events-none text-slate-400">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <Phone className="w-4 h-4 text-slate-400" />
                            </div>
                            <input
                              id="cash-phone-input"
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                              placeholder="5x xxx xxxx"
                              className="w-full bg-transparent py-2.5 pr-4 pl-10 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none font-jakarta tabular-nums placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Sales Details */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-extrabold text-[#09152B] dark:text-white">2. تفاصيل المبيعات والمبلغ</h2>
                  </div>
                </div>
                
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-1 text-right">
                      <label htmlFor="cash-amount-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        إجمالي مبلغ البيع <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-600 transition-all" dir="ltr">
                        <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold shrink-0 rounded-l-xl select-none">
                          شيكل (ILS)
                        </div>
                        <input
                          id="cash-amount-input"
                          type="text"
                          inputMode="decimal"
                          value={amount}
                          onChange={(e) => {
                            let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
                            const parts = val.split('.');
                            if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                            setAmount(val);
                          }}
                          placeholder="0.00"
                          className="flex-1 bg-transparent py-3 px-4 text-lg font-bold text-slate-800 dark:text-slate-200 outline-none font-jakarta tabular-nums text-right"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 sm:col-span-2 text-right">
                      <label htmlFor="cash-description-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        وصف المبيعات (المنتجات / الخدمات)
                      </label>
                      <input
                        id="cash-description-input"
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="مثال: أصناف مواد غذائية، كرتونة زيت، إلخ..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#09152B]/15 dark:focus:ring-blue-500/20 focus:border-[#09152B] dark:focus:border-blue-500 transition-all text-right"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Payment Method */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#09152B] dark:text-white">3. طريقة الدفع الفوري المستلمة</h2>
                      <p className="text-[11px] text-slate-400 font-medium">اختر وسيلة التحصيل الفعلية التي تم استلام المبلغ بها حالياً</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="طريقة الدفع">
                    <button 
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === 'cash'}
                      onClick={() => setPaymentMethod('cash')}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        paymentMethod === 'cash' 
                          ? 'border-[#007a3d] bg-emerald-50/70 dark:bg-emerald-950/40 text-[#007a3d] dark:text-emerald-400 shadow-xs font-bold' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {paymentMethod === 'cash' && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-[#007a3d] rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <Banknote className={`w-6 h-6 mb-2 ${paymentMethod === 'cash' ? 'text-[#007a3d] dark:text-emerald-400' : 'text-slate-400'}`} />
                      <span className="font-bold text-xs sm:text-sm">نقداً / كاش</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">استلام الخزينة</span>
                    </button>

                    <button 
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === 'transfer'}
                      onClick={() => setPaymentMethod('transfer')}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        paymentMethod === 'transfer' 
                          ? 'border-[#007a3d] bg-emerald-50/70 dark:bg-emerald-950/40 text-[#007a3d] dark:text-emerald-400 shadow-xs font-bold' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {paymentMethod === 'transfer' && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-[#007a3d] rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <Landmark className={`w-6 h-6 mb-2 ${paymentMethod === 'transfer' ? 'text-[#007a3d] dark:text-emerald-400' : 'text-slate-400'}`} />
                      <span className="font-bold text-xs sm:text-sm">تحويل بنكي</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">حوالة بنكية فورية</span>
                    </button>

                    <button 
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === 'wallet'}
                      onClick={() => setPaymentMethod('wallet')}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        paymentMethod === 'wallet' 
                          ? 'border-[#007a3d] bg-emerald-50/70 dark:bg-emerald-950/40 text-[#007a3d] dark:text-emerald-400 shadow-xs font-bold' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {paymentMethod === 'wallet' && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-[#007a3d] rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <Smartphone className={`w-6 h-6 mb-2 ${paymentMethod === 'wallet' ? 'text-[#007a3d] dark:text-emerald-400' : 'text-slate-400'}`} />
                      <span className="font-bold text-xs sm:text-sm">محفظة إلكترونية</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Jawwal Pay / PalPay</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Left Column (Invoice Summary & Actions) */}
            <div className="space-y-4 sticky top-24">
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-5">
                
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-slate-400" />
                    <h2 className="text-sm font-extrabold text-[#09152B] dark:text-white">ملخص الفاتورة النقدية</h2>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-md text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                    غير آجل
                  </span>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/60">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">الإجمالي المدفوع فوراً:</span>
                    <div className="text-left" dir="ltr">
                      <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight font-jakarta tabular-nums">
                        {numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 ml-1.5 font-cairo">₪</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-[#007a3d] hover:bg-[#006633] text-white py-3 rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري حفظ الفاتورة...</span>
                      </span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>إتمام البيع وإصدار الفاتورة النقدية</span>
                      </>
                    )}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => navigate(PATHS.PAYMENTS)}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
                  >
                    إلغاء العملية والتراجع
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 pt-1 text-slate-400 text-xs">
                  <Lock className="w-3.5 h-3.5" />
                  <span>موثق ومسجل بنظام وثّق للسداد الفوري المعتمد</span>
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">الفرق بين البيع النقدي والدين الآجل</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    هذه العملية تسجل كقبض فوري وتغلق الدورة المالية مباشرة دون إبقاء التزام مالي أو إرسال مطالبات سداد لاحقة على المشتري.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default CashSaleScreen;
