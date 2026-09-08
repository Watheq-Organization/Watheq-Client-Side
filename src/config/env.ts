/**
 * Centralized environment configuration.
 *
 * The project had no existing env/config module, so this is the smallest
 * addition needed to avoid hardcoding the API URL in multiple files
 * (per project requirement: "Do not hardcode the API URL in multiple files").
 *
 * If VITE_API_BASE_URL is not set (e.g. .env missing at build time), we fall
 * back to the confirmed real backend base URL so the required endpoint
 *   POST http://whateq.runasp.net/api/auth/register
 * always resolves correctly.
 */

/**
 * In production / on HTTPS (e.g. Vercel deployment), requests to http://
 * are blocked by browsers as Mixed Content.
 * When on HTTPS, we default to the relative /api proxy rewrite configured in vercel.json
 * unless an explicit VITE_API_BASE_URL is provided in the environment.
 */
const getDefaultApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return '/api';
  }
  return 'http://whateq.runasp.net/api';
};

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || getDefaultApiBaseUrl();

