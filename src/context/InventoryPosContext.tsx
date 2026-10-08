import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  Product,
  CartItem,
  HeldBill,
  CompletedSale,
  RestockPayload,
  RestockHistoryItem,
  CheckoutPayload,
} from '../types/inventory';

const PRODUCTS_STORAGE_KEY = 'watheq_inventory_products_v1';
const HELD_BILLS_STORAGE_KEY = 'watheq_held_bills_v1';
const SALES_STORAGE_KEY = 'watheq_sales_history_v1';
const RESTOCK_STORAGE_KEY = 'watheq_restock_history_v1';

import { getProductsApi } from '../services/productService';
import { ApiError } from '../api/httpClient';

export const DEFAULT_CASH_CUSTOMER = {
  id: undefined,
  name: 'زبون نقدي عام',
  phone: '',
  totalDebt: 0,
};

// Play responsive cashier audio beeps using Web Audio API
export const playScannerBeep = (type: 'scan' | 'success' | 'alert' = 'scan') => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'scan') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'alert') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch {
    // Ignore audio permission/context errors silently
  }
};

interface CustomerOption {
  id?: string;
  name: string;
  phone?: string;
  totalDebt?: number;
}

interface InventoryPosContextType {
  // Inventory
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> | Product) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  restockProduct: (id: string, payload: RestockPayload) => void;
  getProductByBarcode: (barcode: string) => Product | undefined;
  restockHistory: RestockHistoryItem[];

  // Active Cart
  cart: CartItem[];
  selectedCustomer: CustomerOption;
  setSelectedCustomer: (customer: CustomerOption) => void;
  addToCart: (product: Product, quantity?: number) => { success: boolean; isNegative: boolean };
  updateCartQty: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartDiscount: number;
  setCartDiscount: (discount: number) => void;
  selectedCartItemIndex: number;
  setSelectedCartItemIndex: (index: number | ((prev: number) => number)) => void;

  // Cart Metrics
  totalItemsCount: number;
  cartSubtotal: number;
  cartTotalDue: number;

  // Held Bills
  heldBills: HeldBill[];
  holdCurrentBill: (note?: string) => boolean;
  resumeHeldBill: (billId: string) => void;
  deleteHeldBill: (billId: string) => void;

  // Checkout & Receipt
  completedSales: CompletedSale[];
  activeReceipt: CompletedSale | null;
  setActiveReceipt: (sale: CompletedSale | null) => void;
  checkout: (payload: CheckoutPayload) => Promise<CompletedSale>;

  // Pending negative stock item requiring confirmation
  pendingNegativeItem: { product: Product; quantity: number } | null;
  setPendingNegativeItem: (item: { product: Product; quantity: number } | null) => void;
  confirmAddNegativeItem: () => void;
}

const InventoryPosContext = createContext<InventoryPosContextType | undefined>(undefined);

