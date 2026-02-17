"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  Search,
  LogIn,
  Globe,
  Check,
  Home,
  Info,
  Users,
  Briefcase,
  FolderKanban,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Logo from "./ui/logo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const BlogHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  
  const locales = ["en", "hi", "gu"];
  
  // Extract current locale from pathname
  const pathSegments = pathname.split("/").filter(Boolean);
  const currentLocale = locales.includes(pathSegments[0]) ? pathSegments[0] : "en";
  
  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "gu", label: "ગુજરાતી" },
  ];

  const handleLanguageChange = (value: string) => {
    const newLocale = value.toLowerCase();
    const segments = pathname.split("/").filter(Boolean);
    
    // Remove old locale if present
    if (locales.includes(segments[0])) {
      segments.shift();
    }
    
    // Create new path with new locale
    const newPath = `/${newLocale}${segments.length > 0 ? "/" + segments.join("/") : "/"}`;
    router.push(newPath);
  };

  const navContainerRef = useRef<HTMLElement | null>(null);
  const linkRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });


  const navLinks = [
    { href: "/", text: t("home"), icon: Home },
    { href: "/about", text: t("about"), icon: Info },
    { href: "/workers", text: t("workers"), icon: Users },
    { href: "/business", text: t("business"), icon: Briefcase },
    { href: "/projects", text: t("projects"), icon: FolderKanban },
    { href: "/contact", text: t("contact"), icon: Phone },
  ];

  const isLinkActive = (href: string) => {
    if (!pathname) return false;
    const normalizedPath = pathname.replace(/^\/(en|hi|gu)(?=\/|$)/
      , "") || "/";
    const pathToCheck = normalizedPath === "" ? "/" : normalizedPath;
    if (href === "/") return pathToCheck === "/";
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

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <header
        className={`hidden md:block sticky top-0 z-50 w-full border-b
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
        transition-all duration-300
        ${isScrolled ? "py-2" : "py-5"}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`flex items-center justify-between transition-all duration-300
            ${isScrolled ? "h-14" : "h-16"}`}
          >
            <Logo size={80} />

            {/* DESKTOP NAV */}
            <nav
              ref={navContainerRef}
              className="hidden md:flex items-center space-x-8 relative pb-2"
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
                  className={`text-md font-medium transition-colors pb-1 
                  ${isLinkActive(link.href)
                      ? "text-secondary dark:text-emerald-400"
                      : "text-gray-600 dark:text-gray-300 hover:text-secondary dark:hover:text-emerald-400"}`}
                >
                  {link.text}
                </button>
              ))}
            </nav>


            {/* DESKTOP ACTIONS */}
            <div className="hidden md:flex items-center space-x-3">
              <Select value={currentLocale} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-40 rounded-full border border-border/70 bg-white/80 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm dark:bg-gray-900/80 dark:text-gray-200">
                  <Globe className="mr-2 h-4 w-4 text-gray-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-40">
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
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <Search className="h-5 w-5" />
              </button>
              <button
                onClick={() => router.push(`/${currentLocale}/login`)}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm flex gap-1"
              >
                  
                {t("login")}
                <LogIn className="h-5 w-5" />
              </button>

            </div>

            {/* MOBILE TOP ACTIONS */}
            <div className="md:hidden flex items-center gap-2">
              <Select value={currentLocale} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-28 rounded-full border border-border/70 bg-white/80 px-2 py-1.5 text-xs font-medium text-gray-700 shadow-sm dark:bg-gray-900/80 dark:text-gray-200">
                  <Globe className="mr-1 h-3.5 w-3.5 text-gray-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-28">
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
            </div>
          </div>
        </div>
      </header>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="mx-auto mb-3 w-[calc(100%-1.5rem)] max-w-md rounded-2xl border border-border/60 bg-white/90 shadow-[0_14px_36px_-18px_rgba(0,0,0,0.45)] backdrop-blur-md dark:bg-gray-900/90">
          <div className="grid grid-cols-6 items-stretch gap-1 px-1.5 py-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = isLinkActive(link.href);
            return (
              <button
                key={link.text}
                onClick={() => router.push(`/${currentLocale}${link.href === "/" ? "" : link.href}`)}
                className={`relative flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition-all
                ${isActive
                    ? "bg-secondary/15 text-secondary shadow-sm ring-1 ring-secondary/35"
                    : "text-gray-600 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:bg-gray-800/60"}`}
              >
                <Icon className="h-5 w-5" />
                <span className="leading-none">{link.text}</span>
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
