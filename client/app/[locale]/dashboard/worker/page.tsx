"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentLocale, fetchSessionUser, resolveAccountType } from "@/lib/authClient";
import {
  getWorkerApplications, getWorkerAcceptedJobs,
  getWorkerPendingCompletion, getWorkerCompletedJobs,
  confirmJobCompletion, rejectJobCompletion,
} from "@/lib/jobApplicationApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase, CheckCircle, Clock, AlertCircle,
  MapPin, IndianRupee, ArrowRight, ArrowLeft,
  ChevronRight, Search,
} from "lucide-react";

interface Job {
  _id: string;
  title: string;
  location?: string;
  pricingAmount?: number | string;
  pricingType?: string;
  status: "applied" | "accepted" | "completion_pending" | "completed";
  postedBy?: { name: string };
  createdAt?: string;
  applicationId?: string;
}

type TabId = "active" | "applied" | "pending" | "completed";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "active",    label: "Active",    icon: Clock },
  { id: "applied",   label: "Applied",   icon: Briefcase },
  { id: "pending",   label: "Confirm",   icon: AlertCircle },
  { id: "completed", label: "Done",      icon: CheckCircle },
];

export default function WorkerDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getCurrentLocale(pathname);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("active");
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toNum = (v: number | string | undefined): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string") { const p = parseFloat(v); return isFinite(p) ? p : 0; }
    return 0;
  };

  const fmt = (amount: number | string | undefined, type?: string) => {
    const n = toNum(amount);
    return n > 0 ? `₹${n.toLocaleString()}/${type || "job"}` : `POA`;
  };

  useEffect(() => {
    const init = async () => {
      try {
        const sessionUser = await fetchSessionUser();
        if (!sessionUser) { router.push(`/${locale}/login`); return; }
        if (resolveAccountType(sessionUser) !== "worker") { router.push(`/${locale}`); return; }

        const [apps, accepted, pending, completed] = await Promise.allSettled([
          getWorkerApplications(),
          getWorkerAcceptedJobs(),
          getWorkerPendingCompletion(),
          getWorkerCompletedJobs(),
        ]);

        if (apps.status === "fulfilled")
          setAppliedJobs(apps.value.filter((a: any) => a.status === "applied" && a.jobId).map((a: any) => ({
            _id: a.jobId._id, title: a.jobId.title, location: a.jobId.location,
            pricingAmount: a.jobId.pricingAmount, pricingType: a.jobId.pricingType,
            status: "applied" as const, postedBy: a.jobId.postedBy, createdAt: a.createdAt,
          })));

        if (accepted.status === "fulfilled")
          setActiveJobs(accepted.value.map((a: any) => ({
            _id: a.jobId._id, title: a.jobId.title, location: a.jobId.location,
            pricingAmount: a.jobId.pricingAmount, pricingType: a.jobId.pricingType,
            status: "accepted" as const, postedBy: a.jobId.postedBy, createdAt: a.jobId.createdAt,
          })));

        if (pending.status === "fulfilled")
          setPendingJobs(pending.value.map((a: any) => ({
            _id: a.jobId._id, title: a.jobId.title, location: a.jobId.location,
            pricingAmount: a.jobId.pricingAmount, pricingType: a.jobId.pricingType,
            status: "completion_pending" as const, postedBy: a.jobId.postedBy,
            createdAt: a.jobId.createdAt, applicationId: a._id,
          })));

        if (completed.status === "fulfilled")
          setCompletedJobs(completed.value.map((a: any) => ({
            _id: a.jobId._id, title: a.jobId.title, location: a.jobId.location,
            pricingAmount: a.jobId.pricingAmount, pricingType: a.jobId.pricingType,
            status: "completed" as const, postedBy: a.jobId.postedBy, createdAt: a.jobId.createdAt,
          })));

        // Auto-switch to pending if there are items needing action
        if (pending.status === "fulfilled" && pending.value.length > 0) setActiveTab("pending");

      } catch { setError("Failed to load dashboard"); }
      finally { setLoading(false); }
    };
    init();
  }, [locale, router]);

  const handleConfirm = async (job: Job) => {
    if (!job.applicationId) return;
    await confirmJobCompletion(job.applicationId);
    setPendingJobs((p) => p.filter((j) => j._id !== job._id));
    const d = await getWorkerCompletedJobs();
    setCompletedJobs(d.map((a: any) => ({ _id: a.jobId._id, title: a.jobId.title, location: a.jobId.location, pricingAmount: a.jobId.pricingAmount, pricingType: a.jobId.pricingType, status: "completed" as const, postedBy: a.jobId.postedBy, createdAt: a.jobId.createdAt })));
  };

  const handleReject = async (job: Job) => {
    if (!job.applicationId) return;
    await rejectJobCompletion(job.applicationId);
    setPendingJobs((p) => p.filter((j) => j._id !== job._id));
    const d = await getWorkerAcceptedJobs();
    setActiveJobs(d.map((a: any) => ({ _id: a.jobId._id, title: a.jobId.title, location: a.jobId.location, pricingAmount: a.jobId.pricingAmount, pricingType: a.jobId.pricingType, status: "accepted" as const, postedBy: a.jobId.postedBy, createdAt: a.jobId.createdAt })));
  };

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center flex-col gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-emerald-600" />
      <p className="text-sm text-muted-foreground">Loading your jobs…</p>
    </div>
  );

  if (error) return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
    </div>
  );

  const tabData: Record<TabId, Job[]> = {
    active: activeJobs,
    applied: appliedJobs,
    pending: pendingJobs,
    completed: completedJobs,
  };

  const currentJobs = tabData[activeTab];
  const totalEarned = completedJobs.reduce((s, j) => s + toNum(j.pricingAmount), 0);

  const statusColors: Record<string, string> = {
    applied: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400",
    accepted: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
    completion_pending: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
  };
  const statusLabels: Record<string, string> = {
    applied: "Applied",
    accepted: "In Progress",
    completion_pending: "Confirm?",
    completed: "Done",
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
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </button>

        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Work</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Jobs, applications & earnings</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/projects`)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shrink-0"
          >
            <Search className="h-3.5 w-3.5" /> Find Jobs
          </button>
        </div>

        {/* Summary row */}
        <div className="mb-5 grid grid-cols-4 gap-2">
          {[
            { label: "Applied",  value: appliedJobs.length,   color: "text-blue-600" },
            { label: "Active",   value: activeJobs.length + pendingJobs.length, color: "text-amber-600" },
            { label: "Done",     value: completedJobs.length, color: "text-emerald-600" },
            {
              label: "Earned",
              value: totalEarned > 0
                ? totalEarned >= 1000 ? `₹${(totalEarned / 1000).toFixed(1)}K` : `₹${totalEarned}`
                : "₹0",
              color: "text-emerald-600",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border bg-background p-3 text-center shadow-sm">
              <p className={`text-lg font-bold leading-none ${color}`}>{value}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="mb-4 flex gap-1 rounded-xl border bg-muted/60 p-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const count = tabData[id].length;
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
                    id === "pending" ? "bg-orange-500" : "bg-emerald-600"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Job List ── */}
        {currentJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-background p-10 text-center">
            {activeTab === "active" && <Clock className="h-10 w-10 text-muted-foreground/30" />}
            {activeTab === "applied" && <Briefcase className="h-10 w-10 text-muted-foreground/30" />}
            {activeTab === "pending" && <AlertCircle className="h-10 w-10 text-muted-foreground/30" />}
            {activeTab === "completed" && <CheckCircle className="h-10 w-10 text-muted-foreground/30" />}
            <div>
              <p className="font-semibold text-muted-foreground">
                {activeTab === "active" && "No active jobs"}
                {activeTab === "applied" && "No applications yet"}
                {activeTab === "pending" && "Nothing to confirm"}
                {activeTab === "completed" && "No completed jobs yet"}
              </p>
              {(activeTab === "active" || activeTab === "applied") && (
                <p className="text-xs text-muted-foreground mt-1">Browse available jobs to get started</p>
              )}
            </div>
            {(activeTab === "active" || activeTab === "applied") && (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/projects`)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                <Search className="h-3.5 w-3.5" /> Find Jobs
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {currentJobs.map((job) => (
              <div
                key={job._id}
                className="overflow-hidden rounded-2xl border bg-background shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Status accent line */}
                <div className={`h-1 w-full ${
                  job.status === "accepted" ? "bg-amber-400" :
                  job.status === "completion_pending" ? "bg-orange-400" :
                  job.status === "completed" ? "bg-emerald-400" :
                  "bg-blue-400"
                }`} />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm leading-snug">{job.title}</h3>
                      {job.postedBy && (
                        <p className="text-xs text-muted-foreground mt-0.5">by {job.postedBy.name}</p>
                      )}
                      {job.location && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusColors[job.status]}`}>
                      {statusLabels[job.status]}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-bold text-emerald-600">
                      {fmt(job.pricingAmount, job.pricingType)}
                    </p>

                    {job.status === "completion_pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => handleConfirm(job)}>
                          <CheckCircle className="h-3.5 w-3.5" /> Confirm
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleReject(job)}>
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                        Details <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Find more jobs CTA (bottom) */}
        <div className="mt-6 pt-5 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Looking for more work?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Browse jobs that match your skills</p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/projects`)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Find Jobs <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
