import { httpClient, ApiError } from '../api/httpClient';
import type {
  AddCustomerPayload,
  Customer,
  CustomerDto,
  CustomerProfileDto,
  CustomerProfileTransactionDto,
  CustomerStatus,
  UpdateCustomerPayload,
} from '../types/customer';

/**
 * GET http://whateq.runasp.net/api/customer/getCustomers
 *
 * Fetches every customer belonging to the current merchant. No UserId or
 * BusinessId is sent — the backend derives the current user from the JWT
 * (attached automatically by httpClient), per the confirmed API contract.
 *
 * The doc notes the array may come back wrapped in a HandleResult/CommandResult
 * envelope (e.g. `response.data`) instead of as a bare array, so the response
 * shape is sniffed defensively rather than assumed.
 */
export async function getCustomers(): Promise<CustomerDto[]> {
  const response = await httpClient.get<unknown>('/customer/getCustomers');
  return extractCustomerDtoList(response).map(normalizeCustomerDto);
}

function extractCustomerDtoList(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data;
    if (obj.data && typeof obj.data === 'object' && Array.isArray((obj.data as Record<string, unknown>).data)) {
      return (obj.data as Record<string, unknown>).data as unknown[];
    }
    if (Array.isArray(obj.result)) return obj.result;
  }
  return [];
}

/**
 * Single-object counterpart to extractCustomerDtoList above, for endpoints
 * that return one customer (addCustomer / updateCustomer) instead of a
 * list. Unwraps the same possible ApiResponse-style envelopes
 * (`{ data: {...} }` / `{ result: {...} }`) before falling back to
 * treating the response itself as the DTO.
 *
 * This was the actual cause of the "add customer succeeds, then the page
 * goes blank" bug: addCustomer/updateCustomer used to hand the raw
 * response straight to mapCustomerDtoToCustomer without this unwrap step.
 * If the backend ever wraps that response in one of these envelopes,
 * `dto.fullName` is undefined, and `dto.fullName.trim()` inside
 * mapCustomerDtoToCustomer throws — uncaught, that crashes the whole React
 * tree to a blank screen (there's no error boundary), which a refresh
 * "fixes" only because it remounts fresh and re-fetches via the already-
 * normalized getCustomers(). Normalizing here the same way closes that gap
 * without changing anything for the (also valid) case where the backend
 * already returns a bare object.
 */
function extractCustomerDtoObject(response: unknown): unknown {
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    const obj = response as Record<string, unknown>;
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      return obj.data;
    }
    if (obj.result && typeof obj.result === 'object' && !Array.isArray(obj.result)) {
      return obj.result;
    }
  }
  return response;
}

/**
 * The doc's sample response shows numeric `id`/`phoneNumber` values and a
 * nullable `address`, while `CustomerDto` declares them as strings. Rather
 * than loosening the shared type (and risking silent bugs elsewhere), the
 * raw JSON is normalized to the declared contract at this one boundary.
 */
export function getStoredNationalId(customerId: string): string {
  if (!customerId || typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(`customer-national-id:${customerId}`) ?? '';
  } catch {
    return '';
  }
}

export function setStoredNationalId(customerId: string, value: string): void {
  if (!customerId || typeof window === 'undefined') return;
  try {
    localStorage.setItem(`customer-national-id:${customerId}`, value);
  } catch {
    // Ignore storage failures
  }
}

