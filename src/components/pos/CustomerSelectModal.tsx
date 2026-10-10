import { useState, useEffect, type FC, type FormEvent } from 'react';
import { X, Search, UserPlus, Users, Phone, Check } from 'lucide-react';
import { getCustomers, addCustomer } from '../../services/customerService';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setShowAddForm(false);
      setSearch('');
      setError(null);
      setLoadError(null);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch {
        setLoadError('تعذّر تحميل قائمة العملاء. تحقق من الاتصال وأعد المحاولة.');
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.phoneNumber.includes(search)
  );

  const handleCreateCustomer = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      setError('يرجى إدخال اسم العميل');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const created = await addCustomer({
        fullName: newCustomerName.trim(),
        phoneNumber: newCustomerPhone.trim() || '',
        initialDebt: 0,
      });

      onSelect({
        id: created.id,
        name: created.fullName,
        phone: created.phoneNumber,
        totalDebt: created.totalDebt || 0,
      });
      onClose();
    } catch {
      setError('تعذّر إنشاء العميل. تحقق من الاتصال وأعد المحاولة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  تحديد عميل الفاتورة
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold">
                  F1
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اختر العميل لربط حسابه أو تسجيل الدين
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو رقم الجوال..."
                className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition-all shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'إلغاء' : '+ عميل جديد'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onSelect(DEFAULT_CASH_CUSTOMER);
              onClose();
            }}
            className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center justify-between hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <span>اختيار &quot;زبون نقدي عام&quot; (Default)</span>
            <span className="text-[10px] font-mono font-normal">نقدي فوري</span>
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleCreateCustomer}
            className="p-4 bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900 space-y-2.5 animate-fadeIn"
          >
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300 block">
              إضافة عميل سريع:
            </span>
            <input
              type="text"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="اسم العميل الثلاثي *"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
            />
            <input
              type="tel"
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              placeholder="رقم الهاتف المحمول (اختياري)"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-blue-500 font-mono"
            />
            {error && <p className="text-[11px] text-rose-500">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ واختيار العميل فوراً'}
            </button>
          </form>
        )}

        <div className="p-4 overflow-y-auto space-y-2 flex-1">
        {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse border border-transparent">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-rose-500 font-semibold">{loadError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoadError(null);
                  setCustomers([]);
                  setIsLoading(true);
                  getCustomers()
                    .then((data) => setCustomers(data))
                    .catch(() => setLoadError('تعذّر تحميل قائمة العملاء. تحقق من الاتصال وأعد المحاولة.'))
                    .finally(() => setIsLoading(false));
                }}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              لم يتم العثور على عملاء مطابقين للبحث
            </div>
          ) : (
            filtered.map((c) => {
              const isSelected = c.id === currentCustomerId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelect({
                      id: c.id,
                      name: c.fullName,
                      phone: c.phoneNumber,
                      totalDebt: c.totalDebt || 0,
                    });
                    onClose();
                  }}
                  className={`w-full p-3 rounded-2xl text-right flex items-center justify-between border transition-all ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {c.fullName}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    {c.phoneNumber && (
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {c.phoneNumber}
                      </span>
                    )}
                  </div>

                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block">رصيد الدين</span>
                    <span
                      className={`text-xs font-black font-mono ${
                        (c.totalDebt || 0) > 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      ₪{(c.totalDebt || 0).toFixed(2)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            إغلاق (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
