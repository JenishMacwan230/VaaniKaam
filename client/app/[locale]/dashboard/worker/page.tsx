"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getCurrentLocale, fetchSessionUser, resolveAccountType } from "@/lib/authClient";
import {
  getWorkerApplications, getWorkerAcceptedJobs,
  getWorkerPendingCompletion, getWorkerCompletedJobs,
  confirmJobCompletion,
} from "@/lib/jobApplicationApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import JobDetailsModal from "@/components/JobDetailsModal";
import {
  Briefcase, CheckCircle, Clock, AlertCircle,
  MapPin, ArrowRight, ArrowLeft,
  ChevronRight, Search, Sparkles,
  AlertTriangle, DollarSign,
} from "lucide-react";

interface Job {
  _id: string;
  title: string;
  location?: string;
  pricingAmount?: number | string;
  pricingType?: string;
  status: "applied" | "accepted" | "completion_pending" | "completed";
  postedBy?: { name: string; phone?: string; averageRating?: number; totalRatings?: number };
  createdAt?: string;
  applicationId?: string;
  paymentStatus?: "pending" | "confirmed_paid" | "disputed";
  contractorRating?: { score: number; review?: string; givenAt: Date };
}

type TabId = "active" | "applied" | "pending" | "completed";

const TABS: { id: TabId; icon: React.ElementType }[] = [
  { id: "active", icon: Clock },
  { id: "applied", icon: Briefcase },
  { id: "pending", icon: AlertCircle },
  { id: "completed", icon: CheckCircle },
];

