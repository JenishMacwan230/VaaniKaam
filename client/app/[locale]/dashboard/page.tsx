"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchSessionUser, AuthUser, logoutSession, updateSessionProfile, resolveAccountType, getCurrentLocale } from "@/lib/authClient";
import { UserAvatar } from "@/components/UserAvatar";
import { uploadProfilePicture, deleteProfilePicture } from "@/lib/cloudinaryUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  LogOut,
  MapPin,
  Edit,
  Camera,
  Trash2,
  Check,
  Briefcase,
  FileText,
  Settings,
  Clock,
  Users,
  Star,
  User,
  Hammer,
  Languages,
  BriefcaseBusiness,
  Wallet,
  Upload,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
type PricingType = "hour" | "day" | "job";

function normalizeLanguages(userLanguages: unknown): string[] {
  if (Array.isArray(userLanguages)) {
    return userLanguages.filter((lang): lang is string => typeof lang === "string");
  }

  if (typeof userLanguages === "string") {
    return userLanguages
      .split(",")
      .map((lang) => lang.trim())
      .filter(Boolean);
  }

  return [];
}

function getPricingPlaceholder(pricingType: PricingType): string {
  if (pricingType === "hour") return "INR per hour";
  if (pricingType === "day") return "INR per day";
  return "INR per job";
}

function getPricingLabel(pricingType: PricingType): string {
  if (pricingType === "hour") return "per hour";
  if (pricingType === "day") return "per day";
  return "per job";
}

