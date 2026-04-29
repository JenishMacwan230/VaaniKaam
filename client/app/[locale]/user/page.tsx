"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HelpCircle,
  Mail,
  Info,
  User as UserIcon,
  ArrowLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import {
  AuthUser,
  fetchSessionUser,
  getCurrentLocale,
  resolveAccountType,
  logoutSession,
} from "@/lib/authClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfilePictureManager } from "@/components/ProfilePictureManager";
import { useTranslations } from "next-intl";

export default function UserHubPage() {
  const t = useTranslations("userPage");
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const sessionUser = await fetchSessionUser();
      if (!sessionUser) {
        const locale = getCurrentLocale(pathname);
        router.replace(`/${locale}/login`);
        return;
      }
      setUser(sessionUser);
      setLoading(false);
    };
    void load();
  }, [pathname, router]);

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }, [user?.name]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-teal-500/30 border-t-teal-500 animate-spin" />
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </main>
    );
  }

  const locale = getCurrentLocale(pathname);
  const accountType = resolveAccountType(user);
  const isContractor = accountType === "contractor";
  const dashboardHref = isContractor
    ? `/${locale}/dashboard/contractor`
    : `/${locale}/dashboard`;

  const sections = [
    {
      key: "profile",
      title: t("profileTitle"),
      description: t("profileDesc"),
      href: `/${locale}/dashboard?editProfile=1`,
      icon: UserIcon,
      color: "violet",
    },
    {
      key: "dashboard",
      title: t("dashboardTitle"),
      description: t("dashboardDesc"),
      href: dashboardHref,
      icon: LayoutDashboard,
      color: "blue",
    },
    {
      key: "help",
      title: t("helpTitle"),
      description: t("helpDesc"),
      href: `/${locale}/help-support`,
      icon: HelpCircle,
      color: "amber",
    },
    {
      key: "about",
      title: t("aboutTitle"),
      description: t("aboutDesc"),
      href: `/${locale}/about`,
      icon: Info,
      color: "cyan",
    },
  ];

  const iconColors: Record<string, string> = {
    violet:  "from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400",
    blue:    "from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400",
    amber:   "from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400",
    emerald: "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400",
    cyan:    "from-cyan-500/20 to-sky-500/20 text-cyan-600 dark:text-cyan-400",
  };

  const handleLogout = async () => {
    await logoutSession();
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("firebaseToken");
      window.dispatchEvent(new Event("auth-changed"));
    }
    router.push(`/${locale}`);
  };


  return (
    <div className="min-h-screen bg-background">

      {/* ── Compact Gradient Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600/50 via-emerald-600/50 to-cyan-700/50 dark:from-teal-700/50 dark:via-emerald-700/50 dark:to-cyan-800/50 px-4 pt-8 pb-20 sm:pt-10 sm:pb-24">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-8 -right-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-8 h-36 w-36 rounded-full bg-teal-400/20 blur-2xl" />

        <div className="relative mx-auto max-w-lg">
          {/* ── Side-by-side layout: avatar left, info right ── */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0 ml-7">
              <div className="rounded-full p-[3px] bg-white/30 shadow-xl">
                <ProfilePictureManager
                  user={user}
                  onUserUpdate={setUser}
                  size={96}
                  buttonClassName="absolute bottom-0 right-0 bg-secondary hover:bg-secondary/90 text-white p-2 rounded-full shadow-lg dark:bg-emerald-600 dark:hover:bg-emerald-700"
                  imageClassName="h-full w-full object-cover rounded-full"
                />
              </div>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/65 leading-none mb-1">{t("signedInAs")}</p>
              <h1 className="text-xl sm:text-2xl font-bold text-black leading-tight truncate">
                {user.name || t("defaultName")}
              </h1>
              <p className="mt-1 text-sm text-black/80 truncate">
                {user.phone || user.email || t("noContact")}
              </p>

              {/* Account type + verified chip row */}
              <div className="mt-2.5 flex flex-wrap gap-2">
                <span className="flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-black">
                  <ShieldCheck className="h-3 w-3" />
                  {isContractor ? t("contractor") : t("worker")}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-medium text-black/80">
                  <Sparkles className="h-3 w-3" />
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Card — overlaps header ── */}
      <div className="relative z-10 mx-auto -mt-10 max-w-lg px-4 pb-16 sm:px-6">
        <Card className="border-0 shadow-2xl shadow-black/10 dark:shadow-black/30 rounded-2xl overflow-hidden">
          <CardContent className="p-5 sm:p-8 space-y-6">

            {/* Section label */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-600 dark:text-teal-400">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold text-foreground">{t("accountCentre")}</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
            </div>

            {/* Navigation items */}
            <div className="space-y-2.5">
              {sections.map((section) => {
                const Icon = section.icon;
                const colorClass = iconColors[section.color];
                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => router.push(section.href)}
                    className="group w-full rounded-2xl border border-border/50 bg-card hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md hover:shadow-teal-500/10 px-4 py-3.5 text-left transition-all duration-200 flex items-center gap-3.5"
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-foreground leading-tight">
                        {section.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground leading-snug">
                        {section.description}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Logout */}
            <div className="space-y-3">
              <Button
                type="button"
                onClick={handleLogout}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-semibold shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {t("logOut")}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Manage all your VaaniKaam settings and pages from here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}