export default function WorkerDashboardPage() {
  const t = useTranslations("workerDashboard");
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
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [ratingState, setRatingState] = useState<Record<string, { score: number; review: string; submitting: boolean }>>({});
  const [detailsJobId, setDetailsJobId] = useState<string | null>(null);
  const [detailsJobData, setDetailsJobData] = useState<Job | null>(null);

  const toNum = (v: number | string | undefined): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const p = Number.parseFloat(v);
      return Number.isFinite(p) ? p : 0;
    }
    return 0;
  };

  const fmt = (amount: number | string | undefined, type?: string) => {
    const n = toNum(amount);
    return n > 0 ? `₹${n.toLocaleString()}/${type || "job"}` : `POA`;
  };

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
            applicationId: a._id,
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
            applicationId: a._id, paymentStatus: a.paymentStatus, contractorRating: a.contractorRating,
          })));

        // Auto-switch to pending if there are items needing action
        if (pending.status === "fulfilled" && pending.value.length > 0) setActiveTab("pending");

      } catch { setError("Failed to load dashboard"); }
      finally { setLoading(false); }
    };
    init();
  }, [locale, router]);

  const handleRaiseIssue = (job: Job) => {
    const params = new URLSearchParams({
      reason: "Report a safety issue",
      fullName: job.postedBy?.name ? `${job.postedBy.name} job issue` : "Job issue",
      email: "",
      phone: job.postedBy?.phone || "",
      message: `I want to raise an issue for the job "${job.title}". Job ID: ${job._id}. Please review this and contact me.`,
    });

    router.push(`/${locale}/help-support?${params.toString()}`);
  };

  const handlePaid = async (job: Job) => {
    if (!job.applicationId || !API_BASE_URL) return;

    setPaymentLoading(job._id);
    try {
      await confirmJobCompletion(job.applicationId);

      const res = await fetch(`${API_BASE_URL}/api/jobs/confirm-payment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: job.applicationId, paymentMethod: "other" }),
      });

      if (res.ok) {
        setPendingJobs((p) => p.filter((j) => j._id !== job._id));
        const d = await getWorkerCompletedJobs();
        setCompletedJobs(d.map((a: any) => ({ _id: a.jobId._id, title: a.jobId.title, location: a.jobId.location, pricingAmount: a.jobId.pricingAmount, pricingType: a.jobId.pricingType, status: "completed" as const, postedBy: a.jobId.postedBy, createdAt: a.jobId.createdAt, applicationId: a._id, paymentStatus: a.paymentStatus, contractorRating: a.contractorRating })));
        setActiveTab("completed");
      } else {
        alert("Failed to confirm payment");
      }
    } catch {
      alert("Error confirming payment");
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleMarkAsPaid = async (job: Job) => {
    if (!job.applicationId || !API_BASE_URL) return;

    setPaymentLoading(job._id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/confirm-payment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: job.applicationId, paymentMethod: "other" }),
      });

      if (res.ok) {
        setActiveJobs((jobs) => jobs.filter((item) => item._id !== job._id));
        const [active, completed] = await Promise.all([getWorkerAcceptedJobs(), getWorkerCompletedJobs()]);
        setActiveJobs(active.map((a: any) => ({ _id: a.jobId._id, title: a.jobId.title, location: a.jobId.location, pricingAmount: a.jobId.pricingAmount, pricingType: a.jobId.pricingType, status: "accepted" as const, postedBy: a.jobId.postedBy, createdAt: a.jobId.createdAt, applicationId: a._id })));
        setCompletedJobs(completed.map((a: any) => ({ _id: a.jobId._id, title: a.jobId.title, location: a.jobId.location, pricingAmount: a.jobId.pricingAmount, pricingType: a.jobId.pricingType, status: "completed" as const, postedBy: a.jobId.postedBy, createdAt: a.jobId.createdAt, applicationId: a._id, paymentStatus: a.paymentStatus, contractorRating: a.contractorRating })));
        setActiveTab("completed");
      } else {
        alert("Failed to mark as paid");
      }
    } catch {
      alert("Error marking as paid");
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleConfirmPayment = async (job: Job, method: "cash" | "upi" | "other") => {
    if (!job.applicationId || !API_BASE_URL) return;
    setPaymentLoading(job._id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/confirm-payment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: job.applicationId, paymentMethod: method }),
      });
      if (res.ok) {
        const d = await getWorkerCompletedJobs();
        setCompletedJobs(d.map((a: any) => ({ _id: a.jobId._id, title: a.jobId.title, location: a.jobId.location, pricingAmount: a.jobId.pricingAmount, pricingType: a.jobId.pricingType, status: "completed" as const, postedBy: a.jobId.postedBy, createdAt: a.jobId.createdAt, applicationId: a._id, paymentStatus: a.paymentStatus, contractorRating: a.contractorRating })));
      } else {
        alert("Failed to confirm payment");
      }
    } catch {
      alert("Error confirming payment");
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleDisputePayment = async (job: Job) => {
    if (!job.applicationId || !API_BASE_URL) return;
    setPaymentLoading(job._id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/dispute-payment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: job.applicationId }),
      });
      if (res.ok) {
        const d = await getWorkerCompletedJobs();
        setCompletedJobs(d.map((a: any) => ({ _id: a.jobId._id, title: a.jobId.title, location: a.jobId.location, pricingAmount: a.jobId.pricingAmount, pricingType: a.jobId.pricingType, status: "completed" as const, postedBy: a.jobId.postedBy, createdAt: a.jobId.createdAt, applicationId: a._id, paymentStatus: a.paymentStatus, contractorRating: a.contractorRating })));
      } else {
        alert("Failed to dispute payment");
      }
    } catch {
      alert("Error disputing payment");
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleSubmitRating = async (job: Job) => {
    if (!job.applicationId || !API_BASE_URL) return;
    const ratingData = ratingState[job._id];
    if (!ratingData?.score) {
      alert("Please select a rating");
      return;
    }
    setRatingState((prev) => ({ ...prev, [job._id]: { ...prev[job._id], submitting: true } }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/rate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: job.applicationId, score: ratingData.score, review: ratingData.review || "" }),
      });
      if (res.ok) {
        const d = await getWorkerCompletedJobs();
        setCompletedJobs(d.map((a: any) => ({ _id: a.jobId._id, title: a.jobId.title, location: a.jobId.location, pricingAmount: a.jobId.pricingAmount, pricingType: a.jobId.pricingType, status: "completed" as const, postedBy: a.jobId.postedBy, createdAt: a.jobId.createdAt, applicationId: a._id, paymentStatus: a.paymentStatus, contractorRating: a.contractorRating })));
        setActiveTab("completed");
        setRatingState((prev) => {
          const newState = { ...prev };
          delete newState[job._id];
          return newState;
        });
      } else {
        alert("Failed to submit rating");
      }
    } catch {
      alert("Error submitting rating");
    } finally {
      setRatingState((prev) => ({ ...prev, [job._id]: { ...prev[job._id], submitting: false } }));
    }
  };

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center flex-col gap-3">
      <div className="h-10 w-10 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
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
  const totalEarned = completedJobs.reduce((s, j) => s + (j.paymentStatus === "confirmed_paid" ? toNum(j.pricingAmount) : 0), 0);

  const statusColors: Record<string, string> = {
    applied: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400",
    accepted: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400",
    completion_pending: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400",
    completed: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400",
  };
  const statusLabels: Record<string, string> = {
    applied: t("applied"),
    accepted: t("statusInProgress"),
    completion_pending: t("statusConfirm"),
    completed: t("done"),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Gradient Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 px-4 pt-10 pb-28 sm:pt-14 sm:pb-32">
        <div className="pointer-events-none absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-8 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl" />

        <div className="relative mx-auto max-w-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{t("myWork")}</h1>
                <p className="mt-1 text-sm sm:text-base text-white/75">{t("subtitle")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/find-work`)}
              className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-3 py-2 text-xs font-semibold text-white transition-all backdrop-blur-sm shrink-0"
            >
              <Search className="h-3.5 w-3.5" /> Find Jobs
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content overlapping header ── */}
      <div className="relative z-10 mx-auto -mt-20 max-w-2xl px-4 pb-16 sm:-mt-24 sm:px-6 space-y-5">

        {/* Back button */}
        <div className="mb-2 flex justify-start">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/40"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("back")}</span>
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 px-1">
          {[
            `${appliedJobs.length} ${t("applied")}`,
            `${activeJobs.length + pendingJobs.length} ${t("active")}`,
            `${completedJobs.length} ${t("done")}`,
          ].map((tag) => (
            <span key={tag} className="flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
              <Sparkles className="h-3 w-3" />{tag}
            </span>
          ))}
        </div>

        {/* Summary Card */}
        <div className="rounded-2xl border-0 shadow-2xl shadow-black/10 dark:shadow-black/30 bg-white dark:bg-card p-5 sm:p-8">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: t("applied"),  value: appliedJobs.length,   color: "text-blue-600" },
              { label: t("active"),   value: activeJobs.length + pendingJobs.length, color: "text-cyan-600" },
              { label: t("done"),     value: completedJobs.length, color: "text-teal-600" },
              {
                label: t("earned"),
                value: totalEarned > 0
                  ? totalEarned >= 1000 ? `₹${(totalEarned / 1000).toFixed(1)}K` : `₹${totalEarned}`
                  : "₹0",
                color: "text-blue-600",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl border border-border/50 bg-card p-3 text-center shadow-sm">
                <p className={`text-lg font-bold leading-none ${color}`}>{value}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs & Jobs ── */}
        <div className="rounded-2xl border-0 shadow-2xl shadow-black/10 dark:shadow-black/30 bg-white dark:bg-card p-5 sm:p-8 space-y-3">
          <div className="flex gap-1 rounded-xl border border-border/50 bg-muted/60 p-1">
          {TABS.map(({ id, icon: Icon }) => {
            const label = id === "active" ? t("active") : id === "applied" ? t("applied") : id === "pending" ? t("confirm") : t("done");
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
                    id === "pending" ? "bg-orange-500" : "bg-blue-600"
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
                {activeTab === "active" && t("noActiveJobs")}
                {activeTab === "applied" && t("noApplications")}
                {activeTab === "pending" && t("nothingToConfirm")}
                {activeTab === "completed" && t("noCompletedJobs")}
              </p>
              {(activeTab === "active" || activeTab === "applied") && (
                <p className="text-xs text-muted-foreground mt-1">{t("browseJobs")}</p>
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
                        <p className="text-xs text-muted-foreground mt-0.5">{t("by", { name: job.postedBy.name })}</p>
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
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-blue-600">
                        {fmt(job.pricingAmount, job.pricingType)}
                      </p>
                      {job.postedBy?.averageRating && (
                        <span className="text-xs text-muted-foreground">⭐ {job.postedBy.averageRating.toFixed(1)} ({job.postedBy.totalRatings})</span>
                      )}
                    </div>

                    {activeTab === "active" && job.status === "accepted" ? (
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => handleMarkAsPaid(job)} disabled={paymentLoading === job._id}>
                          <DollarSign className="h-3.5 w-3.5" /> {paymentLoading === job._id ? "..." : t("markAsPaid")}
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => { setDetailsJobId(job._id); setDetailsJobData(job); }}>
                          {t("details")} <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : job.status === "completion_pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => handlePaid(job)} disabled={paymentLoading === job._id}>
                          <DollarSign className="h-3.5 w-3.5" /> {paymentLoading === job._id ? "..." : t("markAsPaid")}
                        </Button>
                        <Button size="sm" variant="destructive" className="h-8 gap-1 text-xs" onClick={() => handleRaiseIssue(job)} disabled={paymentLoading === job._id}>
                          <AlertTriangle className="h-3.5 w-3.5" /> {t("raiseIssue")}
                        </Button>
                      </div>
                    ) : job.status === "completed" && job.paymentStatus === "pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => handleConfirmPayment(job, "cash")} disabled={paymentLoading === job._id}>
                          <DollarSign className="h-3.5 w-3.5" /> {paymentLoading === job._id ? "..." : t("gotPaid")}
                        </Button>
                        <Button size="sm" variant="destructive" className="h-8 gap-1 text-xs" onClick={() => handleDisputePayment(job)} disabled={paymentLoading === job._id}>
                          <AlertTriangle className="h-3.5 w-3.5" /> {t("issue")}
                        </Button>
                      </div>
                    ) : job.status === "completed" && job.paymentStatus === "confirmed_paid" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t("confirmed")}</Badge>
                    ) : job.status === "completed" && job.paymentStatus === "disputed" ? (
                      <Badge variant="destructive">{t("disputed")}</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => { setDetailsJobId(job._id); setDetailsJobData(job); }}>
                        {t("details")} <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Rating UI for completed jobs with confirmed payment */}
                  {job.status === "completed" && job.paymentStatus === "confirmed_paid" && !job.contractorRating?.givenAt && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-semibold mb-2">{t("rateContractor")}</p>
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRatingState((prev) => ({ ...prev, [job._id]: { ...prev[job._id], score: star, review: prev[job._id]?.review || "" } }))}
                            className={`text-lg transition-colors ${
                              (ratingState[job._id]?.score || 0) >= star ? "text-yellow-400" : "text-gray-300"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        placeholder={t("addReview")}
                        value={ratingState[job._id]?.review || ""}
                        onChange={(e) => setRatingState((prev) => ({ ...prev, [job._id]: { ...prev[job._id], review: e.target.value.slice(0, 200), score: prev[job._id]?.score || 0, submitting: false } }))}
                        className="w-full text-xs p-2 border rounded mb-2 resize-none"
                        rows={2}
                      />
                      <Button
                        size="sm"
                        className="w-full h-7 text-xs"
                        onClick={() => handleSubmitRating(job)}
                        disabled={ratingState[job._id]?.submitting || !ratingState[job._id]?.score}
                      >
                        {ratingState[job._id]?.submitting ? t("submitting") : t("submitRating")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Find more jobs CTA (bottom) */}
        <div className="rounded-2xl border-0 shadow-2xl shadow-black/10 dark:shadow-black/30 bg-white dark:bg-card p-5 sm:p-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{t("lookingForWork")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("browseMatch")}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/find-work`)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md shadow-blue-500/25 flex-shrink-0"
          >
            Find Jobs <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <JobDetailsModal
        jobId={detailsJobId || ""}
        isOpen={!!detailsJobId}
        onClose={() => setDetailsJobId(null)}
        initialData={detailsJobData || undefined}
      />
    </div>
  );
}
