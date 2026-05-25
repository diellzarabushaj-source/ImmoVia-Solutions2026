import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { useUser, useClerk } from "@clerk/react";

export type UserRole = "client" | "service_provider" | "admin" | "homeowner" | "contractor";
export type ProviderType = "individual" | "small_team" | "company";

export function normalizeRole(role: UserRole): "client" | "service_provider" | "admin" {
  if (role === "homeowner" || role === "client") return "client";
  if (role === "admin") return "admin";
  return "service_provider";
}

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  providerType?: ProviderType | null;
  fullName: string;
  slug: string | null;
  phone: string | null;
  city: string | null;
  language: string;
  avatarUrl: string | null;
  bio: string | null;
  companyName: string | null;
  serviceTypes: string[] | null;
  website: string | null;
  licenseNumber: string | null;
  yearsExperience: number | null;
  verified: boolean;
  createdAt: string;
}

export interface SignupData {
  email: string;
  password: string;
  role: UserRole;
  providerType?: ProviderType;
  fullName?: string;
  phone?: string;
  city?: string;
  language?: string;
  companyName?: string;
  serviceTypes?: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const API = "/api";

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) msg = data.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

const PENDING_ROLE_KEY = "immovia_pending_signup";

export function setPendingSignup(data: Omit<SignupData, "email" | "password">) {
  sessionStorage.setItem(PENDING_ROLE_KEY, JSON.stringify(data));
}

export function getPendingSignup(): Omit<SignupData, "email" | "password"> | null {
  const raw = sessionStorage.getItem(PENDING_ROLE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Omit<SignupData, "email" | "password">;
  } catch {
    return null;
  }
}

export function clearPendingSignup() {
  sessionStorage.removeItem(PENDING_ROLE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [dbUser, setDbUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const prevClerkIdRef = useRef<string | null | undefined>(undefined);

  const syncUser = async () => {
    // First try fetching existing DB user
    try {
      const data = await jsonFetch<{ user: AuthUser }>("/auth/me");
      setDbUser(data.user);
      return;
    } catch {
      // Not found — need to sync/create
    }

    // JIT provision: check for pending signup data (set during role selection)
    const pending = getPendingSignup();
    try {
      const data = await jsonFetch<{ user: AuthUser }>("/auth/sync", {
        method: "POST",
        body: JSON.stringify(pending ?? {}),
      });
      setDbUser(data.user);
      if (pending) clearPendingSignup();
    } catch (err) {
      console.error("Failed to sync user:", err);
      setDbUser(null);
    }
  };

  useEffect(() => {
    if (!clerkLoaded) return;

    const clerkId = clerkUser?.id ?? null;
    if (clerkId === prevClerkIdRef.current) return;
    prevClerkIdRef.current = clerkId;

    if (clerkId) {
      setLoading(true);
      void syncUser().finally(() => setLoading(false));
    } else {
      setDbUser(null);
      setLoading(false);
    }
  }, [clerkLoaded, clerkUser?.id, isSignedIn]);

  const refresh = async () => {
    if (!isSignedIn || !clerkUser) {
      setDbUser(null);
      return;
    }
    try {
      const data = await jsonFetch<{ user: AuthUser }>("/auth/me");
      setDbUser(data.user);
    } catch {
      setDbUser(null);
    }
  };

  const login = async (_email: string, _password: string) => {
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
    window.location.href = `${basePath}/sign-in`;
  };

  const signup = async (data: SignupData) => {
    setPendingSignup({
      role: data.role,
      providerType: data.providerType,
      fullName: data.fullName,
      phone: data.phone,
      city: data.city,
      language: data.language,
      companyName: data.companyName,
      serviceTypes: data.serviceTypes,
    });
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
    window.location.href = `${basePath}/sign-up`;
  };

  const logout = async () => {
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
    await signOut({ redirectUrl: basePath || "/" });
    setDbUser(null);
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    const data = await jsonFetch<{ user: AuthUser }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    setDbUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user: dbUser, loading, login, signup, logout, refresh, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
