"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchSessionUser, getCurrentLocale, resolveAccountType, getAuthHeaders } from "@/lib/authClient";
import { useTranslations } from "next-intl";
import {
  Bell, TrendingUp, Briefcase, CheckCircle, AlertCircle,
  MessageSquare, ArrowLeft, Plus, ChevronRight, Activity,
  Users, Clock, BarChart3, Sparkles, LayoutDashboard,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  const t = useTranslations("contractorDashboard");

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
          fetch(`${API_BASE_URL}/api/jobs/contractor/jobs`, { headers: getAuthHeaders(), credentials: "include" }).catch(() => null),
          fetch(`${API_BASE_URL}/api/jobs/contractor/stats`, { headers: getAuthHeaders(), credentials: "include" }).catch(() => null),
          fetch(`${API_BASE_URL}/api/jobs/contractor/applications`, { headers: getAuthHeaders(), credentials: "include" }).catch(() => null),
        ]);

        if (jobsRes?.ok) { const d = await jobsRes.json(); setJobs(d.jobs || []); }
        if (statsRes?.ok) { const d = await statsRes.json(); setStats(d.stats || null); }
        if (appsRes?.ok) {
          const d = await appsRes.json();
          setRecentApplications(
            (d.applications || []).filter((a: JobApplication) => a.status === "applied").slice(0, 4)
          );
        }
      } catch { setError(t("loading")); }
      finally { setIsLoading(false); }
    };
    loadData();
  }, [pathname, router, locale]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center flex-col gap-3">
        <div className="h-10 w-10 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
        <p className="text-sm text-muted-foreground">{t("loading")}…</p>
      </div>
    );
  }

  const openJobs = jobs.filter((j) => j.status === "open");
  const inProgressJobs = jobs.filter((j) => ["assigned", "in_progress", "completion_pending"].includes(j.status));
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const completionRate = jobs.length > 0 ? Math.round((completedJobs.length / jobs.length) * 100) : 0;
  const fillRate = jobs.length > 0 ? Math.round(((jobs.length - openJobs.length) / jobs.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Gradient Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 px-4 pt-10 pb-8 sm:pt-14 sm:pb-12">
        <div className="pointer-events-none absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-8 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl" />

        <div className="relative mx-auto max-w-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{t("myDashboard")}</h1>
                <p className="mt-1 text-sm sm:text-base text-white/75">{t("projectsAnalytics")}</p>
              </div>
            </div>
            <Button
              onClick={() => router.push(`/${locale}/add-works`)}
              size="sm"
              className="gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white shadow-md backdrop-blur-sm shrink-0"
            >
              <Plus className="h-3.5 w-3.5" /> {t("postJob")}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              `${jobs.length} ${t("projects")}`,
              `${openJobs.length} ${t("open")}`,
              `${inProgressJobs.length} ${t("active")}`,
            ].map((tag) => (
              <span key={tag} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <TrendingUp className="h-3 w-3" />{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content overlapping header ── */}
      <div className="relative z-10 mx-auto -mt-10 max-w-2xl px-4 pb-16 sm:px-6 space-y-5">

        {/* Back button */}
        <div className="mb-4 flex justify-start pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/40"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900">
            {error}
          </div>
        )}

        {/* ── New Applications Alert ── */}
        {recentApplications.length > 0 && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Bell className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                  {recentApplications.length} New Application{recentApplications.length > 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/dashboard/contractor/projects`)}
                className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {recentApplications.map((app) => (
                <div key={app._id} className="flex items-center justify-between rounded-xl bg-white dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 px-3 py-2.5 gap-3">
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
        <div className="rounded-2xl border-0 shadow-2xl shadow-black/10 dark:shadow-black/30 bg-white dark:bg-card p-5 sm:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <h2 className="text-base font-bold">Analytics</h2>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total", value: jobs.length, Icon: Briefcase, color: "text-blue-600", bg: "from-blue-500/10 to-cyan-500/10" },
              { label: "Open", value: openJobs.length, Icon: AlertCircle, color: "text-cyan-600", bg: "from-cyan-500/10 to-teal-500/10" },
              { label: "Active", value: inProgressJobs.length, Icon: Clock, color: "text-teal-600", bg: "from-teal-500/10 to-cyan-500/10" },
              { label: "Done", value: completedJobs.length, Icon: CheckCircle, color: "text-blue-600", bg: "from-blue-500/10 to-cyan-500/10" },
            ].map(({ label, value, Icon, color, bg }) => (
              <div key={label} className="rounded-2xl border border-border/50 bg-card p-4">
                <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className="text-xl font-bold leading-none">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Applications + rates row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xl font-bold leading-none">{stats?.totalApplications ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">Applications</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10">
                <Users className="h-4 w-4 text-cyan-600" />
              </div>
              <p className="text-xl font-bold leading-none">{completionRate}%</p>
              <p className="mt-1 text-xs text-muted-foreground">Completion</p>
            </div>
          </div>

          {/* Progress bars */}
          {jobs.length > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card px-4 py-3 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-sm font-semibold">Completion Rate</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600 dark:text-cyan-400">{completionRate}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-sm font-semibold">Fill Rate</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600 dark:text-cyan-400">{fillRate}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                    style={{ width: `${fillRate}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigate to Projects ── */}
        <div className="rounded-2xl border-0 shadow-2xl shadow-black/10 dark:shadow-black/30 bg-white dark:bg-card p-5 sm:p-8 space-y-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <h2 className="text-base font-bold">My Projects</h2>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/dashboard/contractor/projects`)}
            className="w-full flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-card p-4 hover:border-blue-300/60 hover:shadow-md hover:shadow-blue-500/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex-shrink-0">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Jobs & Applications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {openJobs.length} open · {inProgressJobs.length} active · {completedJobs.length} completed
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors flex-shrink-0" />
          </button>
        </div>

        {/* ── Quick Actions ── */}
        <div className="rounded-2xl border-0 shadow-2xl shadow-black/10 dark:shadow-black/30 bg-white dark:bg-card p-5 sm:p-8 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-bold">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              {
                icon: Plus,
                label: "Post New Job",
                desc: "Create a new project",
                color: "text-blue-600",
                bg: "from-blue-500/10 to-cyan-500/10",
                action: () => router.push(`/${locale}/add-works`),
              },
              {
                icon: Users,
                label: "Browse Helpers",
                desc: "Find skilled labour",
                color: "text-cyan-600",
                bg: "from-cyan-500/10 to-teal-500/10",
                action: () => router.push(`/${locale}/helpers`),
              },
              {
                icon: CheckCircle,
                label: "View Profile",
                desc: "Your public profile",
                color: "text-teal-600",
                bg: "from-teal-500/10 to-blue-500/10",
                action: () => router.push(`/${locale}/dashboard?editProfile=1`),
              },
            ].map(({ icon: Icon, label, desc, color, bg, action }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className="flex flex-col items-start gap-3 rounded-2xl border border-border/50 bg-card p-4 hover:border-blue-300/60 hover:shadow-md hover:shadow-blue-500/10 transition-all text-left group"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${bg}`}>
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
