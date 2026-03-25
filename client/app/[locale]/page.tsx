"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { fetchSessionUser, resolveAccountType } from "@/lib/authClient";
import Logo from "@/components/ui/logo";

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 8l4 4m0 0l-4 4m4-4H3"
    />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const Hero3: React.FC = () => {
  const t = useTranslations("hero");
  const router = useRouter();
  const params = useParams();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<{
    name?: string;
    location?: string;
    accountType?: "worker" | "contractor";
    workCategory?: string;
    email?: string;
  } | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    location: "",
    workCategory: "",
    email: "",
  });
  
  const features = [
    t("feature1"),
    t("feature2"),
    t("feature3"),
  ];

  const workerJobs = [
    { id: "WJ-01", title: "Tiles helper needed", city: "Surat", pay: "INR 1000/day" },
    { id: "WJ-02", title: "Painter for 2 days", city: "Surat", pay: "INR 900/day" },
  ];

  const workerApplications = [
    { id: "WA-11", title: "Pipe fitting helper", status: "Pending" },
    { id: "WA-12", title: "Site cleaning", status: "Shortlisted" },
  ];

  const contractorPostedJobs = [
    { id: "CJ-21", title: "Need 3 Mason Helpers", status: "Open" },
    { id: "CJ-22", title: "Site Cleaning Crew", status: "Open" },
  ];

  const contractorApplicants = [
    { id: "CA-1", name: "Ravi Kumar", role: "Electric helper" },
    { id: "CA-2", name: "Asha Patel", role: "Painter" },
  ];

  useEffect(() => {
    const hydrateSession = async () => {
      const sessionUser = await fetchSessionUser();

      if (!sessionUser) {
        localStorage.removeItem("user");
        setUser(null);
        setIsEditing(false);
        // Redirect to login if not authenticated
        const locale = params.locale as string || "en";
        router.push(`/${locale}/login`);
        return;
      }

      const accountType = resolveAccountType(sessionUser);
      const normalizedUser = { ...sessionUser, accountType };
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      setDraft({
        name: normalizedUser.name || "",
        location: normalizedUser.location || "",
        workCategory: normalizedUser.workCategory || "",
        email: normalizedUser.email || "",
      });
      setSessionChecked(true);
    };

    void hydrateSession();

    const onAuthChanged = () => {
      void hydrateSession();
    };

    globalThis.window.addEventListener("auth-changed", onAuthChanged);
    globalThis.window.addEventListener("storage", onAuthChanged);

    return () => {
      globalThis.window.removeEventListener("auth-changed", onAuthChanged);
      globalThis.window.removeEventListener("storage", onAuthChanged);
    };
  }, []);

  const handleSaveProfile = () => {
    if (!user) return;

    const updated = {
      ...user,
      name: draft.name.trim(),
      location: draft.location.trim(),
      workCategory: draft.workCategory.trim(),
      email: draft.email.trim(),
    };

    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
    setIsEditing(false);
  };

  const roleTitle = useMemo(() => {
    if (user?.accountType === "contractor") return "Contractor workspace";
    return "Worker workspace";
  }, [user?.accountType]);

  if (!sessionChecked) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
        <Logo size={80} showText={true} />
        <p className="mt-4 text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black w-full">
      <Separator />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <main className="py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black dark:text-white leading-tight">
              {t("title")}
              <br />
              <span className="text-gray-600 dark:text-gray-400">
                {t("subtitle")}
              </span>
            </h1>

            <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t("description")}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-6">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
                >
                  <CheckIcon className="h-5 w-5 text-black dark:text-white" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-md font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                {t("cta1")}
                <ArrowRightIcon className="h-5 w-5" />
              </button>
              <button className="border-2 border-black dark:border-white text-black dark:text-white px-8 py-4 rounded-md font-semibold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                {t("cta2")}
              </button>
            </div>

            <div className="mt-16 pt-16 border-t border-gray-200 dark:border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-black dark:text-white">
                    10K+
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {t("users")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-black dark:text-white">
                    500+
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {t("companies")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-black dark:text-white">
                    4.9/5
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {t("ratings")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Separator />
    </div>
  );
};

export default Hero3;
