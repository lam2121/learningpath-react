import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { recordLoginDay } from "@/feature/user-profile/utils/StudyActivity";

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
  user: AuthUser | null;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

// ─── Storage helpers ───────────────────────────────────────────────────────────

const USER_KEY = "auth_user";
const TOKEN_KEY = "auth_access_token";

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthStorage(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const isAuthenticated = user !== null;

  // Sync state when another tab logs out / in
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === USER_KEY) {
        setUser(e.newValue ? (JSON.parse(e.newValue) as AuthUser) : null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
  }, []);

  /**
   * Re-reads the persisted user from localStorage.
   * Call this after a successful login / token refresh so that
   * any component relying on AuthContext picks up the latest state.
   */
  const refreshAuth = useCallback(async (): Promise<void> => {
    const stored = getStoredUser();
    setUser(stored);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, logout, refreshAuth }}>
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
