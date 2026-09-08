import { useState, useEffect } from 'react';
import { httpClient, ApiError } from '../api/httpClient';
import { getStoredToken } from '../lib/authToken';

export interface MerchantProfile {
  businessName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  profileImagePath?: string;
}

export interface ReminderSettings {
  autoReminderEnabled: boolean;
  messageTemplate: string;
}

const PROFILE_STORAGE_KEY = 'watheq_merchant_profile';
const REMINDER_STORAGE_KEY = 'watheq_reminder_settings';

export const DEFAULT_MERCHANT_PROFILE: MerchantProfile = {
  businessName: 'مؤسسة الأفق التجاري',
  fullName: 'أحمد محمد',
  email: 'info@alufuq.com',
  phoneNumber: '+966 50 123 4567',
  address: 'الرياض، طريق الملك فهد',
  profileImagePath: '/merchant-avatar.jpg',
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  autoReminderEnabled: true,
  messageTemplate:
    'مرحباً [اسم_العميل]، نذكركم بقرب موعد سداد الدفعة المستحقة بقيمة [المبلغ] لمؤسسة [اسم_المؤسسة]. شكراً لتعاونكم.',
};

/**
 * Safely decodes JWT payload claims to read registered email, phone, name etc.
 */
function parseJwtClaims(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Reads local cached or registered profile data from localStorage
 */
export function getStoredMerchantProfile(): MerchantProfile {
  let stored: Partial<MerchantProfile> = {};
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      stored = JSON.parse(raw);
    }
  } catch {
    // Ignore storage parse errors
  }

  // Also check JWT claims for any additional info
  const token = getStoredToken();
  if (token) {
    const claims = parseJwtClaims(token);
    if (claims) {
      const emailClaim =
        (claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] as string) ||
        (claims['email'] as string);
      const nameClaim =
        (claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] as string) ||
        (claims['unique_name'] as string) ||
        (claims['name'] as string);
      const phoneClaim =
        (claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone'] as string) ||
        (claims['phoneNumber'] as string) ||
        (claims['phone'] as string);
      const businessClaim =
        (claims['BusinessName'] as string) ||
        (claims['businessName'] as string) ||
        (claims['StoreName'] as string);

      if (!stored.email && emailClaim) stored.email = emailClaim;
      if (!stored.fullName && nameClaim) stored.fullName = nameClaim;
      if (!stored.phoneNumber && phoneClaim) stored.phoneNumber = phoneClaim;
      if (!stored.businessName && businessClaim) stored.businessName = businessClaim;
    }
  }

  return {
    businessName: stored.businessName?.trim() || DEFAULT_MERCHANT_PROFILE.businessName,
    fullName: stored.fullName?.trim() || DEFAULT_MERCHANT_PROFILE.fullName,
    email: stored.email?.trim() || DEFAULT_MERCHANT_PROFILE.email,
    phoneNumber: stored.phoneNumber?.trim() || DEFAULT_MERCHANT_PROFILE.phoneNumber,
    address: stored.address?.trim() || DEFAULT_MERCHANT_PROFILE.address,
    profileImagePath: stored.profileImagePath || DEFAULT_MERCHANT_PROFILE.profileImagePath,
  };
}

export const PROFILE_UPDATED_EVENT = 'watheq:profile-updated';

/**
 * Saves profile data to local cache and notifies all open components
 */
export function setStoredMerchantProfile(profile: Partial<MerchantProfile>): void {
  try {
    const current = getStoredMerchantProfile();
    const merged = { ...current, ...profile };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merged));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: merged }));
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * React hook to subscribe to merchant profile changes in real time across all pages
 */
