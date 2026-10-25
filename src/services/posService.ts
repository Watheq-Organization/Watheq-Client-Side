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
  notes?: string | null;
  reason?: string | null;
  dueDate?: string | null;
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
    notes: payload.notes ?? null,
    reason: payload.reason ?? payload.notes ?? null,
    dueDate: payload.dueDate ?? null,
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
 * Maps a single raw transaction item from the backend into a strongly-typed PosTransactionListItem.
 * Handles both camelCase and PascalCase properties as well as missing or fallback customer names.
 */
export function mapRawPosTransaction(raw: unknown): PosTransactionListItem {
  const r = (raw || {}) as Record<string, unknown>;

  const rawId = r.id ?? r.Id ?? r.transactionId ?? r.TransactionId ?? '';
  const rawSaleType = String(r.transactionType ?? r.TransactionType ?? r.saleType ?? r.SaleType ?? 'Cash');
  const saleType: PosSaleType = rawSaleType.toLowerCase() === 'debt' ? 'Debt' : 'Cash';

  const rawPaymentMethod = String(r.paymentMethod ?? r.PaymentMethod ?? 'None');
  let paymentMethod: PosPaymentMethod;
  const pmLower = rawPaymentMethod.toLowerCase();
  if (pmLower === 'cash') {
    paymentMethod = 'Cash';
  } else if (pmLower.includes('bank') || pmLower.includes('transfer')) {
    paymentMethod = 'BankTransfer';
  } else if (pmLower === 'none' || !rawPaymentMethod) {
    paymentMethod = 'None';
  } else {
    paymentMethod = rawPaymentMethod as PosPaymentMethod;
  }

  const rawCustId = r.customerId ?? r.CustomerId;
  const customerId = rawCustId != null && !isNaN(Number(rawCustId)) ? Number(rawCustId) : null;

  const customerName = r.customerName ?? r.CustomerName ? String(r.customerName ?? r.CustomerName) : null;
  const guestCustomerName = r.guestCustomerName ?? r.GuestCustomerName ? String(r.guestCustomerName ?? r.GuestCustomerName) : null;

  const totalAmount = Number(r.totalAmount ?? r.TotalAmount ?? r.amount ?? r.Amount ?? 0);

  // Items count might come as itemsCount, itemCount, or items.length
  let itemsCount = 0;
  if (r.itemsCount != null || r.ItemsCount != null) {
    itemsCount = Number(r.itemsCount ?? r.ItemsCount);
  } else if (r.itemCount != null || r.ItemCount != null) {
    itemsCount = Number(r.itemCount ?? r.ItemCount);
  } else if (Array.isArray(r.items ?? r.Items)) {
    itemsCount = ((r.items ?? r.Items) as unknown[]).length;
  }

  const createdAt = String(r.createdAt ?? r.CreatedAt ?? r.date ?? r.Date ?? r.createdDate ?? r.CreatedDate ?? new Date().toISOString());

  return {
    id: String(rawId),
    transactionType: saleType,
    paymentMethod,
    customerId,
    customerName,
    guestCustomerName,
    totalAmount,
    itemsCount,
    createdAt,
  };
}

/**
 * Maps raw transaction details into a typed PosTransactionDetails model.
 */
