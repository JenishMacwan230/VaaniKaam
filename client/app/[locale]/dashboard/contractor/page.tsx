"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchSessionUser, getCurrentLocale, resolveAccountType } from "@/lib/authClient";
import {
  Bell, TrendingUp, Briefcase, CheckCircle, AlertCircle,
  MessageSquare, ArrowLeft, Plus, ChevronRight, Activity,
  Users, Clock, BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface JobWithApplications {
  _id: string;
  status: "open" | "assigned" | "in_progress" | "completion_pending" | "completed" | "cancelled";
  applicationsCount: number;
}

interface JobApplication {
  _id: string;
  jobId: { title: string };
  status: "applied" | "accepted" | "rejected" | "completion_pending" | "completed";
  workerId: { name: string; location?: string };
}

interface ContractorStats {
  totalJobs: number;
  openJobs: number;
  assignedJobs: number;
  completedJobs: number;
  totalApplications: number;
}

export default function ContractorDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getCurrentLocale(pathname);

  const [jobs, setJobs] = useState<JobWithApplications[]>([]);
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<ContractorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await fetchSessionUser();
        if (!currentUser) { router.push(`/${locale}/login`); return; }
        if (resolveAccountType(currentUser) !== "contractor") {
          router.push(`/${locale}/dashboard/worker`); return;
        }
        if (!API_BASE_URL) { setError("API configuration missing"); setIsLoading(false); return; }

        const [jobsRes, statsRes, appsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/jobs/contractor/jobs`, { credentials: "include" }).catch(() => null),
          fetch(`${API_BASE_URL}/api/jobs/contractor/stats`, { credentials: "include" }).catch(() => null),
          fetch(`${API_BASE_URL}/api/jobs/contractor/applications`, { credentials: "include" }).catch(() => null),
        ]);

        if (jobsRes?.ok) { const d = await jobsRes.json(); setJobs(d.jobs || []); }
        if (statsRes?.ok) { const d = await statsRes.json(); setStats(d.stats || null); }
        if (appsRes?.ok) {
          const d = await appsRes.json();
          setRecentApplications(
            (d.applications || []).filter((a: JobApplication) => a.status === "applied").slice(0, 4)
          );
        }
      } catch { setError("Failed to load dashboard data"); }
      finally { setIsLoading(false); }
    };
    loadData();
  }, [pathname, router, locale]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center flex-col gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-emerald-600" />
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    );
  }

  const openJobs = jobs.filter((j) => j.status === "open");
  const inProgressJobs = jobs.filter((j) => ["assigned", "in_progress", "completion_pending"].includes(j.status));
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const completionRate = jobs.length > 0 ? Math.round((completedJobs.length / jobs.length) * 100) : 0;
  const fillRate = jobs.length > 0 ? Math.round(((jobs.length - openJobs.length) / jobs.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-8">

        {/* Back */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Overview, analytics & quick actions</p>
          </div>
          <Button
            onClick={() => router.push(`/${locale}/add-works`)}
            size="sm"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Post Job
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900">
            {error}
          </div>
        )}

        {/* ── New Applications Alert ── */}
        {recentApplications.length > 0 && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white">
                  <Bell className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  {recentApplications.length} New Application{recentApplications.length > 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/dashboard/contractor/projects`)}
                className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {recentApplications.map((app) => (
                <div key={app._id} className="flex items-center justify-between rounded-xl bg-white dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 px-3 py-2.5 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{app.workerId.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      For: {app.jobId?.title || "Job"}
                      {app.workerId.location ? ` · ${app.workerId.location}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs"
                    onClick={() => router.push(`/${locale}/dashboard/contractor/projects`)}>
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Analytics ── */}
        <div className="mb-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600" />
            <h2 className="text-base font-bold">Analytics</h2>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-3">
            {[
              { label: "Total", value: jobs.length, Icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
              { label: "Open", value: openJobs.length, Icon: AlertCircle, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/40" },
              { label: "Active", value: inProgressJobs.length, Icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
              { label: "Done", value: completedJobs.length, Icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
            ].map(({ label, value, Icon, color, bg }) => (
              <Card key={label} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <p className="text-xl font-bold leading-none">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Applications + rates row */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/40">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-xl font-bold leading-none">{stats?.totalApplications ?? 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Total Applications</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40">
                  <Users className="h-4 w-4 text-teal-600" />
                </div>
                <p className="text-xl font-bold leading-none">{completionRate}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Completion Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress bars */}
          {jobs.length > 0 && (
            <Card className="mt-3 border shadow-sm">
              <CardContent className="px-4 py-4 space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Completion Rate
                    </span>
                    <span className="font-bold text-emerald-600">{completionRate}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${completionRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Fill Rate
                    </span>
                    <span className="font-bold text-blue-600">{fillRate}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all" style={{ width: `${fillRate}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Navigate to Projects ── */}
        <div className="mb-5">
          <div className="mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-emerald-600" />
            <h2 className="text-base font-bold">My Projects</h2>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/dashboard/contractor/projects`)}
            className="w-full flex items-center justify-between gap-4 rounded-2xl border bg-background p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <Briefcase className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Manage All Projects</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {openJobs.length} open · {inProgressJobs.length} active · {completedJobs.length} completed
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 transition-colors flex-shrink-0" />
          </button>
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-bold">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              {
                icon: Plus,
                label: "Post New Job",
                desc: "Create a new project",
                color: "text-emerald-600",
                bg: "bg-emerald-50 dark:bg-emerald-950/40",
                action: () => router.push(`/${locale}/add-works`),
              },
              {
                icon: Users,
                label: "Browse Workers",
                desc: "Find skilled labour",
                color: "text-purple-600",
                bg: "bg-purple-50 dark:bg-purple-950/40",
                action: () => router.push(`/${locale}/projects`),
              },
              {
                icon: CheckCircle,
                label: "View Profile",
                desc: "Your public profile",
                color: "text-blue-600",
                bg: "bg-blue-50 dark:bg-blue-950/40",
                action: () => router.push(`/${locale}/profile`),
              },
            ].map(({ icon: Icon, label, desc, color, bg, action }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className="flex flex-col items-start gap-3 rounded-2xl border bg-background p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
