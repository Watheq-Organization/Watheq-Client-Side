import { httpClient, ApiError } from '../api/httpClient';
import type { AddCustomerPayload, Customer, CustomerDto, UpdateCustomerPayload } from '../types/customer';

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'أحمد عبدالله الراجحي',
    type: 'individual',
    typeLabel: 'عميل أفراد',
    nationalOrCrId: '1029384756',
    totalDebt: 45000,
    totalPaid: 15000,
    status: 'overdue',
    statusLabel: 'متأخر',
    avatarLetter: 'أ',
    avatarBg: 'bg-rose-100 text-rose-600',
    phone: '0501234567',
    email: 'ahmed.rajhi@example.com',
    address: 'الرياض - حي الياسمين',
    registrationDate: '2024-01-15',
    transactions: [
      {
        id: 'tx-101',
        date: '2024-08-10',
        type: 'debt',
        typeLabel: 'فاتورة مبيعات آجل',
        amount: 30000,
        status: 'overdue',
        statusLabel: 'متأخر',
        invoiceNumber: 'INV-2024-001',
        notes: 'دفعة مستحقة منذ 15 يوماً',
      },
      {
        id: 'tx-102',
        date: '2024-07-20',
        type: 'debt',
        typeLabel: 'فاتورة خدمات إضافية',
        amount: 15000,
        status: 'overdue',
        statusLabel: 'متأخر',
        invoiceNumber: 'INV-2024-002',
        notes: 'استحقاق السداد نهاية الشهر الماضي',
      },
      {
        id: 'tx-103',
        date: '2024-06-05',
        type: 'payment',
        typeLabel: 'سداد نقدي / حوالة',
        amount: 15000,
        status: 'completed',
        statusLabel: 'مكتمل',
        invoiceNumber: 'PAY-2024-099',
        notes: 'سداد عن طريق تحويل بنكي',
      },
    ],
  },
  {
    id: '2',
    name: 'شركة التقنية المتقدمة',
    type: 'company',
    typeLabel: 'عميل شركات',
    nationalOrCrId: '7001234567',
    totalDebt: 120500,
    totalPaid: 80000,
    status: 'active_debt',
    statusLabel: 'دين نشط',
    avatarLetter: 'ش',
    avatarBg: 'bg-indigo-100 text-indigo-600',
    phone: '0559876543',
    email: 'finance@advtech.sa',
    address: 'جدة - طريق الملك عبدالعزيز',
    registrationDate: '2023-11-20',
    transactions: [
      {
        id: 'tx-201',
        date: '2024-08-18',
        type: 'debt',
        typeLabel: 'عقد توريد أجهزة',
        amount: 120500,
        status: 'pending',
        statusLabel: 'قيد الاستحقاق',
        invoiceNumber: 'INV-2024-045',
        notes: 'مستحق السداد خلال 30 يوم',
      },
      {
        id: 'tx-202',
        date: '2024-05-12',
        type: 'payment',
        typeLabel: 'سداد دفعة عقد',
        amount: 80000,
        status: 'completed',
        statusLabel: 'مكتمل',
        invoiceNumber: 'PAY-2024-032',
        notes: 'تم سداد الدفعة الأولى',
      },
    ],
  },
  {
    id: '3',
    name: 'سالم محمد الدوسري',
    type: 'individual',
    typeLabel: 'عميل أفراد',
    nationalOrCrId: '1098765432',
    totalDebt: 0,
    totalPaid: 45000,
    status: 'paid',
    statusLabel: 'تم السداد',
    avatarLetter: 'س',
    avatarBg: 'bg-emerald-100 text-emerald-600',
    phone: '0543219876',
    email: 'salem.aldossari@example.com',
    address: 'الدمام - حي الشاطئ',
    registrationDate: '2024-02-10',
    transactions: [
      {
        id: 'tx-301',
        date: '2024-06-15',
        type: 'payment',
        typeLabel: 'سداد كامل الرصيد',
        amount: 45000,
        status: 'completed',
        statusLabel: 'مكتمل',
        invoiceNumber: 'PAY-2024-077',
        notes: 'تم تصفية الحساب بالكامل',
      },
    ],
  },
  {
    id: '4',
    name: 'مؤسسة البناء الحديث',
    type: 'company',
    typeLabel: 'عميل شركات',
    nationalOrCrId: '7009876543',
    totalDebt: 15750,
    totalPaid: 60000,
    status: 'active_debt',
    statusLabel: 'دين نشط',
    avatarLetter: 'م',
    avatarBg: 'bg-blue-100 text-blue-600',
    phone: '0567891234',
    email: 'contact@modernbuild.sa',
    address: 'الرياض - حي الملز',
    registrationDate: '2023-09-05',
    transactions: [
      {
        id: 'tx-401',
        date: '2024-08-01',
        type: 'debt',
        typeLabel: 'مواد بناء وتجهيزات',
        amount: 15750,
        status: 'pending',
        statusLabel: 'قيد الاستحقاق',
        invoiceNumber: 'INV-2024-112',
        notes: 'الدفعة الأخيرة للعقد',
      },
    ],
  },
];

