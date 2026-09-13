/**
 * Route paths for the app. Only routes that actually have a page in this
 * project are defined here — per project instructions, we do not invent
 * routes (like /dashboard) that don't exist yet.
 */
export const PATHS = {
  HOME: '/',
  SPLASH: '/splash',
  REGISTER: '/register',
  LOGIN: '/login',
  VERIFY_OTP: '/verify-otp',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_RESET_OTP: '/verify-reset-otp',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  CUSTOMERS: '/customers',
  CUSTOMER_DETAILS: '/customers/:id',
  NEW_PAYMENT: '/customers/:id/payments/new',
  DEBT_NEW: '/add-debt',
  DEBT_INVOICE: '/debts/:id/invoice',
  SETTINGS: '/settings',
  SUBSCRIPTIONS: '/subscriptions',
  REPORTS: '/reports',
  COLLECTIONS_REPORT: '/reports/collections',
  OVERDUE_DEBTS_REPORT: '/reports/overdue-debts',
  PAYMENTS: '/payments',
  PAYMENT_RECEIPT: '/payments/:id/receipt',
  ABOUT: '/about',
  HELP: '/help',
  CONTACT: '/contact-us',
  PRIVACY_POLICY: '/privacy-policy',
  LOGOUT: '/logout',
  TERMS: '/terms',
} as const;



