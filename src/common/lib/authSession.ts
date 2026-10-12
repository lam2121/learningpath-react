import { AUTH_BASE_URL as AUTH_URL, getAppPath } from "@/const/appConst";
import {
  getAccessToken,
  getRefreshToken,
  setCookie,
  deleteCookie,
  REFRESH_TOKEN_KEY,
  TOKEN_KEY,
  USER_KEY,
} from "@/feature/auth/helper/authHelper";

const LOGIN_PATH = getAppPath("/login");
let refreshRequest: Promise<void> | null = null;

export interface AuthRetryFetchOptions extends RequestInit {
  redirectOnAuthFailure?: boolean;
  retryOnUnauthorized?: boolean;
}

export function clearClientAuthState(): void {
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

export function redirectToLogin(): void {
  window.location.href = LOGIN_PATH;
}

/**
 * Build headers that include the Bearer token from Cookie
 * (merged with any caller-supplied headers) with credentials included.
 */
function withAuthHeaders(init: RequestInit): RequestInit {
  const token = getAccessToken();
  const existing = init.headers instanceof Headers
    ? Object.fromEntries((init.headers as Headers).entries())
    : Array.isArray(init.headers)
      ? Object.fromEntries(init.headers)
      : (init.headers ?? {});

  return {
    ...init,
    credentials: "include",
    headers: {
      ...existing,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

export async function refreshAccessToken(): Promise<void> {
  if (refreshRequest) {
    return refreshRequest;
  }

  refreshRequest = (async () => {
    const token = getAccessToken();
    const refreshToken = getRefreshToken();
    const response = await fetch(`${AUTH_URL}/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        ...(refreshToken ? { refresh_token: refreshToken } : {}),
      }),
    });

    if (!response.ok) {
      throw new Error("Refresh token expired or invalid");
    }

    const data = await response.json().catch(() => null);
    if (data?.access_token) {
      setCookie(TOKEN_KEY, data.access_token, 1);
    }
    if (data?.refresh_token) {
      setCookie(REFRESH_TOKEN_KEY, data.refresh_token, 7);
    }

    // Ensure tokens are never in localStorage
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("auth_access_token");
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem("refresh_token");
    } catch {
      // ignore
    }
  })();

  try {
    await refreshRequest;
  } finally {
    refreshRequest = null;
  }
}

export async function fetchWithAuthRetry(
  input: RequestInfo | URL,
  options: AuthRetryFetchOptions = {},
): Promise<Response> {
  const {
    redirectOnAuthFailure = true,
    retryOnUnauthorized = true,
    ...requestInit
  } = options;

  const execute = () =>
    fetch(input, withAuthHeaders({
      credentials: "include",
      ...requestInit,
    }));

  let response = await execute();
  if (!retryOnUnauthorized || response.status !== 401) {
    return response;
  }

  try {
    await refreshAccessToken();
  } catch {
    clearClientAuthState();
    if (redirectOnAuthFailure) {
      redirectToLogin();
    }
    return response;
  }

  response = await execute();
  if (response.status === 401 && redirectOnAuthFailure) {
    clearClientAuthState();
    redirectToLogin();
  }

  return response;
}
