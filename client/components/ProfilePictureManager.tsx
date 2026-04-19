"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { uploadProfilePicture, deleteProfilePicture } from "@/lib/cloudinaryUtils";
import type { AuthUser } from "@/lib/authClient";

const DEFAULT_PROFILE_PICTURE = "/default-avatar.png";

type ProfilePictureManagerProps = {
  user: AuthUser | null;
  onUserUpdate: (user: AuthUser) => void;
  buttonClassName?: string;
  imageClassName?: string;
  size?: number;
};

export function ProfilePictureManager({
  user,
  onUserUpdate,
  buttonClassName,
  imageClassName,
  size = 96,
}: ProfilePictureManagerProps) {
  const [showPicDialog, setShowPicDialog] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onUserUpdate(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
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

      if (!user) return;

      const updatedUser = {
        ...user,
        profilePictureUrl: undefined,
        profilePicturePublicId: undefined,
      };
      onUserUpdate(updatedUser);
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

  const resolvedSize = Math.max(48, size);
  const initials = user?.name
    ? user.name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2)
    : "U";
  const hasProfilePicture = Boolean(user?.profilePictureUrl);

  return (
    <>
      <div className="relative">
        <div
          className="rounded-full border-4 border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
          style={{ height: resolvedSize, width: resolvedSize }}
        >
          {hasProfilePicture ? (
            <Image
              src={user?.profilePictureUrl || DEFAULT_PROFILE_PICTURE}
              alt={user?.name || "Profile"}
              width={resolvedSize}
              height={resolvedSize}
              className={imageClassName || "h-full w-full object-cover"}
            />
          ) : (
            <div className="h-full w-full rounded-full bg-gradient-to-br from-emerald-500/80 via-teal-500/80 to-cyan-500/80 flex items-center justify-center">
              <span
                className="font-semibold text-white"
                style={{ fontSize: Math.max(14, Math.floor(resolvedSize / 2.8)) }}
              >
                {initials}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowPicDialog(true)}
          className={
            buttonClassName
            || "absolute bottom-0 right-0 bg-secondary hover:bg-secondary/90 text-white p-2 rounded-full shadow-lg dark:bg-emerald-600 dark:hover:bg-emerald-700"
          }
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      <Dialog open={showPicDialog} onOpenChange={setShowPicDialog}>
        <DialogContent
          showCloseButton={false}
          className="bg-white/70 dark:bg-gray-950/60 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-900/30 shadow-lg shadow-emerald-500/10"
        >
          <DialogHeader>
            <DialogTitle className="text-emerald-900 dark:text-emerald-100">Update Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="h-32 w-32 rounded-full overflow-hidden border-2 border-emerald-300/70 dark:border-emerald-900/40 bg-white/80 dark:bg-gray-900/70 flex items-center justify-center"
              >
                {hasProfilePicture ? (
                  <Image
                    src={user?.profilePictureUrl || DEFAULT_PROFILE_PICTURE}
                    alt={user?.name || "Profile"}
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-emerald-500/80 via-teal-500/80 to-cyan-500/80 flex items-center justify-center">
                    <span className="text-3xl font-semibold text-white">
                      {initials}
                    </span>
                  </div>
                )}
              </button>
            </div>

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
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700"
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

            {user?.profilePictureUrl && (
              <Button
                onClick={handleRemoveProfilePic}
                disabled={uploadingPic}
                variant="outline"
                className="w-full border-rose-200/70 text-rose-600 hover:text-rose-700 hover:bg-rose-50/70"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Picture
              </Button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowPicDialog(false)}
            className="absolute right-4 top-4 h-11 w-11 rounded-full bg-white/90 text-red-600 shadow-md hover:bg-white"
            aria-label="Close"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent showCloseButton={false} className="bg-transparent border-0 shadow-none p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Profile picture preview</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <div className="min-h-[220px] min-w-[220px] overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur flex items-center justify-center">
              {hasProfilePicture ? (
                <Image
                  src={user?.profilePictureUrl || DEFAULT_PROFILE_PICTURE}
                  alt={user?.name || "Profile"}
                  width={420}
                  height={420}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-emerald-500/80 via-teal-500/80 to-cyan-500/80 flex items-center justify-center">
                  <span className="text-5xl font-semibold text-white">
                    {initials}
                  </span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
