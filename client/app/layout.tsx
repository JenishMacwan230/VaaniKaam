import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import "./globals.css";
import BlogHeader from "@/components/Navbar";
import Footer from "@/components/Footer";
// import { locales } from "@/i18n";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Fixed Navbar */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
          <BlogHeader />
        </header>

        {/* Page Content */}
        <main className="pt-16 min-h-screen">
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </main>

        {/* Footer */}
        <footer className="border-t">
          <Footer />
        </footer>
      </body>
    </html>
  );
}