export const InventoryPosProvider = ({ children }: { children: ReactNode }) => {
  // 1. Initialize Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading products from localStorage:', e);
    }
    return [];
  });

  // 2. Initialize Restock History
  const [restockHistory, setRestockHistory] = useState<RestockHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(RESTOCK_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 3. Initialize Held Bills
  const [heldBills, setHeldBills] = useState<HeldBill[]>(() => {
    try {
      const saved = localStorage.getItem(HELD_BILLS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 4. Initialize Sales History
  const [completedSales, setCompletedSales] = useState<CompletedSale[]>(() => {
    try {
      const saved = localStorage.getItem(SALES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 5. Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption>(DEFAULT_CASH_CUSTOMER);
  const [selectedCartItemIndex, setSelectedCartItemIndex] = useState<number>(-1);
  const [activeReceipt, setActiveReceipt] = useState<CompletedSale | null>(null);
  const [pendingNegativeItem, setPendingNegativeItem] = useState<{
    product: Product;
    quantity: number;
  } | null>(null);

  // Load products from API on mount
  useEffect(() => {
    let mounted = true;
    const loadProducts = async () => {
      try {
        // Fetch up to 1000 items (since it's a POS, we want all local products loaded)
        const res = await getProductsApi({ PageNumber: 1, PageSize: 1000 });
        if (mounted) {
          setProducts(res.items);
        }
      } catch (err) {
        if (err instanceof ApiError && (err.status === 404 || err.status === 0)) {
          console.warn('GET /api/Products failed (404/0). Using local storage products fallback.');
        } else {
          console.error('Failed to load products from API:', err);
        }
      }
    };
    loadProducts();
    return () => {
      mounted = false;
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to sync products to storage:', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(HELD_BILLS_STORAGE_KEY, JSON.stringify(heldBills));
    } catch (e) {
      console.error('Failed to sync held bills:', e);
    }
  }, [heldBills]);

  useEffect(() => {
    try {
      localStorage.setItem(RESTOCK_STORAGE_KEY, JSON.stringify(restockHistory));
    } catch (e) {
      console.error('Failed to sync restock history:', e);
    }
  }, [restockHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(completedSales));
    } catch (e) {
      console.error('Failed to sync completed sales:', e);
    }
  }, [completedSales]);

  // Inventory CRUD
  const addProduct = useCallback(
    (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> | Product): Product => {
      // If the caller already has a server-assigned id, use it directly.
      const hasId = 'id' in productData && Boolean((productData as Product).id);
      const newProduct: Product = hasId
        ? (productData as Product)
        : {
            ...(productData as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>),
            id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
      setProducts((prev) => [newProduct, ...prev]);
      return newProduct;
    },
    []
  );

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const restockProduct = useCallback((id: string, payload: RestockPayload) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const previousStock = item.stock;
          const newStock = previousStock + payload.quantity;
          const updated: Product = {
            ...item,
            stock: newStock,
            costPrice: payload.costPrice !== undefined ? payload.costPrice : item.costPrice,
            updatedAt: new Date().toISOString(),
          };

          const historyEntry: RestockHistoryItem = {
            id: `restock-${Date.now()}`,
            productId: item.id,
            productName: item.name,
            quantityAdded: payload.quantity,
            previousStock,
            newStock,
            supplierNote: payload.supplierNote,
            date: new Date().toISOString(),
          };
          setRestockHistory((rPrev) => [historyEntry, ...rPrev]);

          return updated;
        }
        return item;
      })
    );
  }, []);

  const getProductByBarcode = useCallback(
    (barcode: string): Product | undefined => {
      const clean = barcode.trim().toLowerCase();
      return products.find(
        (p) => p.barcode.toLowerCase() === clean || p.id.toLowerCase() === clean
      );
    },
    [products]
  );

  // Cart operations
  const addToCart = useCallback(
    (product: Product, quantity: number = 1): { success: boolean; isNegative: boolean } => {
      const existingInCart = cart.find((i) => i.product.id === product.id);
      const currentQtyInCart = existingInCart ? existingInCart.quantity : 0;
      const targetQty = currentQtyInCart + quantity;

      if (product.stock <= 0 || targetQty > product.stock) {
        playScannerBeep('alert');
        setPendingNegativeItem({ product, quantity });
        return { success: false, isNegative: true };
      }

      setCart((prev) => {
        const index = prev.findIndex((i) => i.product.id === product.id);
        if (index > -1) {
          const updated = [...prev];
          const newQty = updated[index].quantity + quantity;
          updated[index] = {
            ...updated[index],
            quantity: newQty,
            subtotal: newQty * updated[index].unitPrice,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              product,
              quantity,
              unitPrice: product.salePrice,
              subtotal: quantity * product.salePrice,
            },
          ];
        }
      });

      playScannerBeep('scan');
      return { success: true, isNegative: false };
    },
    [cart]
  );

  const confirmAddNegativeItem = useCallback(() => {
    if (!pendingNegativeItem) return;
    const { product, quantity } = pendingNegativeItem;

    setCart((prev) => {
      const index = prev.findIndex((i) => i.product.id === product.id);
      if (index > -1) {
        const updated = [...prev];
        const newQty = updated[index].quantity + quantity;
        updated[index] = {
          ...updated[index],
          quantity: newQty,
          subtotal: newQty * updated[index].unitPrice,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity,
            unitPrice: product.salePrice,
            subtotal: quantity * product.salePrice,
          },
        ];
      }
    });

    setPendingNegativeItem(null);
    playScannerBeep('scan');
  }, [pendingNegativeItem]);

  const updateCartQty = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? {
              ...i,
              quantity,
              subtotal: quantity * i.unitPrice,
            }
          : i
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCartDiscount(0);
    setSelectedCustomer(DEFAULT_CASH_CUSTOMER);
    setSelectedCartItemIndex(-1);
  }, []);

  // Cart Metrics
  const { totalItemsCount, cartSubtotal, cartTotalDue } = useMemo(() => {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDue = Math.max(0, subtotal - cartDiscount);
    return {
      totalItemsCount: totalCount,
      cartSubtotal: Number(subtotal.toFixed(2)),
      cartTotalDue: Number(totalDue.toFixed(2)),
    };
  }, [cart, cartDiscount]);

  // Hold / Resume Bills
  const holdCurrentBill = useCallback(
    (note?: string): boolean => {
      if (cart.length === 0) return false;

      const newHeld: HeldBill = {
        id: `held-${Date.now()}`,
        heldAt: new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        timestamp: Date.now(),
        customer: selectedCustomer,
        items: [...cart],
        discount: cartDiscount,
        total: cartTotalDue,
        note,
      };

      setHeldBills((prev) => [newHeld, ...prev]);
      clearCart();
      playScannerBeep('success');
      return true;
    },
    [cart, selectedCustomer, cartDiscount, cartTotalDue, clearCart]
  );

  const resumeHeldBill = useCallback(
    (billId: string) => {
      const bill = heldBills.find((b) => b.id === billId);
      if (!bill) return;

      setCart(bill.items);
      setCartDiscount(bill.discount);
      setSelectedCustomer(bill.customer);
      setHeldBills((prev) => prev.filter((b) => b.id !== billId));
      playScannerBeep('scan');
    },
    [heldBills]
  );

  const deleteHeldBill = useCallback((billId: string) => {
    setHeldBills((prev) => prev.filter((b) => b.id !== billId));
  }, []);

  // Checkout with atomic stock deduction
  const checkout = useCallback(
    async (payload: CheckoutPayload): Promise<CompletedSale> => {
      if (cart.length === 0) {
        throw new Error('السلة فارغة، لا يمكن إتمام البيع');
      }

      setProducts((prevProducts) => {
        const productMap = new Map(prevProducts.map((p) => [p.id, { ...p }]));
        for (const cartItem of cart) {
          const prod = productMap.get(cartItem.product.id);
          if (prod) {
            prod.stock = prod.stock - cartItem.quantity;
            prod.updatedAt = new Date().toISOString();
          }
        }
        return Array.from(productMap.values());
      });

      const invoiceNumber = `INV-${new Date().getFullYear()}${String(
        new Date().getMonth() + 1
      ).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      const completedSale: CompletedSale = {
        id: `sale-${Date.now()}`,
        invoiceNumber,
        date: new Date().toISOString(),
        customerName: payload.customerName || selectedCustomer.name,
        customerPhone: payload.customerPhone || selectedCustomer.phone,
        customerId: payload.customerId || selectedCustomer.id,
        items: [...cart],
        subtotal: cartSubtotal,
        discount: payload.discount !== undefined ? payload.discount : cartDiscount,
        total: cartTotalDue,
        paymentMethod: payload.method,
        receivedAmount: payload.receivedAmount,
        changeAmount: payload.changeAmount,
        bankRefCode: payload.bankRefCode,
        previousDebt: selectedCustomer.totalDebt || 0,
        newDebt:
          payload.method === 'debt'
            ? (selectedCustomer.totalDebt || 0) + cartTotalDue
            : selectedCustomer.totalDebt,
        botVerificationSent: payload.method === 'debt',
        mizanReconciled: payload.method === 'bank' ? false : undefined,
      };

      setCompletedSales((prev) => [completedSale, ...prev]);
      setActiveReceipt(completedSale);
      clearCart();
      playScannerBeep('success');

      return completedSale;
    },
    [cart, cartSubtotal, cartDiscount, cartTotalDue, selectedCustomer, clearCart]
  );

  const value = useMemo(
    () => ({
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      restockProduct,
      getProductByBarcode,
      restockHistory,
      cart,
      selectedCustomer,
      setSelectedCustomer,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      cartDiscount,
      setCartDiscount,
      selectedCartItemIndex,
      setSelectedCartItemIndex,
      totalItemsCount,
      cartSubtotal,
      cartTotalDue,
      heldBills,
      holdCurrentBill,
      resumeHeldBill,
      deleteHeldBill,
      completedSales,
      activeReceipt,
      setActiveReceipt,
      checkout,
      pendingNegativeItem,
      setPendingNegativeItem,
      confirmAddNegativeItem,
    }),
    [
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      restockProduct,
      getProductByBarcode,
      restockHistory,
      cart,
      selectedCustomer,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      cartDiscount,
      selectedCartItemIndex,
      totalItemsCount,
      cartSubtotal,
      cartTotalDue,
      heldBills,
      holdCurrentBill,
      resumeHeldBill,
      deleteHeldBill,
      completedSales,
      activeReceipt,
      checkout,
      pendingNegativeItem,
      confirmAddNegativeItem,
    ]
  );

  return <InventoryPosContext.Provider value={value}>{children}</InventoryPosContext.Provider>;
};

export const useInventoryPos = () => {
  const context = useContext(InventoryPosContext);
  if (!context) {
    throw new Error('useInventoryPos must be used within an InventoryPosProvider');
  }
  return context;
};
