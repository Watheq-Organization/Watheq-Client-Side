import { useState, useEffect, type FC, type FormEvent } from 'react';
import { X, Search, UserPlus, Users, Phone, Check, AlertCircle, Loader2 } from 'lucide-react';
import {
  getCustomers,
  addCustomer,
  parseAddCustomerApiError,
  toGetCustomersErrorMessage,
  validateCustomerFullName,
  validateCustomerPhoneNumber,
  validateCustomerNationalId,
  formatFullCustomerPhone,
} from '../../services/customerService';
import type { CustomerDto } from '../../types/customer';
import { DEFAULT_CASH_CUSTOMER } from '../../context/InventoryPosContext';

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: { id?: string; name: string; phone?: string; totalDebt?: number }) => void;
  currentCustomerId?: string;
}

export const CustomerSelectModal: FC<CustomerSelectModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentCustomerId,
}) => {
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerNationalId, setNewCustomerNationalId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    getCustomers()
      .then((data) => {
        if (!isMounted) return;
        setCustomers(data);
        setLoadError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoadError(toGetCustomersErrorMessage(err));
        setCustomers([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleClose = () => {
    setShowAddForm(false);
    setSearch('');
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerNationalId('');
    setError(null);
    setLoadError(null);
    onClose();
  };

  if (!isOpen) return null;

  const handleRetryLoad = () => {
    setLoadError(null);
    setIsLoading(true);
    getCustomers()
      .then((data) => setCustomers(data))
      .catch((err) => setLoadError(toGetCustomersErrorMessage(err)))
      .finally(() => setIsLoading(false));
  };

  const filtered = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.phoneNumber.includes(search)
  );

  const handleCreateCustomer = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = newCustomerName.trim();
    const trimmedPhone = newCustomerPhone.trim();
    const trimmedNationalId = newCustomerNationalId.trim();

    const nameErr = validateCustomerFullName(trimmedName);
    if (nameErr) {
      setError(nameErr);
      return;
    }

    if (trimmedNationalId) {
      const idErr = validateCustomerNationalId(trimmedNationalId);
      if (idErr) {
        setError(idErr);
        return;
      }
    }

    let formattedPhone: string | null = null;
    if (trimmedPhone) {
      const phoneErr = validateCustomerPhoneNumber(trimmedPhone);
      if (phoneErr) {
        setError(phoneErr);
        return;
      }
      formattedPhone = formatFullCustomerPhone('970', trimmedPhone);
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await addCustomer({
        fullName: trimmedName,
        nationalId: trimmedNationalId || null,
        phoneNumber: formattedPhone,
        initialDebt: 0,
      });

      onSelect({
        id: created.id,
        name: created.fullName || trimmedName,
        phone: created.phoneNumber || formattedPhone || '',
        totalDebt: created.totalDebt || 0,
      });
      handleClose();
    } catch (err) {
      const parsed = parseAddCustomerApiError(err);
      const firstFieldErr = Object.values(parsed.fieldErrors)[0];
      setError(parsed.generalMessage || firstFieldErr || 'تعذّر إنشاء العميل؛ يرجى التحقق من البيانات المدخلة.');
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
      <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-md w-full overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  تحديد عميل الفاتورة
                </h3>
                <kbd className="text-[10px] font-jakarta font-semibold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700">
                  F1
                </kbd>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اختر العميل لربط الفاتورة أو التسديد
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Quick Add Toggle */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 space-y-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو رقم الجوال..."
                className="w-full h-9 pr-9 pl-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-slate-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-900"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setError(null);
              }}
              className="h-9 px-3 rounded-lg bg-[#09152B] hover:bg-[#12264B] dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'إلغاء' : 'عميل جديد'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onSelect(DEFAULT_CASH_CUSTOMER);
              handleClose();
            }}
            className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>اختيار &quot;زبون نقدي عام&quot;</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">للبيع الفوري</span>
          </button>
        </div>

        {/* Inline Quick Add Customer Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateCustomer}
            className="p-4 bg-slate-50/90 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0"
          >
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              إضافة عميل سريع
            </span>
            <input
              type="text"
              value={newCustomerName}
              onChange={(e) => {
                setNewCustomerName(e.target.value);
                setError(null);
              }}
              placeholder="اسم العميل الكامل *"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-slate-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="tel"
                value={newCustomerPhone}
                onChange={(e) => {
                  setNewCustomerPhone(e.target.value);
                  setError(null);
                }}
                placeholder="الجوال (9 أرقام)"
                dir="ltr"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-slate-400 font-jakarta tabular-nums text-left"
              />
              <input
                type="text"
                inputMode="numeric"
                maxLength={9}
                value={newCustomerNationalId}
                onChange={(e) => {
                  setNewCustomerNationalId(e.target.value.replace(/\D/g, ''));
                  setError(null);
                }}
                placeholder="رقم الهوية (9 أرقام)"
                dir="ltr"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-slate-400 font-jakarta tabular-nums text-left"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-300 text-[11px] font-semibold flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <span>حفظ واختيار العميل</span>
              )}
            </button>
          </form>
        )}

        {/* Customers List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl animate-pulse"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-2.5 bg-slate-200/70 dark:bg-slate-700/70 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="py-8 text-center space-y-2.5">
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{loadError}</p>
              <button
                type="button"
                onClick={handleRetryLoad}
                className="text-xs text-slate-700 dark:text-slate-200 underline hover:no-underline font-semibold cursor-pointer"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              لم يتم العثور على عملاء مطابقين للبحث
            </div>
          ) : (
            filtered.map((c) => {
              const isSelected = c.id === currentCustomerId;
              const debtAmount =
                c.currentBalance !== undefined && c.currentBalance > 0
                  ? c.currentBalance
                  : c.totalDebt || 0;
              const initial = c.fullName?.trim()?.charAt(0) || 'ع';

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelect({
                      id: c.id,
                      name: c.fullName,
                      phone: c.phoneNumber,
                      totalDebt: debtAmount,
                    });
                    handleClose();
                  }}
                  className={`w-full p-3 rounded-xl text-right flex items-center justify-between border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-50 dark:bg-slate-800 border-[#09152B] dark:border-slate-300 ring-1 ring-[#09152B]/15'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {c.fullName}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                      </div>
                      {c.phoneNumber && (
                        <span className="text-[11px] text-slate-400 font-jakarta tabular-nums inline-flex items-center gap-1 mt-0.5" dir="ltr">
                          <Phone className="w-3 h-3" />
                          {c.phoneNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="text-[10px] text-slate-400 block">رصيد الدين</span>
                    <span
                      className={`text-xs font-bold font-jakarta tabular-nums ${
                        debtAmount > 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                      dir="ltr"
                    >
                      ₪{debtAmount.toFixed(2)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            إغلاق (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
