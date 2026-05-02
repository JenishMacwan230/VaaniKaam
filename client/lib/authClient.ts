import { locales } from "@/i18n";

export type AccountType = "worker" | "contractor";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  normalizedLocation?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  workCategory?: string;
  accountType?: AccountType;
  activeRole?: string;
  profilePictureUrl?: string;
  profilePicturePublicId?: string;
  profession?: string;
  skills?: string[];
  experienceYears?: number;
  pricingType?: "hour" | "day" | "job";
  pricingAmount?: number;
  availability?: boolean;
  languages?: string[];
  about?: string;
}

export interface ProfileUpdatePayload {
  name?: string;
  location?: string;
  normalizedLocation?: string;
  latitude?: number;
  longitude?: number;
  profession?: string;
  skills?: string[];
  experienceYears?: number;
  pricingType?: "hour" | "day" | "job";
  pricingAmount?: number | "";
  availability?: boolean;
  languages?: string[];
  about?: string;
}

export function resolveAccountType(user: AuthUser | null | undefined): AccountType {
  if (!user) return "worker";
  if (user.accountType === "contractor") return "contractor";
  if (user.activeRole === "individual" || user.activeRole === "company") return "contractor";
  return "worker";
}

export function getCurrentLocale(pathname: string): string {
  const segment = pathname.split("/")[1] ?? "";
  return locales.includes(segment as (typeof locales)[number]) ? segment : "en";
}

export async function fetchSessionUser(): Promise<AuthUser | null> {
  if (!API_BASE_URL) return null;

  try {
    const headers = getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: "GET",
      credentials: "include",
      headers,
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { user?: AuthUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export function getAuthHeaders(includeContentType = false): Record<string, string> {
  const headers: Record<string, string> = {};

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  const token = globalThis.window?.localStorage.getItem("authToken") ?? null;
  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  return headers;
}

export async function logoutSession(): Promise<void> {
  if (!API_BASE_URL) return;

  try {
    await fetch(`${API_BASE_URL}/api/users/logout`, {
      method: "POST",
      credentials: "include",
    });
    globalThis.window?.localStorage.removeItem("authToken");
  } catch {
    // Ignore network failures while clearing client state.
  }
}

export async function updateSessionProfile(payload: ProfileUpdatePayload): Promise<AuthUser | null> {
  if (!API_BASE_URL) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { user?: AuthUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export interface PublicStats {
  totalUsers: number;
  totalJobs: number;
  avgRating: number;
}

export async function fetchPublicStats(): Promise<PublicStats | null> {
  if (!API_BASE_URL) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/public-stats`, {
      method: "GET",
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.stats ?? null;
  } catch {
    return null;
  }
}