import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BlogHeader from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VaaniKaam",
  description: "Daily wage worker job platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Fixed Navbar */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
          <BlogHeader />
        </header>

        {/* Page Content */}
        <main className="pt-16 min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t">
          <Footer />
        </footer>
      </body>
    </html>
  );
}
