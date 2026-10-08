export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  salePrice: number;
  costPrice: number;
  stock: number;
  minAlertThreshold: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export interface RestockPayload {
  quantity: number;
  costPrice?: number;
  supplierNote?: string;
}

export interface RestockHistoryItem {
  id: string;
  productId: string;
  productName: string;
  quantityAdded: number;
  previousStock: number;
  newStock: number;
  supplierNote?: string;
  date: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  customDiscount?: number;
  subtotal: number;
}

export interface HeldBill {
  id: string;
  heldAt: string;
  timestamp: number;
  customer: {
    id?: string;
    name: string;
    phone?: string;
    totalDebt?: number;
  };
  items: CartItem[];
  discount: number;
  total: number;
  note?: string;
}

export type PaymentMethod = 'cash' | 'debt' | 'bank';

export interface CheckoutPayload {
  method: PaymentMethod;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  receivedAmount?: number;
  changeAmount?: number;
  bankRefCode?: string;
  debtNotes?: string;
  discount?: number;
}

export interface CompletedSale {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerId?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  receivedAmount?: number;
  changeAmount?: number;
  bankRefCode?: string;
  previousDebt?: number;
  newDebt?: number;
  botVerificationSent?: boolean;
  mizanReconciled?: boolean;
}
