"use client";

import { useState, useEffect } from "react";
import { Menu, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Logo from "./ui/logo";

const BlogHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();


  const navLinks = [
    { href: "/", text: "Home" },
    { href: "/about", text: "About Us" },
    { href: "/workers", text: "Workers" },
    { href: "/Business", text: "Business" },
    { href: "/projects", text: "Projects" },
    { href: "/shopes", text: "Shopes" },
    { href: "/contact", text: "Contact us" },
  ];


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
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <button
                  key={link.text}
                  onClick={() => router.push(link.href)}
                  className="text-md font-medium text-gray-600 dark:text-gray-300 hover:text-secondary dark:hover:text-emerald-400 transition-colors">
                  {link.text}
                </button>
              ))}
            </nav>


            {/* DESKTOP ACTIONS */}
            <div className="hidden md:flex items-center space-x-3">
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <Search className="h-5 w-5" />
              </button>
              <button
                onClick={() => router.push("/subscribe")}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
              >
                Subscribe
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
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* SIDEBAR */}
            <motion.aside
              className="mobile-sidebar fixed top-0 right-0 z-50 h-full w-4/5 max-w-sm
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
                    className="px-4 py-3 rounded-lg text-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {link.text}
                  </button>
                ))}
              </nav>


              {/* FOOTER */}
              <div className="mt-auto pt-6">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/subscribe");
                  }}
                  className="block w-full text-center px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Subscribe
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
