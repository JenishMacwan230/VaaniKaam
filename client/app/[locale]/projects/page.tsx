'use client';

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search, IndianRupee, Clock3, Building2 } from "lucide-react";

type JobTab = "live" | "recommended" | "applied";

type Job = {
  id: string;
  title: string;
  location: string;
  distanceKm: number;
  pay: number;
  payType: "day" | "job";
  urgency: "Urgent" | "Today" | "Normal";
  postedBy: string;
  tab: JobTab;
};

function getUrgencyBadgeClass(urgency: Job["urgency"]): string {
  if (urgency === "Urgent") return "bg-red-100 text-red-700";
  if (urgency === "Today") return "bg-amber-100 text-amber-700";
  return "bg-slate-200 text-slate-700";
}

function getUrgencyStartText(urgency: Job["urgency"]): string {
  if (urgency === "Urgent") return "Immediate joining";
  if (urgency === "Today") return "Starts today";
  return "Flexible start";
}

const jobs: Job[] = [
  {
    id: "j-1",
    title: "Plumber Needed for Apartment Repair",
    location: "Bilimora",
    distanceKm: 1.8,
    pay: 1200,
    payType: "day",
    urgency: "Urgent",
    postedBy: "Shree Builders",
    tab: "live",
  },
  {
    id: "j-2",
    title: "House Repainting Work",
    location: "Navsari",
    distanceKm: 3.5,
    pay: 900,
    payType: "day",
    urgency: "Today",
    postedBy: "Patel Constructions",
    tab: "live",
  },
  {
    id: "j-3",
    title: "Electrical Wiring for New Shop",
    location: "Valsad",
    distanceKm: 6.2,
    pay: 2500,
    payType: "job",
    urgency: "Normal",
    postedBy: "Urban Infra",
    tab: "recommended",
  },
  {
    id: "j-4",
    title: "Tile Fitting for Bathroom",
    location: "Bilimora",
    distanceKm: 2.1,
    pay: 1400,
    payType: "day",
    urgency: "Today",
    postedBy: "HomeFix Services",
    tab: "recommended",
  },
  {
    id: "j-5",
    title: "Masonry Work for Compound Wall",
    location: "Navsari",
    distanceKm: 4.7,
    pay: 3000,
    payType: "job",
    urgency: "Normal",
    postedBy: "Sai Developers",
    tab: "applied",
  },
];

export default function ProjectsPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [distanceFilter, setDistanceFilter] = useState("10");
  const [payFilter, setPayFilter] = useState("0");
  const [activeTab, setActiveTab] = useState<JobTab>("live");

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const byTab = job.tab === activeTab;
      const byQuery = query
        ? job.title.toLowerCase().includes(query.toLowerCase())
          || job.postedBy.toLowerCase().includes(query.toLowerCase())
        : true;

      const byLocation = location
        ? job.location.toLowerCase().includes(location.toLowerCase())
        : true;

      const byDistance = job.distanceKm <= Number(distanceFilter);
      const byPay = job.pay >= Number(payFilter);

      return byTab && byQuery && byLocation && byDistance && byPay;
    });
  }, [activeTab, distanceFilter, location, payFilter, query]);

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
              Search Jobs
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-4 border-slate-200">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-slate-900">Filters</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="border-slate-200">
              <CardContent className="space-y-3 p-4">
                {/** Applied jobs should not show accept action again. */}
                {(() => {
                  const isAppliedJob = job.tab === "applied";
                  return (
                    <>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">{job.title}</h3>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${getUrgencyBadgeClass(job.urgency)}`}>
                    {job.urgency}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {job.location} ({job.distanceKm} km)
                  </p>
                  <p className="flex items-center gap-1.5 font-semibold text-emerald-700">
                    <IndianRupee className="h-4 w-4" />
                    {job.pay} / {job.payType}
                  </p>
                  <p className="flex items-center gap-1.5 sm:col-span-2">
                    <Building2 className="h-4 w-4" />
                    Posted by {job.postedBy}
                  </p>
                  <p className="flex items-center gap-1.5 sm:col-span-2">
                    <Clock3 className="h-4 w-4" />
                    {getUrgencyStartText(job.urgency)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {isAppliedJob ? (
                    <Button size="sm" variant="secondary" className="w-full" disabled>
                      Applied
                    </Button>
                  ) : (
                    <Button size="sm" className="w-full">Accept Job</Button>
                  )}
                  <Button size="sm" variant="outline" className="w-full">View Details</Button>
                </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          ))}

          {filteredJobs.length === 0 && (
            <Card className="border-dashed border-slate-300">
              <CardContent className="p-6 text-center text-sm text-slate-600">
                No jobs found for selected filters.
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
