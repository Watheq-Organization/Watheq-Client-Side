import { httpClient } from '../api/httpClient';
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
  quantity: number;
}

/** Payload sent to PUT /api/Products/{id} */
export interface UpdateProductPayload {
  id: number | string;
  productName: string;
  barcode: string;
  salePrice: number;
  costPrice: number;
  minStockAlert: number;
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
    category: 'عام', // category not in backend yet, defaulting to 'عام'
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
  if (params?.IsActive !== undefined) qs.append('IsActive', String(params.IsActive));
  if (params?.PageNumber !== undefined) qs.append('PageNumber', String(params.PageNumber));
  if (params?.PageSize !== undefined) qs.append('PageSize', String(params.PageSize));

  const query = qs.toString() ? `?${qs.toString()}` : '';
  const response = await httpClient.get<any>(`/Products${query}`);

  // Handle various potential API wrappers (ApiResponse + PaginatedResponse)
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
  const response = await httpClient.post<ApiResponse<ProductApiData>>(
    '/Products',
    payload
  );
  return mapApiProductToLocal(response.data);
}

/**
 * PUT /api/Products/{id}
 *
 * Updates an existing product for the authenticated merchant.
 * Does not update stock.
 */
export async function updateProductApi(
  id: string | number,
  payload: UpdateProductPayload
): Promise<Product> {
  const response = await httpClient.put<ApiResponse<ProductApiData>>(
    `/Products/${id}`,
    payload
  );
  return mapApiProductToLocal(response.data);
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

