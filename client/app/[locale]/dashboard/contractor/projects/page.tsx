"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchSessionUser, getAuthHeaders, getCurrentLocale, resolveAccountType } from "@/lib/authClient";
import { useTranslations } from "next-intl";
import {
  Bell, TrendingUp, Briefcase, CheckCircle, AlertCircle,
  Eye, Phone, MessageSquare, ArrowLeft, Plus, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface JobWithApplications {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  wage?: number | string;
  status: "open" | "assigned" | "in_progress" | "completion_pending" | "completed" | "cancelled";
  applicationsCount: number;
  applications: JobApplication[];
  createdAt: string;
}

interface JobApplication {
  _id: string;
  jobId: { title: string; status: string };
  status: "applied" | "accepted" | "rejected" | "completion_pending" | "completed";
  createdAt: string;
  workerId: { _id: string; name: string; email: string; proficiency?: string; location?: string };
}

interface ContractorStats {
  totalJobs: number; openJobs: number; assignedJobs: number;
  completedJobs: number; totalApplications: number;
}

type TabId = "open" | "active" | "applications" | "completed";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "open",         label: "Open",    icon: AlertCircle },
  { id: "active",       label: "Active",  icon: TrendingUp },
  { id: "applications", label: "Apps",    icon: Bell },
  { id: "completed",    label: "Done",    icon: CheckCircle },
];