export function getCustomerById(id: string): Customer | undefined {
  return MOCK_CUSTOMERS.find((c) => c.id === id);
}

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
 * The doc's sample response shows numeric `id`/`phoneNumber` values and a
 * nullable `address`, while `CustomerDto` declares them as strings. Rather
 * than loosening the shared type (and risking silent bugs elsewhere), the
 * raw JSON is normalized to the declared contract at this one boundary.
 */
function normalizeCustomerDto(raw: unknown): CustomerDto {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    fullName: typeof r.fullName === 'string' ? r.fullName : '',
    phoneNumber: r.phoneNumber != null ? String(r.phoneNumber) : '',
    address: typeof r.address === 'string' ? r.address : '',
    totalDebt: Number(r.totalDebt) || 0,
    totalPaid: Number(r.totalPaid) || 0,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : '',
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
 * PUT http://whateq.runasp.net/api/Customer/updateCustomer/{customerId}
 *
 * Updates a customer's name, phone, and address. `customerId` is sent in
 * the URL only (never the body). The backend derives UserId from the JWT
 * (attached automatically by httpClient), and does not accept
 * BusinessId/totalDebt/totalPaid/createdAt in this request — only
 * fullName/phoneNumber/address are sent, per the confirmed API contract.
 */
export async function updateCustomer(
  customerId: string,
  payload: UpdateCustomerPayload
): Promise<CustomerDto> {
  return httpClient.put<CustomerDto>(`/Customer/updateCustomer/${customerId}`, payload);
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
  const body: AddCustomerPayload = {
    fullName: payload.fullName,
    phoneNumber: payload.phoneNumber,
    ...(payload.address ? { address: payload.address } : {}),
  };
  return httpClient.post<CustomerDto>('/customer/addCustomer', body);
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
 * Maps the real backend Customer DTO (returned by addCustomer) to the
 * app's local UI model. The DTO only carries a subset of the fields the
 * table/details UI displays (no `type`/`nationalOrCrId`, since the backend
 * doesn't have them), so those are given sane defaults rather than
 * fabricated data.
 */
export function mapCustomerDtoToCustomer(dto: CustomerDto): Customer {
  const hasDebt = dto.totalDebt > 0;
  return {
    id: dto.id,
    name: dto.fullName,
    type: 'individual',
    typeLabel: 'عميل أفراد',
    nationalOrCrId: '',
    totalDebt: dto.totalDebt,
    totalPaid: dto.totalPaid,
    status: hasDebt ? 'active_debt' : 'paid',
    statusLabel: hasDebt ? 'دين نشط' : 'تم السداد',
    avatarLetter: dto.fullName.trim().charAt(0) || 'ع',
    avatarBg: 'bg-rose-100 text-rose-600',
    phone: dto.phoneNumber,
    address: dto.address,
    registrationDate: dto.createdAt,
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
