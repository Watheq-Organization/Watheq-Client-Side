import { httpClient } from '../api/httpClient';

export interface PosCheckoutItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface PosCheckoutPayload {
  items: PosCheckoutItem[];
  paymentMethod: string; // "Cash", "Card", etc.
  amountPaid: number;
  customerId?: number;
  notes?: string;
}

export interface PosTransaction {
  id: number | string;
  transactionNumber: string;
  totalAmount: number;
  amountPaid: number;
  paymentMethod: string;
  status: string; // "Completed", "Returned"
  createdAt: string;
  items: {
    productId: number | string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subTotal: number;
  }[];
}

export interface PosTransactionsResponse {
  items: PosTransaction[];
  totalCount: number;
  pageNumber: number;
  totalPages: number;
}

/**
 * POST /api/pos/checkout
 *
 * Processes a POS checkout transaction.
 */
export async function posCheckout(payload: PosCheckoutPayload): Promise<PosTransaction> {
  const response = await httpClient.post<any>('/pos/checkout', payload);
  return response.data ?? response;
}

/**
 * POST /api/pos/transactions/{id}/return
 *
 * Returns a POS transaction.
 */
export async function posReturnTransaction(id: string | number): Promise<boolean> {
  const response = await httpClient.post<any>(`/pos/transactions/${id}/return`);
  return response.data ?? response.success ?? true;
}

/**
 * GET /api/pos/transactions/{id}
 *
 * Gets a specific POS transaction's details.
 */
export async function getPosTransactionDetails(id: string | number): Promise<PosTransaction> {
  const response = await httpClient.get<any>(`/pos/transactions/${id}`);
  return response.data ?? response;
}

/**
 * GET /api/pos/transactions
 *
 * Gets a paginated list of POS transactions.
 */
export async function getPosTransactions(params?: {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
}): Promise<PosTransactionsResponse> {
  const qs = new URLSearchParams();
  if (params?.pageNumber) qs.append('PageNumber', String(params.pageNumber));
  if (params?.pageSize) qs.append('PageSize', String(params.pageSize));
  if (params?.search) qs.append('Search', params.search);

  const query = qs.toString() ? `?${qs.toString()}` : '';
  const response = await httpClient.get<any>(`/pos/transactions${query}`);

  const payload = response.data ?? response;
  
  if (payload && Array.isArray(payload.items)) {
    return {
      items: payload.items,
      totalCount: payload.totalCount ?? payload.items.length,
      pageNumber: payload.pageNumber ?? 1,
      totalPages: payload.totalPages ?? 1,
    };
  }

  if (Array.isArray(payload)) {
    return {
      items: payload,
      totalCount: payload.length,
      pageNumber: 1,
      totalPages: 1,
    };
  }

  return { items: [], totalCount: 0, pageNumber: 1, totalPages: 1 };
}
