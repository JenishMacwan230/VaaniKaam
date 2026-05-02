'use client';

import { useEffect, useState, use } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { fetchSessionUser, getCurrentLocale, getAuthHeaders } from "@/lib/authClient";
import ApplicantsList from "@/components/ApplicantsList";
import {
  ArrowLeft, MapPin, DollarSign, Clock, Users, CheckCircle,
  Briefcase, Edit, Trash2, Copy, AlertCircle, Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface JobDetails {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  normalizedLocation?: string;
  latitude?: number;
  longitude?: number;
  pricingType?: "per_hour" | "per_day" | "per_job";
  pricingAmount?: number;
  duration_value?: number;
  duration_unit?: "hour" | "day" | "week";
  workersRequired?: number;
  jobDate?: "today" | "tomorrow" | "pick" | "flexible";
  selectedDate?: string;
  status: "open" | "assigned" | "in_progress" | "completion_pending" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  applications: JobApplication[];
}

interface JobApplication {
  _id: string;
  status: "applied" | "accepted" | "rejected" | "completion_pending" | "completed";
  paymentStatus?: "pending" | "confirmed_paid" | "disputed";
  workerRating?: { score: number; review?: string; givenAt: Date };
  createdAt: string;
  workerId: {
    _id: string; name: string; email: string;
    phone?: string; proficiency?: string; location?: string;
  };
}

export default function JobDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = getCurrentLocale(pathname);
  const jobId = searchParams?.get("jobId") || "";

  const [job, setJob] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [ratingState, setRatingState] = useState<Record<string, { score: number; review: string; submitting: boolean }>>({});

  const refreshJob = async () => {
    const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, { 
      headers: getAuthHeaders(),
      credentials: "include" 
    });
    if (res.ok) { const d = await res.json(); setJob(d.job); }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await fetchSessionUser();
        if (!currentUser) { router.push(`/${locale}/login`); return; }
        if (!API_BASE_URL) { setError("API configuration missing"); setIsLoading(false); return; }
        const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, { 
          headers: getAuthHeaders(),
          credentials: "include" 
        });
        if (res.ok) { const d = await res.json(); setJob(d.job); }
        else setError("Failed to load job details");
      } catch { setError("Error loading job details"); }
      finally { setIsLoading(false); }
    };
    if (jobId) loadData();
  }, [jobId, pathname, router, locale]);

  const handleMarkJobComplete = async () => {
    if (!job) return;
    const acceptedApps = job.applications.filter((a) => a.status === "accepted");
    if (acceptedApps.length === 0) { alert("You need at least one accepted worker"); return; }
    if (!confirm(`Mark complete? This will notify ${acceptedApps.length} worker(s).`)) return;
    setActionLoading("complete");
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/mark-all-complete`, {
        method: "POST", credentials: "include",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) { alert("Failed to mark complete"); setActionLoading(null); return; }
      await refreshJob();
    } catch { alert("Error"); }
    finally { setActionLoading(null); }
  };

  const handleDeleteJob = async () => {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    setActionLoading("delete");
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
        method: "DELETE", 
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) router.push(`/${locale}/dashboard/contractor/projects`);
      else alert("Failed to delete job");
    } catch { alert("Error deleting job"); }
    finally { setActionLoading(null); }
  };

  const handleSubmitRating = async (applicationId: string) => {
    if (!API_BASE_URL) return;
    const ratingData = ratingState[applicationId];
    if (!ratingData || !ratingData.score) {
      alert("Please select a rating");
      return;
    }
    setRatingState((prev) => ({ ...prev, [applicationId]: { ...prev[applicationId], submitting: true } }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/rate`, {
        method: "POST",
        credentials: "include",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, score: ratingData.score, review: ratingData.review || "" }),
      });
      if (res.ok) {
        await refreshJob();
        setRatingState((prev) => {
          const newState = { ...prev };
          delete newState[applicationId];
          return newState;
        });
      } else {
        alert("Failed to submit rating");
      }
    } catch (e) {
      alert("Error submitting rating");
    } finally {
      setRatingState((prev) => ({ ...prev, [applicationId]: { ...prev[applicationId], submitting: false } }));
    }
  };

  const statusStyles: Record<string, string> = {
    open: "bg-blue-50 text-blue-700 border-blue-200",
    assigned: "bg-amber-50 text-amber-700 border-amber-200",
    in_progress: "bg-purple-50 text-purple-700 border-purple-200",
    completion_pending: "bg-orange-50 text-orange-700 border-orange-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  if (isLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center flex-col gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-emerald-600" />
      <p className="text-sm text-muted-foreground">Loading job details…</p>
    </div>
  );

  if (!job || error) return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button
        type="button"
        onClick={() => router.push(`/${locale}/dashboard/contractor/projects`)}
        className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/50 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-700 font-semibold">{error || "Job not found"}</p>
      </div>
    </div>
  );

  const acceptedCount = job.applications.filter((a) => a.status === "accepted").length;
  const appliedCount = job.applications.filter((a) => a.status === "applied").length;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-8 space-y-5">

        {/* Back */}
        <button
          type="button"
          onClick={() => router.push(`/${locale}/dashboard/contractor/projects`)}
          className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Projects
        </button>

        {/* Job Header Card */}
        <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold leading-tight">{job.title}</h1>
                {job.category && (
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{job.category}</span>
                  </div>
                )}
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${statusStyles[job.status] || ""}`}>
                {job.status.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Location */}
          <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Location
            </div>
            <p className="text-sm font-semibold leading-snug">
              {job.normalizedLocation || job.location || "Not specified"}
            </p>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" /> Payment
            </div>
            <p className="text-xl font-bold text-emerald-600">
              ₹{job.pricingAmount?.toLocaleString() || "—"}
            </p>
            <p className="text-xs text-muted-foreground">per {job.pricingType?.replace("per_", "") || "job"}</p>
          </div>

          {/* Duration */}
          <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Duration
            </div>
            <p className="text-sm font-semibold">
              {job.duration_value} {job.duration_unit}{job.duration_value && job.duration_value > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {job.jobDate === "pick" ? `On ${job.selectedDate}` : `${String(job.jobDate || "").charAt(0).toUpperCase()}${String(job.jobDate || "").slice(1)}`}
            </p>
          </div>

          {/* Workers */}
          <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Workers
            </div>
            <p className="text-sm font-semibold">{job.workersRequired} needed</p>
            <p className="text-xs text-muted-foreground mt-0.5">{acceptedCount} accepted</p>
          </div>
        </div>

        {/* Description */}
        {job.description && (
          <div className="rounded-2xl border bg-background p-5 shadow-sm">
            <h2 className="text-sm font-bold mb-2">Description</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>
        )}

        {/* Applications */}
        <div className="rounded-2xl border bg-background shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold">Applications ({job.applications.length})</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {appliedCount} pending · {acceptedCount} accepted
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            {/* Show payment status for completed applications */}
            {job.applications.some((a) => a.status === "completed" || a.status === "completion_pending") && (
              <div className="mb-4 space-y-3">
                {job.applications.filter((a) => a.status === "completed" || a.status === "completion_pending").map((app) => (
                  <div key={app._id} className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{app.workerId.name}</span>
                      <div className="flex items-center gap-2">
                        {app.status === "completed" && app.paymentStatus === "pending" && (
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Waiting for payment confirmation</Badge>
                        )}
                        {app.status === "completed" && app.paymentStatus === "confirmed_paid" && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">✓ Payment confirmed</Badge>
                        )}
                        {app.status === "completed" && app.paymentStatus === "disputed" && (
                          <Badge variant="destructive" className="text-xs">⚠ Payment disputed</Badge>
                        )}
                        {app.status === "completion_pending" && (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">Awaiting worker confirmation</Badge>
                        )}
                      </div>
                    </div>

                    {/* Rating UI for completed applications with confirmed payment */}
                    {app.status === "completed" && app.paymentStatus === "confirmed_paid" && !app.workerRating?.givenAt && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-semibold mb-2">Rate this worker</p>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setRatingState((prev) => ({ ...prev, [app._id]: { ...prev[app._id], score: star, review: prev[app._id]?.review || "", submitting: false } }))}
                              className={`text-lg transition-colors ${
                                (ratingState[app._id]?.score || 0) >= star ? "text-yellow-400" : "text-gray-300"
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <textarea
                          placeholder="Add a review (optional, max 200 chars)"
                          value={ratingState[app._id]?.review || ""}
                          onChange={(e) => setRatingState((prev) => ({ ...prev, [app._id]: { ...prev[app._id], review: e.target.value.slice(0, 200), score: prev[app._id]?.score || 0, submitting: false } }))}
                          className="w-full text-xs p-2 border rounded mb-2 resize-none"
                          rows={2}
                        />
                        <Button
                          size="sm"
                          className="w-full h-7 text-xs"
                          onClick={() => handleSubmitRating(app._id)}
                          disabled={ratingState[app._id]?.submitting || !ratingState[app._id]?.score}
                        >
                          {ratingState[app._id]?.submitting ? "Submitting..." : "Submit Rating"}
                        </Button>
                      </div>
                    )}

                    {/* Display rating if already given */}
                    {app.status === "completed" && app.workerRating?.givenAt && (
                      <div className="mt-2 pt-2 border-t text-xs">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">Your rating:</span>
                          <span className="text-yellow-500">
                            {"★".repeat(app.workerRating.score)}
                            {"☆".repeat(5 - app.workerRating.score)}
                          </span>
                          <span className="text-muted-foreground">({app.workerRating.score}/5)</span>
                        </div>
                        {app.workerRating.review && (
                          <p className="text-muted-foreground mt-1">"{app.workerRating.review}"</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <ApplicantsList
              applicants={job.applications.map((app) => ({
                _id: app.workerId._id,
                name: app.workerId.name,
                phone: app.workerId.phone || "",
                email: app.workerId.email,
                proficiency: app.workerId.proficiency,
                location: app.workerId.location,
                status: app.status,
                createdAt: app.createdAt,
              }))}
              jobTitle={job.title}
              applicationIds={Object.fromEntries(job.applications.map((app) => [app.workerId._id, app._id]))}
              onStatusUpdate={refreshJob}
            />
          </div>
        </div>

        {/* Job Actions */}
        <div className="rounded-2xl border bg-muted/30 p-5 shadow-sm">
          <h2 className="text-sm font-bold mb-3">Job Actions</h2>
          <div className="flex flex-wrap gap-2">
            {job.status === "open" && (
              <Button variant="outline" size="sm" className="gap-1.5"
                onClick={() => router.push(`/${locale}/add-works?jobId=${jobId}`)}>
                <Edit className="h-3.5 w-3.5" /> Edit Job
              </Button>
            )}
            {(job.status === "assigned" || job.status === "in_progress") && acceptedCount > 0 && (
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleMarkJobComplete} disabled={actionLoading === "complete"}>
                <CheckCircle className="h-3.5 w-3.5" />
                {actionLoading === "complete" ? "Marking…" : "Mark Complete"}
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1.5"
              onClick={() => {
                if (typeof globalThis !== "undefined" && globalThis.location) {
                  const url = `${globalThis.location.protocol}//${globalThis.location.host}/${locale}/projects/${jobId}`;
                  navigator.clipboard.writeText(url);
                  alert("Job link copied!");
                }
              }}>
              <Copy className="h-3.5 w-3.5" /> Copy Link
            </Button>
            {job.status !== "completed" && (
              <Button variant="destructive" size="sm" className="gap-1.5"
                onClick={handleDeleteJob} disabled={actionLoading === "delete"}>
                <Trash2 className="h-3.5 w-3.5" />
                {actionLoading === "delete" ? "Deleting…" : "Delete"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
