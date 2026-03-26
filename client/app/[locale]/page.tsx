"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchSessionUser, resolveAccountType, logoutSession, updateSessionProfile } from "@/lib/authClient";
import { UserAvatar } from "@/components/UserAvatar";
import Logo from "@/components/ui/logo";
import { MapPin, Bell, BriefcaseBusiness, IndianRupee, Star, LogOut, CheckCircle2 } from "lucide-react";

const WorkerHomePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [user, setUser] = useState<{
    id?: string;
    name?: string;
    location?: string;
    accountType?: "worker" | "contractor";
    activeRole?: string;
    workCategory?: string;
    profession?: string;
    skills?: string[];
    experienceYears?: number;
    pricingType?: "hour" | "day" | "job";
    pricingAmount?: string | number;
    languages?: string[] | string;
    about?: string;
    availability?: boolean;
    profilePictureUrl?: string;
  } | null>(null);

  const liveJobs = [
    { id: "job-1", title: "Tile fitting helper", distance: "1.2 km", pay: "INR 1,200/day", urgency: "Urgent" },
    { id: "job-2", title: "Painter for interior work", distance: "2.8 km", pay: "INR 950/day", urgency: "Today" },
    { id: "job-3", title: "Plumbing assistant", distance: "3.4 km", pay: "INR 1,100/day", urgency: "High" },
  ];

  const recommendedJobs = [
    "Masonry helper - 5 day contract",
    "Electric line support - 2 shifts",
    "Waterproofing crew assistant",
  ];

  const alerts = [
    "2 new urgent jobs posted in your area",
    "One contractor viewed your profile today",
    "Complete one more job to unlock top worker badge",
  ];

  useEffect(() => {
    const hydrateSession = async () => {
      const sessionUser = await fetchSessionUser();

      if (!sessionUser) {
        localStorage.removeItem("user");
        setUser(null);
        const locale = params.locale as string || "en";
        router.push(`/${locale}/login`);
        return;
      }

      const accountType = resolveAccountType(sessionUser);
      const normalizedUser = { ...sessionUser, accountType };
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      if (typeof normalizedUser.availability === "boolean") {
        setIsAvailable(normalizedUser.availability);
      }
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
  }, [params.locale, router]);

  const handleLogout = async () => {
    await logoutSession();
    localStorage.removeItem("user");
    globalThis.window.dispatchEvent(new Event("auth-changed"));
    const locale = params.locale as string || "en";
    router.push(`/${locale}/login`);
  };

  const handleAvailabilityToggle = async () => {
    const nextValue = !isAvailable;
    setIsAvailable(nextValue);

    const updatedUser = await updateSessionProfile({ availability: nextValue });
    if (!updatedUser) {
      setIsAvailable(!nextValue);
      return;
    }

    const accountType = resolveAccountType(updatedUser);
    const normalizedUser = { ...updatedUser, accountType };
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  };

  if (!sessionChecked) {
    return (
      <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background">
        <Logo size={80} showText={true} />
        <p className="mt-4 text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  if (user?.accountType !== "worker") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="mx-auto w-full max-w-md space-y-4 px-4 py-4">
        <Card className="relative overflow-hidden border-0 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-emerald-300/15 blur-2xl" />
          <CardContent className="relative space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <UserAvatar user={user} className="h-14 w-14 ring-2 ring-white/30" />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Worker Dashboard</p>
                  <h1 className="mt-1 text-xl font-semibold leading-tight">{user.name || "Worker"}</h1>
                  <p className="mt-1 text-xs text-slate-300">{user.profession || user.workCategory || "Skilled Worker"}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-300">
                    <MapPin className="h-3.5 w-3.5" />
                    {user.location || "Location not set"}
                  </p>
                </div>
              </div>
              <Button
                variant={isAvailable ? "secondary" : "outline"}
                size="sm"
                className="rounded-full border-white/40 bg-white/20 px-3 text-xs text-white hover:bg-white/30"
                onClick={handleAvailabilityToggle}
              >
                {isAvailable ? "Available" : "Unavailable"}
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-100">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                {user.activeRole || "worker"}
              </div>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-200 hover:bg-white/10" onClick={handleLogout}>
                <LogOut className="mr-1.5 h-4 w-4" />
                Log out
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Live Jobs Near You</h2>
            <BriefcaseBusiness className="h-4 w-4 text-slate-500" />
          </div>
          <div className="space-y-3">
            {liveJobs.map((job) => (
              <Card key={job.id} className="border-slate-200">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                      <p className="text-xs text-slate-500">{job.distance} away</p>
                    </div>
                    <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-medium text-red-800">
                      {job.urgency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1 text-sm font-medium text-emerald-700">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {job.pay}
                    </p>
                    <Button size="sm">Accept</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recommended Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendedJobs.map((job) => (
                <li key={job} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {job}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Work Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-slate-100 p-2">
              <p className="text-lg font-bold text-slate-900">28</p>
              <p className="text-xs text-slate-600">Jobs done</p>
            </div>
            <div className="rounded-md bg-slate-100 p-2">
              <p className="text-lg font-bold text-slate-900">INR 32K</p>
              <p className="text-xs text-slate-600">Earnings</p>
            </div>
            <div className="rounded-md bg-slate-100 p-2">
              <p className="flex items-center justify-center gap-1 text-lg font-bold text-slate-900">
                4.8
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </p>
              <p className="text-xs text-slate-600">Rating</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Job Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {alerts.map((alert) => (
                <li key={alert} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {alert}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkerHomePage;
