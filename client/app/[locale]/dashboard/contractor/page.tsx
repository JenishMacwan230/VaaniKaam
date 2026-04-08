"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchSessionUser, AuthUser, getCurrentLocale, resolveAccountType } from "@/lib/authClient";
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
  wage?: number;
  status: "open" | "assigned" | "completed" | "cancelled";
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
  status: "applied" | "accepted" | "rejected";
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

  const [user, setUser] = useState<AuthUser | null>(null);
  const [jobs, setJobs] = useState<JobWithApplications[]>([]);
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<ContractorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

        setUser(currentUser);

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
            setRecentApplications((data.applications || []).slice(0, 5));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "assigned":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

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
              Welcome back, {user?.name}! 👋
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

        {/* Notifications Section */}
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
                    {stats.totalJobs}
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
                    {stats.openJobs}
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
                    {stats.assignedJobs}
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
                    {stats.completedJobs}
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
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Current Projects</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your ongoing and open projects
            </p>
          </div>

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <Card key={job._id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {job.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {job.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        {job.wage && (
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            ₹{job.wage.toLocaleString()}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Posted on {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {job.applicationsCount}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Applications</p>
                      </div>
                    </div>

                    {/* Recent Applications Preview */}
                    {job.applications.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          Recent Applications
                        </p>
                        <div className="space-y-2">
                          {job.applications.slice(0, 2).map((app) => (
                            <div
                              key={app._id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {app.workerId.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  {new Date(app.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {app.status}
                              </Badge>
                            </div>
                          ))}
                          {job.applicationsCount > 2 && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-2">
                              +{job.applicationsCount - 2} more applications
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-6">
                      <Button
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => router.push(`/${locale}/projects/${job._id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                        onClick={() =>
                          router.push(`/${locale}/dashboard/contractor?jobId=${job._id}`)
                        }
                      >
                        Manage Applications
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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