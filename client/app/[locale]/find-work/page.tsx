'use client';

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  MapPin, IndianRupee, Clock3, Building2, Loader, MessageCircle,
  Search, LocateFixed, SlidersHorizontal, Sparkles, Briefcase,
  CheckCircle, ChevronRight, Star,
  User,
} from "lucide-react";
import ApplyJobButton from "@/components/ApplyJobButton";
import { getWorkerApplications, withdrawApplication } from "@/lib/jobApplicationApi";
import type { Coordinates } from "@/lib/geolocation";
import { getCurrentLocation } from "@/lib/geolocation";
import { calculateDistance, formatDistance } from "@/lib/distance";
import { reverseGeocodeNominatim } from "@/lib/geocoding";
import { normalizeLocationWithCache } from "@/lib/locationNormalizer";
import { fetchSessionUser } from "@/lib/authClient";
import { recommendJobs } from "@/lib/recommendedJobs";
import { useTranslations } from "next-intl";

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
  postedBy?: { _id: string; name: string; email: string; phone?: string; activeRole?: string };
  tab?: JobTab;
  status?: string;
  applicationStatus?: "applied" | "accepted" | "rejected";
  recommendationScore?: number;
  recommendationDistanceKm?: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getCityFromAddress(address: Awaited<ReturnType<typeof reverseGeocodeNominatim>>) {
  return address.city || address.town || address.village || address.district || address.displayName || "Unknown location";
}

const categoryEmoji: Record<string, string> = {
  Construction: "🏗️", Plumbing: "🔧", Electrical: "⚡", Carpentry: "🪚",
  Painting: "🎨", Cleaning: "🧹", Gardening: "🌱", Tutoring: "📚", default: "💼",
};

