'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Lock, Phone } from "lucide-react";


export default function SignupCard() {
  const [phone, setPhone] = useState("");
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digitsOnly);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phone.length !== 10 || isSending) return;
    setIsSending(true);
    setTimeout(() => {
      router.push(`/create-account/verify?phone=${encodeURIComponent(phone)}`);
    }, 600);
  };

  const disabled = phone.length !== 10 || isSending;

  return (
    <section className="relative rounded-[32px] border border-border/80 bg-card/95 p-10 shadow-2xl">
      <div className="absolute inset-x-12 top-6 h-1 rounded-full bg-linear-to-r from-primary via-secondary to-accent opacity-60" />
      <div className="relative space-y-8">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Secure Access
            <Lock className="h-3 w-3" />
          </div>
          <h2 className="text-3xl font-semibold leading-tight">Enter your mobile number</h2>
          <p className="text-sm text-muted-foreground">
            We’ll send a one-time code to confirm it’s you. The number must match your contractor agreement.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          <label className="space-y-3 text-sm font-medium">
            <span>Mobile number</span>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                inputMode="numeric"
                pattern="^\\d{10}$"
                maxLength={10}
                title="Enter exactly 10 digits"
                placeholder="10 digit number"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full rounded-3xl border border-input bg-background/40 py-4 my-2 pl-11 pr-4 text-base outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={disabled}
            className="flex w-full items-center justify-center gap-2 rounded-3xl bg-primary px-4 py-4 my-2 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? "Sending code" : "Send verification code"}
            {!isSending && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

       

        <p className="pt-1 text-center text-sm text-muted-foreground">
          Already verified?{" "}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