function normalizeCustomerDto(raw: unknown): CustomerDto {
  const r = (raw ?? {}) as Record<string, unknown>;

  const totalDebt = Number(
    r.totalDebt ??
    r.TotalDebt ??
    r.currentBalance ??
    r.CurrentBalance ??
    r.debt ??
    r.Debt ??
    r.totalDebts ??
    r.TotalDebts ??
    0
  ) || 0;

  const totalPaid = Number(
    r.totalPaid ??
    r.TotalPaid ??
    r.paid ??
    r.Paid ??
    r.totalPayments ??
    r.TotalPayments ??
    0
  ) || 0;

  const currentBalance = Number(
    r.currentBalance ??
    r.CurrentBalance ??
    totalDebt
  ) || 0;

  const nationalId = (r.nationalId ?? r.NationalId ?? r.nationalOrCrId ?? r.NationalOrCrId) != null
    ? String(r.nationalId ?? r.NationalId ?? r.nationalOrCrId ?? r.NationalOrCrId).trim()
    : '';

  const rawStatus = String(r.status ?? r.Status ?? r.accountStatus ?? r.AccountStatus ?? '').trim();

  return {
    id: String(r.id ?? r.customerId ?? r.Id ?? r.CustomerId ?? ''),
    fullName: typeof (r.fullName ?? r.FullName ?? r.name ?? r.Name) === 'string'
      ? String(r.fullName ?? r.FullName ?? r.name ?? r.Name)
      : '',
    phoneNumber: (r.phoneNumber ?? r.PhoneNumber ?? r.phone ?? r.Phone) != null
      ? String(r.phoneNumber ?? r.PhoneNumber ?? r.phone ?? r.Phone)
      : '',
    address: typeof (r.address ?? r.Address) === 'string'
      ? String(r.address ?? r.Address)
      : '',
    nationalId,
    totalDebt,
    totalPaid,
    currentBalance,
    status: rawStatus,
    createdAt: typeof (r.createdAt ?? r.CreatedAt) === 'string'
      ? String(r.createdAt ?? r.CreatedAt)
      : '',
  };
}

/** Maps getCustomers errors to user-friendly Arabic messages (section 11 of the API doc). */
export function toGetCustomersErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
    if (error.status === 401) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.';
    }
    return 'تعذر جلب قائمة العملاء. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}


/**
 * GET http://whateq.runasp.net/api/Customer/getCustomerProfile/{customerId}
 *
 * Fetches the full profile of a single customer for the authenticated
 * merchant: basic info, current balance, total debt/paid, and the complete
 * transaction history (newest-first, each with a running balance). Per the
 * confirmed API contract, `customerId` is sent as a route parameter only
 * (never in the body or as a query parameter), and the backend derives the
 * UserId from the JWT (attached automatically by httpClient) — the
 * frontend does not send userId.
 */
export async function getCustomerProfile(customerId: string): Promise<CustomerProfileDto> {
  const response = await httpClient.get<unknown>(`/Customer/getCustomerProfile/${customerId}`);
  // Same envelope-unwrap as extractCustomerDtoObject (used by addCustomer/
  // updateCustomer above): if the backend wraps this response in
  // `{ data: {...} }` / `{ result: {...} }`, normalizing the raw envelope
  // directly (as this used to do) makes every field read as empty/0, so the
  // screen falls back to its placeholder text instead of the real
  // customer's data. Unwrapping first fixes that.
  return normalizeCustomerProfileDto(extractCustomerDtoObject(response));
}

/**
 * The doc's sample response shows a numeric `id`, while the rest of this
 * codebase treats customer ids as strings (see `normalizeCustomerDto`
 * above) — normalized the same way at this boundary for consistency.
 */
function normalizeCustomerProfileDto(raw: unknown): CustomerProfileDto {
  const r = (raw ?? {}) as Record<string, unknown>;
  const rawTransactions = Array.isArray(r.transactions) ? r.transactions : [];
  return {
    id: String(r.id ?? r.customerId ?? ''),
    fullName: typeof r.fullName === 'string' ? r.fullName : '',
    phoneNumber: r.phoneNumber != null ? String(r.phoneNumber) : '',
    address: typeof r.address === 'string' ? r.address : '',
    currentBalance: Number(r.currentBalance) || 0,
    totalDebt: Number(r.totalDebt) || 0,
    totalPaid: Number(r.totalPaid) || 0,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : '',
    transactions: rawTransactions.map(normalizeCustomerProfileTransaction),
  };
}

