import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { getInstantSales, deleteInstantSale, updateInstantSale } from '../../services/instantSaleService';
import type { InstantSaleDto } from '../../types/instantSale';
import { Banknote, Landmark, CreditCard, RotateCw, AlertCircle, Calendar, Pencil, Trash2, X, CheckCircle2, ChevronDown, Phone } from 'lucide-react';
import { Toast } from '../ui/Toast';

export const InstantSalesLogView: FC = () => {
  const [sales, setSales] = useState<InstantSaleDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);
  
  // Edit Modal State
  const [editingSale, setEditingSale] = useState<InstantSaleDto | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editPhonePrefix, setEditPhonePrefix] = useState('+970');
  const [editPaymentMethod, setEditPaymentMethod] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (text: string, type: 'warning' | 'success' | 'error' = 'warning') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rawData = await getInstantSales();
      const possibleArray = Array.isArray(rawData) ? rawData : (rawData as any)?.items || (rawData as any)?.data;
      setSales(Array.isArray(possibleArray) ? possibleArray : []);
    } catch (err) {
      console.error(err);
      setError('تعذر تحميل بيانات المبيعات النقدية. تأكد من اتصالك بالخادم.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const confirmDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      await deleteInstantSale(id);
      showToast('تم حذف الفاتورة بنجاح.', 'success');
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء حذف الفاتورة.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (sale: InstantSaleDto) => {
    setEditAmount(sale.amount?.toString() || '0');
    setEditDescription(sale.description || '');
    setEditCustomerName(sale.customerName || '');
    
    let prefix = '+970';
    let phoneNum = sale.phoneNumber || '';
    if (phoneNum.startsWith('+')) {
      const match = phoneNum.match(/^(\+\d{1,4})(.*)$/);
      if (match) {
        prefix = match[1];
        phoneNum = match[2];
      }
    }
    
    setEditPhonePrefix(prefix);
    setEditCustomerPhone(phoneNum);
    setEditPaymentMethod(sale.paymentMethod || 1);
    setEditingSale(sale);
  };

  const handleSaveEdit = async () => {
    if (!editingSale) return;
    
    const numAmount = parseFloat(editAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('يرجى إدخال مبلغ صحيح أكبر من صفر', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateInstantSale(editingSale.id, {
        amount: numAmount,
        description: editDescription,
        paymentMethod: editPaymentMethod,
        customerId: editingSale.customerId,
        // Only allow editing name/phone if it's a guest (no customerId)
        guestCustomerName: editingSale.customerId ? null : editCustomerName,
        guestCustomerPhoneNumber: editingSale.customerId ? null : `${editPhonePrefix}${editCustomerPhone}`,
      });
      showToast('تم تعديل الفاتورة بنجاح.', 'success');
      setEditingSale(null);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء تعديل الفاتورة.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getMethodIcon = (method?: number) => {
    switch (method) {
      case 1:
        return <div className="flex items-center gap-1.5"><Banknote className="w-4 h-4 text-emerald-600" /><span className="text-emerald-700">نقداً</span></div>;
      case 2:
        return <div className="flex items-center gap-1.5"><Landmark className="w-4 h-4 text-blue-600" /><span className="text-blue-700">تحويل بنكي</span></div>;
      case 3:
        return <div className="flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-purple-600" /><span className="text-purple-700">محفظة</span></div>;
      default:
        return <div className="flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-slate-400" /><span className="text-slate-600 dark:text-slate-400">غير محدد</span></div>;
    }
  };

  const safeSales = Array.isArray(sales) ? sales : [];
  const totalAmount = safeSales.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6">
      <Toast 
        message={toastMessage?.text || null} 
        type={toastMessage?.type} 
        onClose={() => setToastMessage(null)} 
      />
      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-400 font-medium">إجمالي المبيعات الفورية</span>
          </div>
          <div className="mt-4 text-right">
            <div className="flex items-baseline gap-1.5 justify-start">
              <span className="text-2xl sm:text-3xl font-bold font-cairo text-[#051838] dark:text-white tracking-tight">
                {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 font-medium font-cairo">شيكل</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-400 font-medium">عدد العمليات</span>
          </div>
          <div className="mt-4 text-right">
            <span className="text-2xl sm:text-3xl font-bold font-cairo text-[#051838] dark:text-white tracking-tight">
              {safeSales.length}
            </span>
            <span className="text-xs text-slate-400 font-medium mr-1.5 font-cairo">عملية</span>
          </div>
        </div>

        <div
          onClick={loadData}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-xs group"
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 group-hover:bg-[#051838] group-hover:text-white flex items-center justify-center mb-1.5 transition-colors">
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo">
            تحديث البيانات الآن
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 font-medium text-xs bg-slate-50/6 dark:bg-slate-800/60 dark:bg-slate-800/60">
                <th className="px-6 py-4">رقم الفاتورة</th>
                <th className="px-6 py-4">العميل / الزبون</th>
                <th className="px-6 py-4">رقم الجوال</th>
                <th className="px-6 py-4">المبلغ</th>
                <th className="px-6 py-4">طريقة الدفع</th>
                <th className="px-6 py-4">تاريخ العملية</th>
                <th className="px-6 py-4">الوصف</th>
                <th className="px-6 py-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RotateCw className="w-6 h-6 animate-spin text-[#051838] dark:text-white" />
                      <span className="text-xs font-cairo">جاري تحميل مبيعات الكاش من السيرفر...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-2.5 max-w-md mx-auto p-4">
                      <AlertCircle className="w-8 h-8 text-amber-500" />
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm font-cairo">
                        {error}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : safeSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400 font-cairo text-sm">
                    لا توجد مبيعات نقدية مسجلة حالياً
                  </td>
                </tr>
              ) : (
                safeSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#051838] dark:text-white">#{sale.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                      {sale.customerName || 'زبون نقدي مباشر'}
                      {sale.customerId && (
                        <span className="block text-[10px] text-slate-400 mt-0.5">مسجل بالقائمة</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs" dir="ltr">{sale.phoneNumber || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-emerald-600 font-sans tracking-tight">
                        {sale.amount?.toLocaleString('en-US')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getMethodIcon(sale.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                      {sale.createdAt ? new Date(sale.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs max-w-[200px] truncate">
                      {sale.description || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleEditClick(sale)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="تعديل المبيعات الفورية"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(sale.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="حذف الفاتورة النقدية"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" dir="rtl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-[#051838] dark:text-white">تعديل الفاتورة النقدية #{editingSale.id}</h3>
              <button 
                onClick={() => setEditingSale(null)} 
                className="text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              
              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">اسم العميل / الزبون</label>
                  <input
                    type="text"
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    disabled={!!editingSale.customerId}
                    placeholder="زبون عابر"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#051838] dark:focus:ring-blue-500 transition-all disabled:bg-slate-50 dark:bg-slate-800/50 disabled:text-slate-500 dark:text-slate-400"
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">رقم الجوال</label>
                  {!!editingSale.customerId ? (
                    <div className="relative" dir="ltr">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={editCustomerPhone}
                        disabled
                        className="w-full bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-10 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed text-center"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-[#051838] dark:focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-xs" dir="ltr">
                      <div className="relative shrink-0 h-full">
                        <select
                          value={editPhonePrefix}
                          onChange={(e) => setEditPhonePrefix(e.target.value)}
                          className="appearance-none bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-600 dark:bg-slate-700 rounded-l-xl pl-2 pr-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer border-r border-slate-200 dark:border-slate-700 h-full w-[65px] transition-colors text-center"
                        >
                          <option value="+970">+970</option>
                          <option value="+972">+972</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Phone className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                          type="tel"
                          value={editCustomerPhone}
                          onChange={(e) => setEditCustomerPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="599 000 000"
                          className="w-full bg-transparent py-2.5 pr-4 pl-10 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none placeholder:text-slate-300"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {!!editingSale.customerId && (
                  <div className="col-span-2 p-2.5 bg-blue-50/50 rounded-xl flex items-start gap-2 border border-blue-100/50">
                    <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-600/80 leading-relaxed font-medium">
                      هذه الفاتورة مرتبطة بعميل مسجل في قائمة العملاء. لتعديل اسمه ورقم جواله، يرجى التوجه إلى صفحة إدارة العملاء.
                    </p>
                  </div>
                )}
              </div>

              {/* Amount & Payment Method */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">المبلغ الإجمالي</label>
                  <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-[#051838] dark:focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-xs" dir="ltr">
                    <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold shrink-0 rounded-l-xl select-none">
                      شيكل
                    </div>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="flex-1 bg-transparent py-2.5 px-4 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none border-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">طريقة الدفع</label>
                  <div className="relative">
                    <select
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 pr-10 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#051838] dark:focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value={1}>نقداً</option>
                      <option value={2}>تحويل بنكي</option>
                      <option value={3}>محفظة إلكترونية</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                      {editPaymentMethod === 1 ? <Banknote className="w-4 h-4" /> : editPaymentMethod === 2 ? <Landmark className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الوصف (اختياري)</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#051838] dark:focus:ring-blue-500 transition-all resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
              <button 
                onClick={() => setEditingSale(null)}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800/50 transition-colors cursor-pointer disabled:opacity-50"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-[#007a3d] hover:bg-[#006633] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSaving ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>حفظ التعديلات</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" dir="rtl">
            <div className="p-8 text-center space-y-5">
              <div className="w-20 h-20 bg-rose-50 border-[6px] border-rose-100/50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-[#051838] dark:text-white">تأكيد الحذف</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 leading-relaxed">
                  هل أنت متأكد من رغبتك في حذف الفاتورة رقم #{deleteConfirmId}؟ <br/> لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
                </p>
              </div>
            </div>
            <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 dark:bg-slate-700 hover:text-slate-800 dark:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                تراجع
              </button>
              <button 
                onClick={() => confirmDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-rose-500 hover:bg-rose-600 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>نعم، احذف</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstantSalesLogView;
