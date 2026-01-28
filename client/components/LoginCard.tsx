'use client';

import React, { useState } from "react";
import Link from "next/link";

export default function LoginCard() {
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digitsOnly);
  };

  return (
    <section className="relative rounded-3xl border border-border bg-card p-8 shadow-2xl">
      <div className="absolute inset-x-12 top-6 h-1 rounded-full bg-linear-to-r from-primary via-secondary to-accent opacity-60" />
      <div className="relative space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">Mobile access</p>
          <h2 className="text-3xl font-semibold">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the mobile number linked to your contractor account.
          </p>
        </div>

        <form className="space-y-5">
          <label className="space-y-2 text-sm font-medium">
            <span>Mobile number</span>
            <input
              type="tel"
              inputMode="numeric"
              pattern="^\\d{10}$"
              maxLength={10}
              title="Enter exactly 10 digits"
              placeholder="Enter 10 digit number"
              value={phone}
              onChange={handlePhoneChange}
              className="w-full rounded-2xl border border-input bg-background/40 px-4 py-3 text-base shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </label>

          <label className="space-y-2 text-sm font-medium">
            <span>Account PIN</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter secure PIN"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
              Remember device
            </label>
            <button type="button" className="font-medium text-primary hover:text-primary/80">
              Need help?
            </button>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-linear-to-r from-primary via-secondary to-accent py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90"
          >
            Sign in
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          New contractor?{" "}
          <Link href="/create-account" className="text-primary underline-offset-4 hover:underline">
            Create new
          </Link>
        </p>
      </div>
    </section>
  );
}
