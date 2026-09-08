/**
 * Types for the Create Debt API.
 *
 * The UI (Add New Debt page) never collects `reason` or `currencyId` from
 * the merchant directly — those are derived in debtService.ts — but both
 * are still required, real fields on the wire, so they live in this
 * payload type rather than being bolted on ad-hoc at the call site.
 */
export interface CreateDebtPayload {
  customerId: number;
  amount: number;
  currencyId: number;
  reason: string;
  dueDate: string; // ISO datetime string, e.g. "2026-10-01T00:00:00"
  notes?: string;
}

/**
 * Real backend response shape is not confirmed for this endpoint (no
 * sample success response was provided, only the request payload), so
 * this is intentionally loose. Callers should not depend on fields beyond
 * `id` being present.
 */
export interface DebtDto {
  id?: number | string;
  debtNumber?: string;
  customerId?: number | string;
  amount?: number;
  currencyId?: number;
  currencyCode?: string;
  status?: string;
  reason?: string;
  dueDate?: string;
  notes?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Types for the Update Debt API — PUT /api/Debt/{id}.
 *
 * `debtId`/`userId` are intentionally absent: the id comes from the URL
 * and the user is derived from the JWT, so neither is ever part of the
 * request body per the documented contract.
 */
export interface UpdateDebtPayload {
  customerId: number;
  amount: number;
  currencyId?: number;
  reason: string;
  dueDate: string; // ISO datetime string, e.g. "2026-10-15T00:00:00"
  notes?: string;
}

/**
 * DeleteDebtResponseDto — response body for
 * DELETE /api/Debt/{id}?confirmDeleteWithPayments=... , confirmed from the
 * API doc's Response Properties table and both the success and
 * confirmation-required example responses. `message` is not listed as a
 * DTO property in the doc (the "Message" shown there reads like a
 * separate value), but it's kept optional here in case the backend nests
 * it inside the same body — reading it is always guarded with a type
 * check, never assumed.
 */
export interface DeleteDebtResponseDto {
  deleted: boolean;
  requiresConfirmation: boolean;
  hasPayments: boolean;
  paymentsCount: number;
  customerId: number;
  totalDebt: number;
  message?: string;
}