export function mapRawPosTransactionDetails(raw: unknown): PosTransactionDetails {
  let root: unknown = raw;
  if (root && typeof root === 'object') {
    const r = root as Record<string, unknown>;
    if (r.data !== undefined && typeof r.data === 'object' && !Array.isArray(r.data)) root = r.data;
    else if (r.result !== undefined && typeof r.result === 'object' && !Array.isArray(r.result)) root = r.result;
    else if (r.value !== undefined && typeof r.value === 'object' && !Array.isArray(r.value)) root = r.value;
  }

  const d = (root || {}) as Record<string, unknown>;
  const rawId = String(d.id ?? d.Id ?? d.transactionId ?? d.TransactionId ?? '');
  const rawSaleType = String(d.transactionType ?? d.TransactionType ?? d.saleType ?? d.SaleType ?? 'Cash');
  const transactionType: PosSaleType = rawSaleType.toLowerCase() === 'debt' ? 'Debt' : 'Cash';

  const rawPaymentMethod = String(d.paymentMethod ?? d.PaymentMethod ?? 'None');
  let paymentMethod: PosPaymentMethod;
  const pmLower = rawPaymentMethod.toLowerCase();
  if (pmLower === 'cash') {
    paymentMethod = 'Cash';
  } else if (pmLower.includes('bank') || pmLower.includes('transfer')) {
    paymentMethod = 'BankTransfer';
  } else if (pmLower === 'none' || !rawPaymentMethod) {
    paymentMethod = 'None';
  } else {
    paymentMethod = rawPaymentMethod as PosPaymentMethod;
  }

  const rawCustId = d.customerId ?? d.CustomerId;
  const customerId = rawCustId != null && !isNaN(Number(rawCustId)) ? Number(rawCustId) : null;
  const customerName = d.customerName ?? d.CustomerName ? String(d.customerName ?? d.CustomerName) : null;
  const guestCustomerName = d.guestCustomerName ?? d.GuestCustomerName ? String(d.guestCustomerName ?? d.GuestCustomerName) : null;
  const totalAmount = Number(d.totalAmount ?? d.TotalAmount ?? d.amount ?? d.Amount ?? 0);
  const createdAt = String(d.createdAt ?? d.CreatedAt ?? d.date ?? d.Date ?? d.createdDate ?? d.CreatedDate ?? new Date().toISOString());

  const rawItems = (d.items ?? d.Items ?? []) as unknown[];
  const items: PosTransactionDetailItem[] = Array.isArray(rawItems)
    ? rawItems.map((itRaw) => {
        const it = (itRaw || {}) as Record<string, unknown>;
        const quantity = Number(it.quantity ?? it.Quantity ?? 0);
        const unitPrice = Number(it.unitPrice ?? it.UnitPrice ?? 0);
        const subTotal = Number(it.subTotal ?? it.SubTotal ?? it.total ?? it.Total ?? (quantity * unitPrice));
        return {
          productId: Number(it.productId ?? it.ProductId ?? 0),
          productName: String(it.productName ?? it.ProductName ?? it.name ?? it.Name ?? 'منتج'),
          barcode: it.barcode ?? it.Barcode ? String(it.barcode ?? it.Barcode) : null,
          quantity,
          unitPrice,
          subTotal,
        };
      })
    : [];

  return {
    id: rawId,
    transactionType,
    paymentMethod,
    customerId,
    customerName,
    guestCustomerName,
    totalAmount,
    createdAt,
    items,
  };
}

/**
 * 3. GET /api/pos/transactions/{id}
 *
 * Retrieves the full details of a single POS transaction (Cash or Debt).
 * Automatically supports both prefixed IDs ("CASH-101", "DEBT-205") and bare numeric IDs.
 *
 * @param transactionId - Transaction identifier (e.g. "CASH-101", "DEBT-205", or "101")
 */
export async function getPosTransactionDetails(transactionId: string): Promise<PosTransactionDetails> {
  const cleanId = String(transactionId).trim();
  const encodedId = encodeURIComponent(cleanId);

  try {
    const response = await httpClient.get<unknown>(`/pos/transactions/${encodedId}`);
    return mapRawPosTransactionDetails(response);
  } catch (err: unknown) {
    // If backend rejects with 400 or 404 and cleanId contains a prefix (e.g. CASH-101),
    // try fallback with the numeric portion (101) just in case this environment expects it without prefix:
    if (err instanceof ApiError && (err.status === 400 || err.status === 404)) {
      if (cleanId.includes('-')) {
        const parts = cleanId.split('-');
        const numOnly = parts[1];
        if (numOnly) {
          try {
            const fallbackResp = await httpClient.get<unknown>(`/pos/transactions/${encodeURIComponent(numOnly)}`);
            return mapRawPosTransactionDetails(fallbackResp);
          } catch {
            // Keep original error if fallback also fails
          }
        }
      }
    }
    throw err;
  }
}

