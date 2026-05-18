import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type UserRole = "homeowner" | "contractor";

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
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

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

export interface SignupData {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  city?: string;
  language?: string;
  companyName?: string;
  serviceTypes?: string[];
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await jsonFetch<{ user: AuthUser }>("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await jsonFetch<{ user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
  };

  const signup = async (signupData: SignupData) => {
    const data = await jsonFetch<{ user: AuthUser }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(signupData),
    });
    setUser(data.user);
  };

  const logout = async () => {
    await jsonFetch("/auth/logout", { method: "POST" });
    setUser(null);
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    const data = await jsonFetch<{ user: AuthUser }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
