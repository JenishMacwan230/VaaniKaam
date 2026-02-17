'use client';

import React, { useState } from "react";
import { Mail, MapPin, MessageSquare, Phone } from "lucide-react";

const reasons = [
  "General inquiry",
  "Partner onboarding",
  "Support request",
  "Billing question",
];

export default function ContactPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    reason: reasons[0],
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.fullName || !form.email || !form.message) return;
    setStatus("sending");
    setTimeout(() => setStatus("sent"), 1000);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <section className="mx-auto grid w-full max-w-6xl gap-10 rounded-[36px] border border-border/70 bg-card/95 p-10 shadow-2xl lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-8">
          <header className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Contact</p>
            <h1 className="text-4xl font-semibold leading-tight">Let’s collaborate on your next workforce rollout</h1>
            <p className="text-base text-muted-foreground">
              Share a few details and our city coordinators will reach out within one business day to plan deployment or resolve your request.
            </p>
          </header>

          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-3xl border border-border/70 bg-background/60 p-4">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Email</p>
                <p className="text-sm text-muted-foreground">support@vaanikaam.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-3xl border border-border/70 bg-background/60 p-4">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Phone</p>
                <p className="text-sm text-muted-foreground">+91 70228 90011 (Mon–Sat, 9–7 IST)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-3xl border border-border/70 bg-background/60 p-4">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">HQ</p>
                <p className="text-sm text-muted-foreground">Tower 4, Brigade Tech Gardens, Bengaluru</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>Full name</span>
              <input
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Priya Sharma"
                className="w-full rounded-3xl border border-input bg-background/40 px-4 py-3 text-base outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="w-full rounded-3xl border border-input bg-background/40 px-4 py-3 text-base outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>Phone (optional)</span>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 90000 00000"
                className="w-full rounded-3xl border border-input bg-background/40 px-4 py-3 text-base outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Reason</span>
              <div className="relative">
                <MessageSquare className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-3xl border border-input bg-background/40 px-4 py-3 pr-10 text-base outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  {reasons.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium">
            <span>Message</span>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Share project scope, timelines, or challenges..."
              rows={5}
              className="w-full rounded-3xl border border-input bg-background/40 px-4 py-3 text-base outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </label>

          <button
            type="submit"
            disabled={status === "sending"}
            className="flex w-full items-center justify-center gap-2 rounded-3xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "sent" ? "Message sent" : status === "sending" ? "Sending..." : "Send message"}
          </button>

          {status === "sent" && (
            <p className="text-center text-sm font-medium text-primary">
              Thanks for reaching out—we’ll reply shortly.
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