export default function ContractorProjectsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getCurrentLocale(pathname);
  const t = useTranslations("contractorProjects");

  const [jobs, setJobs] = useState<JobWithApplications[]>([]);
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<ContractorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("open");

  const formatWage = (v: number | string | undefined): string => {
    if (typeof v === "number" && isFinite(v) && v > 0) return `₹${v.toLocaleString()}`;
    if (typeof v === "string") {
      const p = parseFloat(v);
      if (isFinite(p) && p > 0) return `₹${p.toLocaleString()}`;
      return v.trim() || "POA";
    }
    return "POA";
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await fetchSessionUser();
        if (!currentUser) { router.push(`/${locale}/login`); return; }
        if (resolveAccountType(currentUser) !== "contractor") {
          router.push(`/${locale}/dashboard/worker`); return;
        }
        if (!API_BASE_URL) { setError("API configuration missing"); setIsLoading(false); return; }

        const authHeaders = getAuthHeaders();

        const [jobsRes, statsRes, appsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/jobs/contractor/jobs`, { credentials: "include", headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE_URL}/api/jobs/contractor/stats`, { credentials: "include", headers: authHeaders }).catch(() => null),
          fetch(`${API_BASE_URL}/api/jobs/contractor/applications`, { credentials: "include", headers: authHeaders }).catch(() => null),
        ]);

        if (jobsRes?.ok) { const d = await jobsRes.json(); setJobs(d.jobs || []); }
        if (statsRes?.ok) { const d = await statsRes.json(); setStats(d.stats || null); }
        if (appsRes?.ok) {
          const d = await appsRes.json();
          setRecentApplications(
            (d.applications || []).filter((a: JobApplication) => a.status === "applied").slice(0, 10)
          );
          // Auto-switch to applications tab if there are any
          if ((d.applications || []).filter((a: JobApplication) => a.status === "applied").length > 0) {
            setActiveTab("applications");
          }
        }
      } catch { setError(t("loadingProjects")); }
      finally { setIsLoading(false); }
    };
    loadData();
  }, [pathname, router, locale]);

  if (isLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center flex-col gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-emerald-600" />
      <p className="text-sm text-muted-foreground">{t("loadingProjects")}…</p>
    </div>
  );

  const openJobs = jobs.filter((j) => j.status === "open");
  const inProgressJobs = jobs.filter((j) => ["assigned", "in_progress", "completion_pending"].includes(j.status));
  const completedJobs = jobs.filter((j) => j.status === "completed");

  const tabData: Record<TabId, any[]> = {
    open: openJobs,
    active: inProgressJobs,
    applications: recentApplications,
    completed: completedJobs,
  };

  const tabCounts: Record<TabId, number> = {
    open: openJobs.length,
    active: inProgressJobs.length,
    applications: recentApplications.length,
    completed: completedJobs.length,
  };

  const statusBadge = (status: JobWithApplications["status"]) => {
    const map: Record<string, string> = {
      open: "bg-blue-50 text-blue-700 border-blue-200",
      assigned: "bg-amber-50 text-amber-700 border-amber-200",
      in_progress: "bg-amber-50 text-amber-700 border-amber-200",
      completion_pending: "bg-orange-50 text-orange-700 border-orange-200",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };
    const labels: Record<string, string> = {
      open: "Open", assigned: "Assigned", in_progress: "In Progress",
      completion_pending: "Confirm?", completed: "Done", cancelled: "Cancelled",
    };
    return { cls: map[status] || "", label: labels[status] || status };
  };

  const ProjectCard = ({ job }: { job: JobWithApplications }) => {
    const badge = statusBadge(job.status);
    const isInProgress = ["assigned", "in_progress", "completion_pending"].includes(job.status);
    const accentColor = job.status === "open" ? "bg-blue-400" : isInProgress ? "bg-amber-400" : job.status === "completed" ? "bg-emerald-400" : "bg-gray-300";

    return (
      <div className="overflow-hidden rounded-2xl border bg-background shadow-sm hover:shadow-md transition-shadow">
        <div className={`h-1 w-full ${accentColor}`} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-snug">{job.title}</h3>
              {job.location && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">📍 {job.location}</p>
              )}
            </div>
            <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.cls}`}>
              {badge.label}
            </span>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-base font-bold text-emerald-600">{formatWage(job.wage)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(job.createdAt).toLocaleDateString()} · {job.applicationsCount} apps
              </p>
            </div>
            <Button
              size="sm"
              className={`h-8 gap-1 text-xs ${isInProgress ? "bg-amber-500 hover:bg-amber-600 text-white border-0" : job.status === "completed" ? "" : "bg-blue-600 hover:bg-blue-700 text-white border-0"}`}
              variant={job.status === "completed" ? "outline" : "default"}
              onClick={() => router.push(`/${locale}/dashboard/contractor/${job._id}?tab=applications`)}
            >
              {isInProgress
                ? job.status === "completion_pending" ? "View Status" : "Manage"
                : job.status === "completed"
                ? "Details"
                : "Manage"
              }
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-8">

        {/* Back */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("dashboard")}
        </button>

        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("myProjects")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t("manageTrackJobs")}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/add-works`)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> {t("postJobButton")}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Summary row */}
        <div className="mb-5 grid grid-cols-4 gap-2">
          {[
            { label: t("total"),  value: jobs.length,          color: "text-foreground" },
            { label: t("open"),   value: openJobs.length,       color: "text-blue-600" },
            { label: t("active"), value: inProgressJobs.length, color: "text-amber-600" },
            { label: t("done"),   value: completedJobs.length,  color: "text-emerald-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border bg-background p-3 text-center shadow-sm">
              <p className={`text-lg font-bold leading-none ${color}`}>{value}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-background p-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground/30" />
            <div>
              <p className="font-semibold text-muted-foreground">{t("noProjectsYet")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("postFirstProject")}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/add-works`)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> {t("postFirstProjectButton")}
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="mb-4 flex gap-1 rounded-xl border bg-muted/60 p-1">
              {TABS.map(({ id, label, icon: Icon }) => {
                const count = tabCounts[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all ${
                      activeTab === id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                    {count > 0 && (
                      <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white ${
                        id === "applications" ? "bg-amber-500" : "bg-emerald-600"
                      }`}>
                        {count > 9 ? "9+" : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            {activeTab === "applications" ? (
              /* Applications list */
              recentApplications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-background p-10 text-center">
                  <Bell className="h-10 w-10 text-muted-foreground/30" />
                  <p className="font-semibold text-muted-foreground">{t("noPendingApplications")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentApplications.map((app) => (
                    <div key={app._id} className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                      <div className="h-1 w-full bg-amber-400" />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">{app.workerId.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              For: <span className="font-medium">{app.jobId?.title || "Job"}</span>
                            </p>
                            {app.workerId.location && (
                              <p className="text-xs text-muted-foreground mt-0.5">📍 {app.workerId.location}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs"
                              onClick={() => {
                                const jobId = (app.jobId as any)?._id || (app.jobId as any)?.id;
                                if (!jobId) return;
                                router.push(`/${locale}/dashboard/contractor/${jobId}?tab=applications&applicationId=${app._id}`);
                              }}
                            >
                              <Eye className="h-3 w-3" /> View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs"
                              onClick={() => {
                                const phone = (app.workerId as any)?.phone;
                                if (!phone) { alert("Phone not available"); return; }
                                const tel = `tel:${phone.replace(/\D/g, "")}`;
                                window.open(tel, "_self");
                              }}
                            >
                              <Phone className="h-3 w-3" /> Call
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Project cards */
              tabData[activeTab].length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-background p-10 text-center">
                  <Briefcase className="h-10 w-10 text-muted-foreground/30" />
                  <p className="font-semibold text-muted-foreground">
                    {activeTab === "open" ? t("noOpenProjects") : activeTab === "active" ? t("noActiveProjects") : t("noCompletedProjects")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(tabData[activeTab] as JobWithApplications[]).map((job) => (
                    <ProjectCard key={job._id} job={job} />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
