import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import { recordLoginDay } from "@/common/utils/StudyActivity";
import {
  fetchCurrentUserProfile,
  logoutUser
} from "@/feature/auth/api/authAPI";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role?: string;
  role_id?: number | null;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  logout: () => Promise<void>;
  /**
   * Re-fetch the profile from CareerPath and return it.
   *
   * The returned user carries CareerPath's own `role_id`, which is the source of
   * truth for admin rights - the auth-service `role` claim describes the shared
   * central identity and must not be used to decide CareerPath authorization.
   * Returns null if the session could not be verified.
   */
  refreshAuth: () => Promise<AuthUser | null>;
}

// ─── Storage helpers ───────────────────────────────────────────────────────────

const USER_KEY = "auth_user";

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}
export function setStoredUser(user: AuthUser | null): void {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearAuthStorage(): void {
  localStorage.removeItem(USER_KEY);
  // Optional cleanup for legacy tokens if any remain in client storage
  localStorage.removeItem("auth_access_token");
}

function buildAuthUser(profile: UserProfileResponse): AuthUser {
  const isAdmin = Number(profile.role_id) === 2;
  return {
    id: profile.id,
    username: profile.name || profile.email,
    email: profile.email,
    role: isAdmin ? "admin" : "employee",
    role_id: profile.role_id,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isAuthenticated = user !== null;

  // Sync state when another tab logs out / in
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === USER_KEY) {
        try {
          setUser(e.newValue ? (JSON.parse(e.newValue) as AuthUser) : null);
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  // Xác thực phiên làm việc thực tế từ Cookie server khi ứng dụng vừa mount
  useEffect(() => {
    const verifyServerSession = async () => {
      // 1. Skip if on sso-callback or URL has access_token fragment (sso-callback will handle it)
      if (
        window.location.pathname.includes('/sso-callback') ||
        window.location.hash.includes('access_token')
      ) {
        setIsLoading(false);
        return;
      }

      // 2. If no token in localStorage, user is not logged in. Do NOT call /user/me!
      const token = localStorage.getItem("auth_access_token");
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const serverUser = buildAuthUser(
          await fetchCurrentUserProfile({ redirectOnAuthFailure: false }),
        );
        setUser(serverUser);
        setStoredUser(serverUser);
      } catch (error) {
        // If the error is a network/connectivity failure (backend offline),
        // keep the stored user so temporary outages don't kick the user out.
        const isNetworkFailure =
          error instanceof TypeError ||
          (error instanceof Error &&
            (error.message.toLowerCase().includes("failed to fetch") ||
              error.message.toLowerCase().includes("networkerror") ||
              error.message.toLowerCase().includes("load failed")));

        if (!isNetworkFailure) {
          setUser(null);
          clearAuthStorage();
        } else {
          console.warn("Backend server unreachable during session verification; preserving local session.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyServerSession();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let midnightTimer: number | null = null;

    const syncActiveLoginDay = () => {
      recordLoginDay(user.id);
    };

    const scheduleNextMidnightSync = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      const delay = Math.max(1_000, nextMidnight.getTime() - now.getTime() + 1_000);

      midnightTimer = window.setTimeout(() => {
        syncActiveLoginDay();
        scheduleNextMidnightSync();
      }, delay);
    };

    const handleVisibilityOrFocus = () => {
      syncActiveLoginDay();
    };

    syncActiveLoginDay();
    scheduleNextMidnightSync();

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      if (midnightTimer !== null) {
        window.clearTimeout(midnightTimer);
      }
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [user?.id]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      clearAuthStorage();
      setUser(null);
    }
  }, []);

  /**
   * Re-fetches the profile from CareerPath and returns it (null if unverified).
   * Call this after a successful login so that any component relying on
   * AuthContext picks up the latest user state - and so callers deciding a
   * post-login redirect branch on CareerPath's role_id, not the auth-service claim.
   */
  const refreshAuth = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const serverUser = buildAuthUser(
        await fetchCurrentUserProfile({ redirectOnAuthFailure: false }),
      );
      setUser(serverUser);
      setStoredUser(serverUser);
      return serverUser;
    } catch (error) {
      const isNetworkFailure =
        error instanceof TypeError ||
        (error instanceof Error &&
          (error.message.toLowerCase().includes("failed to fetch") ||
            error.message.toLowerCase().includes("networkerror") ||
            error.message.toLowerCase().includes("load failed")));

      if (!isNetworkFailure) {
        setUser(null);
        clearAuthStorage();
      }
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
