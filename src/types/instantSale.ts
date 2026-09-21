export interface CreateInstantSaleDto {
  amount: number;
  description?: string;
  paymentMethod?: number;
  customerId?: number | null;
  customerName?: string | null;
  CustomerName?: string | null;
  phoneNumber?: string | null;
  PhoneNumber?: string | null;
  customerPhone?: string | null;
  CustomerPhone?: string | null;
  guestCustomerName?: string | null;
  GuestCustomerName?: string | null;
  guestCustomerPhoneNumber?: string | null;
  GuestCustomerPhoneNumber?: string | null;
}

export interface UpdateInstantSaleDto {
  amount?: number;
  description?: string;
  paymentMethod?: number;
  customerId?: number | null;
  customerName?: string | null;
  phoneNumber?: string | null;
  guestCustomerName?: string | null;
  guestCustomerPhoneNumber?: string | null;
}

export interface InstantSaleDto {
  id: number;
  amount: number;
  description?: string;
  paymentMethod?: number;
  customerId?: number | null;
  customerName?: string | null;
  phoneNumber?: string | null;
  createdAt: string;
}
