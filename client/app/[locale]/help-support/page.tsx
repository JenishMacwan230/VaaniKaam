"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getCurrentLocale } from "@/lib/authClient";

const supportActions = [
  {
    title: "Start a support request",
    description: "Share what you need and we will respond within one business day.",
    actionLabel: "Open contact form",
    anchor: "contact",
  },
  {
    title: "Account & login help",
    description: "Reset access, verify your phone, or update your profile details.",
    actionLabel: "View guidance",
    anchor: "faq",
  },
  {
    title: "Report a safety issue",
    description: "Flag urgent concerns and we will prioritize follow-up.",
    actionLabel: "Report now",
    anchor: "contact",
  },
  {
    title: "Talk to a coordinator",
    description: "Call or email our team during working hours.",
    actionLabel: "See contact options",
    anchor: "details",
  },
];

const faqs = [
  {
    question: "How soon will I get a response?",
    answer: "Most requests are answered within one business day. Urgent safety issues are prioritized.",
  },
  {
    question: "I am not receiving an OTP. What should I do?",
    answer: "Check your network, request a resend from the previous screen, and confirm your phone number is correct.",
  },
  {
    question: "How do I update my availability or skills?",
    answer: "Go to Profile in your account center and save changes. Updates appear instantly for employers.",
  },
  {
    question: "Can I report a job posting?",
    answer: "Yes. Use the contact form and share the job title, location, and reason for concern.",
  },
];

export default function HelpSupportPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getCurrentLocale(pathname);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-3xl px-6 py-16">
        <div className="mb-6 flex justify-start">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/40"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>

        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Help & Support</p>
          <h1 className="text-3xl sm:text-4xl font-semibold">We are here to help</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Find quick answers, contact our support team, or report an issue.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${locale}/contact`}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Contact support
            </Link>
            <a
              href="#faq"
              className="rounded-full border border-border/70 px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent/40"
            >
              View FAQs
            </a>
          </div>
        </header>

        <section className="mt-10 space-y-5">
          <h2 className="text-lg font-semibold">What can we help with?</h2>
          <div className="space-y-4">
            {supportActions.map((item) => {
              const href = item.anchor === "contact" ? `/${locale}/contact` : `#${item.anchor}`;
              return (
                <Link
                  key={item.title}
                  href={href}
                  className="block rounded-xl border border-border/70 px-4 py-3 transition hover:bg-accent/30"
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-2 text-sm font-semibold text-primary">{item.actionLabel}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="details" className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold">Support details</h2>
          <p className="text-sm text-muted-foreground">Monday to Saturday, 9:00 AM - 7:00 PM IST</p>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Email:</span> support@vaanikaam.com
            </p>
            <p>
              <span className="font-semibold">Phone:</span> +91 70228 90011
            </p>
            <p>
              <span className="font-semibold">HQ:</span> Tower 4, Brigade Tech Gardens, Bengaluru
            </p>
          </div>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-semibold">Safety & trust</h2>
          <p className="text-sm text-muted-foreground">
            If you ever feel unsafe or see suspicious activity, reach out immediately. Our team will
            coordinate the right next steps.
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            <li>Share job title, location, and what happened</li>
            <li>Include screenshots or recordings if available</li>
            <li>We respond quickly and discreetly</li>
          </ul>
        </section>

        <section id="faq" className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((item) => (
              <div key={item.question} className="rounded-xl border border-border/70 px-4 py-3">
                <p className="text-sm font-semibold">{item.question}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
