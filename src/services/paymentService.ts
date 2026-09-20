import { httpClient, ApiError } from '../api/httpClient';
import { getCustomerProfile } from './customerService';
import type {
  DeletePaymentResponseDto,
  NewPaymentFormState,
  PaymentMethod,
  PaymentHistoryItemDto,
  PaymentHistoryQueryParams,
  PaymentHistoryResult,
  RegisterPaymentResponseDto,
  UpdatePaymentResponseDto,
} from '../types/payment';

/**
 * Client-side mirror of the amount rule for this form: required, numeric,
 * and strictly greater than zero, with at most 2 decimal places. Mirrors the style of
 * validateCustomerFullName / validateDebtAmount elsewhere in the codebase.
 */
export function validatePaymentAmount(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'مبلغ الدفعة مطلوب.';
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) return 'يرجى إدخال مبلغ صحيح.';
  if (numeric <= 0) return 'يجب أن يكون مبلغ الدفعة أكبر من صفر.';
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return 'يجب ألا يتجاوز مبلغ الدفعة منزلتين عشريتين.';
  }
  return null;
}

/**
 * Client-side pre-check mirroring the backend's own restriction ("Payment
 * amount cannot exceed the customer's remaining debt"). Optional —
 * `remainingDebt` is only passed once the customer's profile has loaded —
 * but catches the obvious case before a round trip to the server.
 */
export function validatePaymentAmountAgainstBalance(
  value: string,
  remainingDebt: number
): string | null {
  const numeric = Number(value.trim());
  if (!Number.isFinite(numeric) || numeric <= 0) return null; // validatePaymentAmount already covers this
  if (numeric > remainingDebt) {
    return `لا يمكن أن تتجاوز الدفعة المبلغ المتبقي على العميل (الحد الأقصى ${remainingDebt.toFixed(2)}).`;
  }
  return null;
}

const MAX_RECEIPT_NUMBER_LENGTH = 50;

/** Optional field — max 50 characters per the API contract. */
export function validateReceiptNumber(value: string): string | null {
  if (value.length > MAX_RECEIPT_NUMBER_LENGTH) {
    return 'رقم الإيصال طويل جداً (الحد الأقصى 50 حرفاً).';
  }
  return null;
}

const MAX_NOTES_LENGTH = 500;

/** Optional field — max 500 characters per the API contract (payments use
 * a shorter limit than debts' notes field). */
export function validatePaymentNotes(value: string): string | null {
  if (value.length > MAX_NOTES_LENGTH) {
    return 'لا يمكن أن تتجاوز الملاحظات 500 حرف.';
  }
  return null;
}

const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB, per the upload area's own label
const ALLOWED_RECEIPT_TYPES = ['image/png', 'image/jpeg'];

/** Mirrors the "حتى 5 ميجابايت، PNG, JPG" limit shown under the upload area. */
export function validateReceiptFile(file: File): string | null {
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return 'صيغة الملف غير مدعومة. الرجاء رفع صورة PNG أو JPG.';
  }
  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    return 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت.';
  }
  return null;
}

/**
 * POST https://whateq.runasp.net/api/Debt/registerPayment
 *
 * Maps the friendly string PaymentMethod the UI works with to the wire
 * enum value (1 = Cash, 2 = BankTransfer, 3 = CreditCard). There is no
 * "wallet" method in the real API — see the note on PaymentMethod in
 * types/payment.ts.
 */
export const PAYMENT_METHOD_TO_NUMERIC: Record<PaymentMethod, number> = {
  cash: 1,
  bank_transfer: 2,
  credit_card: 3,
};

const REGISTER_PAYMENT_PATH = '/Debt/registerPayment';

/**
 * Builds the multipart/form-data body exactly as documented: customerId,
 * amount and paymentMethod are always sent; receiptNumber, notes and
 * receiptImage are only appended when actually provided (an empty/absent
 * optional field is simply left out of the FormData, never sent as an
 * empty string). No debtId (this endpoint distributes across all of the
 * customer's outstanding debts) and no userId/paymentDate — both are
 * backend-only per the contract.
 */
