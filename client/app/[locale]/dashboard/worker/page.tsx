"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentLocale, fetchSessionUser, AuthUser, resolveAccountType } from "@/lib/authClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CheckCircle, Clock, AlertCircle, MapPin, IndianRupee, ArrowRight } from "lucide-react";

interface Job {
  id: string;
  title: string;
  location: string;
  pay: number;
  payType: "hour" | "day" | "job";
  status: "applied" | "accepted" | "completed";
}

export default function WorkerDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getCurrentLocale(pathname);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
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

      setUser(sessionUser);
      setLoading(false);
    };

    checkAuth();
  }, [locale, router]);

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

  // Sample data - replace with API calls
  const appliedJobs: Job[] = [
    {
      id: "1",
      title: "Plumbing Work",
      location: "Bilimora",
      pay: 1200,
      payType: "day",
      status: "applied"
    },
    {
      id: "2",
      title: "Electrical Wiring",
      location: "Navsari",
      pay: 2500,
      payType: "job",
      status: "applied"
    }
  ];

  const activeJobs: Job[] = [
    {
      id: "3",
      title: "House Renovation",
      location: "Valsad",
      pay: 15000,
      payType: "job",
      status: "accepted"
    }
  ];

  const completedJobs: Job[] = [
    {
      id: "4",
      title: "Tile Fitting",
      location: "Bilimora",
      pay: 3500,
      payType: "day",
      status: "completed"
    },
    {
      id: "5",
      title: "Painting Work",
      location: "Navsari",
      pay: 5000,
      payType: "job",
      status: "completed"
    }
  ];

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
                  {activeJobs.length}
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
                  ₹8.5K
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
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        In Progress
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">
                        ₹{job.pay} <span className="text-sm text-gray-600 dark:text-gray-400">/{job.payType}</span>
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
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Applied
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">
                        ₹{job.pay} <span className="text-sm text-gray-600 dark:text-gray-400">/{job.payType}</span>
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
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Completed
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">
                        ₹{job.pay} <span className="text-sm text-gray-600 dark:text-gray-400">/{job.payType}</span>
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