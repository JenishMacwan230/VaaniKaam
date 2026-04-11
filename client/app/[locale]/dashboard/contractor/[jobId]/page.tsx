'use client';

import { useEffect, useState, use } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchSessionUser, getCurrentLocale } from "@/lib/authClient";
import ApplicantsList from "@/components/ApplicantsList";
import { 
  ArrowLeft, 
  MapPin, 
  DollarSign, 
  Clock, 
  Users, 
  CheckCircle,
  Briefcase,
  Edit,
  Trash2,
  Copy
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
  status: "applied" | "accepted" | "rejected";
  createdAt: string;
  workerId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    proficiency?: string;
    location?: string;
  };
}

export default function JobDetailsPage({ params }: { readonly params: Promise<{ readonly locale: string; readonly jobId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const locale = getCurrentLocale(pathname);

  const [job, setJob] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check authentication
        const currentUser = await fetchSessionUser();
        if (!currentUser) {
          router.push(`/${locale}/login`);
          return;
        }

        if (!API_BASE_URL) {
          setError("API configuration missing");
          setIsLoading(false);
          return;
        }

        // Fetch job details
        const res = await fetch(`${API_BASE_URL}/api/jobs/${resolvedParams.jobId}`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setJob(data.job);
        } else {
          setError("Failed to load job details");
        }
      } catch (err) {
        console.error("Load error:", err);
        setError("Error loading job details");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [resolvedParams.jobId, pathname, router, locale]);

  const handleApplicationAction = async (applicationId: string, action: "accept" | "reject") => {
    setActionLoading(applicationId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/applications/${applicationId}/${action}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        // Update local state
        if (job) {
          setJob({
            ...job,
            applications: job.applications.map((app) =>
              app._id === applicationId ? { ...app, status: action === "accept" ? "accepted" : "rejected" } : app
            ),
          });
        }
      } else {
        alert("Failed to update application");
      }
    } catch (err) {
      console.error("Action error:", err);
      alert("Error updating application");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkJobComplete = async () => {
    if (!job) return;
    
    const acceptedApps = job.applications.filter((app) => app.status === "accepted");
    if (acceptedApps.length === 0) {
      alert("You must have at least one accepted worker to mark the job as complete");
      return;
    }

    if (!confirm(`Mark this job as complete? This will notify ${acceptedApps.length} worker(s) to confirm completion.`)) {
      return;
    }

    setActionLoading("complete");
    try {
      // Mark each accepted application as completion_pending
      for (const app of acceptedApps) {
        const res = await fetch(`${API_BASE_URL}/api/jobs/mark-complete`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId: app._id }),
        });

        if (!res.ok) {
          alert("Failed to mark job as complete");
          setActionLoading(null);
          return;
        }
      }

      // Refresh job details
      const refreshRes = await fetch(`${API_BASE_URL}/api/jobs/${resolvedParams.jobId}`, {
        credentials: "include",
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setJob(data.job);
        alert("Job marked as complete. Workers will be notified to confirm.");
      }
    } catch (err) {
      console.error("Complete error:", err);
      alert("Error marking job as complete");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteJob = async () => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      return;
    }

    setActionLoading("delete");
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/${resolvedParams.jobId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        router.push(`/${locale}/dashboard/contractor`);
      } else {
        alert("Failed to delete job");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting job");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "assigned":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "in_progress":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "completion_pending":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getApplicationColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "accepted":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "rejected":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job || error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push(`/${locale}/dashboard/contractor`)}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/40 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-8 text-center">
              <p className="text-red-600 dark:text-red-400 text-lg">{error || "Job not found"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const acceptedCount = job.applications.filter((app) => app.status === "accepted").length;
  const appliedCount = job.applications.filter((app) => app.status === "applied").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <button
            onClick={() => router.push(`/${locale}/dashboard/contractor`)}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {job.title}
              </h1>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Briefcase className="h-4 w-4" />
                <span>{job.category}</span>
              </div>
            </div>
            <Badge className={getStatusColor(job.status)}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Job Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Location */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-gray-900 dark:text-white">
                {job.normalizedLocation || job.location || "Not specified"}
              </p>
              {Boolean(job.latitude && job.longitude) && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  📍 {job.latitude?.toFixed(4)}, {job.longitude?.toFixed(4)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{job.pricingAmount?.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Per {job.pricingType?.replace("per_", "") || "job"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Duration */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-gray-900 dark:text-white">
                {job.duration_value} {job.duration_unit}
                {job.duration_value && job.duration_value > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {job.jobDate === "pick" ? `Scheduled for ${job.selectedDate}` : `${String(job.jobDate).charAt(0).toUpperCase() + String(job.jobDate).slice(1)}`}
              </p>
            </CardContent>
          </Card>

          {/* Workers Needed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Workers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-gray-900 dark:text-white">
                {job.workersRequired} needed
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {acceptedCount} accepted
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {job.description || "No description provided"}
            </p>
          </CardContent>
        </Card>

        {/* Applicants Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Applications ({job.applications.length})</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {appliedCount} pending • {acceptedCount} accepted
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
              applicationIds={Object.fromEntries(
                job.applications.map((app) => [app.workerId._id, app._id])
              )}
              onStatusUpdate={() => {
                // Refresh job details after status update
                const loadData = async () => {
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/jobs/${resolvedParams.jobId}`, {
                      credentials: "include",
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setJob(data.job);
                    }
                  } catch (err) {
                    console.error("Refresh error:", err);
                  }
                };
                loadData();
              }}
            />
          </CardContent>
        </Card>

        {/* Job Actions */}
        <Card className="bg-gray-50 dark:bg-gray-900/50">
          <CardHeader>
            <CardTitle>Job Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {job.status === "open" && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => router.push(`/${locale}/add-works?jobId=${resolvedParams.jobId}`)}
                >
                  <Edit className="h-4 w-4" />
                  Edit Job
                </Button>
              )}
              {(job.status === "assigned" || job.status === "in_progress") && acceptedCount > 0 && (
                <Button
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  onClick={handleMarkJobComplete}
                  disabled={actionLoading === "complete"}
                >
                  <CheckCircle className="h-4 w-4" />
                  {actionLoading === "complete" ? "Marking..." : "Mark as Complete"}
                </Button>
              )}
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  if (typeof globalThis !== "undefined" && globalThis.location) {
                    const url = `${globalThis.location.protocol}//${globalThis.location.host}/${locale}/projects/${resolvedParams.jobId}`;
                    navigator.clipboard.writeText(url);
                    alert("Job link copied to clipboard");
                  }
                }}
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              {job.status !== "completed" && (
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={handleDeleteJob}
                  disabled={actionLoading === "delete"}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Job
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