/**
 * 4. GET /api/pos/transactions
 *
 * Retrieves a paginated and filtered list of POS transactions for the merchant.
 * Robustly parses multiple backend envelope formats (direct array, { data: { items } }, { items }, { result }, etc.).
 */
export async function getPosTransactions(
  params?: GetPosTransactionsParams
): Promise<PosTransactionsPagedResult> {
  const qs = new URLSearchParams();

  if (params?.pageNumber) qs.append('PageNumber', String(params.pageNumber));
  if (params?.pageSize) qs.append('PageSize', String(params.pageSize));
  if (params?.saleType) qs.append('SaleType', params.saleType);
  if (params?.paymentMethod) qs.append('PaymentMethod', params.paymentMethod);
  if (params?.customerId != null && !isNaN(params.customerId)) qs.append('CustomerId', String(params.customerId));
  if (params?.search && params.search.trim()) qs.append('Search', params.search.trim());
  if (params?.fromDate && params.fromDate.trim()) qs.append('FromDate', params.fromDate.trim());
  if (params?.toDate && params.toDate.trim()) qs.append('ToDate', params.toDate.trim());

  const query = qs.toString() ? `?${qs.toString()}` : '';
  const response = await httpClient.get<unknown>(`/pos/transactions${query}`);

  // Unwrap response if wrapped in data, result, or value
  let root: unknown = response;
  if (root && typeof root === 'object') {
    const r = root as Record<string, unknown>;
    if (r.data !== undefined) root = r.data;
    else if (r.result !== undefined) root = r.result;
    else if (r.value !== undefined) root = r.value;
  }

  let rawItems: unknown[] = [];
  let totalCount = 0;
  let pageNumber = params?.pageNumber ?? 1;
  let pageSize = params?.pageSize ?? 20;
  let totalPages: number | undefined = undefined;

  if (Array.isArray(root)) {
    rawItems = root;
    totalCount = root.length;
    totalPages = Math.max(1, Math.ceil(totalCount / (pageSize || 20)));
  } else if (root && typeof root === 'object') {
    const obj = root as Record<string, unknown>;

    // Check nested arrays: items, Items, data, Data, list
    if (Array.isArray(obj.items)) rawItems = obj.items;
    else if (Array.isArray(obj.Items)) rawItems = obj.Items;
    else if (Array.isArray(obj.data)) rawItems = obj.data;
    else if (Array.isArray(obj.Data)) rawItems = obj.Data;
    else if (Array.isArray(obj.list)) rawItems = obj.list;

    const rawTotal = obj.totalCount ?? obj.TotalCount ?? obj.totalItems ?? obj.TotalItems ?? obj.count ?? obj.Count;
    totalCount = rawTotal != null && !isNaN(Number(rawTotal)) ? Number(rawTotal) : rawItems.length;

    const rawPageNum = obj.pageNumber ?? obj.PageNumber ?? obj.page ?? obj.Page;
    if (rawPageNum != null && !isNaN(Number(rawPageNum))) pageNumber = Number(rawPageNum);

    const rawPageSize = obj.pageSize ?? obj.PageSize;
    if (rawPageSize != null && !isNaN(Number(rawPageSize))) pageSize = Number(rawPageSize);

    const rawPages = obj.totalPages ?? obj.TotalPages;
    if (rawPages != null && !isNaN(Number(rawPages))) {
      totalPages = Number(rawPages);
    } else {
      totalPages = Math.max(1, Math.ceil(totalCount / (pageSize || 20)));
    }
  }

  return {
    items: rawItems.map(mapRawPosTransaction),
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
  };
}
