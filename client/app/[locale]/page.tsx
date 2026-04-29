"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fetchSessionUser, resolveAccountType, AuthUser } from "@/lib/authClient";
import Logo from "@/components/ui/logo";
import { UserMenu } from "@/components/UserMenu";
import { locales } from "@/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  Globe,
  MapPin,
  Briefcase,
  TrendingUp,
  Users,
  Star,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Award,
  CheckCircle,
  Smartphone,
  Target,
  AlertCircle,
  ChevronRight,
  DollarSign,
  User,
  Mic,
  Wrench,
  Paintbrush,
  Lightbulb,
  HardHat,
  Hammer,
  Layers,
} from "lucide-react";

// ─── Brand tokens ────────────────────────────────────────────────────────────
const TEAL = "#0d9e6e";
const BLUE = "#1a7a9e";
const TEAL_L = "#14b87c";
const HERO_GRADIENT = `linear-gradient(135deg, ${BLUE} 0%, ${TEAL} 55%, ${TEAL_L} 100%)`;
const PILL_BG = "rgba(255,255,255,0.16)";
const PILL_BORDER = "rgba(255,255,255,0.28)";
const DEFAULT_PROFILE_PICTURE = "/default-avatar.png";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const GradientText: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <span
    className={className}
    style={{
      background: `linear-gradient(135deg, ${BLUE} 0%, ${TEAL} 100%)`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    }}
  >
    {children}
  </span>
);

const SectionHeading: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="text-center mb-10 md:mb-14">
    <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-2 tracking-tight">{title}</h2>
    {subtitle && <p className="text-foreground/55 text-sm md:text-base mt-1">{subtitle}</p>}
    <div className="mx-auto mt-3 h-[3px] w-12 rounded-full" style={{ background: HERO_GRADIENT }} />
  </div>
);

// ─── Notification banner card ────────────────────────────────────────────────
const NotifCard: React.FC<{ icon: string; title: string; message: string }> = ({ icon, title, message }) => (
  <div
    className="flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer group transition-all"
    style={{ background: "rgba(13,158,110,0.07)", borderColor: "rgba(13,158,110,0.22)" }}
  >
    <span className="text-2xl flex-shrink-0">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: TEAL }}>
        {title}
      </p>
      <p className="text-[13px] font-semibold text-foreground truncate">{message}</p>
    </div>
    <ChevronRight
      className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1"
      style={{ color: TEAL }}
    />
  </div>
);

// ─── Feature card ─────────────────────────────────────────────────────────────
const FeatureCard: React.FC<{
  icon: React.ElementType;
  title: string;
  desc: string;
}> = ({ icon: Icon, title, desc }) => (
  <div
    className="group relative rounded-2xl border bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
    style={{ borderColor: "rgba(13,158,110,0.18)" }}
  >
    <div
      className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
      style={{ background: "rgba(13,158,110,0.1)" }}
    >
      <Icon className="h-5 w-5" style={{ color: TEAL }} />
    </div>
    <div
      className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"
      style={{ background: HERO_GRADIENT }}
    />
    <h3 className="mb-1 text-[15px] font-bold text-foreground">{title}</h3>
    <p className="text-[13px] leading-relaxed text-foreground/55">{desc}</p>
  </div>
);

// ─── Stat card (numbers) ──────────────────────────────────────────────────────
const StatCard: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div
    className="rounded-xl border px-4 py-5 text-center"
    style={{ background: "rgba(13,158,110,0.06)", borderColor: "rgba(13,158,110,0.18)" }}
  >
    <p className="text-2xl font-extrabold" style={{ color: TEAL }}>{value}</p>
    <p className="mt-1 text-[12px] text-foreground/55 font-medium">{label}</p>
  </div>
);

