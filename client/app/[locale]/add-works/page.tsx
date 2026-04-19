'use client';

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrentLocale } from "@/lib/authClient";
import {
  AlertCircle,
  CheckCircle,
  MapPin,
  Loader,
  Eye,
  EyeOff,
  Briefcase,
  FileText,
  Tag,
  IndianRupee,
  Clock,
  CalendarDays,
  Users,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Info,
} from "lucide-react";
import { getCurrentLocation } from "@/lib/geolocation";
import { reverseGeocodeWithCache, getLocationDisplayName } from "@/lib/geocoding";
import { normalizeLocationWithCache } from "@/lib/locationNormalizer";

interface WorkForm {
  title: string;
  description: string;
  category: string;
  payType: "per_hour" | "per_day" | "per_job";
  payAmount: string;
  location: string;
  normalizedLocation?: string;
  latitude?: number;
  longitude?: number;
  duration_value: number;
  duration_unit: "hour" | "day" | "week";
  workersRequired: number | "";
  jobDate: "today" | "tomorrow" | "pick" | "flexible";
  selectedDate?: string;
}

const categoryIcons: Record<string, string> = {
  Construction: "🏗️",
  Plumbing: "🔧",
  Electrical: "⚡",
  Carpentry: "🪚",
  Painting: "🎨",
  Cleaning: "🧹",
  Gardening: "🌱",
  Tutoring: "📚",
  Other: "💼",
};

