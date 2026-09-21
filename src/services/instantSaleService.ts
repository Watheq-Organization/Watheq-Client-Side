import { httpClient } from '../api/httpClient';
import type {
  CreateInstantSaleDto,
  UpdateInstantSaleDto,
  InstantSaleDto,
} from '../types/instantSale';

/**
 * POST /api/InstantSale/create
 */
export async function createInstantSale(data: CreateInstantSaleDto): Promise<InstantSaleDto> {
  return httpClient.post<InstantSaleDto>('/InstantSale/create', data);
}

/**
 * POST /api/InstantSale
 */
export async function createInstantSaleDefault(data: CreateInstantSaleDto): Promise<InstantSaleDto> {
  return httpClient.post<InstantSaleDto>('/InstantSale', data);
}

/**
 * GET /api/InstantSale
 */
export async function getInstantSales(): Promise<InstantSaleDto[]> {
  const response = await httpClient.get<unknown>('/InstantSale');
  
  let rawItems: any[] = [];
  if (Array.isArray(response)) {
    rawItems = response;
  } else if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) rawItems = obj.data;
    else if (Array.isArray(obj.items)) rawItems = obj.items;
    else if (Array.isArray(obj.result)) rawItems = obj.result;
    else if (obj.data && typeof obj.data === 'object') {
      const inner = obj.data as Record<string, unknown>;
      if (Array.isArray(inner.data)) rawItems = inner.data;
      else if (Array.isArray(inner.items)) rawItems = inner.items;
    }
  }

  return rawItems.map((item) => {
    return {
      id: item.id ?? item.Id ?? item.instantSaleId ?? item.InstantSaleId,
      amount: item.amount ?? item.Amount ?? 0,
      description: item.description ?? item.Description ?? item.notes ?? item.Notes,
      paymentMethod: item.paymentMethod ?? item.PaymentMethod ?? item.method ?? item.Method,
      customerId: item.customerId ?? item.CustomerId,
      customerName: item.customerName ?? item.CustomerName ?? item.guestCustomerName ?? item.GuestCustomerName ?? item.customerFullName ?? item.CustomerFullName ?? item.buyerName ?? item.BuyerName,
      phoneNumber: item.customerPhone ?? item.CustomerPhone ?? item.guestCustomerPhoneNumber ?? item.GuestCustomerPhoneNumber ?? item.phoneNumber ?? item.PhoneNumber ?? item.phone ?? item.Phone,
      createdAt: item.createdAt ?? item.CreatedAt ?? item.saleDate ?? item.SaleDate ?? item.date ?? item.Date ?? item.createdDate ?? item.CreatedDate,
    };
  });
}

/**
 * GET /api/InstantSale/{id}
 */
export async function getInstantSaleById(id: number | string): Promise<InstantSaleDto> {
  return httpClient.get<InstantSaleDto>(`/InstantSale/${id}`);
}

/**
 * PUT /api/InstantSale/{id}
 */
export async function updateInstantSale(id: number | string, data: UpdateInstantSaleDto): Promise<InstantSaleDto> {
  return httpClient.put<InstantSaleDto>(`/InstantSale/${id}`, data);
}

/**
 * DELETE /api/InstantSale/{id}
 */
export async function deleteInstantSale(id: number | string): Promise<void> {
  return httpClient.delete(`/InstantSale/${id}`);
}
