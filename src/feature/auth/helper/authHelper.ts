import type { AuthUser } from "@/common/context/AuthContext";

const USER_KEY = "auth_user";
const TOKEN_KEY = "auth_access_token";

/**
 * Shape returned by the login / guest-login API endpoints.
 * Extend as needed when the backend adds more fields.
 */
export interface UserSessionData {
  access_token?: string;
  token?: string;
  user?: AuthUser;
  username?: string;
  email?: string;
  role?: string;
}

/**
 * Persist the user and token received from the API into localStorage
 * so that AuthContext can read them back via `refreshAuth()`.
 */
export function saveUserSession(data: UserSessionData): void {
  const token = data.access_token ?? data.token ?? null;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  const user: AuthUser = data.user ?? {
    username: data.username ?? "",
    email: data.email ?? "",
    role: data.role,
  };

  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Remove all auth-related data from localStorage (logout).
 */
export function clearUserSession(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Return the stored access token, or null if none exists.
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
