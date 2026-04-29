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
  ChevronRight, Search, TrendingUp, Sparkles, LayoutDashboard,
  AlertTriangle, DollarSign,
} from "lucide-react";

interface Job {
  _id: string;
  title: string;
  location?: string;
  pricingAmount?: number | string;
  pricingType?: string;
  status: "applied" | "accepted" | "completion_pending" | "completed";
  postedBy?: { name: string; averageRating?: number; totalRatings?: number };
  createdAt?: string;
  applicationId?: string;
  paymentStatus?: "pending" | "confirmed_paid" | "disputed";
  contractorRating?: { score: number; review?: string; givenAt: Date };
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
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [ratingState, setRatingState] = useState<Record<string, { score: number; review: string; submitting: boolean }>>({});

  const toNum = (v: number | string | undefined): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string") { const p = parseFloat(v); return isFinite(p) ? p : 0; }
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

  const handleConfirm = async (job: Job) => {
    if (!job.applicationId) return;
    await confirmJobCompletion(job.applicationId);
    setPendingJobs((p) => p.filter((j) => j._id !== job._id));
    const d = await getWorkerCompletedJobs();
    setCompletedJobs(d.map((a: any) => ({ _id: a.jobId._id, title: a.jobId.title, location: a.jobId.location, pricingAmount: a.jobId.pricingAmount, pricingType: a.jobId.pricingType, status: "completed" as const, postedBy: a.jobId.postedBy, createdAt: a.jobId.createdAt, applicationId: a._id, paymentStatus: a.paymentStatus, contractorRating: a.contractorRating })));
  };

  const handleReject = async (job: Job) => {
    if (!job.applicationId) return;
    await rejectJobCompletion(job.applicationId);
    setPendingJobs((p) => p.filter((j) => j._id !== job._id));
    const d = await getWorkerAcceptedJobs();
    setActiveJobs(d.map((a: any) => ({ _id: a.jobId._id, title: a.jobId.title, location: a.jobId.location, pricingAmount: a.jobId.pricingAmount, pricingType: a.jobId.pricingType, status: "accepted" as const, postedBy: a.jobId.postedBy, createdAt: a.jobId.createdAt })));
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
    } catch (e) {
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
    } catch (e) {
      alert("Error disputing payment");
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleSubmitRating = async (job: Job) => {
    if (!job.applicationId || !API_BASE_URL) return;
    const ratingData = ratingState[job._id];
    if (!ratingData || !ratingData.score) {
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
        setRatingState((prev) => {
          const newState = { ...prev };
          delete newState[job._id];
          return newState;
        });
      } else {
        alert("Failed to submit rating");
      }
    } catch (e) {
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
    applied: "Applied",
    accepted: "In Progress",
    completion_pending: "Confirm?",
    completed: "Done",
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
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">My Work</h1>
                <p className="mt-1 text-sm sm:text-base text-white/75">Jobs, applications & earnings</p>
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
            <span>Back</span>
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 px-1">
          {[
            `${appliedJobs.length} Applied`,
            `${activeJobs.length + pendingJobs.length} Active`,
            `${completedJobs.length} Done`,
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
              { label: "Applied",  value: appliedJobs.length,   color: "text-blue-600" },
              { label: "Active",   value: activeJobs.length + pendingJobs.length, color: "text-cyan-600" },
              { label: "Done",     value: completedJobs.length, color: "text-teal-600" },
              {
                label: "Earned",
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
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-blue-600">
                        {fmt(job.pricingAmount, job.pricingType)}
                      </p>
                      {job.postedBy?.averageRating && (
                        <span className="text-xs text-muted-foreground">⭐ {job.postedBy.averageRating.toFixed(1)} ({job.postedBy.totalRatings})</span>
                      )}
                    </div>

                    {job.status === "completion_pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs" onClick={() => handleConfirm(job)}>
                          <CheckCircle className="h-3.5 w-3.5" /> Confirm
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleReject(job)}>
                          Reject
                        </Button>
                      </div>
                    ) : job.status === "completed" && job.paymentStatus === "pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => handleConfirmPayment(job, "cash")} disabled={paymentLoading === job._id}>
                          <DollarSign className="h-3.5 w-3.5" /> {paymentLoading === job._id ? "..." : "Got paid"}
                        </Button>
                        <Button size="sm" variant="destructive" className="h-8 gap-1 text-xs" onClick={() => handleDisputePayment(job)} disabled={paymentLoading === job._id}>
                          <AlertTriangle className="h-3.5 w-3.5" /> Issue
                        </Button>
                      </div>
                    ) : job.status === "completed" && job.paymentStatus === "confirmed_paid" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">✓ Confirmed</Badge>
                    ) : job.status === "completed" && job.paymentStatus === "disputed" ? (
                      <Badge variant="destructive">⚠ Disputed</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                        Details <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Rating UI for completed jobs with confirmed payment */}
                  {job.status === "completed" && job.paymentStatus === "confirmed_paid" && !job.contractorRating?.givenAt && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-semibold mb-2">Rate your contractor</p>
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
                        placeholder="Add a review (optional, max 200 chars)"
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
                        {ratingState[job._id]?.submitting ? "Submitting..." : "Submit Rating"}
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
            <p className="text-sm font-semibold">Looking for more work?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Browse jobs that match your skills</p>
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
    </div>
  );
}
