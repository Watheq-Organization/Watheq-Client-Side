/**
 * Types for the Invoice API:
 * - POST /api/Invoice
 * - GET  /api/Invoice/{id}/pdf
 * - POST /api/Invoice/{id}/share/whatsapp
 */

export interface CreateInvoiceItemRequest {
  description?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceCommand {
  debtId?: number | null;
  debtPaymentId?: number | null;
  items?: CreateInvoiceItemRequest[] | null;
  taxRate?: number;
  notes?: string | null;
}

export interface ShareInvoiceRequest {
  phoneNumber?: string | null;
}

export interface CreateInvoiceResponseDto {
  id?: number;
  invoiceId?: number;
  invoiceNumber?: string;
  debtId?: number;
  totalAmount?: number;
  message?: string;
  success?: boolean;
}

export interface ShareInvoiceResponseDto {
  success?: boolean;
  message?: string;
  whatsappUrl?: string;
}
