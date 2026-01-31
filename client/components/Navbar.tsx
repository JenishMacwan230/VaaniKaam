"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Menu, X, Search, LogIn, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import Logo from "./ui/logo";

const BlogHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [language, setLanguage] = useState<"EN" | "HI" | "GU">("EN");
  const languages = [
    { code: "EN" as const, label: "English" },
    { code: "HI" as const, label: "Hindi" },
    { code: "GU" as const, label: "Gujarati" },
  ];

  const handleLanguageChange = (value: "EN" | "HI" | "GU") => {
    setLanguage(value);
  };

  const router = useRouter();
  const pathname = usePathname();
  const navContainerRef = useRef<HTMLElement | null>(null);
  const linkRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });


  const navLinks = [
    { href: "/", text: "Home" },
    { href: "/about", text: "About Us" },
    { href: "/workers", text: "Workers" },
    { href: "/business", text: "Business" },
    { href: "/projects", text: "Projects" },
    { href: "/shops", text: "Shops" },
    { href: "/contact", text: "Contact us" },
  ];

  const isLinkActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
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

  /* ---------- BODY BLUR + SCROLL LOCK ---------- */
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("menu-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("menu-open");
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.classList.remove("menu-open");
      document.body.style.overflow = "auto";
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <header
        className={`sticky top-0 z-50 w-full border-b
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
                  onClick={() => router.push(link.href)}
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
              <div className="relative">
                <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <select
                  value={language}
                  aria-label="Select language"
                  onChange={(event) => handleLanguageChange(event.target.value as "EN" | "HI" | "GU")}
                  className="appearance-none rounded-full border border-border/70 bg-white/80 pl-9 pr-8 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-secondary focus:border-secondary focus:outline-none dark:bg-gray-900/80 dark:text-gray-200"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">▼</span>
              </div>
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <Search className="h-5 w-5" />
              </button>
              <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm flex gap-1"
              >
                  
                Log In
                <LogIn className="h-5 w-5" />
              </button>

            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= MOBILE DRAWER ================= */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* BACKDROP */}
            <motion.div
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xl md:hidden"

              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* SIDEBAR */}
            <motion.aside
              className="mobile-sidebar fixed top-0 right-0 z-[70] h-full w-4/5 max-w-sm
              bg-white dark:bg-gray-900 shadow-xl p-6"
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* HEADER */}
              <div className="flex items-center justify-between mb-8">
                <Logo size={60} />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* LINKS */}
              <nav className="flex flex-col gap-3">
                {navLinks.map((link) => (
                  <button
                    key={link.text}
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push(link.href);
                    }}
                    className={`px-4 py-3 rounded-lg text-lg text-left transition-colors duration-300
                    ${isLinkActive(link.href)
                        ? "bg-gray-100 dark:bg-gray-800 text-secondary dark:text-emerald-400"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    {link.text}
                  </button>
                ))}
              </nav>


              {/* FOOTER */}
              <div className="mt-auto pt-6">
                <div className="mb-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <Globe className="h-4 w-4" />
                    Language
                  </label>
                  <select
                    value={language}
                    aria-label="Select language"
                    onChange={(event) => handleLanguageChange(event.target.value as "EN" | "HI" | "GU")}
                    className="w-full rounded-lg border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-secondary focus:outline-none dark:bg-gray-900/80 dark:text-gray-200"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/login");
                  }}
                  className="w-full flex gap-1 items-center justify-center  px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                   <LogIn className="h-5 w-5" />
                  Log In 
                </button>

              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default BlogHeader;