export default function FindWorkPage() {
  const t = useTranslations("findWork");

  function getUrgencyConfig(urgency?: string) {
    if (urgency === "Immediate") return { label: t("immediate"), class: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800" };
    if (urgency === "Today") return { label: t("today"), class: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800" };
    return { label: t("flexible"), class: "bg-muted/60 text-muted-foreground border border-border/50" };
  }

  function getPayTypeDisplay(pricingType?: string) {
    if (pricingType === "per_hour") return t("perHour");
    if (pricingType === "per_day") return t("perDay");
    if (pricingType === "per_job") return t("perJob");
    return t("perDay");
  }

  function getTimingLabel(jobDate?: string) {
    if (jobDate === "today") return t("today");
    if (jobDate === "tomorrow") return t("tomorrow");
    if (jobDate === "pick") return t("pickDate");
    return t("flexible");
  }

  function getDurationLabel(durationValue?: number, durationUnit?: string) {
    if (!durationValue) return t("anyDuration");
    return `${durationValue} ${durationUnit === "hour" ? t("hours") : durationUnit === "week" ? t("weeks") : t("days")}`;
  }

  const [jobs, setJobs] = useState<Job[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [profileLocationCoords, setProfileLocationCoords] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [approvedJobDialog, setApprovedJobDialog] = useState<Job | null>(null);
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
  const [sheetOpen, setSheetOpen] = useState(false);

  // Track if component is mounted to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();
  const currentLocale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'en' : 'en';

  // Temp filter state for sheet
  const [tempDistance, setTempDistance] = useState(distanceFilter);
  const [tempPay, setTempPay] = useState(payFilter);
  const [tempCategory, setTempCategory] = useState(categoryFilter);
  const [tempTiming, setTempTiming] = useState(timingFilter);
  const [tempDuration, setTempDuration] = useState(durationFilter);
  const [tempPayType, setTempPayType] = useState(payTypeFilter);
  const [tempSort, setTempSort] = useState(sortBy);

  const distanceReferenceLocation = manualLocationCoords || currentLocation || profileLocationCoords;
  const hasDistanceReference = Boolean(distanceReferenceLocation);

  const openSheet = () => {
    setTempDistance(distanceFilter); setTempPay(payFilter); setTempCategory(categoryFilter);
    setTempTiming(timingFilter); setTempDuration(durationFilter); setTempPayType(payTypeFilter);
    setTempSort(sortBy); setSheetOpen(true);
  };
  const applyFilters = () => {
    setDistanceFilter(tempDistance); setPayFilter(tempPay); setCategoryFilter(tempCategory);
    setTimingFilter(tempTiming); setDurationFilter(tempDuration); setPayTypeFilter(tempPayType);
    setSortBy(tempSort); setSheetOpen(false);
  };
  const resetFilters = () => {
    setTempDistance("10"); setTempPay("0"); setTempCategory("all");
    setTempTiming("all"); setTempDuration("all"); setTempPayType("all"); setTempSort("nearest");
  };

  const activeFilterCount = [
    distanceFilter !== "10", payFilter !== "0", categoryFilter !== "all",
    timingFilter !== "all", durationFilter !== "all", payTypeFilter !== "all", sortBy !== "nearest",
  ].filter(Boolean).length;

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true); setError(null);
        if (!API_BASE_URL) throw new Error("API configuration missing");
        const token = globalThis.window === undefined ? null
          : localStorage.getItem("firebaseToken") || localStorage.getItem("token");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
        const response = await fetch(`${API_BASE_URL}/api/jobs`, { method: "GET", headers, credentials: "include" });
        if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || `HTTP ${response.status}`); }
        const data = await response.json();
        const mappedJobs = (data.jobs || []).map((job: any) => ({
          ...job,
          distanceKm: typeof job.distanceKm === "number" ? job.distanceKm : undefined,
          pricingAmount: typeof job.pricingAmount === "number" ? job.pricingAmount : typeof job.wage === "number" ? job.wage : undefined,
          postedBy: job.postedBy || { name: "Unknown" },
          tab: "live" as JobTab,
        }));
        try {
          const applications = await getWorkerApplications();
          const applicationMap = new Map(
            applications.map((app: any) => [app.jobId._id || app.jobId, app.status])
          );
          setJobs(mappedJobs.map((job: Job) => {
            const appStatus = applicationMap.get(job._id);
            return {
              ...job,
              tab: appStatus ? "applied" as JobTab : "live" as JobTab,
              applicationStatus: appStatus
            };
          }));
        } catch { setJobs(mappedJobs); }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load jobs");
      } finally { setIsLoading(false); }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      const user = await fetchSessionUser();
      setUserSkills(Array.isArray(user?.skills) ? user.skills : []);
      if (typeof user?.latitude === "number" && typeof user?.longitude === "number") {
        setProfileLocationCoords({ latitude: user.latitude, longitude: user.longitude });
      }
      if (typeof user?.location === "string" && user.location.trim()) setLocation(user.location);
    };
    void fetchUserPreferences();
  }, []);

  useEffect(() => {
    if (!hasDistanceReference && distanceFilter !== "all") setDistanceFilter("all");
  }, [distanceFilter, hasDistanceReference]);

  const categories = useMemo(() =>
    Array.from(new Set(jobs.map((j) => j.category).filter((c): c is string => Boolean(c)))).sort((a, b) => a.localeCompare(b)),
    [jobs]);

  const jobsWithDistance = useMemo(() =>
    jobs.map((job) => {
      if (!distanceReferenceLocation || typeof job.latitude !== "number" || typeof job.longitude !== "number") return job;
      return { ...job, distanceKm: calculateDistance(distanceReferenceLocation, { latitude: job.latitude, longitude: job.longitude }) };
    }), [distanceReferenceLocation, jobs]);

  const liveJobs = useMemo(() => jobsWithDistance.filter((j) => (j.tab || "live") === "live"), [jobsWithDistance]);
  const appliedJobs = useMemo(() => jobsWithDistance.filter((j) => (j.tab || "live") === "applied"), [jobsWithDistance]);

  const recommendedJobs = useMemo(() => {
    // Only recommend from live jobs, not already applied jobs
    const recommended = recommendJobs(liveJobs, { skills: userSkills, location: distanceReferenceLocation });
    return recommended.map((job) => ({ ...job, distanceKm: typeof job.recommendationDistanceKm === "number" ? job.recommendationDistanceKm : job.distanceKm, tab: "recommended" as JobTab }));
  }, [distanceReferenceLocation, liveJobs, userSkills]);

  const filteredJobs = useMemo(() => {
    const nq = query.trim().toLowerCase();
    const distLimit = distanceFilter === "all" ? Number.POSITIVE_INFINITY : Number(distanceFilter);
    let source = activeTab === "recommended" ? recommendedJobs : activeTab === "applied" ? appliedJobs : liveJobs;
    const filtered = source.filter((job) => {
      const byQuery = nq ? job.title.toLowerCase().includes(nq) || (job.postedBy?.name || "").toLowerCase().includes(nq) : true;
      const byDistance = hasDistanceReference && distanceFilter !== "all" ? typeof job.distanceKm === "number" && job.distanceKm <= distLimit : true;
      const byPay = !job.pricingAmount || job.pricingAmount >= Number(payFilter);
      return byQuery && byDistance && byPay
        && (categoryFilter === "all" || job.category === categoryFilter)
        && (timingFilter === "all" || job.jobDate === timingFilter)
        && (durationFilter === "all" || job.duration_unit === durationFilter)
        && (payTypeFilter === "all" || job.pricingType === payTypeFilter);
    });
    filtered.sort((a, b) => {
      if (activeTab === "recommended") return (b.recommendationScore || 0) - (a.recommendationScore || 0);
      if (sortBy === "highest") return (b.pricingAmount || 0) - (a.pricingAmount || 0);
      if (sortBy === "latest") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      const da = typeof a.distanceKm === "number" ? a.distanceKm : Infinity;
      const db = typeof b.distanceKm === "number" ? b.distanceKm : Infinity;
      return da - db;
    });
    return filtered;
  }, [activeTab, appliedJobs, categoryFilter, distanceFilter, durationFilter, hasDistanceReference, liveJobs, payFilter, payTypeFilter, query, recommendedJobs, sortBy, timingFilter]);

  const openChat = (job: Job) => {
    const phone = job.postedBy?.phone;
    if (phone) {
      const phoneNum = phone.replace(/\D/g, '');
      globalThis.open(`https://wa.me/${phoneNum}`, "_blank", "noopener,noreferrer");
      return;
    }
    
    const email = job.postedBy?.email;
    if (!email) { alert("Chat not available for this job."); return; }
    const subject = encodeURIComponent(`Interested in your job: ${job.title}`);
    const body = encodeURIComponent(`Hi ${job.postedBy?.name || "there"},\n\nI am interested in your job "${job.title}" at ${job.location || "the listed location"}. Please share more details.\n\nThanks`);
    globalThis.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank", "noopener,noreferrer");
  };

  const getJobDistanceDisplay = (job: Job) => {
    if (typeof job.distanceKm === "number") return formatDistance(job.distanceKm);
    if (hasDistanceReference) return t("notAvailable");
    return t("setLocationDistance");
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
      alert(err instanceof Error ? err.message : "Failed to get your location");
    } finally { setIsLocating(false); }
  };

  const resolveManualLocationCoordinates = async () => {
    const text = location.trim();
    if (!text) { setManualLocationCoords(null); return; }
    try {
      setIsResolvingManualLocation(true);
      const normalized = await normalizeLocationWithCache(text);
      if (!normalized.isValid) { setManualLocationCoords(null); return; }
      setManualLocationCoords({ latitude: normalized.latitude, longitude: normalized.longitude });
    } catch { setManualLocationCoords(null); }
    finally { setIsResolvingManualLocation(false); }
  };

  const tabs: { key: JobTab; label: string; icon: React.ReactNode }[] = [
    { key: "live", label: t("liveJobs"), icon: <Briefcase className="h-3.5 w-3.5" /> },
    { key: "recommended", label: t("recommended"), icon: <Star className="h-3.5 w-3.5" /> },
    { key: "applied", label: t("applied"), icon: <CheckCircle className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Gradient Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 px-4 pt-10 pb-16 sm:pt-14 sm:pb-20">
        <div className="pointer-events-none absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-8 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl" />

        <div className="relative mx-auto max-w-2xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{t("heroTitle")}</h1>
              <p className="mt-1 text-sm sm:text-base text-white/75">{t("heroSubtitle")}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[`${liveJobs.length} ${t("liveJobs")}`, `${recommendedJobs.length} ${t("recommended")}`, t("applyInstantly")].map((tag) => (
              <span key={tag} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main card overlapping header ── */}
      <div className="relative z-10 mx-auto -mt-14 max-w-2xl px-4 pb-16 sm:-mt-16 sm:px-6">
        <Card className="border-0 shadow-2xl shadow-black/10 dark:shadow-black/30 rounded-2xl overflow-hidden">
          <CardContent className="p-5 sm:p-8 space-y-5">

            {/* ── Search & Location ── */}
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="h-11 pl-9 rounded-xl border-border/60 bg-muted/40 focus:bg-background focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {/* Location + Filters */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={location}
                    onChange={(e) => { setLocation(e.target.value); if (!e.target.value.trim()) setManualLocationCoords(null); }}
                    onBlur={() => void resolveManualLocationCoordinates()}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void resolveManualLocationCoordinates(); } }}
                    placeholder={t("locationPlaceholder")}
                    className="h-11 pl-9 pr-10 rounded-xl border-border/60 bg-muted/40 focus:bg-background focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={isLocating}
                    title="Use my location"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-500 transition-colors"
                  >
                    {isLocating ? <Loader className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                  </button>
                </div>

                {/* Filter sheet trigger */}
                {isMounted && (
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      onClick={openSheet}
                      className="relative h-11 px-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md shadow-blue-500/25 font-medium shrink-0"
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      {t("filters")}
                      {activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>

                  <SheetContent side="bottom" className="border-0 bg-transparent shadow-none px-3 pb-4">
                    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/20 bg-white/85 dark:bg-slate-900/75 backdrop-blur-xl shadow-2xl">
                      <SheetHeader className="px-4 pb-2 pt-4">
                        <SheetTitle className="text-lg font-bold">{t("filterJobs")}</SheetTitle>
                      </SheetHeader>

                      <div className="grid grid-cols-1 gap-2 px-4 pb-4 sm:grid-cols-2">
                        {[
                          { label: t("category"), emoji: "🏷️", value: tempCategory, setter: setTempCategory, options: [{ v: "all", l: t("allCategories") }, ...categories.map((c) => ({ v: c, l: `${categoryEmoji[c] || "💼"} ${c}` }))] },
                          { label: t("timing"), emoji: "📅", value: tempTiming, setter: setTempTiming, options: [{ v: "all", l: t("anyTiming") }, { v: "today", l: `📅 ${t("today")}` }, { v: "tomorrow", l: `🌅 ${t("tomorrow")}` }, { v: "pick", l: `🗓 ${t("pickDate")}` }, { v: "flexible", l: `🔄 ${t("flexible")}` }] },
                          { label: t("duration"), emoji: "⏳", value: tempDuration, setter: setTempDuration, options: [{ v: "all", l: t("anyDuration") }, { v: "hour", l: t("hours") }, { v: "day", l: t("days") }, { v: "week", l: t("weeks") }] },
                          { label: t("payType"), emoji: "💰", value: tempPayType, setter: setTempPayType, options: [{ v: "all", l: t("anyPayType") }, { v: "per_hour", l: `⏱ ${t("perHour")}` }, { v: "per_day", l: `📅 ${t("perDay")}` }, { v: "per_job", l: `💼 ${t("perJob")}` }] },
                          { label: t("distance"), emoji: "📍", value: tempDistance, setter: setTempDistance, options: [{ v: "3", l: t("within3km") }, { v: "5", l: t("within5km") }, { v: "10", l: t("within10km") }, { v: "20", l: t("within20km") }, { v: "all", l: t("noLimit") }], disabled: !hasDistanceReference },
                          { label: t("minPay"), emoji: "💵", value: tempPay, setter: setTempPay, options: [{ v: "0", l: t("anyPay") }, { v: "800", l: "₹800+" }, { v: "1200", l: "₹1200+" }, { v: "2000", l: "₹2000+" }] },
                          { label: t("sortBy"), emoji: "↕️", value: tempSort, setter: setTempSort, options: [{ v: "nearest", l: t("nearest") }, { v: "highest", l: t("highestPay") }, { v: "latest", l: t("latest") }] },
                        ].map(({ label, emoji, value, setter, options, disabled }) => (
                          <div key={label} className="rounded-xl border border-border/40 bg-white/70 dark:bg-slate-900/40 p-2">
                            <p className="text-[11px] font-semibold text-foreground mb-1.5">{emoji} {label}</p>
                            <Select value={value} onValueChange={setter} disabled={disabled}>
                              <SelectTrigger className="h-9 rounded-lg border-border/60 bg-background/70">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent position="popper" className="rounded-xl">
                                {options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            {disabled && <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">{t("enableLocation")}</p>}
                          </div>
                        ))}

                        <div className="flex gap-2 sm:col-span-2">
                          <Button onClick={applyFilters} className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-blue-500/30">
                            {t("applyFilters")}
                          </Button>
                          <Button variant="outline" onClick={resetFilters} className="flex-1 h-11 rounded-xl border-border/60 font-medium">
                            {t("reset")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                )}
                {!isMounted && (
                <Button
                  type="button"
                  disabled
                  className="relative h-11 px-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/25 font-medium shrink-0"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  {t("filters")}
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
                )}
              </div>

              {/* Status chips */}
              <div className="flex flex-wrap gap-2">
                {isResolvingManualLocation && (
                  <StatusChip color="blue" label={t("resolvingLocation")} icon={<Loader className="h-3 w-3 animate-spin" />} />
                )}
                {currentLocation && (
                  <StatusChip color="emerald" label={t("usingLiveLocation")} icon={<CheckCircle className="h-3 w-3" />} />
                )}
                {!currentLocation && profileLocationCoords && (
                  <StatusChip color="teal" label={t("usingProfileLocation")} icon={<MapPin className="h-3 w-3" />} />
                )}
                {!hasDistanceReference && (
                  <StatusChip color="amber" label={t("setLocationForDistance")} />
                )}
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    activeTab === tab.key
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            {/* Results count */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
              <span className="text-xs font-medium text-muted-foreground px-2">
                {isLoading ? t("loading") : `${filteredJobs.length} job${filteredJobs.length !== 1 ? "s" : ""}`}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
            </div>

            {/* ── Loading ── */}
            {isLoading && (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="h-10 w-10 rounded-full border-4 border-[#1a7a5e]/20 border-t-[#1a7a5e] animate-spin" />
                <p className="text-sm text-muted-foreground">{t("loading")}</p>
              </div>
            )}

            {/* ── Error ── */}
            {error && !isLoading && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* ── Job Cards ── */}
            {!isLoading && !error && (
              <div className="space-y-3">
                {filteredJobs.map((job) => {
                  const isApplied = (job.tab || "live") === "applied";
                  const urgency = getUrgencyConfig(job.urgency);
                  const emoji = categoryEmoji[job.category || ""] || categoryEmoji.default;
                  return (
                    <div
                      key={job._id}
                      className="group rounded-2xl border border-border/50 bg-card hover:border-blue-300/60 hover:shadow-md hover:shadow-blue-500/10 overflow-hidden transition-all duration-200"
                    >
                      <div className="p-4 space-y-3">
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-lg">
                              {emoji}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-foreground text-sm leading-tight truncate">{job.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Building2 className="h-3 w-3 shrink-0" />
                                {job.postedBy?.name || "Unknown"}
                              </p>
                            </div>
                          </div>
                          {/* Pay */}
                          {job.pricingAmount ? (
                            <div className="text-right shrink-0">
                              <p className="text-base font-bold text-blue-600 dark:text-cyan-400 leading-tight">
                                ₹{job.pricingAmount.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">/{getPayTypeDisplay(job.pricingType)}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground shrink-0">{t("poa")}</span>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20 px-2 py-0.5 text-[11px] font-medium">
                            {job.category || t("uncategorized")}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${urgency.class}`}>
                            {urgency.label}
                          </span>
                          {activeTab === "recommended" && job.recommendationScore && (
                            <span className="rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[11px] font-medium flex items-center gap-1">
                              <Star className="h-3 w-3" /> {job.recommendationScore}
                            </span>
                          )}
                          {isApplied && (
                            <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[11px] font-medium flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> {t("applied_badge")}
                            </span>
                          )}
                          {isApplied && job.applicationStatus === "accepted" && (
                            <span className="rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-[11px] font-medium flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> {t("approvedByContractor")}
                            </span>
                          )}
                        </div>

                        {/* Stats row */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <StatPill icon={<MapPin className="h-3.5 w-3.5 text-cyan-600" />} label={`${job.location} · ${getJobDistanceDisplay(job)}`} />
                          <StatPill icon={<Clock3 className="h-3.5 w-3.5 text-blue-600" />} label={`${getTimingLabel(job.jobDate)} · ${getDurationLabel(job.duration_value, job.duration_unit)}`} />
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        {/* Actions */}
                        <div className="flex gap-2">
                          {isApplied && job.applicationStatus === "accepted" ? (
                            <Button
                              size="sm"
                              disabled
                              className="h-9 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-100 font-medium cursor-not-allowed border border-blue-200"
                              onClick={() => setApprovedJobDialog(job)}
                              title={t("cannotCancelApprovedDesc")}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {t("approvedByContractor")}
                            </Button>
                          ) : isApplied ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-medium"
                              onClick={async () => {
                                try {
                                  await withdrawApplication(job._id);
                                  // Update local state to move it back to live
                                  setJobs((prev) => prev.map((j) => j._id === job._id ? { ...j, tab: "live", applicationStatus: undefined } : j));
                                } catch (e) {
                                  alert(e instanceof Error ? e.message : "Failed to cancel application");
                                }
                              }}
                            >
                              {t("cancelApplication") || "Cancel Application"}
                            </Button>
                          ) : (
                            <div onClick={() => {
                              // We need a timeout so that the API call completes before state changes
                              setTimeout(() => {
                                setJobs((prev) => prev.map((j) => j._id === job._id ? { ...j, tab: "applied" } : j));
                              }, 1500);
                            }}>
                              <ApplyJobButton jobId={job._id} isAlreadyApplied={false} />
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-xl border-border/60 px-3 font-medium"
                            onClick={() => openChat(job)}
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                            {t("chat")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-xl border-border/60 px-3 font-medium"
                            onClick={() => {
                              const workerId = job.postedBy?._id;
                              if (!workerId) return;
                              router.push(`/${currentLocale}/helpers/${workerId}`);
                            }}
                            disabled={!job.postedBy?._id}
                          >
                            <User className="h-3.5 w-3.5 mr-1.5" />
                            {t("viewProfile")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 rounded-xl px-3 text-muted-foreground hover:text-foreground"
                            onClick={() => setSelectedJob(job)}
                          >
                            {t("details")}
                            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredJobs.length === 0 && (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-12 px-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 text-2xl">
                      💼
                    </div>
                    <p className="font-semibold text-foreground">{t("noJobsFound")}</p>
                    <p className="text-sm text-muted-foreground">{t("noJobsDesc")}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Job Detail Dialog ── */}
      <Dialog open={Boolean(selectedJob)} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedJob?.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {selectedJob?.location || t("locationNotSpecified")}
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                {[
                  [t("category"), selectedJob.category || "Not specified"],
                  ["Pay", selectedJob.pricingAmount ? `₹${selectedJob.pricingAmount}/${getPayTypeDisplay(selectedJob.pricingType)}` : t("poa")],
                  [t("distance"), typeof selectedJob.distanceKm === "number" ? formatDistance(selectedJob.distanceKm) : t("notAvailable")],
                  ["Urgency", getUrgencyConfig(selectedJob.urgency).label],
                  [t("timing"), getTimingLabel(selectedJob.jobDate)],
                  [t("duration"), getDurationLabel(selectedJob.duration_value, selectedJob.duration_unit)],
                  ["Posted by", selectedJob.postedBy?.name || "Unknown"],
                  ["Email", selectedJob.postedBy?.email || t("notAvailable")],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{k}</p>
                    <p className="font-medium text-foreground mt-0.5 text-xs truncate">{v}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs font-semibold text-foreground mb-1">{t("aboutThisJob")}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selectedJob.description || t("noDescription")}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-medium"
                  onClick={() => openChat(selectedJob)}
                >
                  <MessageCircle className="h-4 w-4 mr-1.5" />
                  {t("chat")}
                </Button>
                <Button variant="outline" className="flex-1 h-10 rounded-xl border-border/60" onClick={() => setSelectedJob(null)}>
                  {t("close")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Approved Application Dialog ── */}
      <Dialog open={Boolean(approvedJobDialog)} onOpenChange={(open) => !open && setApprovedJobDialog(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              {t("cannotCancelApprovedTitle")}
            </DialogTitle>
            <DialogDescription>
              {approvedJobDialog?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {t("cannotCancelApprovedDesc")}
              </p>
            </div>

            <div className="rounded-xl bg-muted/40 p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">{t("postedBy")}</p>
              <p className="text-sm font-medium text-foreground">{approvedJobDialog?.postedBy?.name || "Unknown"}</p>
              {approvedJobDialog?.postedBy?.phone && (
                <p className="text-xs text-muted-foreground">{approvedJobDialog.postedBy.phone}</p>
              )}
              {approvedJobDialog?.postedBy?.email && (
                <p className="text-xs text-muted-foreground">{approvedJobDialog.postedBy.email}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-medium"
                onClick={() => {
                  if (approvedJobDialog) {
                    openChat(approvedJobDialog);
                    setApprovedJobDialog(null);
                  }
                }}
              >
                <MessageCircle className="h-4 w-4 mr-1.5" />
                {t("chat")}
              </Button>
              <Button variant="outline" className="flex-1 h-10 rounded-xl border-border/60" onClick={() => setApprovedJobDialog(null)}>
                {t("close")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Helpers ── */
function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {icon}{label}
    </span>
  );
}

function StatusChip({ color, label, icon }: { color: "blue" | "emerald" | "teal" | "amber"; label: string; icon?: React.ReactNode }) {
  const styles = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    teal: "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  };
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles[color]}`}>
      {icon}{label}
    </span>
  );
}