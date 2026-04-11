"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentLocale, fetchSessionUser, resolveAccountType } from "@/lib/authClient";
import { getWorkerApplications, getWorkerAcceptedJobs, getWorkerPendingCompletion, getWorkerCompletedJobs, confirmJobCompletion, rejectJobCompletion } from "@/lib/jobApplicationApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CheckCircle, Clock, AlertCircle, MapPin, IndianRupee, ArrowRight } from "lucide-react";

interface Job {
  _id: string;
  title: string;
  location?: string;
  pricingAmount?: number | string;
  pricingType?: string;
  status: "applied" | "accepted" | "completion_pending" | "completed";
  postedBy?: {
    name: string;
  };
  createdAt?: string;
  applicationId?: string;
}

export default function WorkerDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getCurrentLocale(pathname);

  const [loading, setLoading] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [pendingCompletionJobs, setPendingCompletionJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getNumericAmount = (value: number | string | undefined): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const formatPricing = (amount: number | string | undefined, type?: string): string => {
    const numericAmount = getNumericAmount(amount);
    if (numericAmount > 0) {
      return `₹${numericAmount.toLocaleString()}/${type || "job"}`;
    }
    return `POA/${type || "job"}`;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionUser = await fetchSessionUser();
        if (!sessionUser) {
          router.push(`/${locale}/login`);
          return;
        }

        const accountType = resolveAccountType(sessionUser);
        if (accountType !== "worker") {
          router.push(`/${locale}`);
          return;
        }

        // Fetch applied jobs
        try {
          const applicationsData = await getWorkerApplications();
          const appliedJobsList = applicationsData
            .filter((app: any) => app.status === "applied" && app.jobId)
            .map((app: any) => ({
              _id: app.jobId._id,
              title: app.jobId.title,
              location: app.jobId.location,
              pricingAmount: app.jobId.pricingAmount,
              pricingType: app.jobId.pricingType,
              status: "applied" as const,
              postedBy: app.jobId.postedBy,
              createdAt: app.createdAt,
            }));
          setAppliedJobs(appliedJobsList);
        } catch (err) {
          console.error("Error fetching applied jobs:", err);
        }

        // Fetch accepted jobs (active work)
        try {
          const acceptedData = await getWorkerAcceptedJobs();
          const acceptedJobsList = acceptedData
            .map((app: any) => ({
              _id: app.jobId._id,
              title: app.jobId.title,
              location: app.jobId.location,
              pricingAmount: app.jobId.pricingAmount,
              pricingType: app.jobId.pricingType,
              status: "accepted" as const,
              postedBy: app.jobId.postedBy,
              createdAt: app.jobId.createdAt,
            }));
          setActiveJobs(acceptedJobsList);
        } catch (err) {
          console.error("Error fetching accepted jobs:", err);
        }

        // Fetch pending completion jobs
        try {
          const pendingData = await getWorkerPendingCompletion();
          const pendingJobsList = pendingData
            .map((app: any) => ({
              _id: app.jobId._id,
              title: app.jobId.title,
              location: app.jobId.location,
              pricingAmount: app.jobId.pricingAmount,
              pricingType: app.jobId.pricingType,
              status: "completion_pending" as const,
              postedBy: app.jobId.postedBy,
              createdAt: app.jobId.createdAt,
              applicationId: app._id,
            }));
          setPendingCompletionJobs(pendingJobsList);
        } catch (err) {
          console.error("Error fetching pending completion jobs:", err);
        }

        // Fetch completed jobs
        try {
          const completedData = await getWorkerCompletedJobs();
          const completedJobsList = completedData
            .map((app: any) => ({
              _id: app.jobId._id,
              title: app.jobId.title,
              location: app.jobId.location,
              pricingAmount: app.jobId.pricingAmount,
              pricingType: app.jobId.pricingType,
              status: "completed" as const,
              postedBy: app.jobId.postedBy,
              createdAt: app.jobId.createdAt,
            }));
          setCompletedJobs(completedJobsList);
        } catch (err) {
          console.error("Error fetching completed jobs:", err);
        }

        setLoading(false);
      } catch (err) {
        console.error("Auth error:", err);
        setError("Failed to load dashboard");
        setLoading(false);
      }
    };

    checkAuth();
  }, [locale, router]);

  const handleConfirmCompletion = async (job: Job) => {
    if (!job.applicationId) return;
    try {
      await confirmJobCompletion(job.applicationId);
      // Refresh the data
      const completedData = await getWorkerCompletedJobs();
      const completedJobsList = completedData.map((app: any) => ({
        _id: app.jobId._id,
        title: app.jobId.title,
        location: app.jobId.location,
        pricingAmount: app.jobId.pricingAmount,
        pricingType: app.jobId.pricingType,
        status: "completed" as const,
        postedBy: app.jobId.postedBy,
        createdAt: app.jobId.createdAt,
      }));
      setCompletedJobs(completedJobsList);
      setPendingCompletionJobs(pendingCompletionJobs.filter(j => j._id !== job._id));
    } catch (err) {
      console.error("Error confirming completion:", err);
    }
  };

  const handleRejectCompletion = async (job: Job) => {
    if (!job.applicationId) return;
    try {
      await rejectJobCompletion(job.applicationId);
      // Refresh active jobs
      const acceptedData = await getWorkerAcceptedJobs();
      const acceptedJobsList = acceptedData.map((app: any) => ({
        _id: app.jobId._id,
        title: app.jobId.title,
        location: app.jobId.location,
        pricingAmount: app.jobId.pricingAmount,
        pricingType: app.jobId.pricingType,
        status: "accepted" as const,
        postedBy: app.jobId.postedBy,
        createdAt: app.jobId.createdAt,
      }));
      setActiveJobs(acceptedJobsList);
      setPendingCompletionJobs(pendingCompletionJobs.filter(j => j._id !== job._id));
    } catch (err) {
      console.error("Error rejecting completion:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-red-700">
              {error}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Work Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your applied jobs, active projects, and completed work
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Applied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {appliedJobs.length}
                </div>
                <AlertCircle className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {activeJobs.length + pendingCompletionJobs.length}
                </div>
                <Clock className="h-8 w-8 text-amber-500 opacity-50" />
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
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{(completedJobs.reduce((sum, job) => sum + getNumericAmount(job.pricingAmount), 0) / 1000).toFixed(1)}K
                </div>
                <IndianRupee className="h-8 w-8 text-emerald-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Jobs */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Active Jobs</h2>
          {activeJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No active jobs</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeJobs.map((job) => (
                <Card key={job._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4" />
                          {job.location || "Location not specified"}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        In Progress
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">
                        {formatPricing(job.pricingAmount, job.pricingType)}
                      </p>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pending Completion Jobs */}
        {pendingCompletionJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Jobs Pending Confirmation</h2>
            <div className="grid gap-4">
              {pendingCompletionJobs.map((job) => (
                <Card key={job._id} className="hover:shadow-lg transition-shadow border-orange-200 dark:border-orange-900/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4" />
                          {job.location || "Location not specified"}
                        </p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        Awaiting Confirmation
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">
                        {formatPricing(job.pricingAmount, job.pricingType)}
                      </p>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleConfirmCompletion(job)}
                      >
                        Confirm Completion
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectCompletion(job)}
                      >
                        Reject & Continue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Applied Jobs */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Applied Jobs</h2>
          {appliedJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No applied jobs</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {appliedJobs.map((job) => (
                <Card key={job._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4" />
                          {job.location || "Location not specified"}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Applied
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">
                        {formatPricing(job.pricingAmount, job.pricingType)}
                      </p>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Jobs */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Completed Jobs</h2>
          {completedJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No completed jobs yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {completedJobs.map((job) => (
                <Card key={job._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4" />
                          {job.location || "Location not specified"}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Completed
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">
                        {formatPricing(job.pricingAmount, job.pricingType)}
                      </p>
                      <Button variant="outline" size="sm">
                        View Details
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
              onClick={() => router.push(`/${locale}/projects`)}
              className="bg-emerald-600 hover:bg-emerald-700 h-auto py-4 text-base"
            >
              <Briefcase className="h-5 w-5 mr-2" />
              Find More Jobs
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="h-auto py-4 text-base"
            >
              View Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}`)}
              className="h-auto py-4 text-base"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}