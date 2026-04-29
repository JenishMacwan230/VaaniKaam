'use client';

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MapPin,
  Search,
  Star,
  Phone,
  MessageCircle,
  SlidersHorizontal,
  LocateFixed,
  Users,
  Loader,
  CheckCircle,
  XCircle,
  X,
  Briefcase,
  Sparkles,
} from "lucide-react";
import type { Coordinates } from "@/lib/geolocation";
import { calculateDistance, formatDistance } from "@/lib/distance";
import { fetchSessionUser } from "@/lib/authClient";

type Worker = {
  id: string;
  name: string;
  profession: string;
  rating: number;
  completedJobs: number;
  distanceKm?: number;
  phone: string;
  isAvailable: boolean;
  location: string;
  avatarUrl: string;
  latitude?: number;
  longitude?: number;
};

// Static workers removed - using dynamic data from backend

const professionIcons: Record<string, string> = {
  Plumber: "🔧",
  Painter: "🎨",
  Electrician: "⚡",
  Mason: "🏗️",
  Carpenter: "🪚",
  Cleaner: "🧹",
  Gardener: "🌱",
  default: "💼",
};

function getProfessionIcon(profession: string) {
  return professionIcons[profession] ?? professionIcons.default;
}

function maskPhone(phone: string): string {
  if (phone.length < 6) return "******";
  return `${phone.slice(0, 2)}******${phone.slice(-2)}`;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [city, setCity] = useState("");
  const [distanceFilter, setDistanceFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("0");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [professionFilter, setProfessionFilter] = useState("all");

  useEffect(() => {
    const fetchWorkers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/public-workers`);
        if (!response.ok) throw new Error("Failed to fetch workers");
        const data = await response.json();
        
        const mappedWorkers = (data.workers || []).map((w: any) => ({
          id: w.id,
          name: w.name || "Anonymous",
          profession: w.profession || "General Worker",
          rating: w.averageRating || 0,
          completedJobs: w.totalRatings || 0,
          distanceKm: undefined,
          phone: w.phone || "",
          isAvailable: w.availability !== false,
          location: w.location || "Unknown",
          avatarUrl: w.profilePictureUrl || `https://i.pravatar.cc/100?u=${w.id}`,
          latitude: typeof w.latitude === "number" ? w.latitude : undefined,
          longitude: typeof w.longitude === "number" ? w.longitude : undefined,
        }));
        
        setWorkers(mappedWorkers);
      } catch (err) {
        console.error("Error fetching workers:", err);
        setError("Failed to load workers. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  // user's saved profile coordinates
  const [profileCoords, setProfileCoords] = useState<Coordinates | null>(null);
  const [currentCoords, setCurrentCoords] = useState<Coordinates | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const user = await fetchSessionUser();
      if (user && typeof user.latitude === "number" && typeof user.longitude === "number") {
        setProfileCoords({ latitude: user.latitude, longitude: user.longitude });
      }
      if (typeof user?.location === "string" && user.location.trim() && !city) {
        // prefer profile location name when city input empty
        setCity(user.location);
      }
    };
    void loadProfile();
  }, []);

  // Temp filter state inside sheet (apply on confirm)
  const [tempDistance, setTempDistance] = useState(distanceFilter);
  const [tempRating, setTempRating] = useState(ratingFilter);
  const [tempAvailability, setTempAvailability] = useState(availabilityFilter);
  const [tempProfession, setTempProfession] = useState(professionFilter);

  const openSheet = () => {
    setTempDistance(distanceFilter);
    setTempRating(ratingFilter);
    setTempAvailability(availabilityFilter);
    setTempProfession(professionFilter);
    setSheetOpen(true);
  };

  const applyFilters = () => {
    setDistanceFilter(tempDistance);
    setRatingFilter(tempRating);
    setAvailabilityFilter(tempAvailability);
    setProfessionFilter(tempProfession);
    setSheetOpen(false);
  };

  const resetFilters = () => {
    setTempDistance("all");
    setTempRating("0");
    setTempAvailability("all");
    setTempProfession("all");
  };

  const handleLocate = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=en`
          );
          const data = await res.json();
          setCity(
            data.address.city ||
              data.address.town ||
              data.address.village ||
              "Current Location"
          );
          setCurrentCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        } catch {
          setCity("Current Location");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setCity("Location Error");
        setIsLocating(false);
      }
    );
  };

  const activeFilterCount = [
    distanceFilter !== "all",
    ratingFilter !== "0",
    availabilityFilter !== "all",
    professionFilter !== "all",
  ].filter(Boolean).length;

  // compute professions list for filter
  const professions = useMemo(() => {
    const setP = new Set(workers.map((w) => w.profession).filter(Boolean));
    return Array.from(setP).sort((a, b) => a.localeCompare(b));
  }, [workers]);

  // determine reference location: use currentCoords if set, otherwise if user did not enter city use profileCoords
  const distanceReferenceLocation = currentCoords || (city.trim() ? null : profileCoords);
  const hasDistanceReference = Boolean(distanceReferenceLocation);

  // attach distances and apply filters + sort nearest first
  const filteredWorkers = useMemo(() => {
    const selectedDistanceLimit = distanceFilter === "all" ? Number.POSITIVE_INFINITY : Number(distanceFilter);

    const withDistance = workers.map((worker) => {
      const lat = worker.latitude;
      const lon = worker.longitude;
      if (hasDistanceReference && typeof lat === "number" && typeof lon === "number") {
        return { ...worker, distanceKm: calculateDistance(distanceReferenceLocation as Coordinates, { latitude: lat, longitude: lon }) };
      }
      return worker;
    });

    const results = withDistance.filter((worker) => {
      const bySearch = searchTerm
        ? `${worker.name} ${worker.profession}`.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const byCity = city ? worker.location.toLowerCase().includes(city.toLowerCase()) : true;
      const byDistance = typeof worker.distanceKm === "number" ? worker.distanceKm <= selectedDistanceLimit : distanceFilter === "all";
      const byRating = worker.rating >= Number(ratingFilter);
      const byAvailability = availabilityFilter === "available" ? worker.isAvailable : availabilityFilter === "unavailable" ? !worker.isAvailable : true;
      const byProfession = professionFilter === "all" ? true : worker.profession === professionFilter;
      return bySearch && byCity && byDistance && byRating && byAvailability && byProfession;
    });

    // sort nearest first when distances available
    results.sort((a, b) => {
      const da = typeof a.distanceKm === "number" ? a.distanceKm : Number.POSITIVE_INFINITY;
      const db = typeof b.distanceKm === "number" ? b.distanceKm : Number.POSITIVE_INFINITY;
      return da - db;
    });

    return results;
  }, [availabilityFilter, city, distanceFilter, ratingFilter, searchTerm, workers, hasDistanceReference, professionFilter, distanceReferenceLocation]);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Gradient Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 dark:from-blue-700 dark:via-cyan-700 dark:to-teal-700 px-4 pt-10 pb-16 sm:pt-14 sm:pb-20">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-8 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl" />

        <div className="relative mx-auto max-w-2xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                Find Workers
              </h1>
              <p className="mt-1 text-sm sm:text-base text-white/75">
                Search and connect with verified local workers
              </p>
            </div>
          </div>

          {/* Quick stat chips */}
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              `${workers.length} Workers`,
              `${workers.filter((w) => w.isAvailable).length} Available Now`,
              "Verified Profiles",
            ].map((tag, i) => (
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

      {/* ── Main Content — overlaps header ── */}
      <div className="relative z-10 mx-auto -mt-14 max-w-2xl px-4 pb-16 sm:-mt-16 sm:px-6">
        <Card className="border-0 shadow-2xl shadow-black/10 dark:shadow-black/30 rounded-2xl overflow-hidden">
          <CardContent className="p-5 sm:p-8 space-y-6">

            {/* ── Search & Filter Bar ── */}
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or profession…"
                  className="h-11 pl-9 rounded-xl border-border/60 bg-muted/40 focus:bg-background focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {/* City + Filter button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City (e.g., Surat, Bilimora)"
                    className="h-11 pl-9 pr-10 rounded-xl border-border/60 bg-muted/40 focus:bg-background focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleLocate}
                    disabled={isLocating}
                    title="Use my current location"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-500 transition-colors"
                  >
                    {isLocating ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <LocateFixed className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Filter Sheet trigger */}
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      onClick={openSheet}
                      className="relative h-11 px-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md shadow-blue-500/25 font-medium shrink-0"
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
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
                        <SheetTitle className="text-lg font-bold">Filter Workers</SheetTitle>
                      </SheetHeader>

                      <div className="grid grid-cols-1 gap-2 px-4 pb-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-border/40 bg-white/70 dark:bg-slate-900/40 p-2">
                          <p className="text-[11px] font-semibold text-foreground mb-1.5">📍 Distance</p>
                          <Select value={tempDistance} onValueChange={setTempDistance}>
                            <SelectTrigger className="h-9 rounded-lg border-border/60 bg-background/70">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="all">Any distance</SelectItem>
                              <SelectItem value="3">Within 3 km</SelectItem>
                              <SelectItem value="5">Within 5 km</SelectItem>
                              <SelectItem value="10">Within 10 km</SelectItem>
                              <SelectItem value="20">Within 20 km</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="rounded-xl border border-border/40 bg-white/70 dark:bg-slate-900/40 p-2">
                          <p className="text-[11px] font-semibold text-foreground mb-1.5">🧰 Profession</p>
                          <Select value={tempProfession} onValueChange={setTempProfession}>
                            <SelectTrigger className="h-9 rounded-lg border-border/60 bg-background/70">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="all">All professions</SelectItem>
                              {professions.map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="rounded-xl border border-border/40 bg-white/70 dark:bg-slate-900/40 p-2">
                          <p className="text-[11px] font-semibold text-foreground mb-1.5">⭐ Minimum Rating</p>
                          <Select value={tempRating} onValueChange={setTempRating}>
                            <SelectTrigger className="h-9 rounded-lg border-border/60 bg-background/70">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="0">Any rating</SelectItem>
                              <SelectItem value="1">1.0 and above</SelectItem>
                              <SelectItem value="2">2.0 and above</SelectItem>
                              <SelectItem value="3">3.0 and above</SelectItem>
                              <SelectItem value="3.5">3.5 and above</SelectItem>
                              <SelectItem value="4">4.0 and above</SelectItem>
                              <SelectItem value="4.5">4.5 and above</SelectItem>
                              <SelectItem value="4.8">4.8 and above</SelectItem>
                              <SelectItem value="5">5.0</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="rounded-xl border border-border/40 bg-white/70 dark:bg-slate-900/40 p-2">
                          <p className="text-[11px] font-semibold text-foreground mb-1.5">🟢 Availability</p>
                          <Select value={tempAvailability} onValueChange={setTempAvailability}>
                            <SelectTrigger className="h-9 rounded-lg border-border/60 bg-background/70">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="all">All workers</SelectItem>
                              <SelectItem value="available">Available now</SelectItem>
                              <SelectItem value="unavailable">Unavailable</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex gap-2 sm:col-span-2">
                          <Button
                            onClick={applyFilters}
                            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-blue-500/30"
                          >
                            Apply Filters
                          </Button>
                          <Button
                            variant="outline"
                            onClick={resetFilters}
                            className="flex-1 h-11 rounded-xl border-border/60 font-medium"
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {distanceFilter !== "all" && (
                  <FilterChip
                    label={`Within ${distanceFilter} km`}
                    onRemove={() => setDistanceFilter("all")}
                  />
                )}
                {ratingFilter !== "0" && (
                  <FilterChip
                    label={`★ ${ratingFilter}+`}
                    onRemove={() => setRatingFilter("0")}
                  />
                )}
                {availabilityFilter !== "all" && (
                  <FilterChip
                    label={availabilityFilter === "available" ? "Available now" : "Unavailable"}
                    onRemove={() => setAvailabilityFilter("all")}
                  />
                )}
                {professionFilter !== "all" && (
                  <FilterChip label={professionFilter} onRemove={() => setProfessionFilter("all")} />
                )}
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
              <span className="text-xs font-medium text-muted-foreground px-2">
                {filteredWorkers.length} worker{filteredWorkers.length !== 1 ? "s" : ""} found
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
            </div>

            {/* ── Worker Cards ── */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-muted-foreground animate-pulse">Finding local talent...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 py-12 px-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
                    <XCircle className="h-7 w-7" />
                  </div>
                  <p className="font-semibold text-rose-900">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : filteredWorkers.length > 0 ? (
                filteredWorkers.map((worker) => (
                  <WorkerCard key={worker.id} worker={worker} />
                ))
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-12 px-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                    <Users className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-foreground">No workers found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or search terms.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── Worker Card ── */
function WorkerCard({ worker }: { worker: Worker }) {
  const locationLabel = typeof worker.distanceKm === 'number'
    ? `${formatDistance(worker.distanceKm)} · ${worker.location}`
    : worker.location || "";

  return (
    <div className="group rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-200">
      <div className="p-4 space-y-3">
        {/* Top row: avatar + name + badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted/60 shadow-sm">
              <img
                src={worker.avatarUrl}
                alt={`${worker.name} profile`}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = "/logo.png";
                }}
              />
            </div>
            <div>
              <p className="font-semibold text-foreground leading-tight">{worker.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <span>{getProfessionIcon(worker.profession)}</span>
                {worker.profession}
              </p>
            </div>
          </div>

          {/* Availability badge */}
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0 ${
              worker.isAvailable
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : "bg-muted/50 text-muted-foreground border border-border/50"
            }`}
          >
            {worker.isAvailable ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {worker.isAvailable ? "Available" : "Unavailable"}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          <StatPill icon={<Star className="h-3.5 w-3.5 text-amber-500" />} label={`${worker.rating} (${worker.completedJobs} jobs)`} />
          {locationLabel ? (
            <StatPill icon={<MapPin className="h-3.5 w-3.5 text-blue-500" />} label={locationLabel} />
          ) : null}
          <StatPill icon={<Phone className="h-3.5 w-3.5 text-muted-foreground" />} label={maskPhone(worker.phone)} />
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 h-9 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-sm shadow-blue-500/20 font-medium"
            asChild
          >
            <a href={`tel:${worker.phone}`}>
              <Phone className="mr-1.5 h-3.5 w-3.5" />
              Call
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-9 rounded-xl border-border/60 hover:bg-muted/60 font-medium"
          >
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
            Chat
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {icon}
      {label}
    </span>
  );
}

const avatarGradients = [
  "from-emerald-400 to-teal-500",
  "from-blue-400 to-cyan-500",
  "from-violet-400 to-purple-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
];