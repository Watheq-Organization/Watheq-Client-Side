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
  DASHBOARD: '/dashboard',
} as const;
