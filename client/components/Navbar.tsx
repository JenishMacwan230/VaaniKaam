"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  Search,
  LogIn,
  LogOut,
  Globe,
  Check,
  Home,
  Info,
  Users,
  FolderKanban,
  Phone,
  Briefcase,
  Bell,
  User as UserIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { fetchSessionUser, logoutSession, AuthUser, resolveAccountType } from "@/lib/authClient";
import Logo from "./ui/logo";
import { UserMenu } from "./UserMenu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const BlogHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const isLoggedIn = !!user;
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  
  const localeSet = new Set(["en", "hi", "gu"]);
  
  // Extract current locale from pathname
  const currentLocaleSegment = pathname.split("/")[1] ?? "";
  const currentLocale = localeSet.has(currentLocaleSegment) ? currentLocaleSegment : "en";
  
  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "gu", label: "ગુજરાતી" },
  ];

  const handleLanguageChange = (value: string) => {
    const newLocale = value.toLowerCase();
    const segments = pathname.split("/").filter(Boolean);
    
    // Remove old locale if present
    if (localeSet.has(segments[0])) {
      segments.shift();
    }
    
    // Create new path with new locale
    const newPath = `/${newLocale}${segments.length > 0 ? "/" + segments.join("/") : "/"}`;
    router.push(newPath);
  };

  const navContainerRef = useRef<HTMLElement | null>(null);
  const linkRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  // Determine user account type
  const accountType = resolveAccountType(user);
  const isContractor = accountType === "contractor";

  const getNavLinks = () => {
    const baseLinks = [
      { href: "/", text: t("home"), icon: Home },
      { href: "/workers", text: t("workers"), icon: Users },
    ];

    // Add projects or add-works based on account type
    baseLinks.push({
      href: isContractor ? "/add-works" : "/projects",
      text: isContractor ? t("add-works") : t("projects"),
      icon: FolderKanban,
    });

    // Add "My Work" link for logged-in users
    if (user) {
      if (isContractor) {
        baseLinks.push({
          href: "/dashboard/contractor",
          text: "My Projects",
          icon: Briefcase,
        });
      } else {
        baseLinks.push({
          href: "/dashboard/worker",
          text: "My Work",
          icon: Briefcase,
        });
      }
    }

    baseLinks.push({ href: "/user", text: t("user"), icon: UserIcon });

    return baseLinks;
  };

  const navLinks = getNavLinks();

  const isLinkActive = (href: string) => {
    if (!pathname) return false;
    // Remove locale prefix to get the path
    const segments = pathname.split("/").filter(Boolean);
    const localeSet = new Set(["en", "hi", "gu"]);
    
    // Remove locale if it's at the start
    if (localeSet.has(segments[0])) {
      segments.shift();
    }

    const normalizedPath = "/" + segments.join("/");
    const pathToCheck = normalizedPath === "/" ? "/" : normalizedPath;

    // Treat related account pages as part of the "User" section
    if (href === "/user") {
      const userSectionPrefixes = [
        "/user",
        "/profile",
        "/contact",
        "/about",
        "/dashboard",
        "/dashboard/worker",
        "/dashboard/contractor",
      ];

      return userSectionPrefixes.some((base) =>
        pathToCheck === base || pathToCheck.startsWith(`${base}/`),
      );
    }

    if (href === "/") {
      // For home, check if path is root
      return pathToCheck === "/" || segments.length === 0;
    }

    return pathToCheck === href || pathToCheck.startsWith(`${href}/`);
  };
  const activeIndex = navLinks.findIndex((link) => isLinkActive(link.href));

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const container = navContainerRef.current;
      if (!container) return;

      if (activeIndex === -1) {
        setIndicatorStyle({ width: 0, left: 0 });
        return;
      }

      const activeButton = linkRefs.current[activeIndex];

      if (!activeButton) {
        setIndicatorStyle({ width: 0, left: 0 });
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeButton.getBoundingClientRect();

      setIndicatorStyle({
        width: activeRect.width,
        left: activeRect.left - containerRect.left,
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [pathname, activeIndex]);


  /* ---------- SCROLL SHRINK ---------- */
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const syncAuthState = async () => {
      const u = await fetchSessionUser();
      setUser(u);
    };

    void syncAuthState();
    
    // Listen for storage changes (other tabs)
    const onStorage = () => {
      void syncAuthState();
    };
    
    // Listen for auth changes (login/logout)
    const onAuthChanged = () => {
      // Add small delay to ensure backend session is ready
      setTimeout(() => {
        void syncAuthState();
      }, 100);
    };
    
    globalThis.window.addEventListener("storage", onStorage);
    globalThis.window.addEventListener("auth-changed", onAuthChanged);
    
    return () => {
      globalThis.window.removeEventListener("storage", onStorage);
      globalThis.window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, [pathname]);

  const handleLogin = () => {
    router.push(`/${currentLocale}/login`);
  };

  // Check if on home page
  const isHomePage = () => {
    const segments = pathname.split("/").filter(Boolean);
    const localeSet = new Set(["en", "hi", "gu"]);
    if (localeSet.has(segments[0])) {
      segments.shift();
    }
    return segments.length === 0;
  };

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <header
        className={`hidden lg:block sticky top-0 z-40 w-full border-b
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
        transition-all duration-300
        ${isScrolled ? "py-2" : "py-3 md:py-5"}`}
      >
        <div className="w-full px-3 sm:px-4 md:px-6">
          <div
            className={`flex items-center justify-between max-w-7xl mx-auto transition-all duration-300
            ${isScrolled ? "h-14" : "h-16"}`}
          >
            <Logo size={isScrolled ? 60 : 80} />

            {/* DESKTOP NAV */}
            <nav
              ref={navContainerRef}
              className="hidden lg:flex items-center space-x-4 md:space-x-8 relative pb-2"
            >
              {indicatorStyle.width > 0 && (
                <motion.span
                  className="absolute bottom-0 h-0.5 rounded-full bg-secondary dark:bg-emerald-400"
                  initial={false}
                  animate={{ width: indicatorStyle.width, x: indicatorStyle.left }}
                  transition={{ type: "tween", duration: 0.3, ease: "linear" }}
                />
              )}
              {navLinks.map((link, index) => (
                <button
                  key={link.text}
                  onClick={() => router.push(`/${currentLocale}${link.href === "/" ? "" : link.href}`)}
                  ref={(node) => {
                    linkRefs.current[index] = node;
                  }}
                  className={`text-sm sm:text-md font-medium transition-colors pb-1 whitespace-nowrap
                  ${isLinkActive(link.href)
                      ? "text-secondary dark:text-emerald-400"
                      : "text-gray-600 dark:text-gray-300 hover:text-secondary dark:hover:text-emerald-400"}`}
                >
                  {link.text}
                </button>
              ))}
            </nav>


            {/* DESKTOP ACTIONS */}
            <div className="hidden lg:flex items-center space-x-2 md:space-x-3">
              <Select value={currentLocale} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-28 md:w-40 rounded-full border border-border/70 bg-white/80 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium text-gray-700 shadow-sm dark:bg-gray-900/80 dark:text-gray-200">
                  <Globe className="mr-1 md:mr-2 h-3.5 md:h-4 w-3.5 md:w-4 text-gray-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-32 md:min-w-40">
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-2">
                        <span>{lang.label}</span>
                        {currentLocale === lang.code && (
                          <Check className="h-4 w-4 text-secondary dark:text-emerald-400" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <Search className="h-4 md:h-5 w-4 md:w-5" />
              </button>
              {user ? (
                <UserMenu user={user} />
              ) : (
                <button
                  onClick={handleLogin}
                  className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm flex gap-1 whitespace-nowrap"
                >
                  <span className="hidden sm:inline">{t("login")}</span>
                  <LogIn className="h-4 md:h-5 w-4 md:w-5" />
                </button>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* ================= TABLET & MOBILE BOTTOM NAV ================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="mx-auto mb-3 w-[calc(100%-1.5rem)] rounded-2xl border border-border/60 bg-white/90 shadow-[0_14px_36px_-18px_rgba(0,0,0,0.45)] backdrop-blur-md dark:bg-gray-900/90">
          <div className="grid grid-flow-col auto-cols-fr items-stretch gap-1 px-2 py-2.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = isLinkActive(link.href);
              return (
                <button
                  key={link.text}
                  onClick={() => router.push(`/${currentLocale}${link.href === "/" ? "" : link.href}`)}
                  className={`relative flex flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2.5 text-[10px] font-medium transition-all
                  ${isActive
                      ? "bg-secondary/15 text-secondary shadow-sm ring-1 ring-secondary/35"
                      : "text-gray-600 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:bg-gray-800/60"}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="leading-none text-center">{link.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

export default BlogHeader;