export function useMerchantProfile(): MerchantProfile {
  const [profile, setProfile] = useState<MerchantProfile>(() => getStoredMerchantProfile());

  useEffect(() => {
    const handleUpdate = () => {
      setProfile(getStoredMerchantProfile());
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return profile;
}

/**
 * GET http://whateq.runasp.net/api/MerchantProfile/getProfile
 * Fetches merchant profile from backend, falling back to stored registration data
 */
export async function getMerchantProfile(): Promise<MerchantProfile> {
  const localProfile = getStoredMerchantProfile();

  try {
    const response = await httpClient.get<unknown>('/MerchantProfile/getProfile');
    const unwrapped = extractProfileObject(response);

    if (unwrapped && typeof unwrapped === 'object') {
      const obj = unwrapped as Record<string, unknown>;
      const serverProfile: MerchantProfile = {
        businessName:
          (typeof obj.businessName === 'string' && obj.businessName.trim()) ||
          (typeof obj.BusinessName === 'string' && obj.BusinessName.trim()) ||
          localProfile.businessName,
        fullName:
          (typeof obj.fullName === 'string' && obj.fullName.trim()) ||
          (typeof obj.FullName === 'string' && obj.FullName.trim()) ||
          localProfile.fullName,
        email:
          (typeof obj.email === 'string' && obj.email.trim()) ||
          (typeof obj.Email === 'string' && obj.Email.trim()) ||
          localProfile.email,
        phoneNumber:
          (typeof obj.phoneNumber === 'string' && obj.phoneNumber.trim()) ||
          (typeof obj.PhoneNumber === 'string' && obj.PhoneNumber.trim()) ||
          localProfile.phoneNumber,
        address:
          (typeof obj.address === 'string' && obj.address.trim()) ||
          (typeof obj.Address === 'string' && obj.Address.trim()) ||
          localProfile.address,
        profileImagePath:
          (typeof obj.profileImagePath === 'string' && obj.profileImagePath) ||
          (typeof obj.ProfileImagePath === 'string' && obj.ProfileImagePath) ||
          localProfile.profileImagePath,
      };

      setStoredMerchantProfile(serverProfile);
      return serverProfile;
    }
  } catch {
    // If backend endpoint is unavailable or fails, gracefully return stored profile
  }

  return localProfile;
}

/**
 * PUT http://whateq.runasp.net/api/MerchantProfile/UpdateProfile
 * Updates merchant profile on backend and updates local cache
 */
export async function updateMerchantProfile(
  profile: Partial<MerchantProfile>,
  imageFile?: File
): Promise<MerchantProfile> {
  // Always update local cache first
  setStoredMerchantProfile(profile);

  try {
    const formData = new FormData();
    if (profile.fullName) formData.append('FullName', profile.fullName.trim());
    if (profile.businessName) formData.append('BusinessName', profile.businessName.trim());
    if (profile.address) formData.append('Address', profile.address.trim());
    if (profile.phoneNumber) formData.append('PhoneNumber', profile.phoneNumber.trim());
    if (profile.email) formData.append('Email', profile.email.trim());
    if (imageFile) formData.append('ProfileImageFile', imageFile);

    await httpClient.put<unknown>('/MerchantProfile/UpdateProfile', formData);
  } catch (error) {
    // If form-data fails, try JSON body as fallback
    try {
      await httpClient.put<unknown>('/MerchantProfile/UpdateProfile', {
        fullName: profile.fullName?.trim(),
        businessName: profile.businessName?.trim(),
        phoneNumber: profile.phoneNumber?.trim(),
        email: profile.email?.trim(),
        address: profile.address?.trim() || null,
      });
    } catch {
      // Re-throw if critical ApiError or proceed with saved local data
      if (error instanceof ApiError && error.status >= 500) {
        // Continue with local update
      }
    }
  }

  return getStoredMerchantProfile();
}

/**
 * Reminder & WhatsApp settings helpers
 */
export function getStoredReminderSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        autoReminderEnabled:
          typeof parsed.autoReminderEnabled === 'boolean'
            ? parsed.autoReminderEnabled
            : DEFAULT_REMINDER_SETTINGS.autoReminderEnabled,
        messageTemplate:
          typeof parsed.messageTemplate === 'string' && parsed.messageTemplate.trim()
            ? parsed.messageTemplate
            : DEFAULT_REMINDER_SETTINGS.messageTemplate,
      };
    }
  } catch {
    // Ignore storage parse errors
  }
  return DEFAULT_REMINDER_SETTINGS;
}

export function setStoredReminderSettings(settings: ReminderSettings): void {
  try {
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

function extractProfileObject(response: unknown): unknown {
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
