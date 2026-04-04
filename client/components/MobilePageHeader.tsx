"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Globe, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { locales } from "@/i18n";
import { UserAvatar } from "./UserAvatar";
import { AuthUser } from "@/lib/authClient";
import { Volume2, VolumeX } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "": "Home",
  about: "About",
  workers: "Workers",
  business: "Business",
  projects: "Projects",
  shops: "Shops",
  contact: "Contact",
  login: "Login",
  "create-account": "Create Account",
  verify: "Verify",
  "forgot-password": "Forgot Password",
};

function toTitleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function MobilePageHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const firstPathSegment = pathname.split("/").at(1) || "";
  const currentLocale = locales.includes(firstPathSegment as (typeof locales)[number])
    ? firstPathSegment
    : "en";
  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "gu", label: "ગુજરાતી" },
  ];

  const handleLanguageChange = (value: string) => {
    const newLocale = value.toLowerCase();
    const segments = pathname.split("/").filter(Boolean);

    if (locales.includes(segments[0] as (typeof locales)[number])) {
      segments.shift();
    }

    const newPath = `/${newLocale}${segments.length > 0 ? "/" + segments.join("/") : "/"}`;
    router.push(newPath);
  };

  useEffect(() => {
    const checkUser = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkUser();
    window.addEventListener("auth-changed", checkUser);
    return () => window.removeEventListener("auth-changed", checkUser);
  }, []);

  const pageTitle = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const routeSegments = segments.slice(1);

    if (routeSegments.length === 0) {
      return PAGE_TITLES[""];
    }

    const firstSegment = routeSegments[0];
    const nestedSegment = routeSegments.at(-1) || "";

    if (routeSegments.length > 1 && PAGE_TITLES[nestedSegment]) {
      return PAGE_TITLES[nestedSegment];
    }

    if (PAGE_TITLES[firstSegment]) {
      return PAGE_TITLES[firstSegment];
    }

    return toTitleCase(firstSegment);
  }, [pathname]);

  const isHomePage = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const routeSegments = segments.slice(1);
    return routeSegments.length === 0;
  }, [pathname]);

  const greetingText = currentLocale === "hi" || currentLocale === "gu" ? "Namaste" : "Hello";

  if (isHomePage) {
    return (
      <section className="lg:hidden border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75">
        <div className="w-full px-4 py-3">
          <div className="flex w-full items-center justify-between gap-3 py-1">
            <div className="flex min-w-0 items-center gap-3">
              <div 
                onClick={() => user ? router.push(`/${currentLocale}/dashboard`) : router.push(`/${currentLocale}/login`)}
                className="cursor-pointer"
              >
                  {user ? (
                    <UserAvatar user={user} className="h-11 w-11" />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary">
                        <User className="h-6 w-6" />
                    </span>
                  )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{greetingText}</p>
                <p className="truncate text-lg font-semibold text-foreground">{user?.name || "Guest"}</p>
              </div>
            </div>

            <Select value={currentLocale} onValueChange={handleLanguageChange}>
              <SelectTrigger className="h-9 w-28 rounded-full border border-border/70 bg-background px-2 py-1.5 text-xs font-medium text-foreground shadow-sm">
                <Globe className="mr-1 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" className="min-w-32">
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <span>{lang.label}</span>
                      {currentLocale === lang.code && <Check className="h-4 w-4 text-secondary" />}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="lg:hidden border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75">
      <div className="w-full px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">VaaniKaam</p>
          <div className="flex items-center gap-2">
             {/* {user && (
                <div 
                  onClick={() => router.push(`/${currentLocale}/dashboard`)}
                  className="cursor-pointer"
                >
                  <UserAvatar user={user} className="h-8 w-8" />
                </div>
             )} */}
             <Volume2 />
            <Select value={currentLocale} onValueChange={handleLanguageChange}>
              <SelectTrigger className="h-9 w-28 rounded-full border border-border/70 bg-background px-2 py-1.5 text-xs font-medium text-foreground shadow-sm">
                <Globe className="mr-1 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" className="min-w-32">
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <span>{lang.label}</span>
                      {currentLocale === lang.code && <Check className="h-4 w-4 text-secondary" />}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <h1 className="mt-1 text-xl font-semibold leading-tight text-foreground">{pageTitle}</h1>
      </div>
    </section>
  );
}
