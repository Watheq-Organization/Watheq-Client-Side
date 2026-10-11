import { httpClient, ApiError } from '../api/httpClient';

// ============================================================================
// Types & Interfaces based on Backend POS Documentation
// ============================================================================

export type PosSaleType = 'Cash' | 'Debt';
export type PosPaymentMethod = 'Cash' | 'BankTransfer' | 'None';

// --- 1. Checkout Types ---
export interface PosCheckoutCartItem {
  productId: number;
  quantity: number;
}

export interface PosCheckoutPayload {
  saleType: PosSaleType;
  paymentMethod: PosPaymentMethod;
  customerId?: number | null;
  guestCustomerName?: string | null;
  items: PosCheckoutCartItem[];
}

export interface PosCheckoutResponseItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  remainingStock: number;
}

export interface PosCheckoutData {
  transactionId: number;
  saleType: PosSaleType;
  paymentMethod: PosPaymentMethod;
  customerId: number | null;
  guestCustomerName: string | null;
  totalAmount: number;
  items: PosCheckoutResponseItem[];
}

export interface PosCheckoutResponse {
  isSuccess: boolean;
  message: string;
  data: PosCheckoutData;
}

// --- 2. Return Types ---
export interface PosReturnCartItem {
  productId: number;
  quantity: number;
}

export interface PosReturnPayload {
  items: PosReturnCartItem[];
}

export type PosReturnStatus = 'PartiallyReturned' | 'FullyReturned';

export interface PosReturnResponseItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  remainingReturnableQuantity: number;
  remainingStock: number;
}

export interface PosReturnData {
  transactionId: string;
  transactionType: PosSaleType;
  totalReturnedAmount: number;
  status: PosReturnStatus;
  items: PosReturnResponseItem[];
  returnDate: string;
}

export interface PosReturnResponse {
  isSuccess: boolean;
  message: string;
  data: PosReturnData;
}

// --- 3. Transaction Details Types ---
export interface PosTransactionDetailItem {
  productId: number;
  productName: string;
  barcode?: string | null;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface PosTransactionDetails {
  id: string; // e.g. "CASH-101" or "DEBT-205"
  transactionType: PosSaleType;
  paymentMethod: PosPaymentMethod;
  customerId: number | null;
  customerName: string | null;
  guestCustomerName: string | null;
  totalAmount: number;
  createdAt: string;
  items: PosTransactionDetailItem[];
}

// --- 4. Transactions List & Filter Types ---
export interface PosTransactionListItem {
  id: string; // e.g. "CASH-101" or "DEBT-205"
  transactionType: PosSaleType;
  paymentMethod: PosPaymentMethod;
  customerId: number | null;
  customerName: string | null;
  guestCustomerName: string | null;
  totalAmount: number;
  itemsCount: number;
  createdAt: string;
}

export interface GetPosTransactionsParams {
  saleType?: PosSaleType;
  paymentMethod?: PosPaymentMethod;
  customerId?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface PosTransactionsPagedResult {
  items: PosTransactionListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
}

// ============================================================================
// Error Message Formatter
// ============================================================================

export function toPosErrorMessage(err: unknown, defaultMessage = 'حدث خطأ غير متوقع.'): string {
  if (err instanceof ApiError) {
    const serverMsg =
      typeof err.body === 'object' && err.body !== null
        ? String((err.body as Record<string, unknown>).message ?? (err.body as Record<string, unknown>).title ?? '')
        : String(err.body ?? '');

    if (serverMsg.includes('Insufficient stock')) {
      return 'الكمية المطلوبة غير متوفرة في المخزون.';
    }
    if (serverMsg.includes('SaleType is required') || serverMsg.includes('SaleType must be')) {
      return 'نوع البيع غير صالح (يجب أن يكون Cash أو Debt).';
    }
    if (serverMsg.includes('CustomerId is required for Debt')) {
      return 'يجب اختيار عميل مسجل لإتمام البيع بالآجل (الدين).';
    }
    if (serverMsg.includes('GuestCustomerName is not allowed for Debt')) {
      return 'لا يمكن تسجيل اسم زبون عابر لمعاملات الدين.';
    }
    if (serverMsg.includes('Cart must contain at least one item') || serverMsg.includes('Items list cannot be empty')) {
      return 'يجب أن تحتوي السلة على منتج واحد على الأقل.';
    }
    if (serverMsg.includes('Exceeded Returnable Quantity') || serverMsg.includes('Maximum returnable quantity')) {
      return 'الكمية المطلوب إرجاعها تتجاوز الكمية المسموح بإرجاعها.';
    }
    if (serverMsg.includes('not part of the original transaction')) {
      return 'المنتج لم يكن جزءاً من المعاملة الأصلية.';
    }
    if (serverMsg.includes('Invalid transaction ID')) {
      return 'معرّف المعاملة غير صالح. يجب أن يبدأ بـ CASH- أو DEBT-.';
    }
    if (serverMsg.includes('Customer not found')) {
      return 'العميل غير موجود أو تم حذفه.';
    }
    if (serverMsg.includes('Transaction not found')) {
      return 'المعاملة غير موجودة أو تخص متجراً آخر.';
    }
    if (serverMsg.includes('No business found')) {
      return 'لم يتم العثور على متجر مرتبط بحسابك.';
    }

    if (err.status === 408) {
      return 'انتهت مهلة انتظار الخادم. تحقق من الاتصال وأعد المحاولة.';
    }
    if (err.status === 0) {
      return 'تعذّر الاتصال بالخادم. يرجى التحقق من اتصالك أو إعدادات CORS.';
    }
    if (err.status === 401) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.';
    }
    if (err.status === 403) {
      return 'ليس لديك صلاحية لتنفيذ هذا الإجراء.';
    }
    if (err.status >= 500) {
      return 'حدث خطأ في الخادم أثناء معالجة الطلب.';
    }

    return serverMsg || defaultMessage;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return defaultMessage;
}

// ============================================================================
// Service Methods
// ============================================================================

/**
 * 1. POST /api/pos/checkout
 *
 * Processes a POS checkout transaction (Cash or Debt).
 * Validates stock, calculates prices server-side, updates inventory,
 * and creates either an instant sale or a customer debt.
 */
export async function posCheckout(payload: PosCheckoutPayload): Promise<PosCheckoutData> {
  const body = {
    saleType: payload.saleType,
    paymentMethod: payload.paymentMethod,
    customerId: payload.customerId ?? null,
    guestCustomerName: payload.guestCustomerName ?? null,
    items: payload.items.map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
    })),
  };

  const response = await httpClient.post<unknown>('/pos/checkout', body);
  const parsed = response as Record<string, unknown>;

  // Response might be wrapped in { isSuccess: true, data: { ... } } or returned directly
  if (parsed?.data && typeof parsed.data === 'object') {
    return parsed.data as PosCheckoutData;
  }

  return parsed as unknown as PosCheckoutData;
}

