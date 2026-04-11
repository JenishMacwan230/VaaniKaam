"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchSessionUser, getCurrentLocale, resolveAccountType } from "@/lib/authClient";
import { Bell, TrendingUp, Briefcase, CheckCircle, AlertCircle, Eye, Phone, MessageSquare, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  jobId: {
    title: string;
    status: string;
  };
  status: "applied" | "accepted" | "rejected" | "completion_pending" | "completed";
  createdAt: string;
  workerId: {
    _id: string;
    name: string;
    email: string;
    proficiency?: string;
    location?: string;
  };
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

  const formatWage = (value: number | string | undefined): string => {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return `₹${value.toLocaleString()}`;
    }
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return `₹${parsed.toLocaleString()}`;
      }
      return value.trim() || "POA";
    }
    return "POA";
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check authentication
        const currentUser = await fetchSessionUser();
        if (!currentUser) {
          router.push(`/${locale}/login`);
          return;
        }

        // Check if user is contractor
        const accountType = resolveAccountType(currentUser);
        if (accountType !== "contractor") {
          router.push(`/${locale}/dashboard/worker`);
          return;
        }

        // Only fetch if API_BASE_URL is defined
        if (!API_BASE_URL) {
          console.warn("API_BASE_URL is not defined");
          setError("API configuration missing");
          setIsLoading(false);
          return;
        }

        // Fetch contractor data in parallel
        try {
          const [jobsRes, statsRes, applicationsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/jobs/contractor/jobs`, { credentials: "include" }).catch(err => {
              console.error("Jobs fetch error:", err);
              return null;
            }),
            fetch(`${API_BASE_URL}/api/jobs/contractor/stats`, { credentials: "include" }).catch(err => {
              console.error("Stats fetch error:", err);
              return null;
            }),
            fetch(`${API_BASE_URL}/api/jobs/contractor/applications`, { credentials: "include" }).catch(err => {
              console.error("Applications fetch error:", err);
              return null;
            }),
          ]);

          if (jobsRes?.ok) {
            const data = await jobsRes.json();
            setJobs(data.jobs || []);
          } else if (jobsRes) {
            console.warn("Jobs response not ok:", jobsRes.status, await jobsRes.text());
          }

          if (statsRes?.ok) {
            const data = await statsRes.json();
            setStats(data.stats || null);
          } else if (statsRes) {
            console.warn("Stats response not ok:", statsRes.status, await statsRes.text());
          }

          if (applicationsRes?.ok) {
            const data = await applicationsRes.json();
            // Only show pending/applied applications (not accepted or rejected)
            const pendingApps = (data.applications || []).filter((app: JobApplication) => app.status === "applied").slice(0, 5);
            setRecentApplications(pendingApps);
          } else if (applicationsRes) {
            console.warn("Applications response not ok:", applicationsRes.status, await applicationsRes.text());
          }
        } catch (err) {
          console.error("Data fetch error:", err);
          // Continue anyway - show partial dashboard
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [pathname, router, locale]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const openJobs = jobs.filter(job => job.status === "open");
  const inProgressJobs = jobs.filter(
    job => job.status === "assigned" || job.status === "in_progress" || job.status === "completion_pending"
  );
  const completedJobs = jobs.filter(job => job.status === "completed");
  const jobsWithApplications = jobs
    .filter(job => job.applicationsCount > 0 && job.status !== "completed")
    .sort((a, b) => b.applicationsCount - a.applicationsCount);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 space-y-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/40"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your projects and track applications
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Notifications Section - Only show for jobs with pending applications */}
        {recentApplications.length > 0 && (
          <Card className="mb-8 border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-lg">
                    New Applications ({recentApplications.length})
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentApplications.map((app) => (
                  <div
                    key={app._id}
                    className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {app.workerId.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Applied for: <span className="font-semibold">{app.jobId?.title || "Job"}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {app.workerId.location && `📍 ${app.workerId.location}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                      >
                        <Phone className="h-4 w-4" />
                        Call
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {jobs.length}
                  </div>
                  <Briefcase className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Open Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {openJobs.length}
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {inProgressJobs.length}
                  </div>
                  <TrendingUp className="h-8 w-8 text-amber-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {completedJobs.length}
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.totalApplications}
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Current Projects Section */}
        <div className="space-y-8">
          {jobs.length === 0 ? (
            <Card className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No projects yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start by creating your first project to find skilled workers
              </p>
              <Button
                onClick={() => router.push(`/${locale}/add-works`)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Post First Project
              </Button>
            </Card>
          ) : (
            <>
              {/* Jobs With Applications */}
              {jobsWithApplications.length > 0 && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Bell className="h-6 w-6 text-indigo-600" />
                      Jobs With Applications
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Projects that currently have worker interest
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {jobsWithApplications.map((job) => (
                      <Card key={`applications-${job._id}`} className="overflow-hidden hover:shadow-lg transition-shadow border-indigo-200 dark:border-indigo-900/30">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg text-gray-900 dark:text-white">
                                {job.title}
                              </CardTitle>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {job.location && `📍 ${job.location}`}
                              </p>
                            </div>
                            <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                              {job.applicationsCount} Applications
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatWage(job.wage)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Posted on {new Date(job.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {job.status.replace("_", " ")}
                            </Badge>
                          </div>

                          <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-sm"
                            onClick={() =>
                              router.push(`/${locale}/dashboard/contractor/${job._id}?tab=applications`)
                            }
                          >
                            Manage Applications
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Open Projects */}
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertCircle className="h-6 w-6 text-blue-600" />
                    Open Projects
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Waiting for workers to apply
                  </p>
                </div>

                {openJobs.length === 0 ? (
                  <Card className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No open projects
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      All your projects have been accepted or completed
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {openJobs.map((job) => (
                  <Card key={job._id} className="overflow-hidden hover:shadow-lg transition-shadow border-blue-200 dark:border-blue-900/30">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-gray-900 dark:text-white">
                            {job.title}
                          </CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {job.location && `📍 ${job.location}`}
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Open
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatWage(job.wage)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Posted on {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {job.applicationsCount}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Applications</p>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                        onClick={() =>
                          router.push(`/${locale}/dashboard/contractor/${job._id}?tab=applications`)
                        }
                      >
                        Manage Applications
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
              </div>

              {/* In Progress Projects */}
          {inProgressJobs.length > 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-amber-600" />
                  In Progress
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Workers are actively working on these projects
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {inProgressJobs.map((job) => (
                  <Card key={job._id} className="overflow-hidden hover:shadow-lg transition-shadow border-amber-200 dark:border-amber-900/30">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-gray-900 dark:text-white">
                            {job.title}
                          </CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {job.location && `📍 ${job.location}`}
                          </p>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          {job.status === "completion_pending" ? "Awaiting Confirmation" : "In Progress"}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatWage(job.wage)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Posted on {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {job.applications?.filter(a => a.status === "accepted").length || 0}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Workers</p>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-amber-600 hover:bg-amber-700 text-sm"
                        onClick={() => router.push(`/${locale}/dashboard/contractor/${job._id}`)}
                      >
                        {job.status === "completion_pending" ? "View Status" : "Mark as Complete"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {completedJobs.length > 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Completed Projects ({completedJobs.length})
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Successfully finished projects
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {completedJobs.map((job) => (
                    <Card key={job._id} className="overflow-hidden hover:shadow-lg transition-shadow border-green-200 dark:border-green-900/30">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-gray-900 dark:text-white">
                              {job.title}
                            </CardTitle>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {job.location && `📍 ${job.location}`}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Completed
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatWage(job.wage)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Completed on {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {job.applications?.filter(a => a.status === "accepted" || a.status === "completed").length || 0}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Workers</p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full text-sm"
                          onClick={() => router.push(`/${locale}/dashboard/contractor/${job._id}`)}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => router.push(`/${locale}/add-works`)}
              className="bg-emerald-600 hover:bg-emerald-700 h-auto py-4 text-base"
            >
              <Briefcase className="h-5 w-5 mr-2" />
              Post New Project
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/projects`)}
              className="h-auto py-4 text-base"
            >
              Browse Workers
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="h-auto py-4 text-base"
            >
              View Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}