export default function AddWorksPage() {
  const pathname = usePathname();
  const locale = getCurrentLocale(pathname);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isGPSLoading, setIsGPSLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isNormalizingLocation, setIsNormalizingLocation] = useState(false);
  const [isLocationNormalized, setIsLocationNormalized] = useState(false);
  const [lowPaymentWarning, setLowPaymentWarning] = useState(false);

  const [formData, setFormData] = useState<WorkForm>({
    title: "",
    description: "",
    category: "",
    payType: "per_day",
    payAmount: "",
    location: "",
    normalizedLocation: undefined,
    latitude: undefined,
    longitude: undefined,
    duration_value: 1,
    duration_unit: "day",
    workersRequired: 1,
    jobDate: "today",
    selectedDate: "",
  });

  const categories = [
    "Construction", "Plumbing", "Electrical", "Carpentry",
    "Painting", "Cleaning", "Gardening", "Tutoring", "Other",
  ];

  const getValidDurationUnits = (payType: WorkForm["payType"]): WorkForm["duration_unit"][] => {
    switch (payType) {
      case "per_hour": return ["hour"];
      case "per_day": return ["day"];
      case "per_job": return ["hour", "day", "week"];
      default: return ["day"];
    }
  };

  const getDefaultDurationForPayType = (payType: WorkForm["payType"]) => {
    switch (payType) {
      case "per_hour": return { duration_value: 8, duration_unit: "hour" as const };
      case "per_day": return { duration_value: 1, duration_unit: "day" as const };
      case "per_job": return { duration_value: 1, duration_unit: "day" as const };
      default: return { duration_value: 1, duration_unit: "day" as const };
    }
  };

  const calculateEstimatedTotal = () => {
    const amount = Number.parseFloat(formData.payAmount) || 0;
    if (amount <= 0) return null;
    if (formData.payType === "per_hour" || formData.payType === "per_day") {
      return amount * formData.duration_value;
    }
    return null;
  };

  const handlePayTypeChange = (newPayType: WorkForm["payType"]) => {
    const defaultDuration = getDefaultDurationForPayType(newPayType);
    setFormData((prev) => ({
      ...prev,
      payType: newPayType,
      duration_value: defaultDuration.duration_value,
      duration_unit: defaultDuration.duration_unit,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "payAmount") {
      const amount = Number.parseFloat(value);
      setLowPaymentWarning(amount > 0 && amount < 100);
    }
    if (name === "location" && value.trim()) setLocationError("");
  };

  const handleLocationBlur = async () => {
    if (!formData.location.trim()) {
      setLocationError("Please enter a location");
      return;
    }
    try {
      setIsNormalizingLocation(true);
      const normalized = await normalizeLocationWithCache(formData.location);
      if (normalized.isValid) {
        setFormData((prev) => ({
          ...prev,
          normalizedLocation: normalized.standardizedName,
          latitude: normalized.latitude,
          longitude: normalized.longitude,
        }));
        setIsLocationNormalized(true);
        setLocationError("");
      } else {
        setFormData((prev) => ({ ...prev, normalizedLocation: undefined }));
        setIsLocationNormalized(false);
        setLocationError(normalized.error || `"${formData.location}" not found. Try GPS or use exact city name.`);
      }
    } catch {
      setFormData((prev) => ({ ...prev, normalizedLocation: undefined }));
      setIsLocationNormalized(false);
      setLocationError("Location verification failed. Use GPS or try again.");
    } finally {
      setIsNormalizingLocation(false);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAutoFillLocation = async () => {
    setIsGPSLoading(true);
    setGpsError("");
    setLocationError("");
    try {
      const location = await getCurrentLocation();
      const address = await reverseGeocodeWithCache(location.latitude, location.longitude);
      const cityName = getLocationDisplayName(address);
      setFormData((prev) => ({
        ...prev,
        location: cityName,
        normalizedLocation: cityName,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
    } catch (err) {
      setGpsError(err instanceof Error ? err.message : "Failed to get location");
    } finally {
      setIsGPSLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (!formData.title || !formData.category || !formData.payAmount || !formData.location) {
        setError("Please fill in all required fields");
        setIsLoading(false);
        return;
      }
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        pricingType: formData.payType,
        pricingAmount: Number.parseFloat(formData.payAmount),
        location: formData.location,
        normalizedLocation: formData.normalizedLocation || formData.location,
        isLocationNormalized,
        duration_value: formData.duration_value,
        duration_unit: formData.duration_unit,
        workersRequired: formData.workersRequired,
        jobDate: formData.jobDate,
        selectedDate: formData.selectedDate || new Date().toISOString().split('T')[0],
        ...(formData.latitude && formData.longitude && {
          latitude: formData.latitude,
          longitude: formData.longitude,
        }),
      };
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to create work");
        setIsLoading(false);
        return;
      }
      setSuccess(true);
      setFormData({
        title: "", description: "", category: "", payType: "per_day",
        payAmount: "", location: "", normalizedLocation: undefined,
        latitude: undefined, longitude: undefined, duration_value: 1,
        duration_unit: "day", workersRequired: 1, jobDate: "today", selectedDate: "",
      });
      setTimeout(() => router.push(`/${locale}/dashboard/contractor/projects`), 2000);
    } catch {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const estimatedTotal = calculateEstimatedTotal();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-800 px-4 pt-10 pb-20 sm:pt-14 sm:pb-24">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-2xl" />

        <div className="relative mx-auto max-w-2xl">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                Post a Work Opportunity
              </h1>
              <p className="mt-1 text-sm sm:text-base text-white/75">
                Connect with skilled workers in your area instantly
              </p>
            </div>
          </div>

          {/* Quick stat chips */}
          <div className="mt-6 flex flex-wrap gap-2">
            {["Fast Hiring", "Verified Workers", "Local Talent"].map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
              >
                <Sparkles className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form Card — overlaps the header */}
      <div className="relative z-10 mx-auto -mt-10 max-w-2xl px-4 pb-16 sm:px-6">
        <Card className="border-0 shadow-2xl shadow-black/10 dark:shadow-black/30 rounded-2xl overflow-hidden">
          <CardContent className="p-5 sm:p-8">

            {/* Alerts */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                  Work posted successfully! Redirecting…
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* ── SECTION 1: Basic Info ── */}
              <section>
                <SectionHeader icon={<FileText className="h-4 w-4" />} title="Basic Info" />

                <div className="mt-4 space-y-4">
                  {/* Title */}
                  <div>
                    <Label htmlFor="title" className="text-sm font-semibold text-foreground">
                      Work Title <Required />
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      type="text"
                      placeholder="e.g., Plumber needed for apartment repair"
                      value={formData.title}
                      onChange={handleChange}
                      className="mt-1.5 h-11 rounded-xl border-border/60 bg-muted/40 focus:bg-background focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description" className="text-sm font-semibold text-foreground">
                      Description
                      <span className="ml-2 text-xs font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Add any extra details, requirements, tools needed…"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="mt-1.5 rounded-xl border-border/60 bg-muted/40 focus:bg-background focus:border-emerald-500 focus:ring-emerald-500/20 resize-none transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* ── SECTION 2: Category & Location ── */}
              <section>
                <SectionHeader icon={<Tag className="h-4 w-4" />} title="Category & Location" />

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <Label className="text-sm font-semibold text-foreground">
                      Category <Required />
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => handleSelectChange("category", v)}
                    >
                      <SelectTrigger className="mt-1.5 h-11 rounded-xl border-border/60 bg-muted/40 focus:border-emerald-500">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="rounded-lg">
                            <span className="flex items-center gap-2">
                              <span>{categoryIcons[cat]}</span>
                              {cat}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location */}
                  <div>
                    <Label className="text-sm font-semibold text-foreground">
                      Location <Required />
                      {isNormalizingLocation && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-blue-500">
                          <Loader className="h-3 w-3 animate-spin" /> Verifying…
                        </span>
                      )}
                    </Label>
                    <div className="mt-1.5 flex gap-2">
                      <Input
                        id="location"
                        name="location"
                        type="text"
                        placeholder="City name (e.g., Surat, Indore)"
                        value={formData.location}
                        onChange={handleChange}
                        onBlur={handleLocationBlur}
                        className="h-11 rounded-xl border-border/60 bg-muted/40 focus:bg-background focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                      />
                      <Button
                        type="button"
                        onClick={handleAutoFillLocation}
                        disabled={isGPSLoading}
                        title="Use my current location"
                        className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-md shadow-blue-500/25 p-0"
                      >
                        {isGPSLoading
                          ? <Loader className="h-4 w-4 animate-spin text-white" />
                          : <MapPin className="h-4 w-4 text-white" />}
                      </Button>
                    </div>

                    {/* Location status messages */}
                    {locationError && (
                      <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        {locationError}
                      </p>
                    )}
                    {gpsError && (
                      <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ {gpsError}
                      </p>
                    )}
                    {isLocationNormalized && formData.normalizedLocation && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        {formData.normalizedLocation}
                        {formData.latitude && (
                          <button
                            type="button"
                            onClick={() => setShowCoordinates(!showCoordinates)}
                            className="ml-1 underline underline-offset-2 opacity-70 hover:opacity-100"
                          >
                            {showCoordinates ? <EyeOff className="h-3 w-3 inline" /> : <Eye className="h-3 w-3 inline" />}
                          </button>
                        )}
                      </p>
                    )}
                    {showCoordinates && formData.latitude && formData.longitude && (
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* ── SECTION 3: Pay ── */}
              <section>
                <SectionHeader icon={<IndianRupee className="h-4 w-4" />} title="Pay Details" />

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Pay Type */}
                  <div className="col-span-1">
                    <Label className="text-sm font-semibold text-foreground">Pay Type</Label>
                    <Select
                      value={formData.payType}
                      onValueChange={(v) => handlePayTypeChange(v as WorkForm["payType"])}
                    >
                      <SelectTrigger className="mt-1.5 h-11 rounded-xl border-border/60 bg-muted/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="per_hour">⏱ Per Hour</SelectItem>
                        <SelectItem value="per_day">📅 Per Day</SelectItem>
                        <SelectItem value="per_job">💼 Per Job</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pay Amount */}
                  <div className="col-span-1 sm:col-span-2">
                    <Label className="text-sm font-semibold text-foreground">
                      Amount (₹) <Required />
                    </Label>
                    <div className="mt-1.5 relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="payAmount"
                        name="payAmount"
                        type="number"
                        placeholder="0"
                        value={formData.payAmount}
                        onChange={handleChange}
                        className="h-11 pl-9 rounded-xl border-border/60 bg-muted/40 focus:bg-background focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                    {formData.payType === "per_day" && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Info className="h-3 w-3" /> Typical: ₹400–₹700/day
                      </p>
                    )}
                    {formData.payType === "per_hour" && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Info className="h-3 w-3" /> Typical: ₹50–₹150/hour
                      </p>
                    )}
                    {lowPaymentWarning && (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-3 py-2">
                        <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                          ⚠️ Very low pay — workers may not respond.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estimated Total Banner */}
                {estimatedTotal !== null && (
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
                    <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                      Estimated Total
                    </span>
                    <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                      ₹{estimatedTotal.toLocaleString()}
                    </span>
                  </div>
                )}
              </section>

              {/* ── SECTION 4: Duration ── */}
              <section>
                <SectionHeader icon={<Clock className="h-4 w-4" />} title="Duration" />

                <div className="mt-4 grid grid-cols-2 gap-4">
                  {/* Duration Value */}
                  <div>
                    <Label className="text-sm font-semibold text-foreground">
                      How many? <Required />
                    </Label>
                    <Input
                      id="duration_value"
                      name="duration_value"
                      type="number"
                      min="1"
                      value={formData.duration_value}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          duration_value: Math.max(1, Number.parseInt(e.target.value) || 1),
                        }))
                      }
                      className="mt-1.5 h-11 rounded-xl border-border/60 bg-muted/40 focus:bg-background focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  {/* Duration Unit */}
                  <div>
                    <Label className="text-sm font-semibold text-foreground">
                      Unit <Required />
                    </Label>
                    <Select
                      value={formData.duration_unit}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, duration_unit: v as WorkForm["duration_unit"] }))
                      }
                    >
                      <SelectTrigger className="mt-1.5 h-11 rounded-xl border-border/60 bg-muted/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {getValidDurationUnits(formData.payType).map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit.charAt(0).toUpperCase() + unit.slice(1)}s
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.payType !== "per_job" && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Locked to {formData.duration_unit}s for this pay type
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* ── SECTION 5: Schedule & Team ── */}
              <section>
                <SectionHeader icon={<CalendarDays className="h-4 w-4" />} title="Schedule & Team" />

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* When */}
                  <div>
                    <Label className="text-sm font-semibold text-foreground">
                      Start Date <Required />
                    </Label>
                    <Select
                      value={formData.jobDate}
                      onValueChange={(v) => handleSelectChange("jobDate", v)}
                    >
                      <SelectTrigger className="mt-1.5 h-11 rounded-xl border-border/60 bg-muted/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="today">📅 Today</SelectItem>
                        <SelectItem value="tomorrow">🌅 Tomorrow</SelectItem>
                        <SelectItem value="pick">🗓 Pick a date</SelectItem>
                        <SelectItem value="flexible">🔄 Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.jobDate === "pick" && (
                      <Input
                        name="selectedDate"
                        type="date"
                        value={formData.selectedDate || ""}
                        onChange={handleChange}
                        className="mt-2 h-11 rounded-xl border-border/60 bg-muted/40"
                      />
                    )}
                  </div>

                  {/* Workers Required */}
                  <div>
                    <Label htmlFor="workersRequired" className="text-sm font-semibold text-foreground">
                      Workers Needed <Required />
                    </Label>
                    <div className="mt-1.5 relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="workersRequired"
                        name="workersRequired"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={formData.workersRequired}
                        onChange={handleChange}
                        className="h-11 pl-9 rounded-xl border-border/60 bg-muted/40 focus:bg-background focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Submit Buttons ── */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || success}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-600/40 transition-all text-base"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader className="h-4 w-4 animate-spin" /> Posting…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Post Work
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-xl border-border/60 font-medium text-base hover:bg-muted transition-all"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400">
        {icon}
      </div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
    </div>
  );
}

function Required() {
  return <span className="ml-0.5 text-rose-500">*</span>;
}