export default function DashboardPage() {
  const professionOptions = [
    "Mason",
    "Carpenter",
    "Plumber",
    "Electrician",
    "Painter",
    "Welder",
    "General Labor",
  ];

  const skillOptions = [
    "Tile Work",
    "Plumbing",
    "Wiring",
    "POP Work",
    "Waterproofing",
    "Painting",
    "Furniture Fitting",
    "Site Cleaning",
  ];

  const languageOptions = [
    "Gujarati",
    "Hindi",
    "English",
    // "Marathi",
    // "Tamil",
    // "Telugu",
  ];

  const experienceOptions = [
    { label: "Fresher", value: 0 },
    { label: "1-3 years", value: 2 },
    { label: "3-5 years", value: 4 },
    { label: "5+ years", value: 6 },
  ];

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPicDialog, setShowPicDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [editFormData, setEditFormData] = useState({
    name: "",
    location: "",
    phone: "",
    profession: "",
    skills: [] as string[],
    experienceYears: 2,
    pricingType: "hour" as PricingType,
    pricingAmount: "",
    languages: [] as string[],
    about: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const profileCompletion = useMemo(() => {
    const checks = [
      Boolean(editFormData.name.trim()),
      Boolean(editFormData.location.trim()),
      Boolean(editFormData.phone.trim()),
      Boolean(editFormData.profession),
      editFormData.skills.length > 0,
      editFormData.experienceYears > 0,
      Boolean(editFormData.pricingAmount),
      editFormData.languages.length > 0,
      Boolean(editFormData.about.trim()),
      Boolean(user?.profilePictureUrl),
    ];

    const completeCount = checks.filter(Boolean).length;
    return Math.round((completeCount / checks.length) * 100);
  }, [editFormData, user?.profilePictureUrl]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await fetchSessionUser();
        if (!userData) {
          router.push("/en/login");
          return;
        }

        // Redirect contractors to their dashboard
        const accountType = resolveAccountType(userData);
        if (accountType === "contractor") {
          const locale = getCurrentLocale(window.location.pathname);
          router.push(`/${locale}/dashboard/contractor`);
          return;
        }

        setUser(userData);
        if (typeof userData.availability === "boolean") {
          setIsAvailable(userData.availability);
        }
        const userLanguages = (userData as unknown as Record<string, unknown>).languages;
        const normalizedLanguages = normalizeLanguages(userLanguages);

        setEditFormData({
          name: userData.name || "",
          location: userData.location || "",
          phone: userData.phone || "",
          profession: (userData as unknown as Record<string, string>).profession || "",
          skills: ((userData as unknown as Record<string, unknown>).skills as string[]) || [],
          experienceYears: Number((userData as unknown as Record<string, unknown>).experienceYears || 2),
          pricingType: ((userData as unknown as Record<string, PricingType>).pricingType || "hour"),
          pricingAmount: typeof (userData as unknown as Record<string, unknown>).pricingAmount === "number"
            || typeof (userData as unknown as Record<string, unknown>).pricingAmount === "string"
            ? String((userData as unknown as Record<string, unknown>).pricingAmount)
            : "",
          languages: normalizedLanguages,
          about: (userData as unknown as Record<string, string>).about || "",
        });
      } catch (error) {
        console.error("Failed to load user", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [router]);

  const handleLogout = async () => {
    await logoutSession();
    localStorage.removeItem("user");
    globalThis.window.dispatchEvent(new Event("auth-changed"));
    router.push("/");
  };

  const handleProfilePicClick = () => {
    setShowPicDialog(true);
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      if (!user?.id) {
        alert("User ID not found");
        return;
      }

      const result = await uploadProfilePicture(file, user.id);

      if (!result.success) {
        alert(`Upload failed: ${result.error}`);
        return;
      }

      // Update user with new profile picture URL
      const updatedUser = {
        ...user,
        profilePictureUrl: result.url,
        profilePicturePublicId: result.publicId,
      };
      setUser(updatedUser);

      // Also update localStorage for quick access
      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert("Profile picture uploaded successfully!");
    } catch (error) {
      console.error("Failed to upload profile picture", error);
      alert("Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveProfilePic = async () => {
    setUploading(true);
    try {
      if (user?.profilePicturePublicId) {
        const deleted = await deleteProfilePicture(user.profilePicturePublicId);
        if (!deleted) {
          console.warn("Failed to delete profile picture from Cloudinary");
        }
      }

      // Update user to remove profile picture
      const updatedUser = {
        ...user,
        profilePictureUrl: undefined,
        profilePicturePublicId: undefined,
      };
      setUser(updatedUser);

      // Update localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setShowPicDialog(false);
      alert("Profile picture removed successfully!");
    } catch (error) {
      console.error("Failed to remove profile picture", error);
      alert("Failed to remove profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleEditProfile = async () => {
    try {
      const parsedPricingAmount: number | "" = editFormData.pricingAmount.trim() === ""
        ? ""
        : Number(editFormData.pricingAmount);

      if (parsedPricingAmount !== "" && Number.isNaN(parsedPricingAmount)) {
        alert("Please enter a valid pricing amount");
        return;
      }

      const payload = {
        name: editFormData.name.trim(),
        location: editFormData.location.trim(),
        profession: editFormData.profession.trim(),
        skills: editFormData.skills,
        experienceYears: editFormData.experienceYears,
        pricingType: editFormData.pricingType,
        pricingAmount: parsedPricingAmount,
        languages: editFormData.languages,
        about: editFormData.about.trim(),
      };

      const updatedUser = await updateSessionProfile(payload);
      if (!updatedUser) {
        alert("Failed to update profile");
        return;
      }

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setShowEditDialog(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile");
    }
  };

  const handleAvailabilityToggle = async () => {
    const nextValue = !isAvailable;
    setIsAvailable(nextValue);

    const updatedUser = await updateSessionProfile({ availability: nextValue });
    if (!updatedUser) {
      setIsAvailable(!nextValue);
      alert("Failed to update availability");
      return;
    }

    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    if (typeof updatedUser.availability === "boolean") {
      setIsAvailable(updatedUser.availability);
    }
  };

  const toggleSkill = (skill: string, checked: boolean) => {
    setEditFormData((prev) => ({
      ...prev,
      skills: checked
        ? [...prev.skills, skill]
        : prev.skills.filter((item) => item !== skill),
    }));
  };

  const toggleLanguage = (language: string, checked: boolean) => {
    setEditFormData((prev) => ({
      ...prev,
      languages: checked
        ? [...prev.languages, language]
        : prev.languages.filter((item) => item !== language),
    }));
  };

  const getDashboardActions = () => {
    if (user?.accountType === "contractor") {
      return [
        {
          icon: Briefcase,
          label: "My Jobs",
          description: "View and manage your posted jobs",
          color: "text-blue-600",
          action: () => router.push("/dashboard/jobs"),
        },
        {
          icon: Users,
          label: "Applications",
          description: "Review worker applications",
          color: "text-green-600",
          action: () => router.push("/dashboard/applications"),
        },
        {
          icon: Star,
          label: "Reviews",
          description: "View your ratings & reviews",
          color: "text-yellow-600",
          action: () => router.push("/dashboard/reviews"),
        },
        {
          icon: FileText,
          label: "Contracts",
          description: "Manage active contracts",
          color: "text-purple-600",
          action: () => router.push("/dashboard/contracts"),
        },
        {
          icon: Settings,
          label: "Settings",
          description: "Account & notification settings",
          color: "text-gray-600",
          action: () => router.push("/dashboard/settings"),
        },
      ];
    } else {
      // Worker account
      return [
        // {
        //   icon: Briefcase,
        //   label: "Available Work",
        //   description: "Browse and apply for jobs",
        //   color: "text-blue-600",
        //   action: () => router.push("/find-work"),
        // },
        {
          icon: Clock,
          label: "My Applications",
          description: "Track your job applications",
          color: "text-orange-600",
          action: () => router.push("/dashboard/my-applications"),
        },
        {
          icon: FileText,
          label: "Active Projects",
          description: "View your current projects",
          color: "text-green-600",
          action: () => router.push("/dashboard/projects"),
        },
        {
          icon: Star,
          label: "My Portfolio",
          description: "Showcase your work & reviews",
          color: "text-yellow-600",
          action: () => router.push("/dashboard/portfolio"),
        },
        {
          icon: Settings,
          label: "Settings",
          description: "Account & notification settings",
          color: "text-gray-600",
          action: () => router.push("/dashboard/settings"),
        },
      ];
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const actions = getDashboardActions();
  const workerProfileData = user as AuthUser & {
    profession?: string;
    skills?: string[];
    experienceYears?: number;
    pricingType?: PricingType;
    pricingAmount?: string | number;
    languages?: string[] | string;
    about?: string;
  };

  const workerPricingAmount =
    typeof workerProfileData.pricingAmount === "number" || typeof workerProfileData.pricingAmount === "string"
      ? String(workerProfileData.pricingAmount)
      : "";
  const workerPricingType = workerProfileData.pricingType || "hour";
  const workerPricingLabel = getPricingLabel(workerPricingType);

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-4xl">
      <div className="mb-8 space-y-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/40"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user.name}!</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="flex flex-col items-start gap-4 space-y-0 pb-6 bg-muted/20 sm:flex-row sm:items-center">
            <button
              type="button"
              className="relative group cursor-pointer self-center sm:self-auto"
              onClick={handleProfilePicClick}
              title="Click to manage profile picture"
            >
              {user?.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt="Profile"
                  className="h-20 w-20 rounded-full ring-4 ring-background object-cover transition-opacity group-hover:opacity-75 sm:h-24 sm:w-24"
                />
              ) : (
                <div className="transition-opacity group-hover:opacity-75">
                  <UserAvatar user={user} className="h-20 w-20 ring-4 ring-background sm:h-24 sm:w-24" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <Camera className="h-4 w-4" />
              </div>
            </button>
            <div className="w-full flex-1">
              <CardTitle className="text-center text-2xl sm:text-left">{user.name || "User"}</CardTitle>
              <div className="mt-2 flex items-center justify-center gap-2 flex-wrap sm:justify-start">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  {user.accountType === "contractor" ? "Business" : "Worker"}
                </span>
                <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
                  {user.activeRole}
                </span>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-1 sm:justify-start">
                  <MapPin className="h-4 w-4" />
                  {user.location || "Add location in profile"}
                </div>
              </div>

              {user.accountType === "worker" && (
                <div className="mt-4 space-y-3 rounded-lg border border-border/70 bg-background/70 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">Availability</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isAvailable ? "default" : "outline"}
                      className="w-full rounded-full sm:w-auto"
                      onClick={handleAvailabilityToggle}
                    >
                      {isAvailable ? "Available" : "Unavailable"}
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <BriefcaseBusiness className="h-4 w-4 text-primary" />
                      <span className="font-medium">Profession</span>
                    </div>
                    {workerProfileData.profession ? (
                      <span className="text-sm text-muted-foreground">{workerProfileData.profession}</span>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setShowEditDialog(true)}>
                        Add Profession
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="font-medium">Pricing</span>
                    </div>
                    {workerPricingAmount ? (
                      <span className="text-sm text-muted-foreground">INR {workerPricingAmount} {workerPricingLabel}</span>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setShowEditDialog(true)}>
                        Add Pricing
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Profile completion</span>
                      <span className="font-semibold text-foreground">{profileCompletion}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${profileCompletion}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 bg-muted/10">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setShowEditDialog(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <div className="hidden sm:block flex-1" />
            <Button
              variant="destructive"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </CardFooter>
        </Card>

        {/* Actions Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Card
                  key={action.label}
                  className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={action.action}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors`}>
                        <IconComponent className={`h-6 w-6 ${action.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm leading-tight">
                          {action.label}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Profile Picture Dialog */}
      <Dialog open={showPicDialog} onOpenChange={setShowPicDialog}>
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Manage Profile Picture</DialogTitle>
            <DialogDescription>
              Upload, change, or remove your profile picture
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {user?.profilePictureUrl && (
              <div className="flex justify-center">
                <img
                  src={user.profilePictureUrl}
                  alt="Current Profile"
                  className="h-32 w-32 rounded-full object-cover ring-2 ring-primary"
                />
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange}
              className="hidden"
            />

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    {user?.profilePictureUrl ? "Change Picture" : "Upload Picture"}
                  </>
                )}
              </Button>

              {user?.profilePictureUrl && (
                <Button
                  variant="destructive"
                  onClick={handleRemoveProfilePic}
                  disabled={uploading}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Picture
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
              <p>• Max file size: 5MB</p>
              <p>• Supported formats: JPG, PNG, GIF, WebP</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPicDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[92vh] w-[95vw] max-w-107.5 overflow-hidden p-0">
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle>Edit Worker Profile</DialogTitle>
            <DialogDescription>Keep your details updated to get better job matches.</DialogDescription>
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Profile completion</span>
                <span className="font-semibold text-foreground">{profileCompletion}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${profileCompletion}%` }} />
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[calc(92vh-170px)] space-y-4 overflow-y-auto px-4 py-4">
            <section className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Camera className="h-4 w-4" />
                Profile Photo
              </div>
              <div className="flex items-center gap-3">
                {user?.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <UserAvatar user={user} className="h-16 w-16" />
                )}
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload Photo"}
                  </Button>
                  {user?.profilePictureUrl && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                      onClick={handleRemoveProfilePic}
                      disabled={uploading}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>
            </section>
            <section className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4" />
                Basic Info
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  placeholder="Enter your location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={editFormData.phone} disabled readOnly />
              </div>
            </section>

            <section className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <BriefcaseBusiness className="h-4 w-4" />
                Profession
              </div>
              <Select
                value={editFormData.profession}
                onValueChange={(value) => setEditFormData({ ...editFormData, profession: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your profession" />
                </SelectTrigger>
                <SelectContent>
                  {professionOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            <section className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Hammer className="h-4 w-4" />
                Skills
              </div>
              <div className="flex flex-wrap gap-2">
                {skillOptions.map((skill) => (
                  <Button
                    key={skill}
                    type="button"
                    size="sm"
                    variant={editFormData.skills.includes(skill) ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => toggleSkill(skill, !editFormData.skills.includes(skill))}
                  >
                    {skill}
                  </Button>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4" />
                Experience
              </div>
              <div className="space-y-2">
                {experienceOptions.map((option) => (
                  <label key={option.label} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="experience"
                      checked={editFormData.experienceYears === option.value}
                      onChange={() => setEditFormData({ ...editFormData, experienceYears: option.value })}
                      className="h-4 w-4"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Wallet className="h-4 w-4" />
                Pricing
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={editFormData.pricingType === "hour" ? "default" : "outline"}
                  onClick={() => setEditFormData({ ...editFormData, pricingType: "hour" })}
                >
                  Per Hour
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={editFormData.pricingType === "day" ? "default" : "outline"}
                  onClick={() => setEditFormData({ ...editFormData, pricingType: "day" })}
                >
                  Per Day
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={editFormData.pricingType === "job" ? "default" : "outline"}
                  onClick={() => setEditFormData({ ...editFormData, pricingType: "job" })}
                >
                  Per Job
                </Button>
              </div>
              <Input
                value={editFormData.pricingAmount}
                onChange={(e) => setEditFormData({ ...editFormData, pricingAmount: e.target.value })}
                placeholder={getPricingPlaceholder(editFormData.pricingType)}
              />
            </section>

            

            <section className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Languages className="h-4 w-4" />
                Languages Spoken
              </div>
              <div className="grid grid-cols-2 gap-2">
                {languageOptions.map((language) => (
                  <label key={language} className="flex items-center gap-2 rounded-md border px-2 py-2 text-sm">
                    <Checkbox
                      checked={editFormData.languages.includes(language)}
                      onCheckedChange={(checked) => toggleLanguage(language, checked === true)}
                    />
                    <span>{language}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4" />
                About
              </div>
              <Textarea
                value={editFormData.about}
                onChange={(e) => setEditFormData({ ...editFormData, about: e.target.value })}
                placeholder="Write a short summary about your work and strengths"
                className="min-h-24"
              />
            </section>
          </div>

          <DialogFooter className="sticky bottom-0 border-t bg-background px-4 py-3">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleEditProfile} className="h-11 w-full text-base font-semibold sm:w-auto">
              <Check className="mr-2 h-4 w-4" />
              Save Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}