'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

export default function VerifyCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(digitsOnly);
    if (error) setError("");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6 digit code from SMS.");
      return;
    }
    setError("");
    setIsVerifying(true);
    setTimeout(() => {
      router.push("/create-account/set-profile");
    }, 900);
  };

  const disabled = code.length !== 6 || isVerifying;
  const phoneLabel = phone ? `+91 ${phone}` : "your mobile number";

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-20">
      <section className="w-full max-w-xl rounded-[32px] border border-border/80 bg-card/95 p-10 shadow-2xl">
        <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
          <Link href="/create-account" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Edit number
          </Link>
          <span>{phoneLabel}</span>
        </div>

        <div className="space-y-8">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Verify Code
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <h1 className="text-3xl font-semibold leading-tight">Enter the 6 digit code</h1>
            <p className="text-sm text-muted-foreground">
              We sent a secure OTP via SMS and WhatsApp. Enter the digits exactly as received to continue.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="space-y-3 text-sm font-medium">
              <span>Verification code</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="^\\d{6}$"
                maxLength={6}
                title="Enter the 6 digit code"
                placeholder="000000"
                value={code}
                onChange={handleCodeChange}
                className="w-full rounded-3xl border border-input bg-background/40 py-4 my-2 text-center text-2xl tracking-[0.4em] outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </label>

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={disabled}
              className="flex w-full items-center justify-center gap-2 rounded-3xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying code
                </>
              ) : (
                "Verify and continue"
              )}
            </button>
          </form>

          <div className="rounded-3xl border border-border/60 bg-background/60 p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Need help?</p>
            <p className="mt-2">
              If the OTP did not arrive within 30 seconds, request a resend from the previous screen or contact crew support.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
