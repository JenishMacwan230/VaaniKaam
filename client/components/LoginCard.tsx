'use client';

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { getCurrentLocale, resolveAccountType } from "@/lib/authClient";
import VoiceTextInput from "@/components/VoiceTextInput";
import VoicePhoneInput from "@/components/VoicePhoneInput";
import { useTranslations } from "next-intl";

// Language code mapping for voice
const getVoiceLanguage = (locale: string): string => {
  const mapping: Record<string, string> = {
    en: "en",
    hi: "hi",
    gu: "gu",
  };
  return mapping[locale] || "en";
};

export default function LoginCard() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = getCurrentLocale(pathname);
  const voiceLanguage = getVoiceLanguage((params?.locale as string) || locale);
  const t = useTranslations("login");
  const t2 = useTranslations("createAccount"); // For phone placeholder if needed
  
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePasswordChange = (val: string) => {
    // Strip spaces from password (backend rejects spaces)
    setPassword(val.replace(/\s/g, ""));
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
        setError(data.message || t("loginFailed"));
        return;
      }

      const accountType = resolveAccountType(data.user);
      const homePath = `/${locale}`;

      // Keep account type normalization in local storage for home role sections.
      localStorage.setItem("user", JSON.stringify({ ...data.user, accountType }));
      // Also store auth token so subsequent API calls can send Authorization header
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }
      globalThis.window.dispatchEvent(new Event("auth-changed"));
      router.replace(homePath);
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative rounded-3xl border border-border bg-card p-8 shadow-2xl">
      <div className="absolute inset-x-12 top-6 h-1 rounded-full bg-linear-to-r from-primary via-secondary to-accent opacity-60" />
      <div className="relative space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t("mobileAccess")}</p>
          <h2 className="text-3xl font-semibold">{t("welcomeBack")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <VoicePhoneInput
            phoneNumber={phone}
            onPhoneNumberChange={setPhone}
            language={voiceLanguage}
            placeholder={t2("phonePlaceholder")}
            disabled={loading}
            showHelper={true}
            autoSpeak={false}
          />

          <div className="space-y-2 text-sm font-medium">
            <span>{t("passwordLabel")}</span>
            <VoiceTextInput
              value={password}
              onChange={handlePasswordChange}
              label=""
              placeholder={t("passwordPlaceholder")}
              language={voiceLanguage}
              disabled={loading}
              type="text"
              showHelper={true}
              autoSpeak={false}
              hint="Please speak or type your password"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p className="font-medium text-muted-foreground">{t("rememberDevice")}</p>
            <Link href={`/${locale}/forgot-password`} className="font-medium text-primary hover:text-primary/80">
              {t("forgotPassword")}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || phone.length !== 10 || !password}
            className="w-full rounded-2xl bg-linear-to-r from-primary via-secondary to-accent py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("signingIn") : t("signIn")}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t("newUser")}{" "}
          <Link href={`/${locale}/create-account`} className="text-primary underline-offset-4 hover:underline">
            {t("createAccount")}
          </Link>
        </p>
      </div>
    </section>
  );
}
