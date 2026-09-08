/**
 * Types for the Register Payment API — POST /api/Debt/registerPayment.
 * The endpoint works at the customer level (not a specific debt): the
 * backend automatically distributes the payment across the customer's
 * outstanding debts, ordered by DueDate, then CreatedAt, then Id.
 */

/**
 * PaymentMethod enum values as documented:
 *   1 = Cash, 2 = BankTransfer, 3 = CreditCard.
 * The UI works with the friendly string form; PAYMENT_METHOD_TO_NUMERIC
 * in paymentService.ts is the single place that maps to the wire value.
 * (There is no "wallet" method in the real API — only these three.)
 */
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card';

/** The three payment methods this form supports, in display order. */
export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'نقدي (Cash)' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
  { value: 'credit_card', label: 'بطاقة ائتمان' },
];

/**
 * Local form state for the New Payment page. `receiptFile` is only ever
 * attached to the multipart request when present — the endpoint accepts
 * it as an optional file (see paymentService.ts:buildRegisterPaymentFormData).
 */
export interface NewPaymentFormState {
  amount: string;
  method: PaymentMethod;
  receiptNumber: string;
  notes: string;
  receiptFile: File | null;
}

/**
 * A single debt affected by a payment, as returned inside
 * RegisterPaymentResponseDto.affectedDebts.
 */
export interface AffectedDebtDto {
  debtId: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
}

/**
 * Real backend response shape from POST /api/Debt/registerPayment.
 * `totalPaid`/`totalRemaining` reflect the customer's totals across ALL
 * debts after this payment was distributed — the same numbers
 * getCustomerProfile would show on a fresh fetch.
 */
export interface RegisterPaymentResponseDto {
  customerId: number;
  paymentAmount: number;
  paymentDate: string;
  receiptImageUrl: string | null;
  totalPaid: number;
  totalRemaining: number;
  affectedDebts: AffectedDebtDto[];
}

/**
 * Real backend response shape from DELETE /api/Payment/{id}.
 * `totalDebt` is the customer's total remaining debt across all debts,
 * already recalculated by the backend after the payment was removed.
 */
export interface DeletePaymentResponseDto {
  paymentId: number;
  customerId: number;
  debtId: number;
  totalDebt: number;
}
