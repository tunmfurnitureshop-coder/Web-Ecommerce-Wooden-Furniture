"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { CustomerPublic } from "@/features/customer/customer.types";

export interface CustomerAuthContextValue {
  customer: CustomerPublic | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  customerFetch: <T>(path: string, options?: RequestInit) => Promise<T>;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

const BASE_URL =
  typeof window === "undefined"
    ? (process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000")
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000");

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerPublic | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  async function refreshToken(): Promise<string | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/customer/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setAccessToken(null);
        setCustomer(null);
        tokenRef.current = null;
        return null;
      }
      const data: { accessToken: string } = await res.json();
      const newToken = data.accessToken;
      setAccessToken(newToken);
      tokenRef.current = newToken;

      const meRes = await fetch(`${BASE_URL}/api/v1/customer/me`, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      if (meRes.ok) setCustomer(await meRes.json());
      return newToken;
    } catch {
      setAccessToken(null);
      setCustomer(null);
      tokenRef.current = null;
      return null;
    }
  }

  useEffect(() => {
    refreshToken().finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/customer/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: { message?: string } })?.error?.message ?? "Login failed");
    }
    const data: { accessToken: string; customer: CustomerPublic } = await res.json();
    setAccessToken(data.accessToken);
    tokenRef.current = data.accessToken;
    setCustomer(data.customer);
  }

  async function logout(): Promise<void> {
    try {
      await fetch(`${BASE_URL}/api/v1/customer/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
        },
        credentials: "include",
      });
    } catch {}
    setAccessToken(null);
    setCustomer(null);
    tokenRef.current = null;
  }

  async function customerFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const makeRequest = (token: string | null) =>
      fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers as Record<string, string> | undefined ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

    let res = await makeRequest(tokenRef.current);
    if (res.status === 401) {
      const newToken = await refreshToken();
      if (newToken) res = await makeRequest(newToken);
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return (
    <CustomerAuthContext.Provider
      value={{ customer, isAuthenticated: !!accessToken, loading, login, logout, customerFetch }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth(): CustomerAuthContextValue {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}
