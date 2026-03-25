"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchSessionUser, AuthUser, logoutSession } from "@/lib/authClient";
import { UserAvatar } from "@/components/UserAvatar";
import { uploadProfilePicture, deleteProfilePicture } from "@/lib/cloudinaryUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  LogOut,
  Phone,
  MapPin,
  Edit,
  Camera,
  Trash2,
  Check,
  X,
  Briefcase,
  FileText,
  Settings,
  Clock,
  Users,
  Star,
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

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPicDialog, setShowPicDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: "", location: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await fetchSessionUser();
        if (!userData) {
          router.push("/en/login");
          return;
        }
        setUser(userData);
        setEditFormData({
          name: userData.name || "",
          location: userData.location || "",
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
    window.dispatchEvent(new Event("auth-changed"));
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
      // Update local storage
      const updatedUser = { ...user, ...editFormData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setShowEditDialog(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile");
    }
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
        {
          icon: Briefcase,
          label: "Available Work",
          description: "Browse and apply for jobs",
          color: "text-blue-600",
          action: () => router.push("/find-work"),
        },
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

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user.name}!</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-6 bg-muted/20">
            <div
              className="relative group cursor-pointer"
              onClick={handleProfilePicClick}
              title="Click to manage profile picture"
            >
              {user?.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt="Profile"
                  className="h-24 w-24 rounded-full ring-4 ring-background object-cover transition-opacity group-hover:opacity-75"
                />
              ) : (
                <div className="transition-opacity group-hover:opacity-75">
                  <UserAvatar user={user} className="h-24 w-24 ring-4 ring-background" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <Camera className="h-4 w-4" />
              </div>
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{user.name || "User"}</CardTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  {user.accountType === "contractor" ? "Business" : "Worker"}
                </span>
                <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
                  {user.activeRole}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {user.phone}
                </div>
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 bg-muted/10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <div className="flex-1" />
            <Button
              variant="destructive"
              size="sm"
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
        <DialogContent className="sm:max-w-[400px]">
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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                placeholder="Enter your full name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editFormData.location}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, location: e.target.value })
                }
                placeholder="Enter your location"
              />
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
              <p>Phone number is not editable as it's your account identifier.</p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProfile}>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}