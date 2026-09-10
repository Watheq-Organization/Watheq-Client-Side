import { httpClient, ApiError } from '../api/httpClient';
import type {
  SubscriptionPlan,
  SubscriptionPlanDto,
  SubscriptionPlanFeature,
} from '../types/subscription';

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 1,
    name: 'الأساسية',
    badge: 'الأساسية',
    badgeType: 'basic',
    price: 'مجانية',
    rawPrice: 0,
    currency: 'ش.إ',
    description: 'للتجار المبتدئين في تنظيم ومتابعة ديونهم.',
    isPopular: false,
    isCurrent: false,
    maxCustomers: 10,
    maxDebtsPerMonth: 20,
    maxWhatsAppMessages: 0,
    features: [
      { text: 'حتى 10 عملاء', included: true },
      { text: 'توثيق ديون أساسي (20 دين/شهر)', included: true },
      { text: 'تنبيهات واتساب', included: false },
      { text: 'تقارير متقدمة', included: false },
      { text: 'دعم فني عبر البريد', included: true },
    ],
    buttonText: 'ابدأ مجاناً',
    buttonVariant: 'secondary',
  },
  {
    id: 2,
    name: 'المتقدمة',
    badge: 'المتقدمة',
    badgeType: 'advanced',
    price: '99 ش.إ',
    rawPrice: 99,
    currency: 'ش.إ',
    period: '/شهرياً',
    description: 'للمحلات التجارية المتوسطة والنمو السريع.',
    isPopular: true,
    isCurrent: true,
    maxCustomers: 100,
    maxDebtsPerMonth: 300,
    maxWhatsAppMessages: 500,
    features: [
      { text: 'حتى 100 عميل', included: true },
      { text: 'توثيق ديون حتى 300 عملية شهرياً', included: true },
      { text: '500 رسالة وتنبيه واتساب', included: true },
      { text: 'تقارير مالية شهرية متقدمة', included: true },
      { text: 'دعم فني سريع عبر واتساب', included: true },
    ],
    buttonText: 'اشترك الآن',
    buttonVariant: 'featured',
  },
  {
    id: 3,
    name: 'الاحترافية',
    badge: 'الاحترافية',
    badgeType: 'professional',
    price: '899 ش.إ',
    rawPrice: 899,
    currency: 'ش.إ',
    period: '/سنوياً',
    description: 'حلول متكاملة للمؤسسات والشركات الكبيرة.',
    isPopular: false,
    isCurrent: false,
    maxCustomers: 99999,
    maxDebtsPerMonth: 99999,
    maxWhatsAppMessages: 99999,
    features: [
      { text: 'عملاء غير محدودين', included: true },
      { text: 'توثيق ديون غير محدود', included: true },
      { text: 'تنبيهات واتساب غير محدودة', included: true },
      { text: 'تصدير بيانات متقدم (Excel/PDF)', included: true },
      { text: 'مدير حساب مخصص وأولوية في الدعم', included: true },
    ],
    buttonText: 'اشترك الآن',
    buttonVariant: 'outline',
  },
];

/**
 * Normalizes currency symbols to Arabic representation
 */
function formatCurrency(currency?: string | null): string {
  if (!currency) return 'ش.إ';
  const c = currency.trim().toUpperCase();
  if (c === 'ILS' || c === 'NIS' || c === 'شيكل' || c === 'ش.إ') return 'ش.إ';
  if (c === 'SAR' || c === 'ريال' || c === 'ر.س') return 'ر.س';
  if (c === 'USD' || c === '$') return '$';
  if (c === 'JOD' || c === 'د.أ') return 'د.أ';
  return currency;
}

/**
 * Formats duration and billing cycle into human-readable Arabic period
 */
function formatPeriod(dto: SubscriptionPlanDto): string | undefined {
  if (dto.price === 0) return undefined;

  const unit = (dto.durationUnit || dto.billingCycle || '').toLowerCase();
  if (unit.includes('year') || unit.includes('سنة') || unit.includes('سنوي')) {
    return '/سنوياً';
  }
  if (unit.includes('day') || unit.includes('يوم')) {
    return '/يومياً';
  }
  return '/شهرياً';
}

