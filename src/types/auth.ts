/**
 * Shape of the Signup form as controlled by the UI (RegisterScreen).
 * These are the field names the existing form already uses — the only
 * concrete "source of truth" available in this project for what data
 * the user provides.
 */
export interface RegisterFormData {
  storeName: string;
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

/**
 * Shape of the Login form as controlled by the UI (LoginPage).
 */
export interface LoginFormData {
  phone: string;
  password: string;
  rememberMe: boolean;
}

/**
 * NOTE ON THE REGISTER API PAYLOAD (backend contract):
 *
 * This project has no backend code, OpenAPI/Swagger spec, or Postman
 * collection checked into the repo, and no publicly discoverable API
 * documentation was found for http://whateq.runasp.net. The exact
 * property names the backend expects for POST /api/auth/register are
 * therefore NOT confirmed.
 *
 * Per the project's explicit instruction not to invent a request body,
 * this type is intentionally left loose (`Record<string, unknown>`) and
 * built by a single, clearly-marked mapping function
 * (`mapRegisterFormToApiPayload` in src/services/authService.ts) rather
 * than guessed here. If/when the real DTO is confirmed (Swagger, backend
 * source, or a captured real request), only that one function needs to
 * change — nothing else in the app depends on the payload shape.
 */
export type RegisterApiPayload = Record<string, unknown>;

/**
 * Generic shape we defensively parse API responses into. Real backend
 * response shape is also unconfirmed for the same reason as above, so
 * every field is optional and consumers must check before using them.
 */
export interface AuthApiResponseShape {
  token?: string;
  accessToken?: string;
  message?: string;
  errors?: Record<string, string[]> | string[];
  [key: string]: unknown;
}

export interface AuthResult {
  success: boolean;
  message: string;
  token?: string;
}
