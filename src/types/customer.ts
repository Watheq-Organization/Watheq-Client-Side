export type CustomerStatus = 'overdue' | 'active_debt' | 'paid';
export type CustomerType = 'individual' | 'company';

export interface CustomerTransaction {
  id: string;
  date: string;
  type: 'debt' | 'payment';
  typeLabel: string;
  amount: number;
  status: 'completed' | 'pending' | 'overdue';
  statusLabel: string;
  invoiceNumber: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  typeLabel: string;
  nationalOrCrId: string;
  totalDebt: number;
  totalPaid?: number;
  status: CustomerStatus;
  statusLabel: string;
  avatarLetter: string;
  avatarBg: string;
  phone?: string;
  email?: string;
  address?: string;
  registrationDate?: string;
  transactions?: CustomerTransaction[];
}

/**
 * Real backend response shape from the Update Customer API
 * (PUT /api/Customer/updateCustomer/{customerId}).
 * Intentionally separate from `Customer` (the app's local/UI model) since
 * the backend DTO only carries a subset of fields — mapping between the
 * two is done explicitly at the call site, never assumed to line up 1:1.
 */
export interface CustomerDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  totalDebt: number;
  totalPaid: number;
  createdAt: string;
}

/**
 * Request body for the Update Customer API. Only these three fields are
 * accepted by the backend — customerId goes in the URL, never the body,
 * and UserId/BusinessId/totalDebt/totalPaid/createdAt must never be sent.
 */
export interface UpdateCustomerPayload {
  fullName: string;
  phoneNumber: string;
  address: string;
}

/**
 * A single entry in a customer's transaction history, as returned inside
 * `CustomerProfileDto.transactions` by
 * GET /api/Customer/getCustomerProfile/{customerId}.
 * `status` is populated for Debt entries and null for Payment entries;
 * `paymentMethod` is the inverse (populated for Payment, null for Debt).
 */
export interface CustomerProfileTransactionDto {
  /** Real numeric id of the underlying Debt or Payment record (debt.Id /
   * payment.Id per the documented API). Lets the edit icon in the
   * Financial Activity Log call PUT /api/Debt/{id} directly, without
   * needing the local "editable debt" cache. */
  id: number;
  type: 'Debt' | 'Payment' | string;
  date: string;
  amount: number;
  description: string;
  reference: string;
  balance: number;
  currencyCode: string;
  status: string | null;
  paymentMethod: string | null;
}

/**
 * Real backend response shape from the Get Customer Profile API
 * (GET /api/Customer/getCustomerProfile/{customerId}). Separate from
 * `CustomerDto` since this endpoint additionally returns `currentBalance`
 * and the full `transactions` history, which `CustomerDto` does not carry.
 * Transactions are returned newest-first per the API contract.
 */
export interface CustomerProfileDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  currentBalance: number;
  totalDebt: number;
  totalPaid: number;
  createdAt: string;
  transactions: CustomerProfileTransactionDto[];
}

/**
 * Request body for the Add Customer API (POST /customer/addCustomer).
 * `address` is optional per the API contract — omit it or send null when
 * not provided. UserId/BusinessId are derived server-side from the JWT and
 * must never be sent; TotalDebt/TotalPaid/CreatedAt are backend-assigned
 * defaults (0/0/now) and are never accepted from the client either.
 */
export interface AddCustomerPayload {
  fullName: string;
  phoneNumber: string;
  address?: string | null;
}
