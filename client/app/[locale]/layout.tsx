import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

import "../globals.css";
import BlogHeader from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobilePageHeader from "@/components/MobilePageHeader";
import { locales } from "@/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!locales.includes(locale as any)) {
    notFound();
  }
  
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <BlogHeader />

          {/* Page Content */}
          <main className="min-h-screen">
            <MobilePageHeader />
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t">
            <Footer />
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