function buildRegisterPaymentFormData(customerId: string, values: NewPaymentFormState): FormData {
  const formData = new FormData();
  formData.append('CustomerId', customerId);
  formData.append('Amount', values.amount.trim());
  const methodNum = String(PAYMENT_METHOD_TO_NUMERIC[values.method] || 1);
  formData.append('PaymentMethod', methodNum);

  const receiptNumber = values.receiptNumber?.trim();
  if (receiptNumber) {
    formData.append('ReceiptNumber', receiptNumber);
  }

  const notes = values.notes?.trim();
  if (notes) {
    formData.append('Notes', notes);
  }

  if (values.receiptFile) {
    formData.append('ReceiptImage', values.receiptFile);
  }

  return formData;
}

export async function registerPayment(
  customerId: string,
  values: NewPaymentFormState
): Promise<RegisterPaymentResponseDto> {
  const formData = buildRegisterPaymentFormData(customerId, values);
  // Diagnostic only — mirrors the [createDebt]/[updateDebt] logging style
  // elsewhere in the codebase. FormData entries are logged individually
  // since FormData itself doesn't stringify usefully.
  // eslint-disable-next-line no-console
  console.log(
    '[registerPayment] POST',
    REGISTER_PAYMENT_PATH,
    Object.fromEntries(formData.entries())
  );
  return httpClient.postForm<RegisterPaymentResponseDto>(REGISTER_PAYMENT_PATH, formData);
}

/** Maps registerPayment errors to user-friendly Arabic messages, incl. known backend business errors. */
export function toRegisterPaymentErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // eslint-disable-next-line no-console
    console.error('[registerPayment] backend responded with an error:', {
      status: error.status,
      body: error.body,
    });

    const body = error.body as { message?: unknown } | string | null;
    const message =
      typeof body === 'object' && body !== null && typeof body.message === 'string'
        ? body.message
        : typeof body === 'string'
          ? body
          : '';

    if (message.includes('No business found for the current merchant')) {
      return 'لا يوجد نشاط تجاري مرتبط بحسابك. يرجى التواصل مع الدعم.';
    }
    if (message.includes('Customer not found')) {
      return 'تعذر العثور على هذا العميل.';
    }
    if (message.includes('has no outstanding debts to pay')) {
      return 'لا توجد ديون مستحقة على هذا العميل حالياً.';
    }
    if (message.includes('cannot exceed')) {
      // The backend embeds the max allowed amount in its own message
      // ("...Maximum allowed payment is {amount}."); surface that verbatim
      // since it's a real, useful number rather than re-deriving it.
      return `قيمة الدفعة أكبر من المبلغ المتبقي على العميل. ${message}`;
    }
    if (message.includes('Payment amount must be greater than zero')) {
      return 'يجب أن يكون مبلغ الدفعة أكبر من صفر.';
    }
    if (message.includes('A valid customer is required')) {
      return 'يجب اختيار عميل صحيح.';
    }
    if (message.includes('A valid payment method is required')) {
      return 'يرجى اختيار طريقة دفع صحيحة.';
    }

    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
    if (error.status === 400) {
      return 'يرجى التحقق من البيانات المدخلة والمحاولة مرة أخرى.';
    }
    if (error.status === 401) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
    }
    if (error.status === 403) {
      return 'لا تملك صلاحية تنفيذ هذا الإجراء.';
    }
    if (error.status === 404) {
      return 'تعذر العثور على البيانات المطلوبة.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.';
    }
    return 'تعذر حفظ الدفعة. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

/* ---------------------------------------------------------------------- */
/* Delete Payment — DELETE /api/Payment/{id}                               */
/*                                                                          */
/* Per the documented contract, deleting a payment is a single call with   */
/* no request body and no confirmation step (unlike Delete Debt): the      */
/* backend recalculates the debt's PaidAmount/Status and the customer's    */
/* TotalDebt, and removes the receipt image only if no other payment still */
/* references it. No UserId is ever sent — the backend extracts it from    */
/* the JWT.                                                                */
/* ---------------------------------------------------------------------- */

const deletePaymentPath = (id: string | number) => `/Payment/${id}`;

export async function deletePayment(paymentId: string | number): Promise<DeletePaymentResponseDto> {
  const numericId = Number(paymentId);
  if (!paymentId || isNaN(numericId) || numericId <= 0) {
    throw new ApiError('معرّف الدفعة غير صالح أو غير متوفر في السجل.', 400, {
      message: 'A valid payment is required.',
    });
  }
  return httpClient.delete<DeletePaymentResponseDto>(deletePaymentPath(numericId));
}

