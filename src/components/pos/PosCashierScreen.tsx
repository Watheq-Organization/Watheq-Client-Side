import { useState, useRef, useEffect, useCallback, useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  PauseCircle,
  Banknote,
  CreditCard,
  Building2,
  Smartphone,
  Camera,
  Users,
  ChevronLeft,
  Clock,
  Package,
} from 'lucide-react';
import { useInventoryPos, playScannerBeep } from '../../context/InventoryPosContext';
import type { CartItem } from '../../types/inventory';
import { QuickAddProductModal } from './QuickAddProductModal';
import { CashPaymentModal } from './CashPaymentModal';
import { DebtPaymentModal } from './DebtPaymentModal';
import { BankPaymentModal } from './BankPaymentModal';
import { HeldBillsModal } from './HeldBillsModal';
import { MobileScannerModal } from './MobileScannerModal';
import { ReceiptModal } from './ReceiptModal';
import { CustomerSelectModal } from './CustomerSelectModal';
import { ModifyQtyModal } from './ModifyQtyModal';
import { NegativeStockModal } from './NegativeStockModal';
import { CameraScannerModal } from '../common/CameraScannerModal';
import { Toast, type ToastType } from '../ui/Toast';
import { PATHS } from '../../routes/paths';
import { createDebt, toCreateDebtErrorMessage } from '../../services/debtService';
import { createInstantSale } from '../../services/instantSaleService';

