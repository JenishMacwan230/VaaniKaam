"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HelpCircle,
  Mail,
  Info,
  User as UserIcon,
  ArrowLeft,
} from "lucide-react";

import { AuthUser, fetchSessionUser, getCurrentLocale, resolveAccountType, logoutSession } from "@/lib/authClient";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UserHubPage() {
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

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Loading your account...</p>
      </main>
    );
  }

  const locale = getCurrentLocale(pathname);
  const accountType = resolveAccountType(user);
  const dashboardHref =
    accountType === "contractor"
      ? `/${locale}/dashboard/contractor`
      : `/${locale}/dashboard`;

  const sections = [
    {
      key: "profile",
      title: "Profile",
      description: "View and edit your personal details, skills and languages.",
      href: `/${locale}/profile`,
      icon: UserIcon,
    },
    {
      key: "dashboard",
      title: "Dashboard",
      description: "Track your work, availability and profile completion.",
      href: dashboardHref,
      icon: LayoutDashboard,
    },
    {
      key: "help",
      title: "Help & support",
      description: "Get help with using VaaniKaam or report an issue.",
      href: `/${locale}/help-support`,
      icon: HelpCircle,
    },
    {
      key: "contact",
      title: "Contact us",
      description: "Talk to our team for partnerships, jobs or support.",
      href: `/${locale}/contact`,
      icon: Mail,
    },
    {
      key: "about",
      title: "About us",
      description: "Learn more about the VaaniKaam mission and vision.",
      href: `/${locale}/about`,
      icon: Info,
    },
  ];

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
    <main className="min-h-screen bg-background text-foreground pb-24 lg:pb-8">
      <section className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
        <div className="mb-4 flex justify-start">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/40"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>

        <div className="mb-6 sm:mb-8 flex flex-col items-center gap-4 text-center">
          <UserAvatar user={user} className="h-16 w-16 sm:h-20 sm:w-20" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Signed in as</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold leading-tight">
              {user.name || "User"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.phone || user.email || "No contact details added yet"}
            </p>
          </div>
        </div>

        <Card className="border border-border/70 bg-card/95 shadow-lg">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center justify-between">
              <span>Account center</span>
              <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                {accountType === "contractor" ? "Contractor" : "Worker"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => router.push(section.href)}
                  className="w-full rounded-2xl border border-border/70 bg-background/60 px-4 py-3 sm:px-5 sm:py-4 text-left transition hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 flex items-start gap-3 sm:gap-4"
                >
                  <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm sm:text-base font-semibold text-foreground">
                      {section.title}
                    </span>
                    <span className="mt-0.5 block text-xs sm:text-sm text-muted-foreground">
                      {section.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            variant="destructive"
            className="w-full rounded-2xl py-3 text-sm font-semibold"
            onClick={handleLogout}
          >
            Log out
          </Button>

          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            Manage all your VaaniKaam settings and pages from here.
          </p>
        </div>
      </section>
    </main>
  );
}