/**
 * 2. POST /api/pos/transactions/{id}/return
 *
 * Processes a full or partial return for an existing POS cash sale or debt transaction,
 * restores product stock, records stock movements, and adjusts debt if applicable.
 *
 * @param transactionId - Must use prefix: "CASH-{id}" or "DEBT-{id}"
 * @param items - List of products and quantities to return
 */
export async function posReturnTransaction(
  transactionId: string,
  items: PosReturnCartItem[]
): Promise<PosReturnData> {
  const body: PosReturnPayload = {
    items: items.map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
    })),
  };

  const encodedId = encodeURIComponent(transactionId);
  const response = await httpClient.post<unknown>(`/pos/transactions/${encodedId}/return`, body);
  const parsed = response as Record<string, unknown>;

  if (parsed?.data && typeof parsed.data === 'object') {
    return parsed.data as PosReturnData;
  }

  return parsed as unknown as PosReturnData;
}

/**
 * 3. GET /api/pos/transactions/{id}
 *
 * Retrieves the full details of a single POS transaction (Cash or Debt).
 *
 * @param transactionId - Must use prefix: "CASH-{id}" or "DEBT-{id}"
 */
export async function getPosTransactionDetails(transactionId: string): Promise<PosTransactionDetails> {
  const encodedId = encodeURIComponent(transactionId);
  const response = await httpClient.get<unknown>(`/pos/transactions/${encodedId}`);
  const parsed = response as Record<string, unknown>;

  if (parsed?.data && typeof parsed.data === 'object') {
    return parsed.data as PosTransactionDetails;
  }

  return parsed as unknown as PosTransactionDetails;
}

/**
 * 4. GET /api/pos/transactions
 *
 * Retrieves a paginated and filtered list of POS transactions for the merchant.
 */
export async function getPosTransactions(
  params?: GetPosTransactionsParams
): Promise<PosTransactionsPagedResult> {
  const qs = new URLSearchParams();

  if (params?.pageNumber) qs.append('PageNumber', String(params.pageNumber));
  if (params?.pageSize) qs.append('PageSize', String(params.pageSize));
  if (params?.saleType) qs.append('SaleType', params.saleType);
  if (params?.paymentMethod) qs.append('PaymentMethod', params.paymentMethod);
  if (params?.customerId != null) qs.append('CustomerId', String(params.customerId));
  if (params?.search) qs.append('Search', params.search);
  if (params?.fromDate) qs.append('FromDate', params.fromDate);
  if (params?.toDate) qs.append('ToDate', params.toDate);

  const query = qs.toString() ? `?${qs.toString()}` : '';
  const response = await httpClient.get<unknown>(`/pos/transactions${query}`);
  const parsed = response as Record<string, unknown>;

  const payload = (parsed?.data && typeof parsed.data === 'object') ? parsed.data : parsed;
  const paged = payload as Record<string, unknown>;

  if (paged && Array.isArray(paged.items)) {
    return {
      items: paged.items as PosTransactionListItem[],
      totalCount: Number(paged.totalCount ?? paged.items.length),
      pageNumber: Number(paged.pageNumber ?? 1),
      pageSize: Number(paged.pageSize ?? 20),
      totalPages: paged.totalPages != null ? Number(paged.totalPages) : undefined,
    };
  }

  if (Array.isArray(payload)) {
    return {
      items: payload as PosTransactionListItem[],
      totalCount: payload.length,
      pageNumber: 1,
      pageSize: payload.length,
      totalPages: 1,
    };
  }

  return { items: [], totalCount: 0, pageNumber: 1, pageSize: 20, totalPages: 1 };
}