function normalizeCustomerProfileTransaction(raw: unknown): CustomerProfileTransactionDto {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    type: typeof r.type === 'string' ? r.type : '',
    date: typeof r.date === 'string' ? r.date : '',
    amount: Number(r.amount) || 0,
    description: typeof r.description === 'string' ? r.description : '',
    reference: typeof r.reference === 'string' ? r.reference : '',
    balance: Number(r.balance) || 0,
    currencyCode: typeof r.currencyCode === 'string' ? r.currencyCode : '',
    status: typeof r.status === 'string' ? r.status : null,
    paymentMethod: typeof r.paymentMethod === 'string' ? r.paymentMethod : null,
  };
}

/**
 * Maps the real CustomerProfileDto to the app's local UI model (Customer).
 * Mirrors `mapCustomerDtoToCustomer` below: the profile doesn't carry
 * `type`/`nationalOrCrId` either (the backend has no such fields), so
 * those get the same sane defaults rather than fabricated data. Status is
 * derived from `currentBalance` (the true outstanding balance) rather than
 * `totalDebt`, since a customer can have debt transactions that were fully
 * paid off.
 */
export function mapCustomerProfileToCustomer(dto: CustomerProfileDto): Customer {
  const hasOutstandingBalance = dto.currentBalance > 0;
  return {
    id: dto.id,
    name: dto.fullName,
    type: 'individual',
    typeLabel: 'عميل أفراد',
    nationalOrCrId: '',
    totalDebt: dto.totalDebt,
    totalPaid: dto.totalPaid,
    status: hasOutstandingBalance ? 'active_debt' : 'paid',
    statusLabel: hasOutstandingBalance ? 'دين نشط' : 'تم السداد',
    avatarLetter: dto.fullName.trim().charAt(0) || 'ع',
    avatarBg: 'bg-rose-100 text-rose-600',
    phone: dto.phoneNumber,
    address: dto.address,
    registrationDate: dto.createdAt,
  };
}

/** Maps getCustomerProfile errors to user-friendly Arabic messages. */
export function toGetCustomerProfileErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
    if (error.status === 400) {
      return 'معرّف العميل غير صالح.';
    }
    if (error.status === 401) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
    }
    if (error.status === 404) {
      return 'تعذر العثور على بيانات هذا العميل.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.';
    }
    return 'تعذر جلب بيانات العميل. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

/**
 * PUT http://whateq.runasp.net/api/Customer/updateCustomer/{customerId}
 *
 * Updates a customer's name, phone, and address. `customerId` is sent in
 * the URL only (never the body). The backend derives UserId from the JWT
 * (attached automatically by httpClient), and does not accept
 * BusinessId/totalDebt/totalPaid/createdAt in this request — only
 * fullName/phoneNumber/address are sent, per the confirmed API contract.
 */
export async function updateCustomer(
  customerId: string | number,
  payload: UpdateCustomerPayload
): Promise<CustomerDto> {
  const body: Record<string, unknown> = {
    fullName: payload.fullName.trim(),
    phoneNumber: payload.phoneNumber.trim(),
    address: payload.address && payload.address.trim() ? payload.address.trim() : null,
  };
  if (payload.nationalId !== undefined && payload.nationalId !== null) {
    body.nationalId = payload.nationalId.trim() || null;
  }
  const response = await httpClient.put<unknown>(`/Customer/updateCustomer/${customerId}`, body);
  return normalizeCustomerDto(extractCustomerDtoObject(response));
}

/**
 * POST http://whateq.runasp.net/api/customer/addCustomer
 *
 * Creates a new customer under the current merchant's business. Only
 * fullName/phoneNumber/address are sent — the backend derives the
 * UserId/BusinessId from the JWT (attached automatically by httpClient)
 * and assigns TotalDebt/TotalPaid/CreatedAt itself, per the confirmed API
 * contract. `address` is omitted from the request body entirely when not
 * provided, matching the documented "or don't send the field at all" case.
 */
