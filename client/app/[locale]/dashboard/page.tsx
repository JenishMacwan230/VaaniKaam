"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchSessionUser,
  AuthUser,
  logoutSession,
  updateSessionProfile,
  resolveAccountType,
  getCurrentLocale,
} from "@/lib/authClient";
import { UserAvatar } from "@/components/UserAvatar";
import { uploadProfilePicture, deleteProfilePicture } from "@/lib/cloudinaryUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2, LogOut, MapPin, Edit, Camera, Trash2, Check,
  Briefcase, FileText, Settings, Clock, Star, User, Hammer,
  Languages, BriefcaseBusiness, Wallet, Upload, ArrowLeft,
  TrendingUp, CheckCircle, AlertCircle, IndianRupee,
  ChevronRight, Activity,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PricingType = "hour" | "day" | "job";

function normalizeLanguages(userLanguages: unknown): string[] {
  if (Array.isArray(userLanguages))
    return userLanguages.filter((l): l is string => typeof l === "string");
  if (typeof userLanguages === "string")
    return userLanguages.split(",").map((l) => l.trim()).filter(Boolean);
  return [];
}

function getPricingPlaceholder(t: PricingType) {
  if (t === "hour") return "INR per hour";
  if (t === "day") return "INR per day";
  return "INR per job";
}

function getPricingLabel(t: PricingType) {
  if (t === "hour") return "/ hr";
  if (t === "day") return "/ day";
  return "/ job";
}

/* ─── Analytics fetch helpers ─── */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface WorkerAnalytics {
  totalApplications: number;
  activeJobs: number;
  completedJobs: number;
  totalEarned: number;
  successRate: number;
}

