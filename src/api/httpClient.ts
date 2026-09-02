import { API_BASE_URL } from '../config/env';

/**
 * The project had no existing Axios instance, fetch wrapper, or API client
 * of any kind (confirmed by searching the codebase for axios/fetch/apiClient
 * before writing this). This is the smallest client needed to satisfy:
 *   "API calls must NOT be written directly inside JSX/page components."
 *
 * Uses the native fetch API (no new dependency added) and centralizes the
 * base URL via src/config/env.ts.
 */

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch {
    // Network-level failure (offline, CORS, DNS, server unreachable, etc.)
    throw new ApiError('NETWORK_ERROR', 0, null);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    throw new ApiError(`HTTP_${response.status}`, response.status, body);
  }

  return body as TResponse;
}

export const httpClient = {
  post: <TResponse>(path: string, data: unknown) =>
    request<TResponse>(path, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: <TResponse>(path: string) => request<TResponse>(path, { method: 'GET' }),
};
