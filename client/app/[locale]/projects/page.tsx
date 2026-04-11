'use client';

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, IndianRupee, Clock3, Building2, Loader, MessageCircle } from "lucide-react";
import ApplyJobButton from "@/components/ApplyJobButton";
import { getWorkerApplications } from "@/lib/jobApplicationApi";
import type { Coordinates } from "@/lib/geolocation";
import { getCurrentLocation } from "@/lib/geolocation";
import { calculateDistance, formatDistance } from "@/lib/distance";
import { reverseGeocodeNominatim } from "@/lib/geocoding";
import { normalizeLocationWithCache } from "@/lib/locationNormalizer";
import { fetchSessionUser } from "@/lib/authClient";
import { recommendJobs } from "@/lib/recommendedJobs";

type JobTab = "live" | "recommended" | "applied";

type Job = {
  _id: string;
  title: string;
  description?: string;
  skillRequired?: string[];
  category?: string;
  location: string;
  normalizedLocation?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  pricingAmount?: number;
  pricingType?: "per_hour" | "per_day" | "per_job";
  urgency?: "Immediate" | "Today" | "Flexible";
  jobDate?: "today" | "tomorrow" | "pick" | "flexible";
  duration_value?: number;
  duration_unit?: "hour" | "day" | "week";
  createdAt?: string;
  postedBy?: {
    _id: string;
    name: string;
    email: string;
    activeRole?: string;
  };
  tab?: JobTab;
  status?: string;
  recommendationScore?: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getUrgencyBadgeClass(urgency?: string): string {
  if (urgency === "Immediate") return "bg-red-100 text-red-700";
  if (urgency === "Today") return "bg-amber-100 text-amber-700";
  return "bg-slate-200 text-slate-700";
}

function getUrgencyStartText(urgency?: string): string {
  if (urgency === "Immediate") return "Immediate joining";
  if (urgency === "Today") return "Starts today";
  return "Flexible start";
}

function getPayTypeDisplay(pricingType?: string): string {
  if (pricingType === "per_hour") return "hour";
  if (pricingType === "per_day") return "day";
  if (pricingType === "per_job") return "job";
  return "day";
}

function getTimingLabel(jobDate?: string): string {
  if (jobDate === "today") return "Today";
  if (jobDate === "tomorrow") return "Tomorrow";
  if (jobDate === "pick") return "Pick date";
  return "Flexible";
}

function getDurationLabel(durationValue?: number, durationUnit?: string): string {
  if (!durationValue) return "Any duration";
  return `${durationValue} ${durationUnit || "day"}${durationValue === 1 ? "" : "s"}`;
}

function getSortLabel(sortBy: string): string {
  if (sortBy === "highest") return "Highest pay";
  if (sortBy === "latest") return "Latest";
  return "Nearest first";
}

function getCityFromAddress(address: Awaited<ReturnType<typeof reverseGeocodeNominatim>>): string {
  return address.city || address.town || address.village || address.district || address.displayName || "Unknown location";
}

export default function ProjectsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [profileLocationCoords, setProfileLocationCoords] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [manualLocationCoords, setManualLocationCoords] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isResolvingManualLocation, setIsResolvingManualLocation] = useState(false);
  const [distanceFilter, setDistanceFilter] = useState("10");
  const [payFilter, setPayFilter] = useState("0");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [timingFilter, setTimingFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [payTypeFilter, setPayTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("nearest");
  const [activeTab, setActiveTab] = useState<JobTab>("live");
  const distanceReferenceLocation = manualLocationCoords || currentLocation || profileLocationCoords;
  const hasDistanceReference = Boolean(distanceReferenceLocation);

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!API_BASE_URL) {
          throw new Error("API configuration missing");
        }

        // Get token from localStorage as fallback
        const token = globalThis.window === undefined
          ? null
          : localStorage.getItem("firebaseToken") || localStorage.getItem("token");

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/jobs`, {
          method: "GET",
          headers,
          credentials: "include", // Send cookies automatically
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Map API response to our Job type, all jobs go to "live" tab
        const mappedJobs = (data.jobs || []).map((job: any) => {
          let pricingAmount: number | undefined;

          if (typeof job.pricingAmount === "number") {
            pricingAmount = job.pricingAmount;
          } else if (typeof job.wage === "number") {
            pricingAmount = job.wage;
          }

          return {
            ...job,
            distanceKm: typeof job.distanceKm === "number" ? job.distanceKm : undefined,
            pricingAmount,
            postedBy: job.postedBy || { name: "Unknown" },
            tab: "live" as JobTab,
          };
        });

        // Fetch user's applications to mark jobs as "applied"
        try {
          const applications = await getWorkerApplications();
          const appliedJobIds = new Set(applications.map((app: any) => app.jobId._id || app.jobId));

          // Mark jobs as "applied" if user has applied to them
          const jobsWithApplicationStatus = mappedJobs.map((job) => ({
            ...job,
            tab: appliedJobIds.has(job._id) ? ("applied" as JobTab) : ("live" as JobTab),
          }));

          setJobs(jobsWithApplicationStatus);
        } catch (err) {
          // If fetching applications fails, just show all jobs as "live"
          // This is not a critical error
          console.warn("Could not fetch user applications:", err);
          setJobs(mappedJobs);
        }
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError(err instanceof Error ? err.message : "Failed to load jobs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      const user = await fetchSessionUser();
      setUserSkills(Array.isArray(user?.skills) ? user.skills : []);

      if (typeof user?.latitude === "number" && typeof user?.longitude === "number") {
        setProfileLocationCoords({
          latitude: user.latitude,
          longitude: user.longitude,
        });
      } else {
        setProfileLocationCoords(null);
      }

      if (typeof user?.location === "string" && user.location.trim()) {
        setLocation(user.location);
      }
    };

    void fetchUserPreferences();
  }, []);

  useEffect(() => {
    if (!hasDistanceReference && distanceFilter !== "all") {
      setDistanceFilter("all");
    }
  }, [distanceFilter, hasDistanceReference]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(jobs.map((job) => job.category).filter((category): category is string => Boolean(category)))
    ).sort((left, right) => left.localeCompare(right));
  }, [jobs]);

  const jobsWithDistance = useMemo(() => {
    return jobs.map((job) => {
      if (!distanceReferenceLocation || typeof job.latitude !== "number" || typeof job.longitude !== "number") {
        return job;
      }

      return {
        ...job,
        distanceKm: calculateDistance(distanceReferenceLocation, {
          latitude: job.latitude,
          longitude: job.longitude,
        }),
      };
    });
  }, [distanceReferenceLocation, jobs]);

  const recommendedJobs = useMemo(() => {
    const recommended = recommendJobs(jobsWithDistance, {
      skills: userSkills,
      location: distanceReferenceLocation,
    });

    return recommended.map((job) => ({
      ...job,
      distanceKm: typeof job.recommendationDistanceKm === "number" ? job.recommendationDistanceKm : job.distanceKm,
      tab: "recommended" as JobTab,
    }));
  }, [distanceReferenceLocation, jobsWithDistance, userSkills]);

  const appliedJobs = useMemo(() => {
    return jobsWithDistance.filter((job) => (job.tab || "live") === "applied");
  }, [jobsWithDistance]);

  const liveJobs = useMemo(() => {
    return jobsWithDistance.filter((job) => (job.tab || "live") === "live");
  }, [jobsWithDistance]);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const selectedDistanceLimit = distanceFilter === "all" ? Number.POSITIVE_INFINITY : Number(distanceFilter);

    let sourceJobs = liveJobs;
    if (activeTab === "recommended") {
      sourceJobs = recommendedJobs;
    } else if (activeTab === "applied") {
      sourceJobs = appliedJobs;
    }

    const filtered = sourceJobs.filter((job) => {
      const byQuery = normalizedQuery
        ? job.title.toLowerCase().includes(normalizedQuery)
          || (job.postedBy?.name || "").toLowerCase().includes(normalizedQuery)
        : true;

      let byDistance = true;
      if (hasDistanceReference && distanceFilter !== "all") {
        byDistance = typeof job.distanceKm === "number" && job.distanceKm <= selectedDistanceLimit;
      }
      const byPay = !job.pricingAmount || job.pricingAmount >= Number(payFilter);
      const byCategory = categoryFilter === "all" || job.category === categoryFilter;
      const byTiming = timingFilter === "all" || job.jobDate === timingFilter;
      const byDuration = durationFilter === "all" || job.duration_unit === durationFilter;
      const byPayType = payTypeFilter === "all" || job.pricingType === payTypeFilter;

      return byQuery && byDistance && byPay && byCategory && byTiming && byDuration && byPayType;
    });

    filtered.sort((left, right) => {
      if (activeTab === "recommended") {
        return (right.recommendationScore || 0) - (left.recommendationScore || 0);
      }

      if (sortBy === "highest") {
        return (right.pricingAmount || 0) - (left.pricingAmount || 0);
      }

      if (sortBy === "latest") {
        return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
      }

      const leftDistance = typeof left.distanceKm === "number" ? left.distanceKm : Number.POSITIVE_INFINITY;
      const rightDistance = typeof right.distanceKm === "number" ? right.distanceKm : Number.POSITIVE_INFINITY;
      return leftDistance - rightDistance;
    });

    return filtered;
  }, [activeTab, appliedJobs, categoryFilter, distanceFilter, durationFilter, hasDistanceReference, liveJobs, location, payFilter, payTypeFilter, query, recommendedJobs, sortBy, timingFilter]);

  const openChat = (job: Job) => {
    const email = job.postedBy?.email;

    if (!email) {
      alert("Chat is not available for this job.");
      return;
    }

    const subject = encodeURIComponent(`Interested in your job: ${job.title}`);
    const body = encodeURIComponent(
      `Hi ${job.postedBy?.name || "there"},\n\nI am interested in your job "${job.title}" at ${job.location || "the listed location"}. Please share more details.\n\nThanks`
    );

    globalThis.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank", "noopener,noreferrer");
  };

  const getJobDistanceDisplay = (job: Job): string => {
    if (typeof job.distanceKm === "number") {
      return formatDistance(job.distanceKm);
    }

    if (hasDistanceReference) {
      return "Not available";
    }

    return "Enter location or use my location to calculate";
  };

  const handleUseMyLocation = async () => {
    try {
      setIsLocating(true);
      const coords = await getCurrentLocation();
      setCurrentLocation(coords);
      setManualLocationCoords(null);

      const address = await reverseGeocodeNominatim(coords.latitude, coords.longitude);
      setLocation(getCityFromAddress(address));
    } catch (err) {
      console.error("Failed to get current location:", err);
      alert(err instanceof Error ? err.message : "Failed to get your location");
    } finally {
      setIsLocating(false);
    }
  };

  const resolveManualLocationCoordinates = async () => {
    const locationText = location.trim();

    if (!locationText) {
      setManualLocationCoords(null);
      return;
    }

    try {
      setIsResolvingManualLocation(true);
      const normalized = await normalizeLocationWithCache(locationText);

      if (!normalized.isValid) {
        setManualLocationCoords(null);
        return;
      }

      // Use only coordinates for distance calculation; keep user text unchanged.
      setManualLocationCoords({
        latitude: normalized.latitude,
        longitude: normalized.longitude,
      });
    } catch (err) {
      console.error("Manual location coordinate lookup failed:", err);
      setManualLocationCoords(null);
    } finally {
      setIsResolvingManualLocation(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto w-full max-w-5xl px-4 py-5">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Jobs for You</h1>
          <p className="text-sm text-slate-600">Browse and pick the right job fast.</p>
        </div>

        <Card className="mb-4 border-slate-200">
          <CardContent className="space-y-3 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Search</p>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by job title or contractor"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-slate-500">Location</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-full px-3 text-xs"
                    onClick={handleUseMyLocation}
                    disabled={isLocating}
                  >
                    {isLocating ? "Locating..." : "Use my location"}
                  </Button>
                </div>
                <Input
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (!e.target.value.trim()) {
                      setManualLocationCoords(null);
                    }
                  }}
                  onBlur={() => {
                    void resolveManualLocationCoordinates();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void resolveManualLocationCoordinates();
                    }
                  }}
                  placeholder="e.g. Bilimora"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">Search updates instantly</span>
              {isResolvingManualLocation && (
                <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                  Resolving manual location coordinates...
                </span>
              )}
              {currentLocation && (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                  Using live location for nearest-first sorting
                </span>
              )}
              {!currentLocation && profileLocationCoords && (
                <span className="rounded-full bg-teal-50 px-2 py-1 text-teal-700">
                  Using saved profile coordinates for distance
                </span>
              )}
              {!hasDistanceReference && (
                <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                  Distance filter disabled until location is provided
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4 border-slate-200">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-slate-900">Filters</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Category</p>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Timing</p>
                <Select value={timingFilter} onValueChange={setTimingFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any timing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any timing</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    <SelectItem value="pick">Pick date</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Duration</p>
                <Select value={durationFilter} onValueChange={setDurationFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any duration</SelectItem>
                    <SelectItem value="hour">Hours</SelectItem>
                    <SelectItem value="day">Days</SelectItem>
                    <SelectItem value="week">Weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Pay type</p>
                <Select value={payTypeFilter} onValueChange={setPayTypeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any pay type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any pay type</SelectItem>
                    <SelectItem value="per_hour">Per hour</SelectItem>
                    <SelectItem value="per_day">Per day</SelectItem>
                    <SelectItem value="per_job">Per job</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Distance</p>
                <Select value={distanceFilter} onValueChange={setDistanceFilter} disabled={!hasDistanceReference}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={hasDistanceReference ? "Select distance" : "Enable location first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Within 3 km</SelectItem>
                    <SelectItem value="5">Within 5 km</SelectItem>
                    <SelectItem value="10">Within 10 km</SelectItem>
                    <SelectItem value="20">Within 20 km</SelectItem>
                    <SelectItem value="all">No limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Pay</p>
                <Select value={payFilter} onValueChange={setPayFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any pay</SelectItem>
                    <SelectItem value="800">INR 800+</SelectItem>
                    <SelectItem value="1200">INR 1200+</SelectItem>
                    <SelectItem value="2000">INR 2000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Sort</p>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Nearest first" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nearest">Nearest first</SelectItem>
                    <SelectItem value="highest">Highest pay</SelectItem>
                    <SelectItem value="latest">Latest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-100 p-1">
          <Button
            type="button"
            size="sm"
            variant={activeTab === "live" ? "default" : "ghost"}
            onClick={() => setActiveTab("live")}
            className="w-full"
          >
            Live Jobs
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === "recommended" ? "default" : "ghost"}
            onClick={() => setActiveTab("recommended")}
            className="w-full"
          >
            Recommended
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === "applied" ? "default" : "ghost"}
            onClick={() => setActiveTab("applied")}
            className="w-full"
          >
            Applied
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="mr-2 h-5 w-5 animate-spin text-slate-600" />
            <p className="text-slate-600">Loading jobs...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Jobs List */}
        {!isLoading && !error && (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <Card key={job._id} className="border-slate-200">
              <CardContent className="space-y-3 p-4">
                {/** Applied jobs should not show accept action again. */}
                {(() => {
                  const isAppliedJob = (job.tab || "live") === "applied";
                  return (
                    <>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900">{job.title}</h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 font-medium text-emerald-700">
                        {job.category || "Uncategorized"}
                      </span>
                      <span className={`rounded-full px-2 py-1 font-medium ${getUrgencyBadgeClass(job.urgency)}`}>
                        {job.urgency || "Flexible"}
                      </span>
                      {activeTab === "recommended" && (
                        <span className="rounded-full bg-blue-100 px-2 py-1 font-medium text-blue-700">
                          Score {job.recommendationScore || 0}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {job.location || "Location not specified"}
                  </p>
                  <p className="flex items-center gap-1.5 font-semibold text-emerald-700">
                    <IndianRupee className="h-4 w-4" />
                    {job.pricingAmount || "POA"} {job.pricingAmount && `/ ${getPayTypeDisplay(job.pricingType)}`}
                  </p>
                  <p className="flex items-center gap-1.5 sm:col-span-2">
                    <MapPin className="h-4 w-4" />
                    Distance: {getJobDistanceDisplay(job)}
                  </p>
                  <p className="flex items-center gap-1.5 sm:col-span-2">
                    <Building2 className="h-4 w-4" />
                    Posted by {job.postedBy?.name || "Unknown"}
                  </p>
                  <p className="flex items-center gap-1.5 sm:col-span-2">
                    <Clock3 className="h-4 w-4" />
                    Timing: {getTimingLabel(job.jobDate)} · Duration: {getDurationLabel(job.duration_value, job.duration_unit)}
                  </p>
                  <p className="flex items-center gap-1.5 sm:col-span-2">
                    <Clock3 className="h-4 w-4" />
                    {getUrgencyStartText(job.urgency)}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {isAppliedJob ? (
                    <ApplyJobButton
                      jobId={job._id}
                      isAlreadyApplied={true}
                    />
                  ) : (
                    <ApplyJobButton
                      jobId={job._id}
                      isAlreadyApplied={false}
                    />
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-full rounded-full px-3 text-sm font-medium gap-1.5"
                    onClick={() => openChat(job)}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat
                  </Button>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setSelectedJob(job)}>
                    View Details
                  </Button>
                </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          ))}

          {filteredJobs.length === 0 && !isLoading && (
            <Card className="border-dashed border-slate-300">
              <CardContent className="p-6 text-center text-sm text-slate-600">
                No jobs found for selected filters.
              </CardContent>
            </Card>
          )}
        </div>
        )}

        <Dialog open={Boolean(selectedJob)} onOpenChange={(open) => !open && setSelectedJob(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedJob?.title}</DialogTitle>
              <DialogDescription>
                {selectedJob?.location || "Location not specified"}
              </DialogDescription>
            </DialogHeader>

            {selectedJob && (
              <div className="space-y-4 text-sm text-slate-700">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <p><span className="font-semibold">Category:</span> {selectedJob.category || "Not specified"}</p>
                  <p><span className="font-semibold">Pay:</span> {selectedJob.pricingAmount || "POA"} {selectedJob.pricingAmount ? `/${getPayTypeDisplay(selectedJob.pricingType)}` : ""}</p>
                  <p><span className="font-semibold">Distance:</span> {typeof selectedJob.distanceKm === "number" ? formatDistance(selectedJob.distanceKm) : "Not available"}</p>
                  <p><span className="font-semibold">Urgency:</span> {selectedJob.urgency || "Flexible"}</p>
                  <p><span className="font-semibold">Timing:</span> {getTimingLabel(selectedJob.jobDate)}</p>
                  <p><span className="font-semibold">Duration:</span> {getDurationLabel(selectedJob.duration_value, selectedJob.duration_unit)}</p>
                  <p><span className="font-semibold">Posted by:</span> {selectedJob.postedBy?.name || "Unknown"}</p>
                  <p><span className="font-semibold">Email:</span> {selectedJob.postedBy?.email || "Not available"}</p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">About this job</p>
                  <p className="mt-1 text-slate-600">
                    {selectedJob.description || "No description was provided for this job."}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className="w-full gap-1.5" onClick={() => openChat(selectedJob)}>
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setSelectedJob(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </section>
    </main>
  );
}