export async function addCustomer(payload: AddCustomerPayload): Promise<CustomerDto> {
  const body: Record<string, unknown> = {
    fullName: payload.fullName.trim(),
    nationalId: payload.nationalId?.trim() || null,
    phoneNumber: payload.phoneNumber?.trim() || null,
    initialDebt:
      payload.initialDebt !== undefined && payload.initialDebt !== null && !isNaN(Number(payload.initialDebt))
        ? Number(payload.initialDebt)
        : null,
    address: payload.address?.trim() || null,
  };
  const response = await httpClient.post<unknown>('/Customer/addCustomer', body);
  return normalizeCustomerDto(extractCustomerDtoObject(response));
}

/**
 * DELETE http://whateq.runasp.net/api/customer/deleteCustomer/{customerId}
 *
 * Deletes a customer belonging to the current merchant. `customerId` is
 * sent as a route parameter only — no request body. The backend verifies
 * the current user and the customer's business before deleting, per the
 * confirmed API contract.
 */
export async function deleteCustomer(customerId: string): Promise<void> {
  await httpClient.delete<unknown>(`/customer/deleteCustomer/${customerId}`);
}

/** Maps deleteCustomer errors to user-friendly Arabic messages. */
export function toDeleteCustomerErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
    if (error.status === 401) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
    }
    if (error.status === 403) {
      return 'لا تملك صلاحية حذف هذا العميل.';
    }
    if (error.status === 404) {
      return 'تعذر العثور على بيانات هذا العميل.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.';
    }
    return 'تعذر حذف العميل. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

/**
 * Client-side mirror of the backend's fullName rules (section 6 of the API
 * doc), so the Add/Edit Customer forms can show inline errors before
 * hitting the network. Returns an Arabic error message, or null when valid.
 */
export function validateCustomerFullName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'اسم العميل مطلوب.';
  if (trimmed.length < 2) return 'اسم العميل يجب ألا يقل عن حرفين.';
  if (trimmed.length > 150) return 'اسم العميل طويل جداً (الحد الأقصى 150 حرفاً).';
  return null;
}

/**
 * Client-side mirror of the backend's phoneNumber rules (section 7 of the
 * API doc): optional leading '+', 8–15 digits, max 20 characters overall.
 */
export function validateCustomerPhoneNumber(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'رقم الجوال مطلوب.';
  if (trimmed.length > 20) return 'رقم الجوال طويل جداً (الحد الأقصى 20 حرفاً).';
  if (!/^\+?[0-9]{8,15}$/.test(trimmed)) return 'صيغة رقم الجوال غير صحيحة.';
  return null;
}

/** Client-side mirror of the backend's address rule (section 8): optional, up to 300 characters. */
export function validateCustomerAddress(value: string): string | null {
  if (value.trim().length > 300) return 'العنوان طويل جداً (الحد الأقصى 300 حرف).';
  return null;
}

/**
 * Validation for national ID or Commercial Registration (CR): 10 digits.
 */
export function validateCustomerNationalId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'رقم الهوية الوطنية / السجل التجاري مطلوب.';
  if (!/^\d{10}$/.test(trimmed)) {
    return 'رقم الهوية أو السجل التجاري يجب أن يتكون من 10 أرقام.';
  }
  return null;
}

/**
 * Validation for optional initial debt balance.
 */
export function validateCustomerInitialDebt(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (isNaN(num) || num < 0) {
    return 'يرجى إدخال مبلغ صحيح لرصيد المديونية.';
  }
  return null;
}

/**
 * Maps the real backend Customer DTO (returned by addCustomer) to the
 * app's local UI model. The DTO only carries a subset of the fields the
 * table/details UI displays (no `type`/`nationalOrCrId`, since the backend
 * doesn't have them), so those are given sane defaults rather than
 * fabricated data.
 */
