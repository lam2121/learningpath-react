import type { AuthUser } from "@/common/context/AuthContext";

export const USER_KEY = "auth_user";
export const TOKEN_KEY = "auth_access_token";
export const REFRESH_TOKEN_KEY = "auth_refresh_token";
export const ADMIN_ROLE_ID = 2;
export const LEARNER_ROLE_ID = 1;

export interface UserSessionData {
  user?: AuthUser;
  access_token?: string;
  id?: number;
  username?: string;
  email?: string;
  role?: string;
  role_id?: number | null;
  user_id?: number;
  name?: string;
}

/**
 * Persist the authenticated user profile into localStorage so that
 * AuthContext can read it back via `refreshAuth()`.
 */
export function saveUserSession(data: UserSessionData): void {
  const roleStr = String(data.role || data.user?.role || '').trim().toLowerCase();
  const isAdmin =
    roleStr === 'admin' ||
    roleStr === 'administrator' ||
    Number(data.role_id) === ADMIN_ROLE_ID ||
    Number(data.user?.role_id) === ADMIN_ROLE_ID;
  const roleId = isAdmin ? ADMIN_ROLE_ID : LEARNER_ROLE_ID;

  const user: AuthUser = data.user ?? {
    id: data.user_id ?? data.id ?? "",
    username: data.username ?? data.name ?? "",
    email: data.email ?? "",
    role: isAdmin ? 'admin' : 'employee',
    role_id: roleId,
  } as AuthUser;

  user.role_id = roleId;
  user.role = isAdmin ? 'admin' : 'employee';

  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // Persist access token if provided (SSO / direct login)
  if (data.access_token) {
    localStorage.setItem(TOKEN_KEY, data.access_token);
  }
}

/**
 * Retrieve stored access token from localStorage.
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove all auth-related data from localStorage (logout).
 */
export function clearUserSession(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
