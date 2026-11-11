import { httpClient, ApiError } from '../api/httpClient';
import type { Product } from '../types/inventory';

// ---------------------------------------------------------------------------
// Request / Response Types
// ---------------------------------------------------------------------------

export interface CreateProductPayload {
  productName: string;
  barcode: string;
  salePrice: number;
  costPrice: number;
  minStockAlert: number;
  quantity?: number;
  category?: string;
  unit?: string;
}

/** Payload sent to PUT /api/Products/{id} */
export interface UpdateProductPayload {
  id: number | string;
  productName: string;
  barcode: string;
  salePrice: number;
  costPrice: number;
  minStockAlert: number;
  category?: string;
  unit?: string;
}

/** Payload sent to POST /api/Products/{id}/stock/supply */
export interface SupplyStockPayload {
  quantity: number;
}

/** Payload sent to POST /api/Products/{id}/stock/return */
export interface ReturnStockPayload {
  quantity: number;
}

/** Payload sent to PATCH /api/Products/{id}/stock/adjust */
export interface AdjustStockPayload {
  actualStock: number;
}

/** Params for GET /api/Products */
export interface GetProductsParams {
  Search?: string;
  category?: string;
  IsActive?: boolean;
  PageNumber?: number;
  PageSize?: number;
}

/** Standard wrapper for paginated responses */
export interface PaginatedResponse<T> {
  items: T[];
  pageNumber?: number;
  totalPages?: number;
  totalCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

/** Shape of the inner data object returned by the backend */
export interface ProductApiData {
  id: number | string;
  productName: string;
  barcode: string;
  salePrice: number;
  costPrice?: number;
  minStockAlert: number;
  quantity: number;
  isLowStock?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  category?: string;
  unit?: string;
}

/** Standard wrapper for success responses */
export interface ApiResponse<T> {
  result: {
    code: number;
    message: string;
  };
  data: T;
  testSchema?: any;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Maps the backend ProductApiData → our internal Product shape.
 */
export function mapApiProductToLocal(api: ProductApiData): Product {
  return {
    id: String(api.id),
    barcode: api.barcode,
    name: api.productName,
    category: api.category || (api as any).categoryName || undefined,
    unit: api.unit || (api as any).unitName || undefined,
    salePrice: api.salePrice,
    costPrice: api.costPrice ?? 0,
    stock: api.quantity ?? 0,
    minAlertThreshold: api.minStockAlert,
    isActive: api.isActive ?? true,
    createdAt: api.createdAt ?? new Date().toISOString(),
    updatedAt: api.updatedAt ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// API Calls
// ---------------------------------------------------------------------------

/**
 * GET /api/Products
 *
 * Fetches a list of products with optional search, filter, and pagination.
 */
export async function getProductsApi(
  params?: GetProductsParams
): Promise<{ items: Product[]; totalCount: number }> {
  const qs = new URLSearchParams();
  if (params?.Search) qs.append('Search', params.Search);
  if (params?.category) qs.append('category', params.category);
  if (params?.IsActive !== undefined) qs.append('IsActive', String(params.IsActive));
  if (params?.PageNumber !== undefined) qs.append('PageNumber', String(params.PageNumber));
  if (params?.PageSize !== undefined) qs.append('PageSize', String(params.PageSize));

  const query = qs.toString() ? `?${qs.toString()}` : '';
  const response = await httpClient.get<any>(`/Products${query}`);

  // Handle various potential API wrappers (ApiResponse + PaginatedResponse)
  const payload = response?.data !== undefined ? response.data : response;

  if (Array.isArray(payload)) {
    return {
      items: payload.map(mapApiProductToLocal),
      totalCount: payload.length,
    };
  }

  if (payload && Array.isArray(payload.items)) {
    return {
      items: payload.items.map(mapApiProductToLocal),
      totalCount: payload.totalCount ?? payload.items.length,
    };
  }

  // Check if inner data exists
  if (payload?.data && Array.isArray(payload.data)) {
    return {
      items: payload.data.map(mapApiProductToLocal),
      totalCount: payload.data.length,
    };
  }

  return { items: [], totalCount: 0 };
}

/**
 * Fetch a single product by its exact barcode from the backend.
 *
 * The GET /api/Products `Search` parameter only searches product names,
 * NOT barcodes. So we fetch products safely and filter by barcode.
 * Returns null if no product matches.
 */
export async function getProductByBarcodeApi(
  barcode: string
): Promise<Product | null> {
  const cleanBarcode = barcode.trim().toLowerCase();
  if (!cleanBarcode) return null;

  try {
    // 1. Try with Search query first (in case backend adds barcode search)
    try {
      const res1 = await getProductsApi({ Search: barcode.trim(), PageSize: 50 });
      const match1 = res1.items.find(
        (p) => p.barcode && p.barcode.trim().toLowerCase() === cleanBarcode
      );
      if (match1) return match1;
    } catch {
      // Ignore search error and fall back to broad query
    }

    // 2. Fetch page 1 (up to 100 products)
    const res2 = await getProductsApi({ PageNumber: 1, PageSize: 100 });
    const match2 = res2.items.find(
      (p) => p.barcode && p.barcode.trim().toLowerCase() === cleanBarcode
    );
    if (match2) return match2;

    // 3. If there are additional pages, check up to page 5
    if (res2.totalCount && res2.totalCount > 100) {
      const maxPages = Math.min(Math.ceil(res2.totalCount / 100), 5);
      for (let page = 2; page <= maxPages; page++) {
        const resPage = await getProductsApi({ PageNumber: page, PageSize: 100 });
        const matchPage = resPage.items.find(
          (p) => p.barcode && p.barcode.trim().toLowerCase() === cleanBarcode
        );
        if (matchPage) return matchPage;
      }
    }

    return null;
  } catch (err) {
    console.error('[getProductByBarcodeApi] Error fetching product:', err);
    return null;
  }
}

/**
 * POST /api/Products
 *
 * Creates a new product for the authenticated merchant.
 * The backend derives UserId / BusinessId from the JWT automatically.
 * Returns the newly-created product mapped to our local Product type.
 *
 * Throws ApiError on non-2xx responses (handled by httpClient).
 */
export async function createProduct(
  payload: CreateProductPayload
): Promise<Product> {
  const requestBody: Record<string, any> = {
    productName: String(payload.productName).trim(),
    barcode: String(payload.barcode).trim(),
    salePrice: Number(payload.salePrice),
    costPrice: Number(payload.costPrice),
    minStockAlert: Number(payload.minStockAlert),
  };

  if (payload.quantity !== undefined) {
    requestBody.quantity = Number(payload.quantity);
  }
  if (payload.category) {
    requestBody.category = String(payload.category).trim();
  }
  if (payload.unit) {
    requestBody.unit = String(payload.unit).trim();
  }

  // eslint-disable-next-line no-console
  console.log('[createProduct] REQUEST BODY:', JSON.stringify(requestBody, null, 2));

  const response = await httpClient.post<any>(
    '/Products',
    requestBody
  );

  // eslint-disable-next-line no-console
  console.log('[createProduct] RESPONSE:', JSON.stringify(response, null, 2));
  
  // Handle possible response wrappers
  const rawData = response?.data ?? response;
  const created = mapApiProductToLocal(rawData);
  if (payload.category) created.category = payload.category.trim();
  if (payload.unit) created.unit = payload.unit.trim();

  // If user provided initial stock > 0, supply it to the product
  if (payload.quantity && payload.quantity > 0 && created.id) {
    try {
      await supplyProductStockApi(created.id, { quantity: payload.quantity });
      created.stock = payload.quantity;
    } catch {
      // Stock supply fallback
      created.stock = payload.quantity;
    }
  }

  return created;
}

/**
 * PUT /api/Products/{id}
 *
 * Updates an existing product for the authenticated merchant.
 * Strictly adheres to backend contract for PUT /api/Products/{id}.
 * Does not update stock.
 */
export async function updateProductApi(
  id: string | number,
  payload: UpdateProductPayload
): Promise<Product> {
  const numId = typeof payload.id === 'string' && !isNaN(Number(payload.id)) ? Number(payload.id) : payload.id;
  const requestBody: Record<string, any> = {
    id: numId,
    productName: String(payload.productName).trim(),
    barcode: String(payload.barcode).trim(),
    salePrice: Number(payload.salePrice),
    costPrice: Number(payload.costPrice),
    minStockAlert: Number(payload.minStockAlert),
  };

  if (payload.category !== undefined) {
    requestBody.category = payload.category ? String(payload.category).trim() : null;
  }
  if (payload.unit !== undefined) {
    requestBody.unit = payload.unit ? String(payload.unit).trim() : null;
  }

  const response = await httpClient.put<any>(
    `/Products/${id}`,
    requestBody
  );
  const rawData = response?.data ?? response;
  const updated = mapApiProductToLocal(rawData);
  if (payload.category) updated.category = payload.category.trim();
  if (payload.unit) updated.unit = payload.unit.trim();
  return updated;
}

/**
 * DELETE /api/Products/{id}
 *
 * Soft deletes a product for the authenticated merchant.
 * Does not physically remove the record.
 */
export async function deleteProductApi(
  id: string | number
): Promise<boolean> {
  const response = await httpClient.delete<ApiResponse<boolean>>(
    `/Products/${id}`
  );
  return response.data;
}

/**
 * POST /api/Products/{id}/stock/supply
 *
 * Adds quantity to the stock of an existing product.
 */
export async function supplyProductStockApi(
  id: string | number,
  payload: SupplyStockPayload
): Promise<boolean> {
  const response = await httpClient.post<ApiResponse<boolean>>(
    `/Products/${id}/stock/supply`,
    payload
  );
  return response.data;
}

/**
 * POST /api/Products/{id}/stock/return
 *
 * Returns quantity to the stock of an existing product.
 */
export async function returnProductStockApi(
  id: string | number,
  payload: ReturnStockPayload
): Promise<boolean> {
  const response = await httpClient.post<ApiResponse<boolean>>(
    `/Products/${id}/stock/return`,
    payload
  );
  return response.data;
}

/**
 * PATCH /api/Products/{id}/stock/adjust
 *
 * Adjusts the exact stock quantity of a product.
 */
export async function adjustProductStockApi(
  id: string | number,
  payload: AdjustStockPayload
): Promise<boolean> {
  const response = await httpClient.patch<ApiResponse<boolean>>(
    `/Products/${id}/stock/adjust`,
    payload
  );
  return response.data;
}

/**
 * PATCH /api/Products/{id}/activate
 *
 * Activates an existing product for the authenticated merchant.
 */
export async function activateProductApi(
  id: string | number
): Promise<Product> {
  const response = await httpClient.patch<ApiResponse<ProductApiData>>(
    `/Products/${id}/activate`
  );
  return mapApiProductToLocal(response.data);
}

/**
 * PATCH /api/Products/{id}/deactivate
 *
 * Deactivates an existing product for the authenticated merchant.
 */
export async function deactivateProductApi(
  id: string | number
): Promise<Product> {
  const response = await httpClient.patch<ApiResponse<ProductApiData>>(
    `/Products/${id}/deactivate`
  );
  return mapApiProductToLocal(response.data);
}

/**
 * GET /api/Products/{id}
 *
 * Gets a specific product by its ID.
 */
export async function getProductByIdApi(
  id: string | number
): Promise<Product> {
  const response = await httpClient.get<ApiResponse<ProductApiData>>(
    `/Products/${id}`
  );
  return mapApiProductToLocal(response.data);
}

/**
 * GET /api/Products/stock/low
 *
 * Gets products that have low stock.
 */
export async function getLowStockProductsApi(): Promise<{ items: Product[]; totalCount: number }> {
  const response = await httpClient.get<any>(`/Products/stock/low`);
  const payload = response.data ?? response;

  if (Array.isArray(payload)) {
    return {
      items: payload.map(mapApiProductToLocal),
      totalCount: payload.length,
    };
  }

  if (payload && Array.isArray(payload.items)) {
    return {
      items: payload.items.map(mapApiProductToLocal),
      totalCount: payload.totalCount ?? payload.items.length,
    };
  }

  return { items: [], totalCount: 0 };
}

export interface StockMovement {
  id: number | string;
  productId: number | string;
  quantity: number;
  type: string;
  createdAt: string;
  note?: string;
}

/**
 * GET /api/Products/{id}/stock/movements
 *
 * Gets stock movements for a specific product.
 */
export async function getStockMovementsApi(
  id: string | number
): Promise<StockMovement[]> {
  const response = await httpClient.get<any>(
    `/Products/${id}/stock/movements`
  );
  const payload = response.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.items)) {
    return payload.items;
  }
  return [];
}


function translateProductBackendMessage(rawMsg: string, fieldHint?: string): string {
  const trimmed = rawMsg.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  const field = (fieldHint || '').toLowerCase();

  if (lower.includes('barcode') && (lower.includes('already exists') || lower.includes('duplicate') || lower.includes('unique'))) {
    return 'الباركود المدخل مستخدم مسبقاً لصنف آخر في المخزون.';
  }
  if ((lower.includes('name') || field.includes('productname')) && (lower.includes('already exists') || lower.includes('duplicate'))) {
    return 'يوجد صنف مسجل بنفس هذا الاسم مسبقاً.';
  }
  if (lower.includes('already exists') || lower.includes('duplicate')) {
    return 'هذا الصنف أو الباركود مسجل مسبقاً في المخزون.';
  }
  if (field.includes('barcode') || lower.includes('barcode')) {
    return 'رمز الباركود المدخل غير صالح أو مطلوب.';
  }
  if (field.includes('productname') || field === 'name') {
    return 'اسم الصنف غير صالح أو يتجاوز الطول المسموح.';
  }
  if (field.includes('saleprice') || lower.includes('saleprice') || lower.includes('sale price')) {
    return 'سعر البيع يجب أن يكون قيمة رقمية صالحة أكبر من أو تساوي صفر.';
  }
  if (field.includes('costprice') || lower.includes('costprice') || lower.includes('cost price')) {
    return 'سعر التكلفة يجب أن يكون قيمة رقمية صالحة أكبر من أو تساوي صفر.';
  }
  if (field.includes('quantity') || field.includes('stock') || lower.includes('insufficient stock')) {
    return 'قيمة الكمية أو المخزون المدخلة غير صالحة.';
  }
  if (lower.includes('product not found') || lower.includes('not found')) {
    return 'تعذر العثور على الصنف المطلوب في المخزون.';
  }
  if (lower.includes('no business found')) {
    return 'لا يوجد نشاط تجاري مرتبط بحسابك. يرجى التواصل مع الدعم الفني.';
  }
  if (lower === 'one or more validation errors occurred.') {
    return 'يوجد خطأ في التحقق من صحة بيانات الصنف.';
  }
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    return trimmed;
  }
  return `رفض الخادم البيانات: ${trimmed}`;
}

/** Maps product API errors (create/update/stock) to explicit Arabic user messages. */
export function toProductErrorMessage(error: unknown, defaultMessage = 'تعذر حفظ بيانات الصنف في المخزون.'): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.';
    }
    if (error.status === 408 || error.message === 'TIMEOUT') {
      return 'انتهت مهلة انتظار الخادم. يرجى المحاولة مرة أخرى.';
    }
    if (error.status === 401) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
    }
    if (error.status === 403) {
      return 'لا تملك صلاحية تعديل أو إضافة الأصناف (403).';
    }

    let body = error.body;
    if (typeof body === 'string') {
      const t = body.trim();
      if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
        try {
          body = JSON.parse(t);
        } catch {
          // plain string
        }
      }
    }

    const parts: string[] = [];
    const pushMsg = (raw: string, hint?: string) => {
      const m = translateProductBackendMessage(raw, hint);
      if (m && !parts.includes(m)) parts.push(m);
    };

    if (typeof body === 'string' && body.trim()) {
      pushMsg(body);
    } else if (body && typeof body === 'object') {
      const b = body as Record<string, unknown>;
      const errs = b.errors ?? b.Errors;
      if (errs && typeof errs === 'object') {
        if (Array.isArray(errs)) {
          for (const item of errs) {
            if (typeof item === 'string') pushMsg(item);
          }
        } else {
          for (const [k, v] of Object.entries(errs as Record<string, unknown>)) {
            const arr = Array.isArray(v) ? v : [v];
            for (const item of arr) {
              if (typeof item === 'string') pushMsg(item, k);
            }
          }
        }
      }

      const resultObj = b.result && typeof b.result === 'object' ? (b.result as Record<string, unknown>) : null;
      const dataObj = b.data && typeof b.data === 'object' ? (b.data as Record<string, unknown>) : null;
      const cands: unknown[] = [
        b.message,
        b.Message,
        b.detail,
        b.Detail,
        b.error,
        b.Error,
        resultObj?.message,
        dataObj?.message,
      ];
      for (const c of cands) {
        if (typeof c === 'string' && c.trim()) pushMsg(c);
      }
      if (parts.length === 0 && typeof (b.title ?? b.Title) === 'string') {
        pushMsg(String(b.title ?? b.Title));
      }
    }

    if (parts.length > 0) {
      return parts.join(' — ');
    }

    if (error.status === 409) {
      return 'يوجد صنف مسجل مسبقاً بنفس الباركود أو البيانات (409).';
    }
    if (error.status === 404) {
      return 'تعذر العثور على الصنف المطلوب (404).';
    }
    if (error.status === 400 || error.status === 422) {
      return 'رفض الخادم بيانات الصنف؛ يرجى التأكد من الاسم والباركود وصحة الأسعار.';
    }
    if (error.status >= 500) {
      return `حدث خطأ داخلي في الخادم أثناء معالجة الصنف (${error.status}).`;
    }
    return defaultMessage;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return defaultMessage;
}
