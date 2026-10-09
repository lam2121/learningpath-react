import { AUTH_BASE_URL as AUTH_URL, getAppPath } from "@/const/appConst";
import {
  getAccessToken,
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
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function redirectToLogin(): void {
  window.location.href = LOGIN_PATH;
}

/**
 * Build headers that include the Bearer token from localStorage
 * (merged with any caller-supplied headers).
 */
function withAuthHeaders(init: RequestInit): RequestInit {
  const token = getAccessToken();
  if (!token) return init;

  const existing = init.headers instanceof Headers
    ? Object.fromEntries((init.headers as Headers).entries())
    : Array.isArray(init.headers)
      ? Object.fromEntries(init.headers)
      : (init.headers ?? {});

  return {
    ...init,
    headers: {
      ...existing,
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function refreshAccessToken(): Promise<void> {
  if (refreshRequest) {
    return refreshRequest;
  }

  refreshRequest = (async () => {
    const token = getAccessToken();
    const response = await fetch(`${AUTH_URL}/refresh-token`, {
      method: "POST",
      credentials: "include",
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    });

    if (!response.ok) {
      throw new Error("Refresh token expired or invalid");
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
