import type { AuthUser } from "@/common/context/AuthContext";

export const USER_KEY = "auth_user";
export const TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "auth_refresh_token";
export const ADMIN_ROLE_ID = 2;
export const LEARNER_ROLE_ID = 1;

export interface UserSessionData {
  user?: AuthUser;
  access_token?: string;
  refresh_token?: string;
  id?: number;
  username?: string;
  email?: string;
  role?: string;
  role_id?: number | null;
  user_id?: number;
  name?: string;
}

/**
 * Determine top-level domain for cookie sharing across subdomains (e.g. .builtbylam.com).
 */
function getCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return undefined;
  }
  if (hostname.endsWith("builtbylam.com")) {
    return ".builtbylam.com";
  }
  const parts = hostname.split(".");
  if (parts.length >= 2 && !/^\d+$/.test(parts[parts.length - 1])) {
    return "." + parts.slice(-2).join(".");
  }
  return undefined;
}

/**
 * Get cookie value by name.
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const encodedName = encodeURIComponent(name);
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const cookie of cookies) {
    const [key, ...valParts] = cookie.split("=");
    if (key.trim() === encodedName || key.trim() === name) {
      return decodeURIComponent(valParts.join("="));
    }
  }
  return null;
}

/**
 * Set cookie value with expiration and cross-subdomain support.
 */
export function setCookie(name: string, value: string, days = 1): void {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  const domain = getCookieDomain();
  const domainAttr = domain ? `; domain=${domain}` : "";
  const secureAttr = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${domainAttr}${secureAttr}`;
  if (domain) {
    // Also set host-only cookie for reliability
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secureAttr}`;
  }
}

/**
 * Delete cookie by name across potential domains.
 */
export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  const domain = getCookieDomain();
  const domainAttr = domain ? `; domain=${domain}` : "";
  const secureAttr = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${domainAttr}${secureAttr}`;
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureAttr}`;
}

/**
 * Persist the authenticated user profile into localStorage and tokens into Cookies.
 * Tokens are strictly stored in Cookies and completely purged from localStorage.
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

  // Persist tokens into Cookies (never localStorage)
  if (data.access_token) {
    setCookie(TOKEN_KEY, data.access_token, 1);
  }
  if (data.refresh_token) {
    setCookie(REFRESH_TOKEN_KEY, data.refresh_token, 7);
  }

  // Purge any tokens from localStorage
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("auth_access_token");
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem("refresh_token");
  } catch {
    // ignore
  }
}

/**
 * Retrieve stored access token from Cookies.
 */
export function getAccessToken(): string | null {
  return getCookie(TOKEN_KEY) || getCookie("auth_access_token");
}

/**
 * Retrieve stored refresh token from Cookies.
 */
export function getRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_KEY) || getCookie("refresh_token");
}

/**
 * Remove all auth-related data from Cookies & localStorage (logout).
 */
export function clearUserSession(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("auth_access_token");
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("refresh_token");
  deleteCookie(TOKEN_KEY);
  deleteCookie("auth_access_token");
  deleteCookie(REFRESH_TOKEN_KEY);
  deleteCookie("refresh_token");
}