/** Maps deletePayment errors to user-friendly Arabic messages, incl. known backend business errors. */
export function toDeletePaymentErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    console.error('[deletePayment] backend responded with an error:', {
      status: error.status,
      body: error.body,
    });

    const body = error.body as { message?: unknown } | string | null;
    const message =
      typeof body === 'object' && body !== null && typeof body.message === 'string'
        ? body.message
        : typeof body === 'string'
          ? body
          : '';

    if (message.includes('No business found for the current merchant')) {
      return 'لا يوجد نشاط تجاري مرتبط بحسابك. يرجى التواصل مع الدعم.';
    }
    if (message.includes('Payment not found')) {
      return 'تعذر العثور على هذه الدفعة. قد تكون قد حُذفت بالفعل.';
    }
    if (message.includes('A valid payment is required')) {
      return 'معرّف الدفعة غير صالح أو غير متوفر.';
    }

    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
    if (error.status === 400) {
      return message || 'يرجى التحقق من صحة الدفعة والمحاولة مرة أخرى.';
    }
    if (error.status === 401) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
    }
    if (error.status === 403) {
      return 'لا تملك صلاحية حذف هذه الدفعة.';
    }
    if (error.status === 404) {
      return 'تعذر العثور على هذه الدفعة.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ في الخادم أثناء حذف الدفعة. يرجى المحاولة لاحقاً.';
    }
    return message || 'تعذر حذف الدفعة. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

/* ---------------------------------------------------------------------- */
/* Update Payment — PUT /api/Payment/{id}                                 */
/*                                                                        */
/* Allows the merchant to update a previously registered payment amount.  */
/* Backend distributes overflow across the customer's other debts and     */
/* recalculates status and totalDebt.                                     */
/* ---------------------------------------------------------------------- */

const updatePaymentPath = (id: string | number) => `/Payment/${id}`;

export async function updatePayment(
  paymentId: string | number,
  newAmount: number,
  paymentMethod?: number,
  notes?: string,
  receiptFile?: File | null
): Promise<UpdatePaymentResponseDto> {
  const numericId = Number(paymentId);
  if (!paymentId || isNaN(numericId) || numericId <= 0) {
    throw new ApiError('معرّف الدفعة غير صالح.', 400, { message: 'A valid payment is required.' });
  }

  const formData = new FormData();
  formData.append('PaymentId', String(numericId));
  formData.append('Amount', String(newAmount));
  if (paymentMethod !== undefined) {
    formData.append('PaymentMethod', String(paymentMethod));
  }
  if (notes) {
    formData.append('Notes', notes.trim());
  }
  if (receiptFile) {
    formData.append('ReceiptImage', receiptFile);
  }

  return httpClient.putForm<UpdatePaymentResponseDto>(updatePaymentPath(numericId), formData);
}

/** Maps updatePayment errors to user-friendly Arabic messages, incl. known backend business errors. */
export function toUpdatePaymentErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // eslint-disable-next-line no-console
    console.error('[updatePayment] backend responded with an error:', {
      status: error.status,
      body: error.body,
    });

    const body = error.body as { message?: unknown } | string | null;
    const message =
      typeof body === 'object' && body !== null && typeof body.message === 'string'
        ? body.message
        : typeof body === 'string'
          ? body
          : '';

    if (message.includes('No business found for the current merchant')) {
      return 'لا يوجد نشاط تجاري مرتبط بحسابك. يرجى التواصل مع الدعم.';
    }
    if (message.includes('Payment not found')) {
      return 'تعذر العثور على هذه الدفعة. قد تكون قد حُذفت بالفعل.';
    }
    if (message.includes('User identification is required')) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.';
    }
    if (message.includes('A valid payment is required')) {
      return 'معرّف الدفعة غير صالح.';
    }
    if (message.includes('Payment amount must be greater than zero')) {
      return 'يجب أن يكون مبلغ الدفعة أكبر من صفر.';
    }
    if (message.includes('at most 18 digits and 2 decimal places')) {
      return 'يجب ألا يتجاوز مبلغ الدفعة منزلتين عشريتين.';
    }
    if (message.includes('cannot exceed the maximum allowed amount')) {
      return `مبلغ الدفعة يتجاوز الحد الأقصى المسموح به. ${message}`;
    }
    if (message.includes('Payment could not be updated. No changes were saved')) {
      return 'تعذر تعديل الدفعة. لم يتم حفظ أي تغييرات.';
    }

    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
    if (error.status === 400) {
      return message || 'يرجى التحقق من القيمة المدخلة والمحاولة مرة أخرى.';
    }
    if (error.status === 401) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
    }
    if (error.status === 403) {
      return 'لا تملك صلاحية تعديل هذه الدفعة.';
    }
    if (error.status === 404) {
      return 'تعذر العثور على الدفعة المطلوبة.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ في الخادم أثناء تعديل الدفعة. يرجى المحاولة لاحقاً.';
    }
    return message || 'تعذر تعديل الدفعة. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

