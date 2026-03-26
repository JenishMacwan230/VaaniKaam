'use client';

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search, Star, Phone, MessageCircle } from "lucide-react";

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
  const [profession, setProfession] = useState("");
  const [location, setLocation] = useState("");
  const [distanceFilter, setDistanceFilter] = useState("10");
  const [ratingFilter, setRatingFilter] = useState("0");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const byProfession = profession
        ? worker.profession.toLowerCase().includes(profession.toLowerCase())
        : true;

      const byLocation = location
        ? worker.location.toLowerCase().includes(location.toLowerCase())
        : true;

      const byDistance = worker.distanceKm <= Number(distanceFilter);
      const byRating = worker.rating >= Number(ratingFilter);
      let byAvailability = true;
      if (availabilityFilter === "available") {
        byAvailability = worker.isAvailable;
      } else if (availabilityFilter === "unavailable") {
        byAvailability = !worker.isAvailable;
      }

      return byProfession && byLocation && byDistance && byRating && byAvailability;
    });
  }, [availabilityFilter, distanceFilter, location, profession, ratingFilter]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto w-full max-w-5xl px-4 py-5">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Worker Discovery</h1>
          <p className="text-sm text-slate-600">Find workers quickly and connect in one tap.</p>
        </div>

        <Card className="mb-4 border-slate-200">
          <CardContent className="space-y-3 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Profession</p>
                <Input
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g. Plumber"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Location</p>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bilimora"
                />
              </div>
            </div>
            <Button className="w-full md:w-auto">
              <Search className="mr-2 h-4 w-4" />
              Search Workers
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-4 border-slate-200">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-slate-900">Filters</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Distance</p>
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

              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Rating</p>
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

              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Availability</p>
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
          </CardContent>
        </Card>

        <div className="space-y-3">
          {filteredWorkers.map((worker) => (
            <Card key={worker.id} className="border-slate-200">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{worker.name}</p>
                    <p className="text-sm text-slate-600">{worker.profession}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${worker.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                    {worker.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                  <p className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-500" />
                    {worker.rating} ({worker.completedJobs} jobs)
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {worker.distanceKm} km
                  </p>
                  <div className="col-span-2 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      {maskPhone(worker.phone)}
                    </p>
                    <Button size="sm" variant="outline" className="shrink-0">
                      <MessageCircle className="mr-1.5 h-4 w-4" />
                      Chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredWorkers.length === 0 && (
            <Card className="border-dashed border-slate-300">
              <CardContent className="p-6 text-center text-sm text-slate-600">
                No workers found for selected filters.
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
