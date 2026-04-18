'use client';

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MapPin, Search, Star, Phone, MessageCircle, Menu, LocateFixed } from "lucide-react";

type Worker = {
  id: string;
  name: string;
  profession: string;
  rating: number;
  completedJobs: number;
  distanceKm: number;
  phone: string;
  isAvailable: boolean;
  location: string;
};

const workers: Worker[] = [
  {
    id: "w-1",
    name: "Ravi Patel",
    profession: "Plumber",
    rating: 4.8,
    completedJobs: 124,
    distanceKm: 1.5,
    phone: "9328135511",
    isAvailable: true,
    location: "Bilimora",
  },
  {
    id: "w-2",
    name: "Asha Macwan",
    profession: "Painter",
    rating: 4.6,
    completedJobs: 89,
    distanceKm: 3.1,
    phone: "9898123412",
    isAvailable: false,
    location: "Navsari",
  },
  {
    id: "w-3",
    name: "Imran Sheikh",
    profession: "Electrician",
    rating: 4.9,
    completedJobs: 170,
    distanceKm: 5.2,
    phone: "9016123498",
    isAvailable: true,
    location: "Bilimora",
  },
  {
    id: "w-4",
    name: "Sanjay Chauhan",
    profession: "Mason",
    rating: 4.3,
    completedJobs: 52,
    distanceKm: 7.4,
    phone: "9978442211",
    isAvailable: true,
    location: "Valsad",
  },
];

function maskPhone(phone: string): string {
  if (phone.length < 6) return "******";
  return `${phone.slice(0, 2)}******${phone.slice(-2)}`;
}

export default function WorkersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [city, setCity] = useState("");
  const [distanceFilter, setDistanceFilter] = useState("10");
  const [ratingFilter, setRatingFilter] = useState("0");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const resetFilters = () => {
    setDistanceFilter("10");
    setRatingFilter("0");
    setAvailabilityFilter("all");
  };

  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const bySearch = searchTerm
        ? `${worker.name} ${worker.profession}`.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const byCity = city
        ? worker.location.toLowerCase().includes(city.toLowerCase())
        : true;

      const byDistance = worker.distanceKm <= Number(distanceFilter);
      const byRating = worker.rating >= Number(ratingFilter);
      let byAvailability = true;
      if (availabilityFilter === "available") {
        byAvailability = worker.isAvailable;
      } else if (availabilityFilter === "unavailable") {
        byAvailability = !worker.isAvailable;
      }

      return bySearch && byCity && byDistance && byRating && byAvailability;
    });
  }, [availabilityFilter, city, distanceFilter, ratingFilter, searchTerm]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-4 py-4">
        <Card className="mb-4 border-border/70 bg-card/95">
          <CardContent className="space-y-2 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent w-max">Find workers</h1>
                <p className="text-sm text-muted-foreground">
                  Search and connect with verified workers.
                </p>
              </div>
              
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or profession"
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="px-9"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCity("Locating...");
                      navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                          try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=en`);
                            const data = await res.json();
                            setCity(data.address.city || data.address.town || data.address.village || "Current Location");
                          } catch {
                            setCity("Current Location");
                          }
                        },
                        () => setCity("Location Error")
                      );
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    title="Use my current location"
                  >
                    <LocateFixed className="h-4 w-4" />
                  </button>
                </div>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="h-10 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
                      <Menu className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="center"
                    overlayClassName="bg-black/60"
                    className="w-[min(90vw,320px)] max-h-[70vh] overflow-y-auto bg-background/80 backdrop-blur"
                  >
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-5 px-4 pb-4">
                    <div className="rounded-xl border border-border/70 bg-accent/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground">
                        Distance
                      </p>
                      <div className="mt-2">
                        <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">Within 3 km</SelectItem>
                            <SelectItem value="5">Within 5 km</SelectItem>
                            <SelectItem value="10">Within 10 km</SelectItem>
                            <SelectItem value="20">Within 20 km</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-secondary/10 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                        Rating
                      </p>
                      <div className="mt-2">
                        <Select value={ratingFilter} onValueChange={setRatingFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Any rating</SelectItem>
                            <SelectItem value="4">4.0+</SelectItem>
                            <SelectItem value="4.5">4.5+</SelectItem>
                            <SelectItem value="4.8">4.8+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-primary/10 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        Availability
                      </p>
                      <div className="mt-2">
                        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="unavailable">Unavailable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button className="w-full">Apply filters</Button>
                      <Button variant="outline" className="w-full" onClick={resetFilters}>
                        Reset filters
                      </Button>
                    </div>
                  </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {distanceFilter !== "10" && (
                <span className="rounded-full bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/20 px-3 py-1 text-accent-foreground">
                  Distance: {distanceFilter} km
                </span>
              )}
              {ratingFilter !== "0" && (
                <span className="rounded-full bg-gradient-to-r from-secondary/20 to-secondary/10 border border-secondary/20 px-3 py-1 text-secondary">
                  Rating: {ratingFilter}+
                </span>
              )}
              {availabilityFilter !== "all" && (
                <span className="rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20 px-3 py-1 text-primary">
                  {availabilityFilter === "available" ? "Available only" : "Unavailable only"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {filteredWorkers.map((worker) => (
            <Card key={worker.id} className="border-primary/20 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 shadow-sm backdrop-blur-sm transition-all hover:border-primary/40 hover:from-primary/15 hover:to-secondary/15">
              <CardContent className="space-y-3 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold">{worker.name}</p>
                    <p className="text-sm text-muted-foreground">{worker.profession}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold border ${worker.isAvailable ? "border-secondary/30 bg-gradient-to-r from-secondary/15 to-secondary/5 text-secondary" : "border-border/50 bg-muted/30 text-muted-foreground"}`}>
                    {worker.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-500" />
                    {worker.rating} ({worker.completedJobs} jobs)
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {worker.distanceKm} km
                  </p>
                  <div className="col-span-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      {maskPhone(worker.phone)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" className="shrink-0" asChild>
                        <a href={`tel:${worker.phone}`}>
                          <Phone className="mr-1.5 h-4 w-4" />
                          Call
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" className="shrink-0">
                        <MessageCircle className="mr-1.5 h-4 w-4" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredWorkers.length === 0 && (
            <Card className="border-dashed border-border/70">
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                No workers found for selected filters.
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