/* ---------------------------------------------------------------------- */
/* Payment History — GET /api/Payment/history                             */
/* ---------------------------------------------------------------------- */

/**
 * GET https://whateq.runasp.net/api/Payment/history
 *
 * Fetches the payment history for the merchant with optional filters:
 * PaymentMethod, Status, FromDate, ToDate, UserId.
 */
export async function getPaymentHistory(
  params?: PaymentHistoryQueryParams
): Promise<PaymentHistoryResult> {
  try {
    const searchParams = new URLSearchParams();

    if (
      params?.paymentMethod !== undefined &&
      params.paymentMethod !== null &&
      String(params.paymentMethod) !== 'all'
    ) {
      let numMethod: number | undefined;
      if (typeof params.paymentMethod === 'number') {
        numMethod = params.paymentMethod;
      } else {
        const s = String(params.paymentMethod).trim().toLowerCase().replace(/[\s_-]/g, '');
        if (s === '1' || s.includes('cash') || s.includes('نقد')) numMethod = 1;
        else if (s === '2' || s.includes('bank') || s.includes('بنك') || s.includes('تحويل') || s.includes('transfer')) numMethod = 2;
        else if (s === '3' || s.includes('card') || s.includes('credit') || s.includes('محفظ') || s.includes('مدى') || s.includes('بطاق')) numMethod = 3;
      }
      if (numMethod !== undefined) {
        searchParams.append('PaymentMethod', String(numMethod));
      }
    }

    if (
      params?.status !== undefined &&
      params.status !== null &&
      String(params.status) !== 'all'
    ) {
      searchParams.append('Status', String(params.status));
    }

    // Always provide safe default dates if omitted so ASP.NET required DateTime parameters never fail with 400
    const fromDate = params?.fromDate || '2020-01-01T00:00:00Z';
    const toDate = params?.toDate || new Date(Date.now() + 86400000).toISOString();
    searchParams.append('FromDate', fromDate);
    searchParams.append('ToDate', toDate);

    if (params?.userId) {
      searchParams.append('UserId', params.userId);
    }

    const queryString = searchParams.toString();
    const url = `/Payment/history${queryString ? `?${queryString}` : ''}`;
    console.log('[getPaymentHistory] Fetching:', url);

    const response = await httpClient.get<unknown>(url);
    console.log('[getPaymentHistory] Raw API response:', response);

    let rawItems: unknown[] = [];
    if (Array.isArray(response)) {
      rawItems = response;
    } else if (response && typeof response === 'object') {
      const obj = response as Record<string, unknown>;
      if (Array.isArray(obj.data)) {
        rawItems = obj.data;
      } else if (Array.isArray(obj.items)) {
        rawItems = obj.items;
      } else if (Array.isArray(obj.result)) {
        rawItems = obj.result;
      } else if (obj.data && typeof obj.data === 'object') {
        const inner = obj.data as Record<string, unknown>;
        if (Array.isArray(inner.data)) {
          rawItems = inner.data;
        } else if (Array.isArray(inner.items)) {
          rawItems = inner.items;
        }
      }
    }

    console.log('[getPaymentHistory] Raw items received from /Payment/history:', rawItems);

    const items: PaymentHistoryItemDto[] = rawItems.map((item) => {
      const it = (item || {}) as Record<string, unknown>;
      const id = it.id ?? it.paymentId ?? it.PaymentId;
      const customerId = it.customerId ?? it.CustomerId;
      const customerName = String(
        it.customerName ?? it.CustomerName ?? it.customerFullName ?? ''
      );
      const amount = Number(it.amount ?? it.Amount ?? 0);
      const paymentDate = String(
        it.paymentDate ?? it.PaymentDate ?? it.date ?? it.Date ?? it.createdAt ?? ''
      );
      const rawMethod =
        it.paymentMethod ??
        it.PaymentMethod ??
        it.paymentMethodName ??
        it.PaymentMethodName ??
        it.paymentType ??
        it.PaymentType ??
        it.paymentMode ??
        it.PaymentMode ??
        it.method ??
        it.Method;

      let paymentMethod: string | number | null = null;
      if (typeof rawMethod === 'number' || typeof rawMethod === 'string') {
        paymentMethod = rawMethod;
      } else if (typeof rawMethod === 'object' && rawMethod !== null) {
        const obj = rawMethod as Record<string, unknown>;
        const val = obj.name ?? obj.Name ?? obj.value ?? obj.id;
        if (typeof val === 'string' || typeof val === 'number') {
          paymentMethod = val;
        }
      }

      const status = String(it.status ?? it.Status ?? 'تم التحقق');
      const receiptNumber = it.receiptNumber ? String(it.receiptNumber) : undefined;
      const receiptImageUrl = (it.receiptImageUrl ??
        it.ReceiptImageUrl ??
        it.receiptImage ??
        null) as string | null;
      const notes = it.notes ? String(it.notes) : null;

      return {
        id: id !== undefined ? String(id) : undefined,
        paymentId: id !== undefined ? String(id) : undefined,
        customerId: customerId !== undefined ? String(customerId) : undefined,
        customerName,
        amount,
        paymentDate,
        date: paymentDate,
        paymentMethod,
        status,
        receiptNumber,
        receiptImageUrl,
        notes,
      };
    });

    // Enrich items with true paymentMethod from customer profile transactions
    const uniqueCustomerIds = Array.from(
      new Set(items.map((i) => i.customerId).filter(Boolean))
    );

    if (uniqueCustomerIds.length > 0) {
      try {
        const profiles = await Promise.all(
          uniqueCustomerIds.map((cid) => getCustomerProfile(String(cid)).catch(() => null))
        );
        const txMap = new Map<string, string>();
        for (const p of profiles) {
          if (!p || !Array.isArray(p.transactions)) continue;
          for (const tx of p.transactions) {
            if (tx.paymentMethod) {
              if (tx.id) txMap.set(String(tx.id), tx.paymentMethod);
              if (tx.reference) txMap.set(String(tx.reference), tx.paymentMethod);
              txMap.set(`${p.id}_${tx.amount}`, tx.paymentMethod);
            }
          }
        }

        for (const it of items) {
          const matchedMethod =
            (it.paymentId ? txMap.get(String(it.paymentId)) : undefined) ??
            (it.id ? txMap.get(String(it.id)) : undefined) ??
            (it.receiptNumber ? txMap.get(String(it.receiptNumber)) : undefined) ??
            (it.customerId ? txMap.get(`${it.customerId}_${it.amount}`) : undefined);

          if (matchedMethod) {
            it.paymentMethod = matchedMethod;
          }
        }
      } catch (enrichErr) {
        console.warn('[getPaymentHistory] Could not enrich payment methods:', enrichErr);
      }
    }

    const totalAmount = items.reduce(
      (acc, curr) => acc + (Number(curr.amount) || 0),
      0
    );

    return {
      items,
      totalCount: items.length,
      totalAmount,
      fromApi: true,
      status: 200,
      error: null,
    };
  } catch (err: unknown) {
    console.error('[getPaymentHistory] Server error in getPaymentHistory:', err);
    let status = 500;
    let errorMessage = 'حدث خطأ أثناء جلب سجل المدفوعات من الخادم.';

    if (err instanceof ApiError) {
      status = err.status;
      if (err.status === 401) {
        errorMessage = 'يرجى تسجيل الدخول لعرض سجل المدفوعات (401).';
      } else if (err.status === 404) {
        errorMessage = 'لا توجد سجلات مدفوعات حالياً (404).';
      } else if (err.status >= 500) {
        errorMessage = 'خطأ في خادم المدفوعات (500). يرجى المحاولة لاحقاً.';
      } else {
        errorMessage = `تعذر جلب سجل المدفوعات (رمز الخطأ: ${err.status}).`;
      }
    }

    return {
      items: [],
      totalCount: 0,
      totalAmount: 0,
      fromApi: false,
      status,
      error: errorMessage,
    };
  }
}

