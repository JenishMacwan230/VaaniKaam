import { locales } from "@/i18n";

export type AccountType = "worker" | "contractor";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AuthUser {
  name?: string;
  location?: string;
  city?: string;
  workCategory?: string;
  accountType?: AccountType;
  activeRole?: string;
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
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { user?: AuthUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function logoutSession(): Promise<void> {
  if (!API_BASE_URL) return;

  try {
    await fetch(`${API_BASE_URL}/api/users/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignore network failures while clearing client state.
  }
}