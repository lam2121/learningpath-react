const AUTH_URL = import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:8001/api/auth";
const LOGIN_PATH = "/careerpath/login";
let refreshRequest: Promise<void> | null = null;

export interface AuthRetryFetchOptions extends RequestInit {
  redirectOnAuthFailure?: boolean;
  retryOnUnauthorized?: boolean;
}

export function clearClientAuthState(): void {
  localStorage.removeItem("auth_user");
  localStorage.removeItem("auth_access_token");
}

export function redirectToLogin(): void {
  window.location.href = LOGIN_PATH;
}

export async function refreshAccessToken(): Promise<void> {
  if (refreshRequest) {
    return refreshRequest;
  }

  refreshRequest = (async () => {
    const response = await fetch(`${AUTH_URL}/refresh-token`, {
      method: "POST",
      credentials: "include",
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
    fetch(input, {
      credentials: "include",
      ...requestInit,
    });

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
