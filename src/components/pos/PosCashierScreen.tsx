import { useState, useRef, useEffect, useCallback, useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  PauseCircle,
  Banknote,
  CreditCard,
  Building2,
  Smartphone,
  Search,
  X,
  Users,
  ChevronLeft,
  Clock,
  Package,
  ReceiptText,
  AlertCircle,
  AlertTriangle,
  Barcode,
  RotateCw,
  Moon,
  Sun,
} from 'lucide-react';
import { useInventoryPos, playScannerBeep } from '../../context/InventoryPosContext';
import { useTheme } from '../../context/ThemeContext';
import { ApiError } from '../../api/httpClient';
import type { CartItem, Product } from '../../types/inventory';
import {
  cashierScannerManager,
  type ScannedProductDto,
  type CashierScannerStatus,
} from '../../services/scannerHubService';
import { scannerP2PService, type P2PCartItem } from '../../services/scannerP2PService';
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
import { RegisterPaymentModal } from './RegisterPaymentModal';
import { Toast, type ToastType } from '../ui/Toast';
import { PATHS } from '../../routes/paths';
import { createProduct, getProductByBarcodeApi } from '../../services/productService';
import { getCustomerProfile } from '../../services/customerService';

const normalizeArabic = (text: string) => {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '');
};

export const PosCashierScreen: FC = () => {
  const navigate = useNavigate();
  const { isDarkMode, setTheme } = useTheme();
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
    refreshProducts,
    isLoadingProducts,
    productsLoadError,
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
  const [confirmingClearCart, setConfirmingClearCart] = useState(false);

  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [unresolvedBarcode, setUnresolvedBarcode] = useState('');

  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isHeldBillsModalOpen, setIsHeldBillsModalOpen] = useState(false);
  const [isMobileScannerModalOpen, setIsMobileScannerModalOpen] = useState(false);
  const [isCustomerSelectModalOpen, setIsCustomerSelectModalOpen] = useState(false);
  const [isModifyQtyModalOpen, setIsModifyQtyModalOpen] = useState(false);
  const [isRegisterPaymentModalOpen, setIsRegisterPaymentModalOpen] = useState(false);
  const [paymentModalDefaultMethod, setPaymentModalDefaultMethod] = useState<'cash' | 'wallet'>('cash');
  const [scannerStatus, setScannerStatus] = useState<CashierScannerStatus>('idle');

  const [toast, setToast] = useState<{ message: string; type?: ToastType } | null>(null);

  const focusBarcodeInput = useCallback(() => {
    const isAnyModalOpen =
      isQuickAddModalOpen ||
      isCashModalOpen ||
      isDebtModalOpen ||
      isBankModalOpen ||
      isHeldBillsModalOpen ||
      isMobileScannerModalOpen ||
      isCustomerSelectModalOpen ||
      isModifyQtyModalOpen ||
      isRegisterPaymentModalOpen ||
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
    isCustomerSelectModalOpen,
    isModifyQtyModalOpen,
    isRegisterPaymentModalOpen,
    activeReceipt,
    pendingNegativeItem,
  ]);

  useEffect(() => {
    void refreshProducts();
    focusBarcodeInput();
  }, [focusBarcodeInput, refreshProducts]);

  const handleCloseMobileScanner = useCallback(() => {
    setIsMobileScannerModalOpen(false);
    setTimeout(focusBarcodeInput, 100);
  }, [focusBarcodeInput]);

  const lastCashierScannedCodeRef = useRef<string>('');
  const lastCashierScannedTimeRef = useRef<number>(0);

  const handleResolveBarcode = useCallback(
    async (codeToScan: string) => {
      const trimmed = codeToScan.trim();
      if (!trimmed) return;

      // Ignore pairing URLs or session QR codes accidentally scanned
      if (
        trimmed.includes('/scan?') ||
        trimmed.includes('sessionId=') ||
        trimmed.includes('pairingSecret') ||
        trimmed.includes('secret=')
      ) {
        return;
      }

      const now = Date.now();
      if (
        lastCashierScannedCodeRef.current === trimmed &&
        now - lastCashierScannedTimeRef.current < 1500
      ) {
        return;
      }
      lastCashierScannedCodeRef.current = trimmed;
      lastCashierScannedTimeRef.current = now;

      let found = getProductByBarcode(trimmed);

      if (!found) {
        try {
          const match = await getProductByBarcodeApi(trimmed);
          if (match) {
            addProduct(match);
            found = match;
          }
        } catch {
          // ignore lookup error and continue name search fallback
        }
      }

      if (!found) {
        const norm = normalizeArabic(trimmed);
        const exactNameMatch = products.find(
          (p) => normalizeArabic(p.name) === norm
        );
        if (exactNameMatch) {
          found = exactNameMatch;
        } else {
          const nameMatches = products.filter((p) =>
            normalizeArabic(p.name).includes(norm)
          );
          if (nameMatches.length === 1) {
            found = nameMatches[0];
          }
        }
      }

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
    [getProductByBarcode, addProduct, addToCart, focusBarcodeInput, products]
  );

  const handleRemoteProductScanned = useCallback(
    (scannedProduct: ScannedProductDto) => {
      if (!scannedProduct?.barcode) return;

      const trimmed = scannedProduct.barcode.trim();
      const now = Date.now();
      if (
        lastCashierScannedCodeRef.current === trimmed &&
        now - lastCashierScannedTimeRef.current < 1500
      ) {
        return;
      }
      lastCashierScannedCodeRef.current = trimmed;
      lastCashierScannedTimeRef.current = now;

      let found = getProductByBarcode(trimmed);

      if (!found) {
        const resolvedProduct: Product = {
          id: String(scannedProduct.productId),
          barcode: trimmed,
          name: scannedProduct.productName,
          category: scannedProduct.category || 'غير محدد',
          unit: scannedProduct.unit || 'غير محدد',
          salePrice: Number(scannedProduct.salePrice || 0),
          costPrice: 0,
          stock: Number(scannedProduct.stockQuantity || 0),
          minAlertThreshold: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addProduct(resolvedProduct);
        found = resolvedProduct;
      }

      addToCart(found, 1);
      playScannerBeep('scan');
      setBarcodeQuery('');
      setToast({ message: `تمت إضافة (${found.name}) عبر ماسح الجوال`, type: 'info' });
      setTimeout(focusBarcodeInput, 50);
    },
    [getProductByBarcode, addProduct, addToCart, focusBarcodeInput]
  );

  const handleRemoteUpdateQty = useCallback(
    (target: string, delta: number) => {
      const cleanTarget = target.trim().toLowerCase();
      const existing = cart.find(
        (i) =>
          String(i.product.id).trim().toLowerCase() === cleanTarget ||
          (i.product.barcode && i.product.barcode.trim().toLowerCase() === cleanTarget)
      );
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          removeFromCart(existing.product.id);
          setToast({ message: `تم حذف (${existing.product.name}) من السلة عبر الجوال`, type: 'info' });
        } else {
          updateCartQty(existing.product.id, newQty);
          setToast({
            message: `تم تعديل كمية (${existing.product.name}) إلى ${newQty} عبر الجوال`,
            type: 'info',
          });
        }
      }
    },
    [cart, updateCartQty, removeFromCart]
  );

  // Subscribe to SignalR ScannerHub events, WebRTC P2P events, and local fallbacks
  useEffect(() => {
    const unsubScanner = cashierScannerManager.subscribeStatus(setScannerStatus);
    const unsubBarcode = cashierScannerManager.subscribeBarcode((data) => {
      if (data.product) {
        handleRemoteProductScanned(data.product);
      } else if (data.barcode) {
        void handleResolveBarcode(data.barcode);
      }
    });
    const unsubProduct = cashierScannerManager.subscribeProduct((prod) => {
      handleRemoteProductScanned(prod);
    });

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('watheq_pos_scanner');
      channel.onmessage = (event) => {
        if (event.data?.type === 'BARCODE_SCANNED' && event.data?.barcode) {
          void handleResolveBarcode(event.data.barcode);
        } else if (
          event.data?.type === 'UPDATE_QTY' &&
          event.data?.productId &&
          typeof event.data?.delta === 'number'
        ) {
          handleRemoteUpdateQty(event.data.productId, event.data.delta);
        }
      };
    } catch {
      // ignore BroadcastChannel unavailable
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'watheq_last_scanned_barcode' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.barcode) {
            void handleResolveBarcode(parsed.barcode);
          }
        } catch {
          // ignore invalid JSON
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      unsubScanner();
      unsubBarcode();
      unsubProduct();
      channel?.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [handleResolveBarcode, handleRemoteProductScanned, handleRemoteUpdateQty]);

  useEffect(() => {
    const unsub = scannerP2PService.subscribeUpdateQty((target, delta) => {
      handleRemoteUpdateQty(target, delta);
    });
    return () => unsub();
  }, [handleRemoteUpdateQty]);

  // Sync full cart to connected Mobile Scanner in real-time
  useEffect(() => {
    const p2pCart: P2PCartItem[] = cart.map((i) => ({
      id: i.product.id,
      barcode: i.product.barcode || '',
      name: i.product.name,
      price: i.unitPrice,
      quantity: i.quantity,
    }));

    if (scannerP2PService.getStatus() === 'connected') {
      scannerP2PService.sendCartSync(p2pCart, cartTotalDue, totalItemsCount);
    }

    try {
      const bc = new BroadcastChannel('watheq_pos_scanner');
      bc.postMessage({
        type: 'CART_SYNC',
        cart: p2pCart,
        totalAmount: cartTotalDue,
        totalCount: totalItemsCount,
      });
      bc.close();
    } catch {
      // ignore
    }
  }, [cart, cartTotalDue, totalItemsCount]);

  useEffect(() => {
    const unsub = scannerP2PService.subscribeStatus((st) => {
      if (st === 'connected') {
        const p2pCart: P2PCartItem[] = cart.map((i) => ({
          id: i.product.id,
          barcode: i.product.barcode || '',
          name: i.product.name,
          price: i.unitPrice,
          quantity: i.quantity,
        }));
        scannerP2PService.sendCartSync(p2pCart, cartTotalDue, totalItemsCount);
      }
    });
    return () => unsub();
  }, [cart, cartTotalDue, totalItemsCount]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isAnyModalOpen =
        isQuickAddModalOpen ||
        isCashModalOpen ||
        isDebtModalOpen ||
        isBankModalOpen ||
        isHeldBillsModalOpen ||
        isMobileScannerModalOpen ||
        isCustomerSelectModalOpen ||
        isModifyQtyModalOpen ||
        isRegisterPaymentModalOpen ||
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
          setToast({ message: 'السلة فارغة؛ أضف صنفاً لتعديل كميته.', type: 'error' });
        }
        return;
      }

      if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          holdCurrentBill();
          setToast({ message: 'تم تعليق الفاتورة بنجاح في قائمة الانتظار.', type: 'info' });
        } else {
          setToast({ message: 'لا توجد أصناف بالسلة لتعليق الفاتورة.', type: 'error' });
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
        } else if (
          selectedCustomer.id &&
          selectedCustomer.name !== 'زبون نقدي عام' &&
          (selectedCustomer.totalDebt || 0) > 0
        ) {
          setPaymentModalDefaultMethod('cash');
          setIsRegisterPaymentModalOpen(true);
        } else {
          setToast({ message: 'أضف أصنافاً للسلة أولاً للبدء بالسداد النقدي.', type: 'error' });
        }
        return;
      }

      if (e.key === 'F10') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsDebtModalOpen(true);
        } else {
          setToast({ message: 'أضف أصنافاً للسلة أولاً لتسجيل البيع بالآجل.', type: 'error' });
        }
        return;
      }

      if (e.key === 'F11') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsBankModalOpen(true);
        } else if (
          selectedCustomer.id &&
          selectedCustomer.name !== 'زبون نقدي عام' &&
          (selectedCustomer.totalDebt || 0) > 0
        ) {
          setPaymentModalDefaultMethod('wallet');
          setIsRegisterPaymentModalOpen(true);
        } else {
          setToast({ message: 'أضف أصنافاً للسلة أولاً للتحويل البنكي.', type: 'error' });
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
          setIsCustomerSelectModalOpen(false);
          setIsModifyQtyModalOpen(false);
          setIsRegisterPaymentModalOpen(false);
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
    isCustomerSelectModalOpen,
    isModifyQtyModalOpen,
    isRegisterPaymentModalOpen,
    activeReceipt,
    pendingNegativeItem,
    selectedCustomer,
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
    const rawQ = barcodeQuery.trim();

    if (!rawQ) {
      if (activeCategoryTab === 'all') {
        return products;
      }
      return products.filter((p) => p.category === activeCategoryTab);
    }

    const normQ = normalizeArabic(rawQ);
    const queryTokens = normQ.split(/\s+/).filter(Boolean);

    const matchesQuery = (p: Product) => {
      const prodName = normalizeArabic(p.name || '');
      const prodBarcode = (p.barcode || '').toLowerCase();
      const prodCategory = normalizeArabic(p.category || '');

      return queryTokens.every((token) => {
        return (
          prodName.includes(token) ||
          prodBarcode.includes(token) ||
          prodCategory.includes(token)
        );
      });
    };

    if (activeCategoryTab !== 'all') {
      const inTabMatches = products
        .filter((p) => p.category === activeCategoryTab)
        .filter(matchesQuery);

      if (inTabMatches.length > 0) {
        return inTabMatches;
      }
    }

    return products.filter(matchesQuery);
  }, [products, activeCategoryTab, barcodeQuery]);

  const cartQtyByProductId = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((item) => {
      map.set(item.product.id, (map.get(item.product.id) ?? 0) + item.quantity);
    });
    return map;
  }, [cart]);

  const activeCartItemForEdit: CartItem | null = useMemo(() => {
    if (cart.length === 0) return null;
    if (selectedCartItemIndex >= 0 && selectedCartItemIndex < cart.length) {
      return cart[selectedCartItemIndex];
    }
    return cart[cart.length - 1];
  }, [cart, selectedCartItemIndex]);

  const customerInitial = selectedCustomer.name?.trim()?.charAt(0) || 'ع';

  return (
    <div
      className="flex flex-col h-screen bg-[#F5F6F8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 font-cairo select-none overflow-hidden"
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
      <header className="h-14 bg-white dark:bg-[#111827] border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#09152B] dark:bg-slate-800 border border-slate-200/20 p-1 flex items-center justify-center shrink-0">
              <img
                src="/logo-hd.png"
                alt="وثّق"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">
                نقطة البيع
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>جاهز</span>
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-800 pr-3">
            <button
              type="button"
              onClick={() => navigate(PATHS.INVENTORY)}
              className="h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/80 dark:border-slate-700/80 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span>المخزون</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(PATHS.POS_TRANSACTIONS)}
              className="h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/80 dark:border-slate-700/80 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="عرض ومتابعة معاملات نقطة البيع"
            >
              <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
              <span>معاملات الكاشير</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(PATHS.DASHBOARD)}
              className="h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/80 dark:border-slate-700/80 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>لوحة التحكم</span>
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Legend */}
        <div className="hidden xl:flex items-center gap-2.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {[
            { key: 'F1', label: 'عميل' },
            { key: 'F2', label: 'كمية' },
            { key: 'F4', label: 'تعليق' },
            { key: 'F5', label: 'معلق' },
            { key: 'F9', label: 'نقدي' },
            { key: 'F10', label: 'دين' },
            { key: 'F11', label: 'بنك' },
          ].map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-jakarta font-semibold text-slate-700 dark:text-slate-300">
                {s.key}
              </kbd>
              <span>{s.label}</span>
            </span>
          ))}
        </div>

        {/* Right Controls: Theme, Held Bills, Scanner */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 transition-colors cursor-pointer"
            title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            aria-label="تبديل المظهر"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsHeldBillsModalOpen(true)}
            className="h-8 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="الفواتير المعلقة (F5)"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>المعلق</span>
            {heldBills.length > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-md bg-amber-500 text-white font-jakarta font-bold text-[10px] flex items-center justify-center tabular-nums">
                {heldBills.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMobileScannerModalOpen(true)}
            className={`h-8 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              scannerStatus === 'connected'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                : scannerStatus === 'connecting' || scannerStatus === 'paired'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                  : scannerStatus === 'disconnected'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                    : 'bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700'
            }`}
            title="ربط ماسح الجوال"
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            {scannerStatus === 'connected' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="hidden sm:inline">الماسح متصل</span>
              </>
            )}
            {(scannerStatus === 'connecting' || scannerStatus === 'paired') && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="hidden sm:inline">جاري الربط...</span>
              </>
            )}
            {scannerStatus === 'disconnected' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="hidden sm:inline">الماسح مفصول</span>
              </>
            )}
            {scannerStatus === 'idle' && (
              <span className="hidden sm:inline">ربط الجوال</span>
            )}
          </button>
        </div>
      </header>

      {/* Main Terminal Workspace: Screen Split */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Cart / Invoice Pane (Right in RTL) */}
        <section className="w-full lg:w-[40%] flex flex-col border-b lg:border-b-0 lg:border-l border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] h-[52vh] lg:h-full shrink-0">
          {/* Customer Context Strip */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 flex items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-extrabold shrink-0 border ${
                  selectedCustomer.id
                    ? 'bg-[#09152B] dark:bg-emerald-600 text-white border-transparent'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 shadow-2xs'
                }`}
              >
                {selectedCustomer.id ? customerInitial : <Users className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    العميل:
                  </span>
                  <span className="text-sm font-extrabold text-[#09152B] dark:text-white break-words">
                    {selectedCustomer.name}
                  </span>
                </div>
                {(selectedCustomer.totalDebt || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 mt-0.5 text-xs font-jakarta tabular-nums font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                    دين سابق: ₪{(selectedCustomer.totalDebt || 0).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {selectedCustomer.id &&
                selectedCustomer.name !== 'زبون نقدي عام' &&
                (selectedCustomer.totalDebt || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentModalDefaultMethod('cash');
                      setIsRegisterPaymentModalOpen(true);
                    }}
                    className="min-h-8 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="تسجيل دفعة للعميل لسداد الديون المستحقة"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>تسجيل دفعة</span>
                  </button>
                )}

              <button
                type="button"
                onClick={() => setIsCustomerSelectModalOpen(true)}
                className="min-h-8 px-3 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#09152B] dark:text-white border border-slate-300 dark:border-slate-600 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <span>تغيير العميل</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-jakarta font-semibold text-slate-700 dark:text-slate-300 leading-none">
                  F1
                </kbd>
              </button>
            </div>
          </div>

          {/* Cart Column Header (when cart has items) */}
          {cart.length > 0 && (
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
              <span>أصناف الفاتورة ({cart.length})</span>
              <span className="text-slate-600 dark:text-slate-400">الكمية · الإجمالي</span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/50 dark:bg-[#0B0F19]/40">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-slate-400">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center mb-3 shadow-2xs">
                  <ShoppingCart className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
                <p className="font-bold text-[#09152B] dark:text-slate-200 text-sm">
                  الفاتورة الحالية فارغة
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                  امسح باركود الصنف أو اختر من قائمة الأصناف لإضافته مباشرة.
                </p>
              </div>
            ) : (
              cart.map((item, index) => {
                const isSelected = selectedCartItemIndex === index;
                const remainingInStore = item.product.stock - item.quantity;
                const isDepleted = remainingInStore < 0;
                const isLowRemaining = !isDepleted && remainingInStore <= item.product.minAlertThreshold;

                return (
                  <div
                    key={item.product.id}
                    onClick={() => setSelectedCartItemIndex(index)}
                    className={`relative px-3.5 py-3 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-[#111827] border-2 border-emerald-600 dark:border-emerald-500 shadow-sm'
                        : 'bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 shadow-2xs hover:border-[#09152B]/60 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <span className="text-sm font-extrabold text-[#09152B] dark:text-white leading-snug break-words block">
                        {item.product.name}
                      </span>

                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">سعر الوحدة:</span>
                          <span className="font-jakarta tabular-nums font-bold" dir="ltr">
                            ₪{item.unitPrice.toFixed(2)}
                          </span>
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border tabular-nums ${
                            isDepleted
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                              : isLowRemaining
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {isDepleted && <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />}
                          {!isDepleted && isLowRemaining && (
                            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                          )}
                          <span>
                            متبقي: {remainingInStore}
                            {item.product.unit ? ` ${item.product.unit}` : ''}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Unified Segmented Qty Stepper */}
                    <div className="inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCartQty(item.product.id, item.quantity - 1);
                        }}
                        className="w-8 h-8 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#09152B] dark:text-white flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="إنقاص الكمية"
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
                        className="min-w-9 h-8 px-2 bg-white dark:bg-slate-900 border-x border-slate-300 dark:border-slate-600 text-center font-jakarta tabular-nums font-extrabold text-sm text-[#09152B] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="تعديل الكمية (F2)"
                      >
                        {item.quantity}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item.product, 1);
                        }}
                        className="w-8 h-8 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#09152B] dark:text-white flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="زيادة الكمية"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line Subtotal */}
                    <div className="text-left font-jakarta tabular-nums shrink-0 min-w-[70px]" dir="ltr">
                      <span className="text-sm sm:text-base font-extrabold text-[#09152B] dark:text-white block">
                        ₪{item.subtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Framed Delete Action */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.product.id);
                      }}
                      className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-300 dark:hover:border-rose-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="حذف من السلة"
                      aria-label={`حذف ${item.product.name} من السلة`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Financial Summary & Payment Keypad */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 space-y-3 shrink-0">
            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="font-medium">عدد القطع</span>
                <span className="font-bold text-[#09152B] dark:text-white font-jakarta tabular-nums">
                  {totalItemsCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">المجموع الفرعي</span>
                <span className="font-jakarta tabular-nums font-bold text-[#09152B] dark:text-white" dir="ltr">
                  ₪{cartSubtotal.toFixed(2)}
                </span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold">
                  <span>الخصم</span>
                  <span className="font-jakarta tabular-nums" dir="ltr">
                    -₪{cartDiscount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Clean Architectural Total Panel */}
            <div className="px-4 py-3 rounded-xl bg-[#09152B] dark:bg-[#070B14] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">
                  المجموع النهائي للتحصيل
                </span>
                <span className="text-[10.5px] text-slate-400">شامل الخصم</span>
              </div>
              <span
                className="text-2xl sm:text-3xl font-bold font-jakarta tabular-nums text-emerald-400 tracking-tight"
                dir="ltr"
              >
                ₪{cartTotalDue.toFixed(2)}
              </span>
            </div>

            {/* 3 Payment Method Keys */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0) setIsCashModalOpen(true);
                  else setToast({ message: 'أضف أصنافاً للسلة أولاً لإتمام السداد النقدي.', type: 'error' });
                }}
                disabled={cart.length === 0}
                className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4" />
                  <span>نقدي</span>
                </div>
                <span className="text-[10px] opacity-80 font-jakarta">F9</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0) setIsDebtModalOpen(true);
                  else setToast({ message: 'أضف أصنافاً للسلة أولاً لتسجيل البيع بالآجل.', type: 'error' });
                }}
                disabled={cart.length === 0}
                className="py-2.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  <span>دين / آجل</span>
                </div>
                <span className="text-[10px] opacity-80 font-jakarta">F10</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0) setIsBankModalOpen(true);
                  else setToast({ message: 'أضف أصنافاً للسلة أولاً للتحويل البنكي.', type: 'error' });
                }}
                disabled={cart.length === 0}
                className="py-2.5 px-2 rounded-xl bg-[#09152B] hover:bg-[#12264B] dark:bg-slate-100 dark:hover:bg-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white dark:text-slate-900 font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>بنك / بال باي</span>
                </div>
                <span className="text-[10px] opacity-80 font-jakarta">F11</span>
              </button>
            </div>

            {/* Hold Bill / Clear Cart Footer */}
            <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0) {
                    holdCurrentBill();
                    setConfirmingClearCart(false);
                    setToast({ message: 'تم تعليق الفاتورة بنجاح (F4).', type: 'info' });
                  }
                }}
                disabled={cart.length === 0}
                className="h-8 px-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-400 font-semibold inline-flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>تعليق الفاتورة (F4)</span>
              </button>

              {confirmingClearCart && cart.length > 0 ? (
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      clearCart();
                      setConfirmingClearCart(false);
                    }}
                    className="h-7 px-2.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                  >
                    تأكيد التفريغ
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingClearCart(false)}
                    className="h-7 px-2 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-[11px] font-semibold cursor-pointer"
                  >
                    تراجع
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (cart.length > 0) setConfirmingClearCart(true);
                  }}
                  disabled={cart.length === 0}
                  className="min-h-8 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-700 disabled:opacity-40 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تفريغ السلة</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Catalog & Barcode Scanner Pane (Left in RTL) */}
        <section className="flex-1 flex flex-col min-h-0 p-4 sm:p-5 space-y-4 overflow-hidden">
          {/* Barcode & Search Bar */}
          <div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeQuery}
                  onChange={(e) => setBarcodeQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleResolveBarcode(barcodeQuery);
                    }
                  }}
                  placeholder="امسح الباركود أو ابحث باسم الصنف / التصنيف..."
                  className="w-full h-11 pr-10 pl-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#09152B] dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-hidden transition-colors"
                  autoFocus
                />
                {barcodeQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setBarcodeQuery('');
                      setTimeout(focusBarcodeInput, 50);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="مسح البحث"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => void refreshProducts()}
                disabled={isLoadingProducts}
                className="h-11 w-11 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="تحديث قائمة الأصناف"
                aria-label="تحديث الأصناف"
              >
                <RotateCw className={`w-4 h-4 ${isLoadingProducts ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 px-1">
              <span>قارئ الباركود جاهز تلقائياً · اضغط Enter لإضافة الصنف مباشرة</span>
              {barcodeQuery.trim() && (
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {displayedQuickItems.length} نتائج مطابقة
                </span>
              )}
            </div>
          </div>

          {/* Products Fetch Error Banner (if any) */}
          {productsLoadError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{productsLoadError}</span>
              </div>
              <button
                type="button"
                onClick={() => void refreshProducts()}
                className="underline font-bold cursor-pointer hover:no-underline shrink-0"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
            <button
              type="button"
              onClick={() => setActiveCategoryTab('all')}
              className={`h-8 px-3 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer tabular-nums ${
                activeCategoryTab === 'all'
                  ? 'bg-[#09152B] dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              جميع الأصناف ({barcodeQuery.trim() ? displayedQuickItems.length : products.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryTab(cat)}
                className={`h-8 px-3 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  activeCategoryTab === cat
                    ? 'bg-[#09152B] dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingProducts && products.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(215px,1fr))] gap-3">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex justify-between">
                      <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      <div className="h-3 w-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-3/4 bg-slate-200/70 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="h-4 w-16 bg-slate-200/70 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedQuickItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-white dark:bg-[#111827] rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <Package className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {barcodeQuery.trim()
                    ? `لا توجد نتائج مطابقة لـ "${barcodeQuery.trim()}"`
                    : 'لا توجد أصناف مسجّلة في هذا التصنيف'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
                  {barcodeQuery.trim()
                    ? 'تحقق من الاسم أو الباركود، أو قم بتسجيله كصنف جديد مباشرة.'
                    : 'أضف أصنافاً من المخزون أو عبر مسح الباركود في الأعلى.'}
                </p>
                {barcodeQuery.trim() && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBarcodeQuery('');
                        setTimeout(focusBarcodeInput, 50);
                      }}
                      className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      مسح البحث
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUnresolvedBarcode(barcodeQuery.trim());
                        setIsQuickAddModalOpen(true);
                        setBarcodeQuery('');
                      }}
                      className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة كصنف جديد</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(215px,1fr))] gap-3 pb-2">
                {displayedQuickItems.map((prod) => {
                  const isOutOfStock = prod.stock <= 0;
                  const isLowStock = !isOutOfStock && prod.stock <= prod.minAlertThreshold;
                  const inCartQty = cartQtyByProductId.get(prod.id) ?? 0;
                  const stockUnit = prod.unit ? ` ${prod.unit}` : '';

                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => addToCart(prod, 1)}
                      className={`p-4 rounded-xl bg-white dark:bg-[#111827] text-right transition-all flex flex-col justify-between gap-3 group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#09152B] dark:focus-visible:outline-emerald-400 ${
                        inCartQty > 0
                          ? 'border-2 border-emerald-600 dark:border-emerald-500 shadow-sm'
                          : 'border border-slate-300 dark:border-slate-700 shadow-2xs hover:border-[#09152B] dark:hover:border-slate-400 hover:shadow-md'
                      }`}
                    >
                      {/* Top Metadata Row: Category + Stock State */}
                      <div className="flex items-start justify-between w-full gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {prod.category || 'عام'}
                        </span>

                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 shrink-0">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                            <span>نفد المخزون</span>
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 tabular-nums shrink-0">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>
                              متبقي: {prod.stock}
                              {stockUnit}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 tabular-nums shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
                            <span>
                              متوفر: {prod.stock}
                              {stockUnit}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Middle Identity: Name + Barcode + Cart Quantity */}
                      <div className="space-y-1.5 w-full">
                        <h4 className="font-extrabold text-sm sm:text-[0.9375rem] text-[#09152B] dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug break-words">
                          {prod.name}
                        </h4>

                        <div className="flex items-center justify-between gap-2 min-h-5">
                          {prod.barcode ? (
                            <span className="inline-flex items-center gap-1 text-xs font-jakarta tabular-nums text-slate-600 dark:text-slate-300">
                              <Barcode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                              <span>{prod.barcode}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 dark:text-slate-400">بدون باركود</span>
                          )}

                          {inCartQty > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-600 text-white text-xs font-bold tabular-nums shrink-0">
                              بالسلة: {inCartQty}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Footer: Price + Explicit Add Pill */}
                      <div className="flex items-center justify-between w-full pt-2.5 border-t border-slate-200/90 dark:border-slate-800">
                        <div className="text-right">
                          <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 leading-tight">
                            سعر البيع
                          </span>
                          <span
                            className="text-base sm:text-lg font-extrabold font-jakarta tabular-nums text-[#09152B] dark:text-white"
                            dir="ltr"
                          >
                            ₪{prod.salePrice.toFixed(2)}
                          </span>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                            isOutOfStock
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600'
                              : 'bg-[#09152B] dark:bg-slate-800 text-white border border-transparent dark:border-slate-700 group-hover:bg-emerald-700 dark:group-hover:bg-emerald-600'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modals */}
      <QuickAddProductModal
        isOpen={isQuickAddModalOpen}
        onClose={() => {
          setIsQuickAddModalOpen(false);
          setTimeout(focusBarcodeInput, 100);
        }}
        barcode={unresolvedBarcode}
        onConfirm={async (newProductData) => {
          const existingProduct = await getProductByBarcodeApi(newProductData.barcode);
          if (existingProduct) {
            const added = addProduct(existingProduct);
            addToCart(added, 1);
            setToast({
              message: `الصنف (${added.name}) مسجّل مسبقاً — تمت إضافته للسلة.`,
              type: 'info',
            });
            setIsQuickAddModalOpen(false);
            setTimeout(focusBarcodeInput, 100);
            return;
          }

          let savedProduct;
          try {
            savedProduct = await createProduct({
              productName: newProductData.name,
              barcode: newProductData.barcode,
              category: newProductData.category,
              unit: newProductData.unit,
              salePrice: newProductData.salePrice,
              costPrice: newProductData.costPrice,
              quantity: newProductData.stock,
              minStockAlert: newProductData.minAlertThreshold,
            });
          } catch (err: unknown) {
            const isConflictStatus = err instanceof ApiError && err.status === 409;
            const bodyStr =
              err instanceof ApiError && err.body ? JSON.stringify(err.body) : '';
            const isConflict =
              isConflictStatus ||
              bodyStr.includes('already exists') ||
              bodyStr.includes('Conflict') ||
              bodyStr.includes('مكرر');

            if (isConflict) {
              const fallback = await getProductByBarcodeApi(newProductData.barcode);
              if (fallback) {
                const added = addProduct(fallback);
                addToCart(added, 1);
                setToast({
                  message: `تم جلب الصنف المسجّل (${added.name}) وإضافته للسلة.`,
                  type: 'info',
                });
                setIsQuickAddModalOpen(false);
                setTimeout(focusBarcodeInput, 100);
                return;
              }
            }
            throw err;
          }

          const enrichedProduct: Product = {
            ...savedProduct,
            category: savedProduct.category || newProductData.category,
            unit: savedProduct.unit || newProductData.unit,
            stock: savedProduct.stock !== undefined ? savedProduct.stock : newProductData.stock,
          };
          const created = addProduct(enrichedProduct);
          addToCart(created, 1);
          setToast({
            message: `تم حفظ الصنف (${created.name}) وإضافته للسلة.`,
            type: 'success',
          });
          setIsQuickAddModalOpen(false);
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
          await checkout({
            method: 'cash',
            customerName: selectedCustomer.name,
            customerPhone: selectedCustomer.phone,
            customerId: selectedCustomer.id,
            receivedAmount: received,
            changeAmount: change,
            discount,
          });
          setToast({ message: 'تم إتمام البيع وتسجيل الدفعة النقدية بنجاح.', type: 'success' });
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
        onConfirm={async (dueDate, invoiceNotes, notifyBot, currencyCode, currencyId) => {
          await checkout({
            method: 'debt',
            customerName: selectedCustomer.name,
            customerPhone: selectedCustomer.phone,
            customerId: selectedCustomer.id,
            debtNotes: invoiceNotes,
            debtDueDate: dueDate,
            notifyCustomerViaBot: notifyBot,
            currencyCode: currencyCode || 'ILS',
            currencyId: currencyId || 4,
          });

          setToast({
            message:
              notifyBot && selectedCustomer.id
                ? 'تم تسجيل البيع بالآجل وإرسال إشعار التوثيق للعميل.'
                : 'تم تسجيل البيع بالآجل وإصدار السند بنجاح.',
            type: 'success',
          });
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
          await checkout({
            method: 'bank',
            customerName: selectedCustomer.name,
            customerPhone: selectedCustomer.phone,
            customerId: selectedCustomer.id,
            bankRefCode: `${provider}: ${bankRefCode}`,
          });
          setToast({ message: 'تم تسجيل الدفعة البنكية وإتمام البيع بنجاح.', type: 'success' });
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
          setToast({ message: 'تم استرجاع الفاتورة بنجاح.', type: 'info' });
          setTimeout(focusBarcodeInput, 100);
        }}
        onDelete={(billId) => {
          deleteHeldBill(billId);
          setToast({ message: 'تم حذف الفاتورة المعلقة.', type: 'info' });
        }}
      />

      <MobileScannerModal
        isOpen={isMobileScannerModalOpen}
        onClose={handleCloseMobileScanner}
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

          if (cust.id) {
            getCustomerProfile(cust.id)
              .then((profile) => {
                const accurateDebt =
                  profile.currentBalance > 0
                    ? profile.currentBalance
                    : profile.totalDebt || 0;
                setSelectedCustomer({
                  ...cust,
                  totalDebt: accurateDebt,
                });
              })
              .catch(() => {
                // Keep quick-selected totalDebt fallback
              });
          }
        }}
      />

      <RegisterPaymentModal
        isOpen={isRegisterPaymentModalOpen}
        onClose={() => {
          setIsRegisterPaymentModalOpen(false);
          setTimeout(focusBarcodeInput, 100);
        }}
        customer={selectedCustomer}
        defaultMethod={paymentModalDefaultMethod}
        onSuccess={(res, paidAmount) => {
          setSelectedCustomer({
            ...selectedCustomer,
            totalDebt:
              typeof res?.totalRemaining === 'number'
                ? res.totalRemaining
                : Math.max(0, (selectedCustomer.totalDebt || 0) - paidAmount),
          });

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('watheq:activity-updated'));
          }

          setToast({
            message: `تم تسجيل الدفعة بقيمة ₪${paidAmount.toFixed(2)} بنجاح وتوزيعها على الديون المستحقة.`,
            type: 'success',
          });
          playScannerBeep('success');
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

export default PosCashierScreen;