/**
 * Maps raw DTO from http://whateq.runasp.net/api/Subscription/plans
 * into frontend SubscriptionPlan model
 */
export function mapSubscriptionPlanDtoToPlan(
  dto: SubscriptionPlanDto,
  index: number,
  totalCount: number
): SubscriptionPlan {
  const isFree = dto.price === 0;
  const currencySymbol = formatCurrency(dto.currency);
  const formattedPrice = isFree ? 'مجانية' : `${dto.price} ${currencySymbol}`;
  const period = formatPeriod(dto);

  // Derive badge & tier type based on index or price
  let badgeType: 'basic' | 'advanced' | 'professional' = 'basic';
  if (isFree || index === 0) {
    badgeType = 'basic';
  } else if (index === totalCount - 1 && totalCount > 2) {
    badgeType = 'professional';
  } else {
    badgeType = 'advanced';
  }

  const isPopular = totalCount > 1 ? index === 1 || badgeType === 'advanced' : false;

  // Build feature list from limits and features array
  const features: SubscriptionPlanFeature[] = [];

  // 1. Customers limit
  if (dto.maxCustomers !== undefined && dto.maxCustomers !== null) {
    if (dto.maxCustomers <= 0 || dto.maxCustomers >= 99999) {
      features.push({ text: 'عملاء غير محدودين', included: true });
    } else {
      features.push({ text: `حتى ${dto.maxCustomers} عميل`, included: true });
    }
  }

  // 2. Debts per month
  if (dto.maxDebtsPerMonth !== undefined && dto.maxDebtsPerMonth !== null) {
    if (dto.maxDebtsPerMonth <= 0 || dto.maxDebtsPerMonth >= 99999) {
      features.push({ text: 'توثيق ديون غير محدود', included: true });
    } else {
      features.push({
        text: `حتى ${dto.maxDebtsPerMonth} دين شهرياً`,
        included: true,
      });
    }
  }

  // 3. WhatsApp messages
  if (dto.maxWhatsAppMessages !== undefined && dto.maxWhatsAppMessages !== null) {
    if (dto.maxWhatsAppMessages <= 0) {
      features.push({ text: 'تنبيهات واتساب', included: false });
    } else if (dto.maxWhatsAppMessages >= 99999) {
      features.push({ text: 'تنبيهات واتساب غير محدودة', included: true });
    } else {
      features.push({
        text: `${dto.maxWhatsAppMessages} رسالة وتنبيه واتساب`,
        included: true,
      });
    }
  }

  // 4. Custom features from API
  if (Array.isArray(dto.features)) {
    dto.features.forEach((feat) => {
      if (typeof feat === 'string' && feat.trim()) {
        features.push({ text: feat.trim(), included: true });
      }
    });
  }

  // If no features were produced, supply good defaults based on tier
  if (features.length === 0) {
    if (isFree) {
      features.push(
        { text: 'حتى 10 عملاء', included: true },
        { text: 'توثيق ديون أساسي', included: true },
        { text: 'تنبيهات واتساب', included: false },
        { text: 'تقارير متقدمة', included: false }
      );
    } else if (badgeType === 'advanced') {
      features.push(
        { text: 'حتى 100 عميل', included: true },
        { text: 'تنبيهات واتساب آلية', included: true },
        { text: 'تقارير مالية شهرية', included: true },
        { text: 'دعم فني سريع', included: true }
      );
    } else {
      features.push(
        { text: 'عملاء غير محدودين', included: true },
        { text: 'تنبيهات واتساب غير محدودة', included: true },
        { text: 'تصدير بيانات متقدم (Excel/PDF)', included: true },
        { text: 'مدير حساب مخصص', included: true }
      );
    }
  }

  // Description
  let description = '';
  if (isFree) {
    description = 'للتجار المبتدئين في تنظيم ومتابعة ديونهم.';
  } else if (badgeType === 'advanced') {
    description = 'للمحلات التجارية المتوسطة والنمو السريع.';
  } else {
    description = 'حلول متكاملة للمؤسسات والشركات الكبيرة.';
  }

  // Button config
  let buttonText = 'اشترك الآن';
  let buttonVariant: 'outline' | 'featured' | 'secondary' = 'featured';

  if (dto.isCurrent) {
    buttonText = 'باقتك الحالية';
    buttonVariant = isPopular ? 'featured' : 'outline';
  } else if (isFree) {
    buttonText = 'ابدأ مجاناً';
    buttonVariant = 'secondary';
  } else if (isPopular) {
    buttonText = 'اشترك الآن';
    buttonVariant = 'featured';
  } else {
    buttonText = 'اشترك الآن';
    buttonVariant = 'outline';
  }

  return {
    id: dto.id,
    name: dto.name || `خطة ${index + 1}`,
    badge: dto.name || 'خطة',
    badgeType,
    price: formattedPrice,
    rawPrice: dto.price,
    currency: currencySymbol,
    period,
    description,
    isPopular,
    isCurrent: Boolean(dto.isCurrent),
    features,
    maxCustomers: dto.maxCustomers,
    maxDebtsPerMonth: dto.maxDebtsPerMonth,
    maxWhatsAppMessages: dto.maxWhatsAppMessages,
    buttonText,
    buttonVariant,
  };
}