// ─── Dashboard card ───────────────────────────────────────────────────────────
const DashCard: React.FC<{
  icon: React.ElementType;
  badge: string;
  badgeBg: string;
  badgeText: string;
  value: string;
  label: string;
  btnLabel: string;
  topColor: string;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
}> = ({ icon: Icon, badge, badgeBg, badgeText, value, label, btnLabel, topColor, iconBg, iconColor, onClick }) => (
  <div
    className="group relative overflow-hidden rounded-2xl border bg-white transition-all hover:-translate-y-1 hover:shadow-xl"
    style={{ borderColor: "rgba(0,0,0,0.08)" }}
  >
    <div className="h-[3px]" style={{ background: topColor }} />
    <div className="p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: iconBg }}>
          <Icon className="h-6 w-6" style={{ color: iconColor }} />
        </div>
        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: badgeBg, color: badgeText }}>
          {badge}
        </span>
      </div>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
      <p className="mb-4 text-[13px] text-foreground/55">{label}</p>
      <button
        onClick={onClick}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold text-white transition-opacity active:opacity-80"
        style={{ background: topColor }}
      >
        {btnLabel} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  </div>
);

// ─── Category chip ────────────────────────────────────────────────────────────
const CategoryChip: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
  <div
    className="group flex flex-col items-center gap-2.5 rounded-2xl border bg-white p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
    style={{ borderColor: "rgba(13,158,110,0.15)" }}
  >
    <div
      className="flex h-11 w-11 items-center justify-center rounded-full transition-colors group-hover:scale-110"
      style={{ background: "rgba(13,158,110,0.1)" }}
    >
      <Icon className="h-5 w-5" style={{ color: TEAL }} />
    </div>
    <p className="text-[13px] font-semibold text-foreground">{label}</p>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const HomePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [notifIdx, setNotifIdx] = useState(0);

  const notifications = [
    { id: 1, title: "New Opportunity!", message: "₹2,000 - Plumber needed in Bilimora", icon: "🔧" },
    { id: 2, title: "Payment Received", message: "₹5,500 credited to your account", icon: "💳" },
    { id: 3, title: "New Rating", message: "5.0★ — Great work! Excellent services", icon: "⭐" },
    { id: 4, title: "Job Near You", message: "Interior painting - 1.2 km away - ₹1,500", icon: "🎨" },
  ];

  useEffect(() => {
    const run = async () => {
      const s = await fetchSessionUser();
      setUser(s || null);
      setSessionChecked(true);
    };
    void run();
  }, []);

  useEffect(() => {
    if (notifications.length < 2) return;
    const t = setInterval(() => setNotifIdx((p) => (p + 1) % notifications.length), 4500);
    return () => clearInterval(t);
  }, [notifications.length]);

  if (!sessionChecked) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
        <Logo size={72} showText />
        <p className="mt-4 animate-pulse text-sm font-medium" style={{ color: TEAL }}>Loading…</p>
      </div>
    );
  }

  const locale = (params.locale as string) || "en";
  const currentLocale = locales.includes(locale as (typeof locales)[number]) ? locale : "en";
  const accountType = resolveAccountType(user);
  const isContractor = accountType === "contractor";

  const handleLanguageChange = (value: string) => {
    const newLocale = value.toLowerCase();
    const segments = pathname.split("/").filter(Boolean);
    if (locales.includes(segments[0] as (typeof locales)[number])) segments.shift();
    router.push(`/${newLocale}${segments.length > 0 ? "/" + segments.join("/") : "/"}`);
  };

  const greeting =
    currentLocale === "hi" ? "नमस्ते" : currentLocale === "gu" ? "નમસ્તે" : "Hello";

  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "gu", label: "ગુજરાતી" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ══════════════════════════════════════════════════
          MOBILE HERO HEADER
      ══════════════════════════════════════════════════ */}
      <header className="lg:hidden relative overflow-hidden" style={{ background: HERO_GRADIENT, paddingBottom: "20px" }}>
        {/* Decorative orbs */}
        <span className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <span className="pointer-events-none absolute -bottom-8 left-4 h-28 w-28 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
        <span className="pointer-events-none absolute top-1/2 right-8 h-16 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />

        <div className="relative z-10 px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push(user ? `/${currentLocale}/user` : `/${currentLocale}/login`)}
                className="relative h-11 w-11 overflow-hidden rounded-full border"
                style={{ background: PILL_BG, borderColor: PILL_BORDER }}
              >
                <Image
                  src={user?.profilePictureUrl || DEFAULT_PROFILE_PICTURE}
                  alt={user?.name || "User"}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              </button>
              <div>
                <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.68)" }}>{greeting}</p>
                <p className="text-[17px] font-extrabold text-white leading-tight tracking-tight">
                  {user?.name || "Guest"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Voice search"
                className="flex h-9 w-9 items-center justify-center rounded-full border"
                style={{ background: PILL_BG, borderColor: PILL_BORDER }}
              >
                <Mic className="h-4 w-4 text-white" />
              </button>
              <Select value={currentLocale} onValueChange={handleLanguageChange}>
                <SelectTrigger
                  className="h-[32px] w-auto gap-1 rounded-full border px-3 text-[12px] font-semibold text-white shadow-none"
                  style={{ background: PILL_BG, borderColor: PILL_BORDER }}
                >
                  <Globe className="h-3.5 w-3.5 shrink-0 text-white" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end" className="min-w-[148px]">
                  {languages.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-[13px]">{l.label}</span>
                        {currentLocale === l.code && <Check className="h-3 w-3 text-emerald-600" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          NOTIFICATION BANNER
      ══════════════════════════════════════════════════ */}
      <div className="relative px-4 py-3 border-b" style={{ borderColor: "rgba(13,158,110,0.15)", background: "rgba(13,158,110,0.04)" }}>
        <div className="overflow-hidden">
          <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${notifIdx * 100}%)` }}>
            {notifications.map((n) => (
              <div key={n.id} className="w-full shrink-0">
                <NotifCard icon={n.icon} title={n.title} message={n.message} />
              </div>
            ))}
          </div>
        </div>
        {/* Dots */}
        <div className="mt-2.5 flex justify-center gap-1.5">
          {notifications.map((_, i) => (
            <button
              key={i}
              onClick={() => setNotifIdx(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === notifIdx ? 24 : 6,
                background: i === notifIdx ? TEAL : "rgba(13,158,110,0.25)",
              }}
            />
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          DESKTOP HERO / MAIN CTA
      ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 py-14 md:py-24">
        {/* bg blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full opacity-20 blur-3xl" style={{ background: TEAL }} />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full opacity-15 blur-3xl" style={{ background: BLUE }} />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6">
            <Logo size={56} showText />
          </div>

          <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            <GradientText>Find Your Perfect</GradientText>
            <br />
            <span className="text-foreground">Opportunity Today</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-base text-foreground/55 md:text-lg leading-relaxed">
            Connect talented workers with amazing opportunities. Build your career with India's most trusted work platform.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {user ? (
              <>
                <button
                  onClick={() => router.push(`/${locale}/projects`)}
                  className="flex items-center gap-2 rounded-xl px-7 py-3.5 text-[15px] font-bold text-white transition-opacity active:opacity-80 shadow-md"
                  style={{ background: HERO_GRADIENT }}
                >
                  Find Jobs <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => router.push(`/${locale}/dashboard`)}
                  className="rounded-xl border-2 px-7 py-3.5 text-[15px] font-bold transition-colors"
                  style={{ borderColor: TEAL, color: TEAL }}
                >
                  Dashboard
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push(`/${locale}/create-account`)}
                  className="flex items-center gap-2 rounded-xl px-7 py-3.5 text-[15px] font-bold text-white shadow-md transition-opacity active:opacity-80"
                  style={{ background: HERO_GRADIENT }}
                >
                  Get Started <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => router.push(`/${locale}/login`)}
                  className="rounded-xl border-2 px-7 py-3.5 text-[15px] font-bold text-foreground transition-colors hover:border-current"
                  style={{ borderColor: "rgba(0,0,0,0.15)" }}
                >
                  Sign In
                </button>
              </>
            )}
          </div>

          {/* Quick stats */}
          <div className="mt-12 grid grid-cols-3 gap-3">
            <StatCard value="10K+" label="Active Users" />
            <StatCard value="5K+" label="Jobs Posted" />
            <StatCard value="4.8★" label="Avg Rating" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════ */}
      <section className="px-4 py-14 md:py-20" style={{ background: "rgba(13,158,110,0.03)" }}>
        <div className="mx-auto max-w-5xl">
          <SectionHeading title="Why Choose VaaniKaam?" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <FeatureCard icon={Zap} title="Quick Apply" desc="Apply in seconds with your verified profile" />
            <FeatureCard icon={Shield} title="Verified Workers" desc="All workers pass background verification" />
            <FeatureCard icon={Clock} title="24/7 Support" desc="Round-the-clock support for every query" />
            <FeatureCard icon={Award} title="Ratings & Reviews" desc="Build reputation with genuine client reviews" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          POPULAR JOBS (logged-in only)
      ══════════════════════════════════════════════════ */}
      {user && (
        <section className="px-4 py-14 md:py-20 bg-white">
          <div className="mx-auto max-w-5xl">
            <SectionHeading title="Popular Jobs Near You" subtitle="Opportunities matched to your location" />
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: "Plumber Needed", location: "Bilimora", pay: "₹1,200/day", dist: "1.2 km", badge: "Urgent", badgeColor: "#dc2626" },
                { title: "Painter for Interior", location: "Navsari", pay: "₹950/day", dist: "2.8 km", badge: "Today", badgeColor: TEAL },
                { title: "Construction Helper", location: "Valsad", pay: "₹1,100/day", dist: "3.4 km", badge: "Flexible", badgeColor: BLUE },
              ].map((job) => (
                <div
                  key={job.title}
                  className="group overflow-hidden rounded-2xl border bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{ borderColor: "rgba(0,0,0,0.08)" }}
                >
                  <div className="h-[3px]" style={{ background: job.badgeColor }} />
                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="text-[15px] font-bold text-foreground leading-snug">{job.title}</h3>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                        style={{ background: job.badgeColor }}
                      >
                        {job.badge}
                      </span>
                    </div>
                    <p className="mb-1 flex items-center gap-1.5 text-[13px] text-foreground/55">
                      <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: TEAL }} />
                      {job.location} · {job.dist}
                    </p>
                    <p className="mb-4 flex items-center gap-1.5 text-[14px] font-bold text-foreground">
                      <DollarSign className="h-3.5 w-3.5 shrink-0" style={{ color: TEAL }} />
                      {job.pay}
                    </p>
                    <button
                      className="w-full rounded-xl py-2.5 text-[13px] font-bold text-white transition-opacity active:opacity-80"
                      style={{ background: HERO_GRADIENT }}
                    >
                      View Job
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <button
                onClick={() => router.push(`/${locale}/projects`)}
                className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[15px] font-bold text-white shadow-md transition-opacity active:opacity-80"
                style={{ background: HERO_GRADIENT }}
              >
                View All Jobs <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════ */}
      <section className="px-4 py-14 md:py-20" style={{ background: "rgba(13,158,110,0.03)" }}>
        <div className="mx-auto max-w-5xl">
          <SectionHeading title="How It Works" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              { step: "1", title: "Create Profile", desc: "Sign up in minutes", icon: Users },
              { step: "2", title: "Browse Jobs", desc: "Find matching opportunities", icon: Target },
              { step: "3", title: "Apply Instantly", desc: "One-tap job applications", icon: Smartphone },
              { step: "4", title: "Get Hired", desc: "Start earning right away", icon: CheckCircle },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="relative">
                  <div
                    className="rounded-2xl border bg-white p-5 text-center transition-all hover:-translate-y-1 hover:shadow-md"
                    style={{ borderColor: "rgba(13,158,110,0.15)" }}
                  >
                    <div
                      className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-extrabold text-white"
                      style={{ background: HERO_GRADIENT }}
                    >
                      {item.step}
                    </div>
                    <Icon className="mx-auto mb-2 h-7 w-7" style={{ color: TEAL }} />
                    <h3 className="mb-1 text-[14px] font-bold text-foreground">{item.title}</h3>
                    <p className="text-[12px] text-foreground/50">{item.desc}</p>
                  </div>
                  {idx < 3 && (
                    <ArrowRight
                      className="absolute -right-2.5 top-1/3 hidden h-5 w-5 md:block"
                      style={{ color: "rgba(13,158,110,0.3)" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CONTRACTOR DASHBOARD
      ══════════════════════════════════════════════════ */}
      {user && isContractor && (
        <section className="px-4 py-14 md:py-20 bg-white">
          <div className="mx-auto max-w-5xl">
            <SectionHeading title="Manage Your Contracts" subtitle="Track active projects and earnings" />
            <div className="grid gap-4 md:grid-cols-3">
              <DashCard
                icon={Briefcase}
                badge="Active"
                badgeBg="rgba(13,158,110,0.12)"
                badgeText={TEAL}
                value="3"
                label="Active Contracts"
                btnLabel="View All"
                topColor={HERO_GRADIENT}
                iconBg="rgba(13,158,110,0.1)"
                iconColor={TEAL}
              />
              <DashCard
                icon={DollarSign}
                badge="This Month"
                badgeBg="rgba(26,122,158,0.12)"
                badgeText={BLUE}
                value="₹18,500"
                label="Total Earnings"
                btnLabel="Withdraw"
                topColor={`linear-gradient(135deg,${BLUE},${TEAL})`}
                iconBg="rgba(26,122,158,0.1)"
                iconColor={BLUE}
              />
              <DashCard
                icon={AlertCircle}
                badge="Pending"
                badgeBg="#fee2e2"
                badgeText="#dc2626"
                value="2"
                label="Pending Projects"
                btnLabel="Review"
                topColor="linear-gradient(135deg,#dc2626,#f87171)"
                iconBg="#fee2e2"
                iconColor="#dc2626"
              />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard value="96%" label="Completion Rate" />
              <StatCard value="4.9★" label="Average Rating" />
              <StatCard value="28" label="Total Projects" />
              <StatCard value="<2 hr" label="Response Time" />
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          WORKER DASHBOARD
      ══════════════════════════════════════════════════ */}
      {user && !isContractor && (
        <section className="px-4 py-14 md:py-20 bg-white">
          <div className="mx-auto max-w-5xl">
            <SectionHeading title="Your Work Stats" subtitle="Track your progress and opportunities" />
            <div className="grid gap-4 md:grid-cols-3">
              <DashCard
                icon={Target}
                badge="Pending"
                badgeBg="rgba(26,122,158,0.12)"
                badgeText={BLUE}
                value="5"
                label="Job Applications"
                btnLabel="View All"
                topColor={`linear-gradient(135deg,${BLUE},${TEAL_L})`}
                iconBg="rgba(26,122,158,0.1)"
                iconColor={BLUE}
              />
              <DashCard
                icon={DollarSign}
                badge="Total"
                badgeBg="rgba(13,158,110,0.12)"
                badgeText={TEAL}
                value="₹12,350"
                label="Total Earnings"
                btnLabel="History"
                topColor={HERO_GRADIENT}
                iconBg="rgba(13,158,110,0.1)"
                iconColor={TEAL}
              />
              <DashCard
                icon={Star}
                badge="4.8★"
                badgeBg="rgba(251,191,36,0.15)"
                badgeText="#b45309"
                value="87"
                label="Profile Views"
                btnLabel="Update Profile"
                topColor="linear-gradient(135deg,#f59e0b,#fbbf24)"
                iconBg="rgba(251,191,36,0.12)"
                iconColor="#f59e0b"
              />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard value="42" label="Jobs Completed" />
              <StatCard value="98%" label="On-time Rate" />
              <StatCard value="15" label="Repeat Clients" />
              <StatCard value="30 min" label="Avg Response" />
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          TRENDING CATEGORIES
      ══════════════════════════════════════════════════ */}
      <section className="px-4 py-14 md:py-20" style={{ background: "rgba(13,158,110,0.03)" }}>
        <div className="mx-auto max-w-5xl">
          <SectionHeading title="Trending Categories" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <CategoryChip icon={Wrench} label="Plumbing" />
            <CategoryChip icon={HardHat} label="Construction" />
            <CategoryChip icon={Layers} label="Cleaning" />
            <CategoryChip icon={Paintbrush} label="Painting" />
            <CategoryChip icon={Lightbulb} label="Electrical" />
            <CategoryChip icon={Hammer} label="Carpentry" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════ */}
      <footer className="border-t px-4 py-10" style={{ borderColor: "rgba(13,158,110,0.15)", background: "rgba(13,158,110,0.03)" }}>
        <div className="mx-auto max-w-5xl text-center">
          <Logo size={44} showText />
          <p className="mt-3 text-[13px] text-foreground/45">Empowering workers and businesses across India</p>
          <div className="mt-4 flex justify-center gap-5 text-[13px]">
            {["About", "Terms", "Privacy"].map((l) => (
              <button key={l} className="text-foreground/45 transition-colors hover:text-foreground">
                {l}
              </button>
            ))}
          </div>
          <p className="mt-5 text-[11px] text-foreground/30">© 2026 VaaniKaam. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
