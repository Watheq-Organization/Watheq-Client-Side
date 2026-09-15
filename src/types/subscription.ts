export interface SubscriptionPlanDto {
  id: number;
  name: string;
  price: number;
  currency?: string | null;
  duration?: number;
  durationUnit?: string | null;
  billingCycle?: string | null;
  isCurrent?: boolean;
  features?: string[] | null;
  maxCustomers?: number;
  maxDebtsPerMonth?: number;
  maxWhatsAppMessages?: number;
}

export interface SubscriptionPlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: number | string;
  name: string;
  badge: string;
  badgeType: 'basic' | 'advanced' | 'professional';
  price: string;
  rawPrice: number;
  currency: string;
  period?: string;
  description: string;
  isPopular?: boolean;
  isCurrent?: boolean;
  features: SubscriptionPlanFeature[];
  maxCustomers?: number;
  maxDebtsPerMonth?: number;
  maxWhatsAppMessages?: number;
  buttonText: string;
  buttonVariant: 'outline' | 'featured' | 'secondary';
}

export interface SubscriptionPlansApiResponse {
  result?: {
    code?: string | number;
    message?: string;
  };
  data?: SubscriptionPlanDto[];
  testSchema?: unknown;
}

/**
 * Request payload for POST /api/Subscription/checkout
 */
export interface CreateCheckoutRequest {
  planId: number;
  successUrl?: string | null;
  cancelUrl?: string | null;
}

/**
 * Checkout session data returned by the backend
 */
export interface CheckoutSessionDto {
  sessionId?: string | null;
  checkoutUrl?: string | null;
  subscriptionId?: number;
  planId?: number;
  amount?: number;
}

/**
 * Full backend response structure for POST /api/Subscription/checkout
 */
export interface CheckoutSessionResponseResult {
  result?: {
    code?: string | number;
    message?: string;
  };
  data?: CheckoutSessionDto | null;
  testSchema?: unknown;
}

/**
 * Normalized result object used by UI layers
 */
export interface CreateCheckoutResult {
  success: boolean;
  data?: CheckoutSessionDto | null;
  checkoutUrl?: string | null;
  status: number;
  error?: string | null;
}
