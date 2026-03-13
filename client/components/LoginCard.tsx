'use client';

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentLocale, resolveAccountType } from "@/lib/authClient";

export default function LoginCard() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getCurrentLocale(pathname);
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replaceAll(/\D/g, "").slice(0, 10);
    setPhone(digitsOnly);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          phone: `+91${phone}`, 
          password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      const accountType = resolveAccountType(data.user);
      const homePath = `/${locale}`;

      // Keep account type normalization in local storage for home role sections.
      localStorage.setItem("user", JSON.stringify({ ...data.user, accountType }));
      globalThis.window.dispatchEvent(new Event("auth-changed"));
      router.replace(homePath);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative rounded-3xl border border-border bg-card p-8 shadow-2xl">
      <div className="absolute inset-x-12 top-6 h-1 rounded-full bg-linear-to-r from-primary via-secondary to-accent opacity-60" />
      <div className="relative space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">Mobile access</p>
          <h2 className="text-3xl font-semibold">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the mobile number linked to your account.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <label className="space-y-2 text-sm font-medium">
            <span>Mobile number</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Enter 10 digit number"
              value={phone}
              onChange={handlePhoneChange}
              disabled={loading}
              className="w-full rounded-2xl border border-input bg-background/40 px-4 py-3 text-base shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </label>

          <label className="space-y-2 text-sm font-medium">
            <span>Password</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                className="w-full rounded-2xl border border-input bg-background/40 px-4 py-3 text-base shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-primary"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p className="font-medium text-muted-foreground">Remember this device</p>
            <Link href={`/${locale}/forgot-password`} className="font-medium text-primary hover:text-primary/80">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || phone.length !== 10 || !password}
            className="w-full rounded-2xl bg-linear-to-r from-primary via-secondary to-accent py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          New user?{" "}
          <Link href={`/${locale}/create-account`} className="text-primary underline-offset-4 hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </section>
  );
}