/**
 * Extracts array from various API response shapes
 */
function extractSubscriptionPlanDtos(response: unknown): SubscriptionPlanDto[] {
  if (Array.isArray(response)) {
    return response as SubscriptionPlanDto[];
  }
  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      return obj.data as SubscriptionPlanDto[];
    }
    if (
      obj.data &&
      typeof obj.data === 'object' &&
      Array.isArray((obj.data as Record<string, unknown>).data)
    ) {
      return (obj.data as Record<string, unknown>).data as SubscriptionPlanDto[];
    }
    if (Array.isArray(obj.result)) {
      return obj.result as SubscriptionPlanDto[];
    }
  }
  return [];
}

export interface SubscriptionPlansResult {
  plans: SubscriptionPlan[];
  fromApi: boolean;
  status: number;
  error?: string | null;
}

/**
 * GET http://whateq.runasp.net/api/Subscription/plans
 *
 * Fetches all available subscription plans from the backend.
 * Returns empty plans array and real HTTP status (e.g. 404) if not found or failed.
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlansResult> {
  try {
    const response = await httpClient.get<unknown>('/Subscription/plans');
    const dtos = extractSubscriptionPlanDtos(response);

    if (dtos.length > 0) {
      const plans = dtos.map((dto, idx) =>
        mapSubscriptionPlanDtoToPlan(dto, idx, dtos.length)
      );
      return { plans, fromApi: true, status: 200, error: null };
    }

    return {
      plans: [],
      fromApi: true,
      status: 200,
      error: 'لا توجد باقات اشتراك مسجلة في النظام حالياً.',
    };
  } catch (err: unknown) {
    let status = 500;
    let errorMessage = 'حدث خطأ أثناء جلب باقات الاشتراك من الخادم.';

    if (err instanceof ApiError) {
      status = err.status;
      if (err.status === 404) {
        errorMessage = 'لا توجد باقات اشتراك متاحة حالياً على الخادم (404 Not Found).';
      } else if (err.status === 401) {
        errorMessage = 'يرجى تسجيل الدخول لعرض باقات الاشتراك (401 Unauthorized).';
      } else if (err.status >= 500) {
        errorMessage = 'خطأ في خادم الاشتراكات (500 Server Error). يرجى المحاولة لاحقاً.';
      } else {
        errorMessage = `تعذر جلب الباقات (رمز الخطأ: ${err.status}).`;
      }
    }

    return {
      plans: [],
      fromApi: false,
      status,
      error: errorMessage,
    };
  }
}
