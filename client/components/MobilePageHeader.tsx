"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";

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
  const [userName, setUserName] = useState("Guest");
  const currentLocale = pathname.split("/").filter(Boolean)[0] || "en";

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) return;

    try {
      const parsedUser = JSON.parse(savedUser) as {
        name?: string;
        fullName?: string;
        displayName?: string;
      };

      const resolvedName =
        parsedUser.name || parsedUser.fullName || parsedUser.displayName || "Guest";

      setUserName(resolvedName);
    } catch {
      setUserName("Guest");
    }
  }, []);

  const pageTitle = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const routeSegments = segments.slice(1);

    if (routeSegments.length === 0) {
      return PAGE_TITLES[""];
    }

    const firstSegment = routeSegments[0];
    const nestedSegment = routeSegments[routeSegments.length - 1];

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
      <section className="md:hidden border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75">
        <div className="container mx-auto px-4 py-3">
          <div className="mx-auto flex w-full max-w-sm items-center gap-3 px-4 py-1">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary">
              <User className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">{greetingText}</p>
              <p className="truncate text-lg font-semibold text-foreground">{userName}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="md:hidden border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75">
      <div className="container mx-auto px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">VaaniKaam</p>
        <h1 className="mt-1 text-xl font-semibold leading-tight text-foreground">{pageTitle}</h1>
      </div>
    </section>
  );
}
