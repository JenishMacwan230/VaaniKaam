'use client';

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AlertCircle, CheckCircle, MapPin, Loader, Eye, EyeOff } from "lucide-react";
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
  // Duration with structured inputs
  duration_value: number;
  duration_unit: "hour" | "day" | "week";
  workersRequired: number | "";
  jobDate: "today" | "tomorrow" | "pick" | "flexible";
  selectedDate?: string;
}

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
    // New duration structure with defaults
    duration_value: 1,
    duration_unit: "day",
    workersRequired: 1,
    jobDate: "today",
    selectedDate: "",
  });

  const categories = [
    "Construction",
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Painting",
    "Cleaning",
    "Gardening",
    "Tutoring",
    "Other",
  ];

  // Get valid duration units based on pay type
  const getValidDurationUnits = (payType: WorkForm["payType"]): WorkForm["duration_unit"][] => {
    switch (payType) {
      case "per_hour":
        return ["hour"];
      case "per_day":
        return ["day"];
      case "per_job":
        return ["hour", "day", "week"];
      default:
        return ["day"];
    }
  };

  // Get default duration unit and value for a pay type
  const getDefaultDurationForPayType = (payType: WorkForm["payType"]) => {
    switch (payType) {
      case "per_hour":
        return { duration_value: 8, duration_unit: "hour" as const };
      case "per_day":
        return { duration_value: 1, duration_unit: "day" as const };
      case "per_job":
        return { duration_value: 1, duration_unit: "day" as const };
      default:
        return { duration_value: 1, duration_unit: "day" as const };
    }
  };

  // Calculate estimated total
  const calculateEstimatedTotal = () => {
    const amount = Number.parseFloat(formData.payAmount) || 0;
    if (amount <= 0) return null;
    
    if (formData.payType === "per_hour" || formData.payType === "per_day") {
      return amount * formData.duration_value;
    }
    return null; // per_job doesn't calculate total
  };

  // Handle pay type change - reset duration to defaults
  const handlePayTypeChange = (newPayType: WorkForm["payType"]) => {
    const defaultDuration = getDefaultDurationForPayType(newPayType);
    setFormData((prev) => ({
      ...prev,
      payType: newPayType,
      duration_value: defaultDuration.duration_value,
      duration_unit: defaultDuration.duration_unit,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Check for low payment amount
    if (name === "payAmount") {
      const amount = Number.parseFloat(value);
      setLowPaymentWarning(amount > 0 && amount < 100);
    }

    if (name === "location" && value.trim()) {
      setLocationError("");
    }
  };

  // Handle location blur - auto-normalize, but non-blocking (fallback to original)
  const handleLocationBlur = async () => {
    if (!formData.location.trim()) {
      setLocationError("Please enter a location");
      return;
    }

    try {
      setIsNormalizingLocation(true);
      
      // Normalize location via API (simple, fast - ONE call)
      const normalized = await normalizeLocationWithCache(formData.location);
      
      if (normalized.isValid) {
        // ✅ Normalization succeeded
        setFormData((prev) => ({
          ...prev,
          location: prev.location,
          normalizedLocation: normalized.standardizedName,
          latitude: normalized.latitude,
          longitude: normalized.longitude,
        }));
        setIsLocationNormalized(true);
        setLocationError("");
      } else {
        // ❌ Normalization failed - don't use fallback
        setFormData((prev) => ({
          ...prev,
          normalizedLocation: undefined,
        }));
        setIsLocationNormalized(false);
        setLocationError(
          normalized.error || `"${formData.location}" not found. Try GPS auto-fill or use exact city name.`
        );
      }
    } catch (err: unknown) {
      console.error('Location normalization error:', err);
      setFormData((prev) => ({
        ...prev,
        normalizedLocation: undefined,
      }));
      setIsLocationNormalized(false);
      setLocationError("Location verification failed. Use GPS or try again.");
    } finally {
      setIsNormalizingLocation(false);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle GPS Auto-Fill
  const handleAutoFillLocation = async () => {
    setIsGPSLoading(true);
    setGpsError("");
    setLocationError("");

    try {
      // Get user's GPS location
      const location = await getCurrentLocation();
      
      // Reverse geocode to get city name
      const address = await reverseGeocodeWithCache(
        location.latitude,
        location.longitude
      );
      const cityName = getLocationDisplayName(address);

      // Update form with location and coordinates
      setFormData((prev) => ({
        ...prev,
        location: cityName,
        normalizedLocation: cityName,
        latitude: location.latitude,
        longitude: location.longitude,
      }));

      setGpsError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get location";
      setGpsError(message);
    } finally {
      setIsGPSLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate form
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
        // Duration fields - structured format
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/jobs`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to create work");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setFormData({
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

      setTimeout(() => {
        router.push(`/${locale}/dashboard/contractor`);
      }, 2000);
    } catch (err: unknown) {
      console.error('Work submission error:', err);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Post a New Work Opportunity
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Fill in the details below to create a work posting
          </p>
        </div>

        <Card className="border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Work Details</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  Work posted successfully! Redirecting...
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-base font-medium">
                  Work Title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g., Plumber needed for apartment repair"
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-2"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-base font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide details about the work (optional)"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <Label htmlFor="category" className="text-base font-medium">
                    Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleSelectChange("category", value)
                    }
                  >
                    <SelectTrigger id="category" className="mt-2">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="relative">
                  <Label htmlFor="location" className="text-base font-medium">
                    Location *
                    {isNormalizingLocation && (
                      <span className="text-xs text-blue-600 ml-2">Normalizing...</span>
                    )}
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1 relative">
                      <Input
                        id="location"
                        name="location"
                        type="text"
                        placeholder="Type city name or use GPS (e.g., Indore, Surat)"
                        value={formData.location}
                        onChange={handleChange}
                        onBlur={handleLocationBlur}
                        className="flex-1"
                      />

                      {/* Auto-normalization happens on blur - no dropdown needed */}
                    </div>

                    <Button
                      type="button"
                      onClick={handleAutoFillLocation}
                      disabled={isGPSLoading}
                      className="bg-blue-600 hover:bg-blue-700 px-3"
                      title="Auto-fill with your current location"
                    >
                      {isGPSLoading ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Location Error */}
                  {locationError && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                      ⚠️ {locationError}
                    </div>
                  )}

                  {/* Normalizing Status */}
                  {isNormalizingLocation && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <Loader className="h-3 w-3 animate-spin" />
                      <span>Auto-normalizing location format...</span>
                    </div>
                  )}

                  {/* GPS Error */}
                  {gpsError && (
                    <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-xs text-orange-600 dark:text-orange-400">
                      <p className="font-medium">⚠️ Location Issue</p>
                      <p>{gpsError}</p>
                      <p className="text-xs text-orange-500 mt-1">Tip: Type or select from suggestions</p>
                    </div>
                  )}

                  {/* DEBUG: Show Normalized Location (Disabled, Read-Only) */}
                  {formData.normalizedLocation && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">
                      <label htmlFor="normalized-location" className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                        🔍 DEBUG: Normalized Location (System Format)
                      </label>
                      <Input
                        id="normalized-location"
                        type="text"
                        value={formData.normalizedLocation}
                        disabled
                        readOnly
                        className="text-xs bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Status: {isLocationNormalized ? (
                          <span className="text-green-600 dark:text-green-400 font-semibold">✅ Normalized</span>
                        ) : (
                          <span className="text-orange-600 dark:text-orange-400 font-semibold">⚠️ Using Fallback</span>
                        )}
                        {formData.latitude && formData.longitude && (
                          <span className="ml-2 text-blue-600 dark:text-blue-400">
                            📍 Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Coordinates Display */}
                  {formData.latitude && formData.longitude && (
                    <button
                      type="button"
                      onClick={() => setShowCoordinates(!showCoordinates)}
                      className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1"
                    >
                      {showCoordinates ? (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Hide coordinates
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" />
                          Show coordinates
                        </>
                      )}
                    </button>
                  )}

                  {showCoordinates && formData.latitude && formData.longitude && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400 font-mono">
                      <div>Latitude: {formData.latitude.toFixed(4)}</div>
                      <div>Longitude: {formData.longitude.toFixed(4)}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pay Type */}
                <div>
                  <Label htmlFor="payType" className="text-base font-medium">
                    Pay Type
                  </Label>
                  <Select
                    value={formData.payType}
                    onValueChange={(value) =>
                      handlePayTypeChange(value as any)
                    }
                  >
                    <SelectTrigger id="payType" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_hour">Per Hour</SelectItem>
                      <SelectItem value="per_day">Per Day</SelectItem>
                      <SelectItem value="per_job">Per Job</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pay Amount */}
                <div>
                  <Label htmlFor="payAmount" className="text-base font-medium">
                    Pay Amount (₹) *
                  </Label>
                  <Input
                    id="payAmount"
                    name="payAmount"
                    type="number"
                    placeholder="Amount"
                    value={formData.payAmount}
                    onChange={handleChange}
                    className="mt-2"
                  />
                  {formData.payType === "per_day" && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      💡 Typical: ₹400–₹700/day
                    </p>
                  )}
                  {formData.payType === "per_hour" && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      💡 Typical: ₹50–₹150/hour
                    </p>
                  )}
                  {lowPaymentWarning && (
                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                      <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                        ⚠️ That's... optimistic. Workers might not respond to such low pay.
                      </p>
                    </div>
                  )}
                </div>

                {/* Duration Value */}
                <div>
                  <Label htmlFor="duration_value" className="text-base font-medium">
                    Duration *
                  </Label>
                  <Input
                    id="duration_value"
                    name="duration_value"
                    type="number"
                    min="1"
                    placeholder="Number"
                    value={formData.duration_value}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration_value: Math.max(1, Number.parseInt(e.target.value) || 1),
                      }))
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Duration Unit */}
                <div>
                  <Label htmlFor="duration_unit" className="text-base font-medium">
                    Unit *
                  </Label>
                  <Select
                    value={formData.duration_unit}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration_unit: value as WorkForm["duration_unit"],
                      }))
                    }
                  >
                    <SelectTrigger id="duration_unit" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getValidDurationUnits(formData.payType).map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit.charAt(0).toUpperCase() + unit.slice(1)}
                          {formData.payType === "per_job" && `${formData.payType === "per_job" ? "s" : ""}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.payType === "per_job" ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      📌 Per job is flexible
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Locked to {formData.duration_unit}
                    </p>
                  )}
                </div>

                {/* Duration Summary & Estimated Total */}
                <div>
                  <div className="text-base font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Duration Summary
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      {formData.duration_value} {formData.duration_unit}
                      {formData.duration_value > 1 ? "s" : ""}
                    </p>
                    {(formData.payType === "per_hour" || formData.payType === "per_day") && (
                      <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Estimated Total:
                        </p>
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                          ₹{calculateEstimatedTotal()?.toLocaleString() || "0"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* When */}
                <div>
                  <Label htmlFor="jobDate" className="text-base font-medium">
                    When *
                  </Label>
                  <Select
                    value={formData.jobDate}
                    onValueChange={(value) =>
                      handleSelectChange("jobDate", value as any)
                    }
                  >
                    <SelectTrigger id="jobDate" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="pick">Pick a date</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.jobDate === "pick" && (
                    <Input
                      name="selectedDate"
                      type="date"
                      value={formData.selectedDate || ""}
                      onChange={handleChange}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Workers Required */}
                <div>
                  <Label htmlFor="workersRequired" className="text-base font-medium">
                    Workers Required *
                  </Label>
                  <Input
                    id="workersRequired"
                    name="workersRequired"
                    type="number"
                    min="1"
                    placeholder="Number of workers"
                    value={formData.workersRequired}
                    onChange={handleChange}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isLoading ? "Posting..." : "Post Work"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1"
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
