"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fetchSessionUser, AuthUser, updateSessionProfile, resolveAccountType } from "@/lib/authClient";
import { uploadProfilePicture, deleteProfilePicture } from "@/lib/cloudinaryUtils";
import { normalizeLocationWithCache } from "@/lib/locationNormalizer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MapPin,
  Save,
  X,
  Plus,
  Trash2,
  Briefcase,
  FileText,
  Languages,
  User,
  Camera,
  ArrowLeft,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_PROFILE_PICTURE = "/default-avatar.png";
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

function getPricingLabel(pricingType: PricingType): string {
  if (pricingType === "hour") return "per hour";
  if (pricingType === "day") return "per day";
  return "per job";
}

export default function ProfilePage() {
  const skillOptions = [
    "Tile Work",
    "Plumbing",
    "Wiring",
    "POP Work",
    "Waterproofing",
    "Painting",
    "Furniture Fitting",
    "Site Cleaning",
    "Carpentry",
    "Welding",
    "Concrete Work",
    "Masonry",
  ];

  const professionOptions = [
    "Mason",
    "Carpenter",
    "Plumber",
    "Electrician",
    "Painter",
    "Welder",
    "General Labor",
    "Contractor",
    "Builder",
    "Architect",
  ];

  const languageOptions = [
    "Gujarati",
    "Hindi",
    "English",
  ];

  const experienceOptions = [
    { label: "Fresher", value: 0 },
    { label: "1-3 years", value: 2 },
    { label: "3-5 years", value: 4 },
    { label: "5+ years", value: 6 },
  ];

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const [showPicDialog, setShowPicDialog] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [isNormalizingLocation, setIsNormalizingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    location: "",
    normalizedLocation: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    profession: "",
    skills: [] as string[],
    languages: [] as string[],
    about: "",
    experienceYears: 2,
    pricingType: "hour" as PricingType,
    pricingAmount: "",
  });
  const router = useRouter();
  const accountType = resolveAccountType(user);

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPic(true);
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

      const updatedUser = {
        ...user,
        profilePictureUrl: result.url,
        profilePicturePublicId: result.publicId,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      // Notify other components (like Navbar) to refresh session user
      if (globalThis.window !== undefined) {
        globalThis.dispatchEvent(new Event("auth-changed"));
      }
      alert("Profile picture updated successfully!");
      setShowPicDialog(false);
    } catch (error) {
      console.error("Failed to upload profile picture", error);
      alert("Failed to upload profile picture");
    } finally {
      setUploadingPic(false);
    }
  };

  const handleRemoveProfilePic = async () => {
    setUploadingPic(true);
    try {
      if (user?.profilePicturePublicId) {
        const deleted = await deleteProfilePicture(user.profilePicturePublicId);
        if (!deleted) {
          console.warn("Failed to delete profile picture from Cloudinary");
        }
      }

      const updatedUser = {
        ...user,
        profilePictureUrl: undefined,
        profilePicturePublicId: undefined,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      if (globalThis.window !== undefined) {
        globalThis.dispatchEvent(new Event("auth-changed"));
      }
      setShowPicDialog(false);
      alert("Profile picture removed successfully!");
    } catch (error) {
      console.error("Failed to remove profile picture", error);
      alert("Failed to remove profile picture");
    } finally {
      setUploadingPic(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await fetchSessionUser();
        if (!userData) {
          router.push("/en/login");
          return;
        }

        setUser(userData);

        const userLanguages = (userData as unknown as Record<string, unknown>).languages;
        const normalizedLanguages = normalizeLanguages(userLanguages);

        setEditFormData({
          name: userData.name || "",
          location: userData.location || "",
          normalizedLocation: userData.normalizedLocation || "",
          latitude: typeof userData.latitude === "number" ? userData.latitude : undefined,
          longitude: typeof userData.longitude === "number" ? userData.longitude : undefined,
          profession: (userData as unknown as Record<string, string>).profession || "",
          skills: ((userData as unknown as Record<string, unknown>).skills as string[]) || [],
          languages: normalizedLanguages,
          about: (userData as unknown as Record<string, string>).about || "",
          experienceYears: Number((userData as unknown as Record<string, unknown>).experienceYears || 2),
          pricingType: ((userData as unknown as Record<string, PricingType>).pricingType || "hour"),
          pricingAmount: typeof (userData as unknown as Record<string, unknown>).pricingAmount === "number"
            || typeof (userData as unknown as Record<string, unknown>).pricingAmount === "string"
            ? String((userData as unknown as Record<string, unknown>).pricingAmount)
            : "",
        });
      } catch (error) {
        console.error("Failed to load user", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [router]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !editFormData.skills.includes(newSkill.trim())) {
      setEditFormData({
        ...editFormData,
        skills: [...editFormData.skills, newSkill.trim()],
      });
      setNewSkill("");
      setShowSkillDialog(false);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditFormData({
      ...editFormData,
      skills: editFormData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  const handleLanguageToggle = (language: string) => {
    setEditFormData({
      ...editFormData,
      languages: editFormData.languages.includes(language)
        ? editFormData.languages.filter((lang) => lang !== language)
        : [...editFormData.languages, language],
    });
  };

  const normalizeProfileLocation = async (): Promise<boolean> => {
    const locationInput = editFormData.location.trim();

    if (!locationInput) {
      setLocationError("City/Location is required");
      return false;
    }

    try {
      setIsNormalizingLocation(true);
      const normalized = await normalizeLocationWithCache(locationInput);

      if (!normalized.isValid) {
        setLocationError(
          normalized.error || `"${locationInput}" not found. Please enter a valid location.`
        );
        return false;
      }

      setEditFormData((prev) => ({
        ...prev,
        normalizedLocation: normalized.standardizedName,
        latitude: normalized.latitude,
        longitude: normalized.longitude,
      }));
      setLocationError("");
      return true;
    } catch (error) {
      console.error("Failed to normalize profile location", error);
      setLocationError("Location verification failed. Please try again.");
      return false;
    } finally {
      setIsNormalizingLocation(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editFormData.name.trim()) {
      alert("Name is required");
      return;
    }
    if (!editFormData.location.trim()) {
      alert("City/Location is required");
      return;
    }

    const hasLocationData = Boolean(
      editFormData.normalizedLocation
      && typeof editFormData.latitude === "number"
      && typeof editFormData.longitude === "number"
    );

    if (!hasLocationData) {
      const isLocationValid = await normalizeProfileLocation();
      if (!isLocationValid) {
        alert("Please enter a valid location before saving your profile.");
        return;
      }
    }

    setSaving(true);
    try {
      const parsedPricingAmount: number | "" = editFormData.pricingAmount.trim() === ""
        ? ""
        : Number(editFormData.pricingAmount);

      if (parsedPricingAmount !== "" && Number.isNaN(parsedPricingAmount)) {
        alert("Please enter a valid pricing amount");
        setSaving(false);
        return;
      }

      const payload = {
        name: editFormData.name.trim(),
        location: editFormData.location.trim(),
        normalizedLocation: editFormData.normalizedLocation.trim(),
        latitude: editFormData.latitude,
        longitude: editFormData.longitude,
        profession: editFormData.profession.trim(),
        skills: editFormData.skills,
        languages: editFormData.languages,
        about: editFormData.about.trim(),
        experienceYears: editFormData.experienceYears,
        pricingType: editFormData.pricingType,
        pricingAmount: parsedPricingAmount,
      };

      const updatedUser = await updateSessionProfile(payload);
      if (updatedUser) {
        setUser(updatedUser);
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-secondary dark:text-emerald-400" />
      </div>
    );
  }

  let locationStatusText = "Location will be normalized and coordinates saved.";
  if (isNormalizingLocation) {
    locationStatusText = "Verifying location...";
  } else if (editFormData.normalizedLocation) {
    locationStatusText = `Normalized: ${editFormData.normalizedLocation}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 lg:pb-8">
      {/* Page Header with Profile Picture */}
      <div className="border-b bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="mt-4 flex items-start justify-between">
            <div className="flex items-end gap-4">
              {/* Profile Picture */}
              <div className="relative">
                <div className="h-24 w-24 rounded-full border-4 border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Image
                    src={user?.profilePictureUrl || DEFAULT_PROFILE_PICTURE}
                    alt={user?.name || "Profile"}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  onClick={() => setShowPicDialog(true)}
                  className="absolute bottom-0 right-0 bg-secondary hover:bg-secondary/90 text-white p-2 rounded-full shadow-lg dark:bg-emerald-600 dark:hover:bg-emerald-700"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              {/* Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user?.name || "Your Profile"}</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {accountType === "contractor" ? "Contractor Account" : "Worker Account"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Overview */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium dark:text-gray-300">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Location/City */}
            <div>
              <Label htmlFor="location" className="text-sm font-medium dark:text-gray-300 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                City/Location
              </Label>
              <Input
                id="location"
                placeholder="Enter your city"
                value={editFormData.location}
                onChange={(e) => {
                  setEditFormData({
                    ...editFormData,
                    location: e.target.value,
                    normalizedLocation: "",
                    latitude: undefined,
                    longitude: undefined,
                  });
                  if (locationError) {
                    setLocationError("");
                  }
                }}
                onBlur={() => {
                  void normalizeProfileLocation();
                }}
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {locationStatusText}
              </p>
              {typeof editFormData.latitude === "number" && typeof editFormData.longitude === "number" && (
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  Coordinates: {editFormData.latitude.toFixed(4)}, {editFormData.longitude.toFixed(4)}
                </p>
              )}
              {locationError && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{locationError}</p>
              )}
            </div>

            {/* About */}
            <div>
              <Label htmlFor="about" className="text-sm font-medium dark:text-gray-300 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                About You
              </Label>
              <Textarea
                id="about"
                placeholder="Tell us about yourself, your experience, and what you specialize in..."
                value={editFormData.about}
                onChange={(e) => setEditFormData({ ...editFormData, about: e.target.value })}
                rows={4}
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Profession */}
            <div>
              <Label htmlFor="profession" className="text-sm font-medium dark:text-gray-300 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Profession
              </Label>
              <Select value={editFormData.profession} onValueChange={(value) => setEditFormData({ ...editFormData, profession: value })}>
                <SelectTrigger id="profession" className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Select profession" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {professionOptions.map((prof) => (
                    <SelectItem key={prof} value={prof} className="dark:text-white">
                      {prof}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Skills Section - Only for Workers */}
        {accountType === "worker" && (
          <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Briefcase className="h-5 w-5" />
                  Skills
                </CardTitle>
                <Button
                  onClick={() => setShowSkillDialog(true)}
                  size="sm"
                  className="bg-secondary text-white hover:bg-secondary/90 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Skill
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editFormData.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {editFormData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-2 text-sm dark:bg-emerald-900 dark:text-emerald-100">
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No skills added yet. Click "Add Skill" to get started.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Languages Section */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Languages className="h-5 w-5" />
              Languages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {languageOptions.map((language) => (
                <div key={language} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={language}
                    checked={editFormData.languages.includes(language)}
                    onChange={() => handleLanguageToggle(language)}
                    className="h-4 w-4 text-secondary dark:text-emerald-400 rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                  <Label htmlFor={language} className="cursor-pointer dark:text-gray-300">
                    {language}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Experience and Pricing Section - Only for Workers */}
        {accountType === "worker" && (
          <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Experience & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Experience */}
              <div>
                <Label htmlFor="experience" className="text-sm font-medium dark:text-gray-300">Experience</Label>
                <Select
                  value={String(editFormData.experienceYears)}
                  onValueChange={(value) => setEditFormData({ ...editFormData, experienceYears: Number(value) })}
                >
                  <SelectTrigger id="experience" className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                    {experienceOptions.map((exp) => (
                      <SelectItem key={exp.value} value={String(exp.value)} className="dark:text-white">
                        {exp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pricing Type */}
              <div>
                <Label htmlFor="pricingType" className="text-sm font-medium dark:text-gray-300">Pricing Type</Label>
                <Select
                  value={editFormData.pricingType}
                  onValueChange={(value) => setEditFormData({ ...editFormData, pricingType: value as PricingType })}
                >
                  <SelectTrigger id="pricingType" className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="Select pricing type" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectItem value="hour" className="dark:text-white">Per Hour</SelectItem>
                    <SelectItem value="day" className="dark:text-white">Per Day</SelectItem>
                    <SelectItem value="job" className="dark:text-white">Per Job</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pricing Amount */}
              <div>
                <Label htmlFor="pricingAmount" className="text-sm font-medium dark:text-gray-300">
                  Amount ({getPricingLabel(editFormData.pricingType)})
                </Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400">₹</span>
                  <Input
                    id="pricingAmount"
                    type="number"
                    placeholder="0"
                    value={editFormData.pricingAmount}
                    onChange={(e) => setEditFormData({ ...editFormData, pricingAmount: e.target.value })}
                    className="pl-8 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleSaveProfile}
            disabled={saving || loading}
            className="bg-secondary text-white hover:bg-secondary/90 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Add Skill Dialog */}
      <Dialog open={showSkillDialog} onOpenChange={setShowSkillDialog}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Add a Skill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newSkill" className="text-sm font-medium dark:text-gray-300">Select or Enter Skill</Label>
              <Select value={newSkill} onValueChange={setNewSkill}>
                <SelectTrigger id="newSkill" className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Choose a skill" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {skillOptions
                    .filter((skill) => !editFormData.skills.includes(skill))
                    .map((skill) => (
                      <SelectItem key={skill} value={skill} className="dark:text-white">
                        {skill}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Or type a custom skill:</p>
              <Input
                placeholder="Type custom skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSkillDialog(false)}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSkill}
              disabled={!newSkill.trim()}
              className="bg-secondary text-white hover:bg-secondary/90 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              Add Skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Picture Dialog */}
      <Dialog open={showPicDialog} onOpenChange={setShowPicDialog}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Update Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current Picture Preview (shows default if no custom picture) */}
            <div className="flex justify-center">
              <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                <Image
                  src={user?.profilePictureUrl || DEFAULT_PROFILE_PICTURE}
                  alt={user?.name || "Profile"}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* File Input */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPic}
                className="w-full bg-secondary text-white hover:bg-secondary/90 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                {uploadingPic ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    {user?.profilePictureUrl ? "Change Picture" : "Upload Picture"}
                  </>
                )}
              </Button>
            </div>

            {/* Remove Button */}
            {user?.profilePictureUrl && (
              <Button
                onClick={handleRemoveProfilePic}
                disabled={uploadingPic}
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 dark:border-gray-600 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Picture
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPicDialog(false)}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
