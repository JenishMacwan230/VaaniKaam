"use client";

import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";
import BlogHeader from "@/components/Navbar";

import Logo from "@/components/ui/logo";
import Link from "next/link";
import { Globe, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Check if current path is an auth page
  // We check for these strings in the path. Using includes covers /en/login, /gu/create-account etc.
  const isAuthPage = pathname.includes("/login") || 
                     pathname.includes("/create-account") || 
                     pathname.includes("/forgot-password") ||
                     pathname.includes("/verify-phone");

  const localeSet = new Set(["en", "hi", "gu"]);
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
    
    if (localeSet.has(segments[0])) {
      segments.shift();
    }
    
    const newPath = `/${newLocale}${segments.length > 0 ? "/" + segments.join("/") : "/"}`;
    router.push(newPath);
  };

  if (isAuthPage) {
    return (
      <>
        <Toaster position="top-center" />
        <div className="flex flex-col min-h-screen bg-background">
          <header className="flex justify-between items-center pt-6 px-4 sm:px-6 w-full">
            <div className="flex-1"></div>
            <Link href="/" className="flex-1 flex justify-center">
              <Logo showText={true} size={80} />
            </Link>
            <div className="flex-1 flex justify-end">
              <Select value={currentLocale} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-auto min-w-32 md:min-w-40 rounded-full border border-border/70 bg-white/80 px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-gray-700 shadow-sm dark:bg-gray-900/80 dark:text-gray-200 flex items-center gap-2">
                  <Globe className="h-3.5 md:h-4 w-3.5 md:w-4 text-gray-500 shrink-0" />
                  <SelectValue placeholder="Select language" className="truncate" />
                </SelectTrigger>
                <SelectContent position="popper" align="end" side="bottom" className="z-50 min-w-40">
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">{lang.label}</span>
                        {currentLocale === lang.code && (
                          <Check className="h-4 w-4 text-secondary dark:text-emerald-400 shrink-0" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </header>
          <main className="flex-1 flex items-center justify-center px-4 pb-12">
            {children}
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <BlogHeader />
      {/* Page Content */}
      <main className="min-h-screen">
        {children}
      </main>
    </>
  );
}