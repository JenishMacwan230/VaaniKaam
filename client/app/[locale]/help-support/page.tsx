"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Mail, MapPin, Phone, Loader2, CheckCircle, AlertCircle,
  HelpCircle, Shield, MessageCircle, Clock, Zap,
} from "lucide-react";

import { fetchSessionUser } from "@/lib/authClient";
import { useTranslations } from "next-intl";

export default function HelpSupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("helpSupport");
  
  const reasons = [
    t("reason1"),
    t("reason2"),
    t("reason3"),
    t("reason4"),
    t("reason5"),
  ];

  const supportOptions = [
    {
      icon: HelpCircle,
      title: t("faqsTitle"),
      description: t("faqsDesc"),
      color: "from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400",
    },
    {
      icon: Shield,
      title: t("safetyTitle"),
      description: t("safetyDesc"),
      color: "from-red-500/20 to-pink-500/20 text-red-600 dark:text-red-400",
    },
    {
      icon: MessageCircle,
      title: t("contactTitle"),
      description: t("contactDesc"),
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Clock,
      title: t("responseTitle"),
      description: t("responseDesc"),
      color: "from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400",
    },
  ];

  const faqs = [
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
    { question: t("faq4Q"), answer: t("faq4A") },
  ];

  const [form, setForm] = useState({
    fullName: searchParams.get("fullName") || "",
    email: searchParams.get("email") || "",
    phone: searchParams.get("phone") || "",
    reason: searchParams.get("reason") || reasons[0],
    message: searchParams.get("message") || "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const hydrateUser = async () => {
      const sessionUser = await fetchSessionUser();
      if (!active || !sessionUser) return;

      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || sessionUser.name || "",
        email: prev.email || sessionUser.email || "",
        phone: prev.phone || sessionUser.phone || "",
      }));
    };

    void hydrateUser();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.fullName || !form.email || !form.message) {
      setErrorMessage("Please fill in all required fields");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setErrorMessage("Please enter a valid email address");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/contact/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setStatus("sent");
        setForm({ fullName: "", email: "", phone: "", reason: reasons[0], message: "" });
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || "Failed to send message. Please try again.");
        setStatus("error");
        setTimeout(() => setStatus("idle"), 5000);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setErrorMessage("Network error. Please check your connection and try again.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* ═══════════════ HERO HEADER ═══════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600/60 via-teal-600/60 to-cyan-700/60 dark:from-emerald-700/60 dark:via-teal-700/60 dark:to-cyan-800/60 px-4 pt-8 pb-20 sm:pt-12 sm:pb-24">
        <div className="pointer-events-none absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-8 h-40 w-40 rounded-full bg-emerald-400/20 blur-2xl" />

        <div className="relative mx-auto max-w-4xl">
          <div className="mb-6 flex justify-start">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t("back")}</span>
            </button>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              {t("heroTitle")}
            </h1>
            <p className="text-lg text-white/90 max-w-2xl">
              {t("heroSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════ SUPPORT OPTIONS GRID ═══════════════ */}
      <div className="relative z-10 mx-auto -mt-10 max-w-4xl px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-12">
          {supportOptions.map((option, idx) => {
            const Icon = option.icon;
            return (
              <div
                key={option.title}
                className="rounded-xl border border-border/50 bg-card p-4 text-center shadow-sm hover:shadow-md transition"
              >
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${option.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">{option.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
              </div>
            );
          })}
        </div>

        {/* ═══════════════ CONTACT FORM & INFO ═══════════════ */}
        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Email */}
            <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/40 dark:to-blue-950/20 p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50 mb-3">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="font-semibold text-sm text-foreground mb-1">{t("email")}</p>
              <p className="text-xs text-muted-foreground">support@vaanikaam.com</p>
            </div>

            {/* Phone */}
            <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/40 dark:to-emerald-950/20 p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50 mb-3">
                <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="font-semibold text-sm text-foreground mb-1">{t("phone")}</p>
              <p className="text-xs text-muted-foreground">+91 70228 90011</p>
              <p className="text-[11px] text-muted-foreground mt-1">{t("workingHours")}</p>
            </div>

            {/* Location */}
            <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-950/40 dark:to-purple-950/20 p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50 mb-3">
                <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="font-semibold text-sm text-foreground mb-1">{t("hq")}</p>
              <p className="text-xs text-muted-foreground">Tower 4, Brigade Tech Gardens, Bengaluru</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              {t("sendMessage")}
            </h2>

            {status === "sent" && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30 animate-in fade-in">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-300 text-sm">{t("messageSent")}</p>
                  <p className="text-xs text-green-800 dark:text-green-400 mt-1">
                    {t("messageSentDesc")}
                  </p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-300 text-sm">{t("error")}</p>
                  <p className="text-xs text-red-800 dark:text-red-400 mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder={t("namePlaceholder")}
                  required
                  className="rounded-lg border border-input bg-background/60 px-4 py-2.5 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t("emailPlaceholder")}
                  required
                  className="rounded-lg border border-input bg-background/60 px-4 py-2.5 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder={t("phonePlaceholder")}
                  className="rounded-lg border border-input bg-background/60 px-4 py-2.5 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                />
                <select
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  className="rounded-lg border border-input bg-background/60 px-4 py-2.5 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  {reasons.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder={t("messagePlaceholder")}
                rows={3}
                required
                className="w-full rounded-lg border border-input bg-background/60 px-4 py-2.5 text-sm outline-none transition resize-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
                {status === "sent" ? t("sent") : status === "sending" ? t("sending") : t("sendBtn")}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ═══════════════ FAQ SECTION ═══════════════ */}
      <section className="px-4 py-16 bg-muted/50">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-12 text-center">{t("commonQuestions")}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {faqs.map((item, idx) => (
              <details
                key={item.question}
                className="group rounded-xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-md transition"
              >
                <summary className="flex cursor-pointer items-start gap-3 font-semibold text-foreground">
                  <span className="text-primary transition group-open:rotate-90 mt-0.5 flex-shrink-0">▶</span>
                  <span className="text-sm">{item.question}</span>
                </summary>
                <p className="mt-3 ml-6 text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SAFETY SECTION ═══════════════ */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40 p-8 shadow-sm">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50 flex-shrink-0">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">{t("safetyFirstTitle")}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("safetyFirstDesc")}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <Zap className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{t("safetyPoint1")}</span>
                  </li>
                  <li className="flex gap-2">
                    <Zap className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{t("safetyPoint2")}</span>
                  </li>
                  <li className="flex gap-2">
                    <Zap className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{t("safetyPoint3")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