export const PosCashierScreen: FC = () => {
  const navigate = useNavigate();
  const {
    products,
    addProduct,
    getProductByBarcode,
    cart,
    selectedCustomer,
    setSelectedCustomer,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartDiscount,
    selectedCartItemIndex,
    setSelectedCartItemIndex,
    totalItemsCount,
    cartSubtotal,
    cartTotalDue,
    heldBills,
    holdCurrentBill,
    resumeHeldBill,
    deleteHeldBill,
    activeReceipt,
    setActiveReceipt,
    checkout,
    pendingNegativeItem,
    setPendingNegativeItem,
    confirmAddNegativeItem,
  } = useInventoryPos();

  const [barcodeQuery, setBarcodeQuery] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');

  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [unresolvedBarcode, setUnresolvedBarcode] = useState('');

  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isHeldBillsModalOpen, setIsHeldBillsModalOpen] = useState(false);
  const [isMobileScannerModalOpen, setIsMobileScannerModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isCustomerSelectModalOpen, setIsCustomerSelectModalOpen] = useState(false);
  const [isModifyQtyModalOpen, setIsModifyQtyModalOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type?: ToastType } | null>(null);

  const focusBarcodeInput = useCallback(() => {
    const isAnyModalOpen =
      isQuickAddModalOpen ||
      isCashModalOpen ||
      isDebtModalOpen ||
      isBankModalOpen ||
      isHeldBillsModalOpen ||
      isMobileScannerModalOpen ||
      isCameraScannerOpen ||
      isCustomerSelectModalOpen ||
      isModifyQtyModalOpen ||
      Boolean(activeReceipt) ||
      Boolean(pendingNegativeItem);

    if (!isAnyModalOpen && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [
    isQuickAddModalOpen,
    isCashModalOpen,
    isDebtModalOpen,
    isBankModalOpen,
    isHeldBillsModalOpen,
    isMobileScannerModalOpen,
    isCameraScannerOpen,
    isCustomerSelectModalOpen,
    isModifyQtyModalOpen,
    activeReceipt,
    pendingNegativeItem,
  ]);

  useEffect(() => {
    focusBarcodeInput();
  }, [focusBarcodeInput]);

  const handleResolveBarcode = useCallback(
    (codeToScan: string) => {
      const trimmed = codeToScan.trim();
      if (!trimmed) return;

      const found = getProductByBarcode(trimmed);
      if (found) {
        addToCart(found, 1);
        setBarcodeQuery('');
        setToast({ message: `تمت إضافة (${found.name}) إلى الفاتورة`, type: 'info' });
      } else {
        playScannerBeep('alert');
        setUnresolvedBarcode(trimmed);
        setIsQuickAddModalOpen(true);
        setBarcodeQuery('');
      }
      setTimeout(focusBarcodeInput, 50);
    },
    [getProductByBarcode, addToCart, focusBarcodeInput]
  );

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isAnyModalOpen =
        isQuickAddModalOpen ||
        isCashModalOpen ||
        isDebtModalOpen ||
        isBankModalOpen ||
        isHeldBillsModalOpen ||
        isMobileScannerModalOpen ||
        isCameraScannerOpen ||
        isCustomerSelectModalOpen ||
        isModifyQtyModalOpen ||
        Boolean(activeReceipt) ||
        Boolean(pendingNegativeItem);

      if (e.key === 'F1') {
        e.preventDefault();
        setIsCustomerSelectModalOpen(true);
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsModifyQtyModalOpen(true);
        } else {
          setToast({ message: 'السلة فارغة حالياً لتعديل الكمية', type: 'error' });
        }
        return;
      }

      if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          holdCurrentBill();
          setToast({ message: 'تم تعليق الفاتورة بنجاح في قائمة الانتظار', type: 'info' });
        } else {
          setToast({ message: 'لا توجد أصناف بالسلة لتعليقها', type: 'error' });
        }
        return;
      }

      if (e.key === 'F5') {
        e.preventDefault();
        setIsHeldBillsModalOpen(true);
        return;
      }

      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsCashModalOpen(true);
        } else {
          setToast({ message: 'أضف أصنافاً أولاً للبدء بالسداد النقدي', type: 'error' });
        }
        return;
      }

      if (e.key === 'F10') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsDebtModalOpen(true);
        } else {
          setToast({ message: 'أضف أصنافاً أولاً لتسجيل الدين', type: 'error' });
        }
        return;
      }

      if (e.key === 'F11') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsBankModalOpen(true);
        } else {
          setToast({ message: 'أضف أصنافاً أولاً للتحويل البنكي', type: 'error' });
        }
        return;
      }

      if (e.key === 'Escape') {
        if (isAnyModalOpen) {
          setIsQuickAddModalOpen(false);
          setIsCashModalOpen(false);
          setIsDebtModalOpen(false);
          setIsBankModalOpen(false);
          setIsHeldBillsModalOpen(false);
          setIsMobileScannerModalOpen(false);
          setIsCameraScannerOpen(false);
          setIsCustomerSelectModalOpen(false);
          setIsModifyQtyModalOpen(false);
          setActiveReceipt(null);
          setPendingNegativeItem(null);
          setTimeout(focusBarcodeInput, 100);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    cart.length,
    holdCurrentBill,
    focusBarcodeInput,
    isQuickAddModalOpen,
    isCashModalOpen,
    isDebtModalOpen,
    isBankModalOpen,
    isHeldBillsModalOpen,
    isMobileScannerModalOpen,
    isCameraScannerOpen,
    isCustomerSelectModalOpen,
    isModifyQtyModalOpen,
    activeReceipt,
    pendingNegativeItem,
    setActiveReceipt,
    setPendingNegativeItem,
  ]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const displayedQuickItems = useMemo(() => {
    if (activeCategoryTab === 'all') {
      return products;
    } else {
      return products.filter((p) => p.category === activeCategoryTab);
    }
  }, [products, activeCategoryTab]);

  const activeCartItemForEdit: CartItem | null = useMemo(() => {
    if (cart.length === 0) return null;
    if (selectedCartItemIndex >= 0 && selectedCartItemIndex < cart.length) {
      return cart[selectedCartItemIndex];
    }
    return cart[cart.length - 1];
  }, [cart, selectedCartItemIndex]);

  return (
    <div
      className="flex flex-col h-screen bg-slate-950 text-slate-100 font-cairo select-none overflow-hidden"
      dir="rtl"
      onClick={focusBarcodeInput}
    >
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* POS Top Terminal Header Bar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base tracking-wide">نقطة بيع وثّق</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  متصل ومباشر 🟢
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(PATHS.INVENTORY)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold border border-slate-700 transition-colors"
          >
            <Package className="w-3.5 h-3.5 text-blue-400" />
            <span>كتالوج المخزون</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(PATHS.DASHBOARD)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold border border-slate-700 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>لوحة القيادة</span>
          </button>
        </div>

        <div className="hidden xl:flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-emerald-400">
              F1
            </kbd>{' '}
            عميل
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-purple-400">
              F2
            </kbd>{' '}
            كمية
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-amber-400">
              F4
            </kbd>{' '}
            تعليق
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-amber-400">
              F5
            </kbd>{' '}
            استرجاع
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-emerald-400">
              F9
            </kbd>{' '}
            كاش
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-rose-400">
              F10
            </kbd>{' '}
            دين
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-indigo-400">
              F11
            </kbd>{' '}
            بنك
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHeldBillsModalOpen(true)}
            className="relative px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="الفواتير المعلقة (F5)"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>المعلق</span>
            {heldBills.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-black text-[11px] flex items-center justify-center animate-pulse">
                {heldBills.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMobileScannerModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="ربط ماسح الجوال 📲"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ربط ماسح الجوال 📲</span>
          </button>
        </div>
      </header>

      {/* Main Terminal Workspace: Screen Split */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Side: 40% Cart */}
        <section className="w-full lg:w-[40%] flex flex-col border-b lg:border-b-0 lg:border-l border-slate-800 bg-slate-900/90 h-[50vh] lg:h-full shrink-0">
          <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">العميل:</span>
                  <span className="text-xs sm:text-sm font-black text-white truncate">
                    {selectedCustomer.name}
                  </span>
                </div>
                {(selectedCustomer.totalDebt || 0) > 0 && (
                  <span className="text-[11px] text-rose-400 font-mono font-bold block">
                    دين سابق: ₪{(selectedCustomer.totalDebt || 0).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCustomerSelectModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
            >
              <span>تغيير (F1)</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-2 sm:p-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <ShoppingCart className="w-16 h-16 mb-3 stroke-1 opacity-20" />
                <p className="font-bold text-slate-400 text-sm">الفاتورة الحالية فارغة</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  ابدأ بمسح باركود السلعة أو اضغط على أي صنف من الشبكة السريعة لإضافته فوراً
                </p>
              </div>
            ) : (
              cart.map((item, index) => {
                const isSelected = selectedCartItemIndex === index;
                const remainingInStore = item.product.stock - item.quantity;
                const isDepleted = remainingInStore < 0;

                return (
                  <div
                    key={item.product.id}
                    onClick={() => setSelectedCartItemIndex(index)}
                    className={`p-2.5 sm:p-3 rounded-2xl transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-800/90 ring-1 ring-emerald-500/50'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {item.product.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="font-mono text-emerald-400 font-bold">
                          ₪{item.unitPrice.toFixed(2)}
                        </span>

                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                            isDepleted
                              ? 'bg-rose-950/60 text-rose-400 border border-rose-800 font-bold'
                              : remainingInStore <= item.product.minAlertThreshold
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          [المتبقي بالمحل: {remainingInStore}]
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCartQty(item.product.id, item.quantity - 1);
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCartItemIndex(index);
                          setIsModifyQtyModalOpen(true);
                        }}
                        className="min-w-[28px] px-1.5 py-0.5 rounded-lg bg-slate-950 border border-slate-700 text-center font-mono font-black text-xs sm:text-sm text-white hover:border-purple-400"
                        title="انقر لتعديل الكمية (F2)"
                      >
                        {item.quantity}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item.product, 1);
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-left font-mono shrink-0 min-w-[65px]">
                      <span className="text-sm font-black text-white block">
                        ₪{item.subtotal.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.product.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                      title="حذف من السلة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Financial Summary */}
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/95 space-y-3 shrink-0">
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>عدد الأصناف الإجمالي:</span>
                <span className="font-bold text-white font-mono">{totalItemsCount} قطعة</span>
              </div>
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-mono text-white">₪{cartSubtotal.toFixed(2)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-amber-400 font-bold">
                  <span>الخصم:</span>
                  <span className="font-mono">-₪{cartDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border-2 border-emerald-500/40 flex items-center justify-between shadow-lg shadow-emerald-950/20">
              <div>
                <span className="text-xs font-bold text-emerald-400 block">المجموع النهائي للتحصيل</span>
                <span className="text-[10px] text-slate-400">شامل الضريبة والخصم</span>
              </div>
              <div className="text-left font-mono">
                <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                  ₪{cartTotalDue.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0) setIsCashModalOpen(true);
                  else setToast({ message: 'السلة فارغة!', type: 'error' });
                }}
                disabled={cart.length === 0}
                className="py-3 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:opacity-40 text-white font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-1">
                  <Banknote className="w-4 h-4" />
                  <span>نقدي</span>
                </div>
                <span className="text-[10px] opacity-80 font-mono">F9</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0) setIsDebtModalOpen(true);
                  else setToast({ message: 'السلة فارغة!', type: 'error' });
                }}
                disabled={cart.length === 0}
                className="py-3 px-2 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:opacity-40 text-white font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-1">
                  <CreditCard className="w-4 h-4" />
                  <span>دين / آجل</span>
                </div>
                <span className="text-[10px] opacity-80 font-mono">F10</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0) setIsBankModalOpen(true);
                  else setToast({ message: 'السلة فارغة!', type: 'error' });
                }}
                disabled={cart.length === 0}
                className="py-3 px-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:opacity-40 text-white font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  <span>بنك / بال باي</span>
                </div>
                <span className="text-[10px] opacity-80 font-mono">F11</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0) {
                    holdCurrentBill();
                    setToast({ message: 'تم تعليق الفاتورة (F4)', type: 'info' });
                  }
                }}
                disabled={cart.length === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 disabled:opacity-40 transition-colors"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>تعليق الفاتورة (F4)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0 && confirm('هل تريد تفريغ السلة الحالية بالكامل؟')) {
                    clearCart();
                  }
                }}
                disabled={cart.length === 0}
                className="text-slate-500 hover:text-rose-400 disabled:opacity-30 transition-colors"
              >
                إلغاء السلة ✕
              </button>
            </div>
          </div>
        </section>

        {/* Right Side: 60% Input & Grid */}
        <section className="flex-1 flex flex-col min-h-0 bg-slate-950 p-3 sm:p-5 space-y-4 overflow-hidden">
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Barcode className="w-5 h-5 text-emerald-400 absolute right-4 top-3.5" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeQuery}
                  onChange={(e) => setBarcodeQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleResolveBarcode(barcodeQuery);
                    }
                  }}
                  placeholder="امسح الباركود بجهاز الليزر أو اكتب الرقم واضغط Enter..."
                  className="w-full pr-12 pl-4 py-3.5 rounded-2xl border-2 border-emerald-500/50 bg-slate-900 text-white font-mono text-sm sm:text-base placeholder:text-slate-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 outline-hidden transition-all shadow-inner"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 hover:scale-[1.02]"
                title="مسح بالكاميرا"
              >
                <Camera className="w-5 h-5" />
                <span className="hidden sm:inline">كاميرا</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-2">
              <span>قارئ الباركود نشط تلقائياً • استجابة فورية &lt;50ms</span>
              <span className="font-mono text-emerald-400/80">
                إذا كان الباركود غير مسجل، ستظهر نافذة الإضافة السريعة فوراً!
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
            <button
              type="button"
              onClick={() => setActiveCategoryTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeCategoryTab === 'all'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              جميع الأصناف ({products.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryTab(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  activeCategoryTab === cat
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
              {displayedQuickItems.map((prod) => {
                const isOutOfStock = prod.stock <= 0;
                const isLowStock = !isOutOfStock && prod.stock <= prod.minAlertThreshold;

                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => {
                      addToCart(prod, 1);
                    }}
                    className="p-3 sm:p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/60 text-right transition-all flex flex-col justify-between group active:scale-[0.97] hover:shadow-lg relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between w-full mb-2">
                      <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[100px]">
                        {prod.category}
                      </span>

                      {isOutOfStock ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-950/80 text-rose-400 border border-rose-800">
                          نفد 🔴
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-950/80 text-amber-400 border border-amber-800">
                          {prod.stock} حبات 🟡
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-500">
                          {prod.stock} بالمحل
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-tight mb-2">
                      {prod.name}
                    </h4>

                    <div className="flex items-center justify-between w-full pt-2 border-t border-slate-800/80 font-mono">
                      <span className="text-sm sm:text-base font-black text-emerald-400">
                        ₪{prod.salePrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all font-bold">
                        + إضافة
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <QuickAddProductModal
        isOpen={isQuickAddModalOpen}
        onClose={() => {
          setIsQuickAddModalOpen(false);
          setTimeout(focusBarcodeInput, 100);
        }}
        barcode={unresolvedBarcode}
        onConfirm={(newProductData) => {
          const created = addProduct(newProductData);
          addToCart(created, 1);
          setToast({
            message: `تم حفظ الصنف (${created.name}) في المخزون وإضافته للسلة فوراً!`,
            type: 'success',
          });
          setTimeout(focusBarcodeInput, 100);
        }}
      />

      <CashPaymentModal
        isOpen={isCashModalOpen}
        onClose={() => {
          setIsCashModalOpen(false);
          setTimeout(focusBarcodeInput, 100);
        }}
        totalDue={cartTotalDue}
        customerName={selectedCustomer.name}
        onConfirm={async (received, change, discount) => {
          try {
            const netDue = cartTotalDue - discount;
            const isGuest = !selectedCustomer.id || selectedCustomer.name === 'زبون نقدي عام';
            const invoiceNotes = cart.map((item) => `${item.product.name} × ${item.quantity}`).join(' | ');
            const desc = `مبيعات نقدية | محتويات الفاتورة: ${invoiceNotes}`;

            await createInstantSale({
              amount: netDue,
              description: desc,
              paymentMethod: 1, // 1 for Cash
              customerId: !isGuest ? Number(selectedCustomer.id) : null,
              customerName: !isGuest ? selectedCustomer.name : null,
              phoneNumber: !isGuest ? selectedCustomer.phone : null,
              guestCustomerName: isGuest ? selectedCustomer.name : null,
              guestCustomerPhoneNumber: isGuest ? selectedCustomer.phone : null,
            });

            await checkout({
              method: 'cash',
              customerName: selectedCustomer.name,
              customerPhone: selectedCustomer.phone,
              customerId: selectedCustomer.id,
              receivedAmount: received,
              changeAmount: change,
              discount,
            });
            setToast({ message: 'تم إتمام البيع وتسجيل الدفعة النقدية بنجاح', type: 'success' });
          } catch (error) {
            setToast({ message: 'حدث خطأ أثناء تسجيل الدفعة في الخادم', type: 'error' });
          }
        }}
      />

      <DebtPaymentModal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          setTimeout(focusBarcodeInput, 100);
        }}
        totalDue={cartTotalDue}
        customer={selectedCustomer}
        cartItems={cart}
        onSelectCustomer={() => {
          setIsDebtModalOpen(false);
          setIsCustomerSelectModalOpen(true);
        }}
        onConfirm={async (dueDate, invoiceNotes) => {
          try {
            if (selectedCustomer.id) {
              await createDebt({
                customerId: selectedCustomer.id,
                amount: cartTotalDue.toString(),
                dueDate: dueDate,
                notes: invoiceNotes,
              });
            }
            await checkout({
              method: 'debt',
              customerName: selectedCustomer.name,
              customerPhone: selectedCustomer.phone,
              customerId: selectedCustomer.id,
              debtNotes: invoiceNotes,
            });
            setToast({ message: 'تم تسجيل الدين وإصدار السند بنجاح', type: 'success' });
          } catch (error) {
            setToast({ message: toCreateDebtErrorMessage(error), type: 'error' });
          }
        }}
      />

      <BankPaymentModal
        isOpen={isBankModalOpen}
        onClose={() => {
          setIsBankModalOpen(false);
          setTimeout(focusBarcodeInput, 100);
        }}
        totalDue={cartTotalDue}
        customerName={selectedCustomer.name}
        onConfirm={async (bankRefCode, provider) => {
          try {
            await createInstantSale({
              amount: cartTotalDue,
              description: `دفع بنكي (${provider}): ${bankRefCode}`,
              customerId: selectedCustomer.id ? Number(selectedCustomer.id) : null,
              customerName: selectedCustomer.name,
              phoneNumber: selectedCustomer.phone,
              paymentMethod: 2, // Bank Payment
            });

            await checkout({
              method: 'bank',
              customerName: selectedCustomer.name,
              customerPhone: selectedCustomer.phone,
              customerId: selectedCustomer.id,
              bankRefCode: `${provider}: ${bankRefCode}`,
            });
            setToast({ message: 'تم تسجيل الدفعة البنكية وإصدار السند بنجاح', type: 'success' });
          } catch (error) {
            setToast({ message: 'حدث خطأ أثناء تسجيل الدفعة في الخادم', type: 'error' });
          }
        }}
      />

      <HeldBillsModal
        isOpen={isHeldBillsModalOpen}
        onClose={() => {
          setIsHeldBillsModalOpen(false);
          setTimeout(focusBarcodeInput, 100);
        }}
        heldBills={heldBills}
        onResume={(billId) => {
          resumeHeldBill(billId);
          setToast({ message: 'تم استرجاع الفاتورة للشاشة بنجاح', type: 'info' });
          setTimeout(focusBarcodeInput, 100);
        }}
        onDelete={(billId) => {
          deleteHeldBill(billId);
          setToast({ message: 'تم حذف الفاتورة المعلقة', type: 'info' });
        }}
      />

      <MobileScannerModal
        isOpen={isMobileScannerModalOpen}
        onClose={() => {
          setIsMobileScannerModalOpen(false);
          setTimeout(focusBarcodeInput, 100);
        }}
        onSimulateBarcode={(scanned) => {
          handleResolveBarcode(scanned);
        }}
      />

      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => {
          setIsCameraScannerOpen(false);
          setTimeout(focusBarcodeInput, 100);
        }}
        onScan={(scanned) => {
          handleResolveBarcode(scanned);
        }}
        title="مسح باركود السلعة بكاميرا الكاشير"
      />

      <CustomerSelectModal
        isOpen={isCustomerSelectModalOpen}
        onClose={() => {
          setIsCustomerSelectModalOpen(false);
          setTimeout(focusBarcodeInput, 100);
        }}
        currentCustomerId={selectedCustomer.id}
        onSelect={(cust) => {
          setSelectedCustomer(cust);
          setToast({ message: `تم تحديد العميل: ${cust.name}`, type: 'info' });
          setTimeout(focusBarcodeInput, 100);
        }}
      />

      <ModifyQtyModal
        isOpen={isModifyQtyModalOpen}
        onClose={() => {
          setIsModifyQtyModalOpen(false);
          setTimeout(focusBarcodeInput, 100);
        }}
        cartItem={activeCartItemForEdit}
        onConfirm={(newQty) => {
          if (activeCartItemForEdit) {
            updateCartQty(activeCartItemForEdit.product.id, newQty);
          }
          setTimeout(focusBarcodeInput, 100);
        }}
      />

      <NegativeStockModal
        pendingItem={pendingNegativeItem}
        onConfirm={() => confirmAddNegativeItem()}
        onCancel={() => setPendingNegativeItem(null)}
      />

      <ReceiptModal
        sale={activeReceipt}
        isOpen={Boolean(activeReceipt)}
        onClose={() => {
          setActiveReceipt(null);
          setTimeout(focusBarcodeInput, 100);
        }}
      />
    </div>
  );
};
