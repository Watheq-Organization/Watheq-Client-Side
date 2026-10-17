import { useState, useEffect } from 'react';
import { httpClient } from '../api/httpClient';
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
  profileImagePath: '',
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
    profileImagePath: normalizeProfileImageUrl(stored.profileImagePath),
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
    let isMounted = true;
    // Fetch fresh profile from API on application launch / component mount
    getMerchantProfile()
      .then((fresh) => {
        if (isMounted) {
          setProfile(fresh);
        }
      })
      .catch(() => {});

    const handleUpdate = () => {
      setProfile(getStoredMerchantProfile());
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return profile;
}

/**
/**
 * Ensures profile image URLs are properly formatted for both local dev and production on Vercel.
 * Prevents mixed-content blocking (HTTP on HTTPS) and fixes relative paths from backend.
 */
export function normalizeProfileImageUrl(path?: string | null): string {
  if (!path || !path.trim() || path.includes('merchant-avatar')) return '';
  const trimmed = path.trim();

  // If already base64 data URL or blob
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // If it's a backend URL on whateq.runasp.net
  if (trimmed.includes('whateq.runasp.net')) {
    const cleanRelative = trimmed.replace(/^https?:\/\/whateq\.runasp\.net/, '');
    const pathWithSlash = cleanRelative.startsWith('/') ? cleanRelative : `/${cleanRelative}`;
    // In production HTTPS (e.g. Vercel), route through proxy to avoid mixed content block
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      return pathWithSlash;
    }
    return `https://whateq.runasp.net${pathWithSlash}`;
  }

  // If it's an absolute external URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // If relative path from backend (e.g. /uploads/... or Uploads/...)
  const pathWithSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return pathWithSlash;
  }
  return `https://whateq.runasp.net${pathWithSlash}`;
}

/**
 * GET https://whateq.runasp.net/api/MerchantProfile/getProfile
 * Fetches merchant profile from backend, falling back to stored registration data
 */
export async function getMerchantProfile(): Promise<MerchantProfile> {
  const localProfile = getStoredMerchantProfile();

  try {
    const response = await httpClient.get<unknown>('/MerchantProfile/getProfile');
    const unwrapped = extractProfileObject(response);

    if (unwrapped && typeof unwrapped === 'object') {
      const obj = unwrapped as Record<string, unknown>;
      const rawImage =
        (typeof obj.profileImage === 'string' && obj.profileImage) ||
        (typeof obj.ProfileImage === 'string' && obj.ProfileImage) ||
        (typeof obj.profileImagePath === 'string' && obj.profileImagePath) ||
        (typeof obj.ProfileImagePath === 'string' && obj.ProfileImagePath) ||
        (typeof obj.logoPath === 'string' && obj.logoPath) ||
        (typeof obj.LogoPath === 'string' && obj.LogoPath) ||
        (typeof obj.imagePath === 'string' && obj.imagePath) ||
        (typeof obj.ImagePath === 'string' && obj.ImagePath);

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
        profileImagePath: rawImage ? normalizeProfileImageUrl(rawImage) : localProfile.profileImagePath,
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
 * PUT https://whateq.runasp.net/api/MerchantProfile/UpdateProfile
 * Updates merchant profile on backend (FullName, BusinessName, ProfileImageFile, ProfileImagePath)
 * Note: UserId is automatically retrieved by backend from JWT, so it must NOT be sent in FormData.
 */
export async function updateMerchantProfile(
  profile: Partial<MerchantProfile>,
  imageFile?: File
): Promise<MerchantProfile> {
  const formData = new FormData();

  // 1. FullName (2 - 150 chars)
  if (profile.fullName && profile.fullName.trim().length >= 2) {
    formData.append('FullName', profile.fullName.trim());
  }

  // 2. BusinessName (2 - 150 chars)
  if (profile.businessName && profile.businessName.trim().length >= 2) {
    formData.append('BusinessName', profile.businessName.trim());
  }

  // 3. Profile Image:
  // If a new image file is selected, send it as ProfileImageFile
  if (imageFile) {
    formData.append('ProfileImageFile', imageFile);
  } else if (profile.profileImagePath && !profile.profileImagePath.startsWith('data:')) {
    // If no new file is uploaded, send existing image path (ignore local base64 preview strings)
    formData.append('ProfileImagePath', profile.profileImagePath.trim());
  }

  // Send multipart/form-data request with Bearer token
  const response = await httpClient.putForm<unknown>('/MerchantProfile/UpdateProfile', formData);
  const unwrapped = extractProfileObject(response);

  const localCurrent = getStoredMerchantProfile();
  let serverImage: string | undefined;

  let updatedFullName = profile.fullName?.trim() || localCurrent.fullName;
  let updatedBusinessName = profile.businessName?.trim() || localCurrent.businessName;
  let updatedEmail = profile.email?.trim() || localCurrent.email;
  let updatedPhoneNumber = profile.phoneNumber?.trim() || localCurrent.phoneNumber;

  if (unwrapped && typeof unwrapped === 'object') {
    const obj = unwrapped as Record<string, unknown>;
    if (typeof obj.fullName === 'string' && obj.fullName.trim()) updatedFullName = obj.fullName.trim();
    else if (typeof obj.FullName === 'string' && obj.FullName.trim()) updatedFullName = obj.FullName.trim();

    if (typeof obj.businessName === 'string' && obj.businessName.trim()) updatedBusinessName = obj.businessName.trim();
    else if (typeof obj.BusinessName === 'string' && obj.BusinessName.trim()) updatedBusinessName = obj.BusinessName.trim();

    if (typeof obj.email === 'string' && obj.email.trim()) updatedEmail = obj.email.trim();
    else if (typeof obj.Email === 'string' && obj.Email.trim()) updatedEmail = obj.Email.trim();

    if (typeof obj.phoneNumber === 'string' && obj.phoneNumber.trim()) updatedPhoneNumber = obj.phoneNumber.trim();
    else if (typeof obj.PhoneNumber === 'string' && obj.PhoneNumber.trim()) updatedPhoneNumber = obj.PhoneNumber.trim();

    serverImage =
      (typeof obj.profileImage === 'string' && obj.profileImage) ||
      (typeof obj.ProfileImage === 'string' && obj.ProfileImage) ||
      (typeof obj.profileImagePath === 'string' && obj.profileImagePath) ||
      (typeof obj.ProfileImagePath === 'string' && obj.ProfileImagePath) ||
      (typeof obj.logoPath === 'string' && obj.logoPath) ||
      (typeof obj.LogoPath === 'string' && obj.LogoPath);
  }

  const finalProfile: MerchantProfile = {
    ...localCurrent,
    ...profile,
    fullName: updatedFullName,
    businessName: updatedBusinessName,
    email: updatedEmail,
    phoneNumber: updatedPhoneNumber,
    address: profile.address !== undefined ? profile.address.trim() : localCurrent.address,
    profileImagePath: serverImage
      ? normalizeProfileImageUrl(serverImage)
      : (profile.profileImagePath && !profile.profileImagePath.startsWith('data:')
          ? normalizeProfileImageUrl(profile.profileImagePath)
          : localCurrent.profileImagePath),
  };

  // Save to local storage cache only upon successful server response
  setStoredMerchantProfile(finalProfile);

  return finalProfile;
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
