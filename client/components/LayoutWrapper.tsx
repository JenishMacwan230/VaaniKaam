"use client";

import { usePathname } from "next/navigation";
import BlogHeader from "@/components/Navbar";
import MobilePageHeader from "@/components/MobilePageHeader";
import Footer from "@/components/Footer";
import Logo from "@/components/ui/logo";
import Link from "next/link";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if current path is an auth page
  // We check for these strings in the path. Using includes covers /en/login, /gu/create-account etc.
  const isAuthPage = pathname.includes("/login") || 
                     pathname.includes("/create-account") || 
                     pathname.includes("/forgot-password") ||
                     pathname.includes("/verify-phone");

  if (isAuthPage) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="flex justify-center pt-10">
           <Link href="/">
             <Logo showText={true} size={80} />
           </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 pb-12">
          {children}
        </main>
      </div>
    );
  }

  return (
    <>
      <BlogHeader />
      {/* Page Content */}
      <main className="min-h-screen">
        <MobilePageHeader />
        {children}
      </main>
      {/* Footer */}
      <footer className="hidden lg:block border-t">
        <Footer />
      </footer>
    </>
  );
}