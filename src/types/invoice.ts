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

export interface InvoiceItemDto {
  id?: string | number;
  name?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  total?: number;
}

export interface DebtInvoiceDto {
  id?: number | string;
  invoiceId?: number | string;
  invoiceNumber?: string;
  debtId?: number;
  customerId?: number | string;
  customerName?: string;
  customerNationalId?: string;
  customerPhone?: string;
  amount?: number;
  invoiceAmount?: number;
  originalAmount?: number;
  remainingAmount?: number;
  previousDebt?: number;
  previousPaid?: number;
  totalCurrentDebt?: number;
  date?: string;
  fileOpenDate?: string;
  customerRegistrationDate?: string;
  issueDate?: string;
  issueTime?: string;
  dueDate?: string;
  status?: string;
  branch?: string;
  items?: InvoiceItemDto[];
  taxRate?: number;
  taxAmount?: number;
  notes?: string;
  currency?: string;
  currencyCode?: string;
  hash?: string;
}

export interface PaymentInvoiceDto {
  id?: number | string;
  paymentId?: number | string;
  invoiceId?: number | string;
  invoiceNumber?: string;
  receiptNumber?: string;
  customerId?: number | string;
  customerName?: string;
  customerNationalId?: string;
  customerPhone?: string;
  amount?: number;
  paidAmount?: number;
  date?: string;
  paymentDate?: string;
  time?: string;
  paymentTime?: string;
  paymentMethod?: number | string;
  status?: string;
  previousDebt?: number;
  remainingDebt?: number;
  referenceNumber?: string;
  notes?: string;
  currency?: string;
  currencyCode?: string;
  dueDate?: string;
  nextDueDate?: string;
  originalInvoiceDate?: string;
}