export function mapCustomerDtoToCustomer(dto: CustomerDto, index?: number): Customer {
  const safeFullName = (dto?.fullName ?? '').trim();
  const totalDebt = Number(dto?.totalDebt) || 0;
  const totalPaid = Number(dto?.totalPaid) || 0;
  const hasDebt = totalDebt > 0 || (Number(dto?.currentBalance) || 0) > 0;
  const rawId = dto?.id != null ? String(dto.id) : '';

  // Format sequential ID as fallback
  const sequentialId = index !== undefined
    ? String(index + 1).padStart(4, '0')
    : '0001';

  // Use real nationalId from backend, or locally stored ID, or fallback sequential ID
  const displayNationalId = (dto.nationalId && dto.nationalId.trim())
    ? dto.nationalId.trim()
    : (getStoredNationalId(rawId) || sequentialId);

  // Derive status from backend dto if provided, otherwise derive from hasDebt
  let status: CustomerStatus = hasDebt ? 'active_debt' : 'paid';
  let statusLabel = hasDebt ? 'دين نشط' : 'تم السداد';

  if (dto.status) {
    const s = dto.status.toLowerCase();
    if (s.includes('overdue') || s.includes('متأخر') || s === '2') {
      status = 'overdue';
      statusLabel = 'متأخر';
    } else if (s.includes('active') || s.includes('نشط') || s === '1') {
      status = 'active_debt';
      statusLabel = 'دين نشط';
    } else if (s.includes('paid') || s.includes('سداد') || s === '0') {
      status = 'paid';
      statusLabel = 'تم السداد';
    }
  }

  return {
    id: rawId || String(Date.now()),
    name: safeFullName || 'عميل بدون اسم',
    type: 'individual',
    typeLabel: 'عميل أفراد',
    nationalOrCrId: displayNationalId,
    totalDebt: totalDebt,
    totalPaid: totalPaid,
    status: status,
    statusLabel: statusLabel,
    avatarLetter: safeFullName.charAt(0) || 'ع',
    avatarBg: 'bg-rose-100 text-rose-600',
    phone: dto?.phoneNumber != null ? String(dto.phoneNumber) : '',
    address: dto?.address != null ? String(dto.address) : '',
    registrationDate: dto?.createdAt ? String(dto.createdAt) : new Date().toISOString(),
  };
}

/** True when the backend rejected the update because the phone number is already used by another customer. */
export function isDuplicatePhoneNumberError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  const body = error.body as { message?: unknown } | string | null;
  const message =
    typeof body === 'object' && body !== null && typeof body.message === 'string'
      ? body.message
      : typeof body === 'string'
        ? body
        : '';
  return message.includes('A customer with this phone number already exists');
}

/** Maps updateCustomer errors to user-friendly Arabic messages. */
export function toUpdateCustomerErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
    if (error.status === 408 || error.message === 'TIMEOUT') {
      return 'استغرقت الاستجابة وقتاً طويلاً من الخادم. يرجى المحاولة مرة أخرى.';
    }
    if (isDuplicatePhoneNumberError(error)) {
      return 'يوجد عميل آخر مسجل بنفس رقم الجوال.';
    }
    if (error.status === 400) {
      return 'يرجى التحقق من البيانات المدخلة والمحاولة مرة أخرى.';
    }
    if (error.status === 401) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
    }
    if (error.status === 404) {
      return 'تعذر العثور على بيانات هذا العميل.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.';
    }
    return 'تعذر حفظ التعديلات. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

/** Maps addCustomer errors to user-friendly Arabic messages (section 18 of the API doc). */
export function toAddCustomerErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
    if (isDuplicatePhoneNumberError(error)) {
      return 'يوجد عميل آخر مسجل بنفس رقم الجوال.';
    }
    if (error.status === 400) {
      return 'يرجى التحقق من البيانات المدخلة والمحاولة مرة أخرى.';
    }
    if (error.status === 401) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
    }
    if (error.status === 404) {
      return 'لا يوجد نشاط تجاري مرتبط بحسابك. يرجى التواصل مع الدعم.';
    }
    if (error.status >= 500) {
      return 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.';
    }
    return 'تعذر إضافة العميل. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}