async function fetchWorkerAnalytics(): Promise<WorkerAnalytics> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/jobs/worker/analytics`, {
      credentials: "include",
    });
    if (res.ok) {
      const d = await res.json();
      return d.analytics;
    }
  } catch {}
  return { totalApplications: 0, activeJobs: 0, completedJobs: 0, totalEarned: 0, successRate: 0 };
}

export default function DashboardPage() {
  const professionOptions = ["Mason", "Carpenter", "Plumber", "Electrician", "Painter", "Welder", "General Labor"];
  const skillOptions = ["Tile Work", "Plumbing", "Wiring", "POP Work", "Waterproofing", "Painting", "Furniture Fitting", "Site Cleaning"];
  const languageOptions = ["Gujarati", "Hindi", "English"];
  const experienceOptions = [
    { label: "Fresher", value: 0 },
    { label: "1–3 years", value: 2 },
    { label: "3–5 years", value: 4 },
    { label: "5+ years", value: 6 },
  ];

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPicDialog, setShowPicDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [analytics, setAnalytics] = useState<WorkerAnalytics | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "", location: "", phone: "", profession: "",
    skills: [] as string[], experienceYears: 2,
    pricingType: "hour" as PricingType, pricingAmount: "",
    languages: [] as string[], about: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const profileCompletion = useMemo(() => {
    const checks = [
      Boolean(editFormData.name.trim()), Boolean(editFormData.location.trim()),
      Boolean(editFormData.phone.trim()), Boolean(editFormData.profession),
      editFormData.skills.length > 0, editFormData.experienceYears > 0,
      Boolean(editFormData.pricingAmount), editFormData.languages.length > 0,
      Boolean(editFormData.about.trim()), Boolean(user?.profilePictureUrl),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [editFormData, user?.profilePictureUrl]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await fetchSessionUser();
        if (!userData) { router.push("/en/login"); return; }
        const accountType = resolveAccountType(userData);
        setUser(userData);
        if (typeof userData.availability === "boolean") setIsAvailable(userData.availability);
        const raw = userData as unknown as Record<string, unknown>;
        setEditFormData({
          name: userData.name || "",
          location: userData.location || "",
          phone: userData.phone || "",
          profession: (raw.profession as string) || "",
          skills: (raw.skills as string[]) || [],
          experienceYears: Number(raw.experienceYears || 2),
          pricingType: (raw.pricingType as PricingType) || "hour",
          pricingAmount: raw.pricingAmount != null ? String(raw.pricingAmount) : "",
          languages: normalizeLanguages(raw.languages),
          about: (raw.about as string) || "",
        });
        // Load analytics
        const a = await fetchWorkerAnalytics();
        setAnalytics(a);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [router]);

  useEffect(() => {
    if (!loading && searchParams.get("editProfile") === "1") {
      setShowEditDialog(true);
    }
  }, [loading, searchParams]);

  const handleLogout = async () => {
    await logoutSession();
    localStorage.removeItem("user");
    globalThis.window.dispatchEvent(new Event("auth-changed"));
    router.push("/");
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const result = await uploadProfilePicture(file, user.id);
      if (!result.success) { alert(`Upload failed: ${result.error}`); return; }
      const updated = { ...user, profilePictureUrl: result.url, profilePicturePublicId: result.publicId };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
    } catch { alert("Failed to upload"); }
    finally { setUploading(false); }
  };

  const handleRemoveProfilePic = async () => {
    setUploading(true);
    try {
      if (user?.profilePicturePublicId) await deleteProfilePicture(user.profilePicturePublicId);
      const updated = { ...user, profilePictureUrl: undefined, profilePicturePublicId: undefined };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      setShowPicDialog(false);
    } finally { setUploading(false); }
  };

  const handleEditDialogChange = (open: boolean) => {
    setShowEditDialog(open);
    if (!open && searchParams.get("editProfile") === "1") {
      router.back();
    }
  };

  const handleEditProfile = async () => {
    const parsedAmount: number | "" =
      editFormData.pricingAmount.trim() === "" ? "" : Number(editFormData.pricingAmount);
    if (parsedAmount !== "" && Number.isNaN(parsedAmount)) { alert("Enter a valid pricing amount"); return; }
    try {
      const updated = await updateSessionProfile({
        name: editFormData.name.trim(), location: editFormData.location.trim(),
        profession: editFormData.profession.trim(), skills: editFormData.skills,
        experienceYears: editFormData.experienceYears, pricingType: editFormData.pricingType,
        pricingAmount: parsedAmount, languages: editFormData.languages,
        about: editFormData.about.trim(),
      });
      if (!updated) { alert("Failed to update profile"); return; }
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      handleEditDialogChange(false);
    } catch { alert("Failed to update profile"); }
  };

  const handleAvailabilityToggle = async () => {
    const next = !isAvailable;
    setIsAvailable(next);
    const updated = await updateSessionProfile({ availability: next });
    if (!updated) { setIsAvailable(!next); return; }
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
    if (typeof updated.availability === "boolean") setIsAvailable(updated.availability);
  };

  const toggleSkill = (skill: string, checked: boolean) =>
    setEditFormData((p) => ({ ...p, skills: checked ? [...p.skills, skill] : p.skills.filter((s) => s !== skill) }));
  const toggleLanguage = (lang: string, checked: boolean) =>
    setEditFormData((p) => ({ ...p, languages: checked ? [...p.languages, lang] : p.languages.filter((l) => l !== lang) }));

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center flex-col gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    );
  }

  if (!user) return null;
  const isContractor = resolveAccountType(user) === "contractor";

  const workerData = user as AuthUser & {
    profession?: string; skills?: string[]; experienceYears?: number;
    pricingType?: PricingType; pricingAmount?: string | number;
    languages?: string[] | string; about?: string;
  };

  const workerPricingAmount =
    workerData.pricingAmount != null ? String(workerData.pricingAmount) : "";
  const workerPricingType = workerData.pricingType || "hour";

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-8">

        {/* Back button */}
        <div className="mb-4 flex justify-start">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/40"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Profile, analytics & quick actions</p>
        </div>

        {/* ── Profile Card ── */}
        <Card className="mb-5 overflow-hidden border-0 shadow-md">
          {/* Banner */}
          <div className="h-20 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardContent className="pt-0 pb-5 px-5">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <button
                type="button"
                onClick={() => setShowPicDialog(true)}
                className="relative group"
              >
                {user.profilePictureUrl ? (
                  <img
                    src={user.profilePictureUrl}
                    alt="Profile"
                    className="h-20 w-20 rounded-full border-4 border-background object-cover shadow-sm"
                  />
                ) : (
                  <UserAvatar user={user} className="h-20 w-20 border-4 border-background shadow-sm" />
                )}
                <span className="absolute bottom-0.5 right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow">
                  <Camera className="h-3.5 w-3.5" />
                </span>
              </button>
              {/* Availability toggle */}
              {!isContractor && (
                <button
                  type="button"
                  onClick={handleAvailabilityToggle}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                    isAvailable
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-gray-400"}`} />
                  {isAvailable ? "Available" : "Unavailable"}
                </button>
              )}
            </div>

            {/* Name + meta */}
            <h2 className="text-xl font-bold">{user.name || "User"}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-wide">
                {resolveAccountType(user) === "contractor" ? "Contractor" : "Worker"}
              </Badge>
              {!isContractor && workerData.profession && (
                <Badge variant="outline" className="text-xs">{workerData.profession}</Badge>
              )}
              {user.location && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {user.location}
                </span>
              )}
            </div>

            {/* Pricing */}
            {!isContractor && workerPricingAmount ? (
              <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                ₹{workerPricingAmount} {getPricingLabel(workerPricingType)}
              </p>
            ) : null}

            {/* About */}
            {workerData.about && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {workerData.about}
              </p>
            )}

            {/* Skills */}
            {!isContractor && workerData.skills && workerData.skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {workerData.skills.slice(0, 5).map((s) => (
                  <span key={s} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {s}
                  </span>
                ))}
                {workerData.skills.length > 5 && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    +{workerData.skills.length - 5}
                  </span>
                )}
              </div>
            )}

            {/* Profile completion */}
            {!isContractor && (
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Profile completion</span>
                  <span className="font-bold text-foreground">{profileCompletion}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                {profileCompletion < 100 && (
                  <p className="text-xs text-muted-foreground">
                    Complete your profile to get more job matches
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEditDialogChange(true)} className="gap-1.5">
                <Edit className="h-3.5 w-3.5" /> Edit Profile
              </Button>
              <Button size="sm" variant="ghost" onClick={handleLogout} className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-3.5 w-3.5" /> Log Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Worker Analytics ── */}
        {!isContractor && (
          <div className="mb-5">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-bold">Analytics</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Applied",
                value: analytics?.totalApplications ?? "—",
                icon: Briefcase,
                color: "text-blue-600",
                bg: "bg-blue-50 dark:bg-blue-950/40",
              },
              {
                label: "Active Jobs",
                value: analytics?.activeJobs ?? "—",
                icon: Clock,
                color: "text-amber-600",
                bg: "bg-amber-50 dark:bg-amber-950/40",
              },
              {
                label: "Completed",
                value: analytics?.completedJobs ?? "—",
                icon: CheckCircle,
                color: "text-emerald-600",
                bg: "bg-emerald-50 dark:bg-emerald-950/40",
              },
              {
                label: "Earned",
                value: analytics
                  ? analytics.totalEarned >= 1000
                    ? `₹${(analytics.totalEarned / 1000).toFixed(1)}K`
                    : `₹${analytics.totalEarned}`
                  : "—",
                icon: IndianRupee,
                color: "text-emerald-600",
                bg: "bg-emerald-50 dark:bg-emerald-950/40",
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <p className="text-xl font-bold leading-none">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Success rate bar */}
          {analytics && analytics.totalApplications > 0 && (
            <Card className="mt-3 border shadow-sm">
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-sm font-semibold">Success Rate</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{analytics.successRate}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                    style={{ width: `${analytics.successRate}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {analytics.completedJobs} of {analytics.totalApplications} applications completed
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        )}

        {/* ── Navigate to Work Section ── */}
        {!isContractor && (
        <div className="mb-5">
          <div className="mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-emerald-600" />
            <h2 className="text-base font-bold">My Work</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              const locale = getCurrentLocale(window.location.pathname);
              router.push(`/${locale}/dashboard/worker`);
            }}
            className="w-full flex items-center justify-between gap-4 rounded-2xl border bg-background p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <Briefcase className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Jobs & Applications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {analytics
                    ? `${analytics.activeJobs} active · ${analytics.totalApplications} applied`
                    : "View active jobs, applied jobs & completed work"}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 transition-colors flex-shrink-0" />
          </button>
        </div>
        )}

        {/* ── Quick Actions ── */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-bold">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              {
                icon: FileText,
                label: "My Portfolio",
                desc: "Showcase your work",
                color: "text-yellow-600",
                bg: "bg-yellow-50 dark:bg-yellow-950/40",
                action: () => { const l = getCurrentLocale(window.location.pathname); router.push(`/${l}/dashboard/portfolio`); },
              },
              {
                icon: Star,
                label: "My Reviews",
                desc: "See your ratings",
                color: "text-purple-600",
                bg: "bg-purple-50 dark:bg-purple-950/40",
                action: () => { const l = getCurrentLocale(window.location.pathname); router.push(`/${l}/dashboard/reviews`); },
              },
              {
                icon: Settings,
                label: "Settings",
                desc: "Account settings",
                color: "text-gray-600",
                bg: "bg-gray-100 dark:bg-gray-800",
                action: () => { const l = getCurrentLocale(window.location.pathname); router.push(`/${l}/dashboard/settings`); },
              },
            ].map(({ icon: Icon, label, desc, color, bg, action }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className="flex flex-col items-start gap-3 rounded-2xl border bg-background p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Profile Picture Dialog ── */}
      <Dialog open={showPicDialog} onOpenChange={setShowPicDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Profile Picture</DialogTitle>
            <DialogDescription>Upload or remove your profile photo</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            {user.profilePictureUrl && (
              <div className="flex justify-center">
                <img src={user.profilePictureUrl} alt="Profile" className="h-28 w-28 rounded-full object-cover ring-2 ring-primary" />
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {user.profilePictureUrl ? "Change Picture" : "Upload Picture"}
            </Button>
            {user.profilePictureUrl && (
              <Button variant="destructive" onClick={handleRemoveProfilePic} disabled={uploading} className="w-full gap-2">
                <Trash2 className="h-4 w-4" /> Remove Picture
              </Button>
            )}
            <p className="text-xs text-muted-foreground text-center">Max 5 MB · JPG, PNG, GIF, WebP</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPicDialog(false)} className="w-full">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Profile Dialog ── */}
      <Dialog open={showEditDialog} onOpenChange={handleEditDialogChange}>
        <DialogContent className="max-h-[92vh] w-[95vw] max-w-lg overflow-hidden p-0">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Keep your details updated to get better job matches.</DialogDescription>
            {!isContractor && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Profile completion</span>
                <span className="font-bold text-foreground">{profileCompletion}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${profileCompletion}%` }} />
              </div>
            </div>
            )}
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(92vh-175px)] px-5 py-4 space-y-5">

            {/* Photo */}
            <section className="rounded-xl border bg-muted/30 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Camera className="h-4 w-4" /> Profile Photo</p>
              <div className="flex items-center gap-3">
                {user.profilePictureUrl
                  ? <img src={user.profilePictureUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                  : <UserAvatar user={user} className="h-14 w-14" />
                }
                <div className="flex-1 space-y-2">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
                  <Button type="button" variant="outline" size="sm" className="w-full gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Upload"}
                  </Button>
                  {user.profilePictureUrl && (
                    <Button type="button" variant="destructive" size="sm" className="w-full gap-1.5" onClick={handleRemoveProfilePic} disabled={uploading}>
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  )}
                </div>
              </div>
            </section>

            {/* Basic Info */}
            <section className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold"><User className="h-4 w-4" /> Basic Info</p>
              <div className="space-y-1"><Label htmlFor="edit-name">Name</Label><Input id="edit-name" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} placeholder="Full name" /></div>
              <div className="space-y-1"><Label htmlFor="edit-location">Location</Label><Input id="edit-location" value={editFormData.location} onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })} placeholder="City, State" /></div>
              <div className="space-y-1"><Label htmlFor="edit-phone">Phone</Label><Input id="edit-phone" value={editFormData.phone} disabled readOnly /></div>
            </section>

            {/* Profession */}
            {!isContractor && (
            <section className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold"><BriefcaseBusiness className="h-4 w-4" /> Profession</p>
              <Select value={editFormData.profession} onValueChange={(v) => setEditFormData({ ...editFormData, profession: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select profession" /></SelectTrigger>
                <SelectContent>{professionOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </section>
            )}

            {/* Skills */}
            {!isContractor && (
            <section className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold"><Hammer className="h-4 w-4" /> Skills</p>
              <div className="flex flex-wrap gap-2">
                {skillOptions.map((skill) => (
                  <button key={skill} type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${editFormData.skills.includes(skill) ? "bg-emerald-600 text-white border-emerald-600" : "bg-background text-muted-foreground border-border hover:border-emerald-400"}`}
                    onClick={() => toggleSkill(skill, !editFormData.skills.includes(skill))}>
                    {skill}
                  </button>
                ))}
              </div>
            </section>
            )}

            {/* Experience */}
            {!isContractor && (
            <section className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4" /> Experience</p>
              <div className="grid grid-cols-2 gap-2">
                {experienceOptions.map((opt) => (
                  <label key={opt.label}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer text-sm transition-colors ${editFormData.experienceYears === opt.value ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 font-medium" : "bg-background hover:border-emerald-300"}`}>
                    <input type="radio" name="experience" checked={editFormData.experienceYears === opt.value}
                      onChange={() => setEditFormData({ ...editFormData, experienceYears: opt.value })}
                      className="accent-emerald-600 h-3.5 w-3.5" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </section>
            )}

            {/* Pricing */}
            {!isContractor && (
            <section className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold"><Wallet className="h-4 w-4" /> Pricing</p>
              <div className="flex gap-2">
                {(["hour", "day", "job"] as PricingType[]).map((t) => (
                  <button key={t} type="button"
                    className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors ${editFormData.pricingType === t ? "bg-emerald-600 text-white border-emerald-600" : "bg-background hover:border-emerald-400"}`}
                    onClick={() => setEditFormData({ ...editFormData, pricingType: t })}>
                    Per {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <Input value={editFormData.pricingAmount} onChange={(e) => setEditFormData({ ...editFormData, pricingAmount: e.target.value })} placeholder={getPricingPlaceholder(editFormData.pricingType)} />
            </section>
            )}

            {/* Languages */}
            <section className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold"><Languages className="h-4 w-4" /> Languages</p>
              <div className="grid grid-cols-2 gap-2">
                {languageOptions.map((lang) => (
                  <label key={lang} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-sm cursor-pointer hover:border-emerald-300 transition-colors">
                    <Checkbox checked={editFormData.languages.includes(lang)} onCheckedChange={(c) => toggleLanguage(lang, c === true)} />
                    {lang}
                  </label>
                ))}
              </div>
            </section>

            {/* About */}
            <section className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4" /> About</p>
              <Textarea value={editFormData.about} onChange={(e) => setEditFormData({ ...editFormData, about: e.target.value })} placeholder="Short summary about your work and strengths…" className="min-h-[96px]" />
            </section>
          </div>

          <DialogFooter className="border-t bg-background px-5 py-3 flex-row gap-2">
            <Button variant="outline" onClick={() => handleEditDialogChange(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleEditProfile} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Check className="h-4 w-4" /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
