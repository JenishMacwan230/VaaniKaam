/**
 * Cloudinary Upload Utility for Profile Pictures
 * This utility handles uploading and managing profile pictures on Cloudinary
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export interface CloudinaryUploadResponse {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

/**
 * Upload a profile picture to Cloudinary
 * @param file - The image file to upload
 * @param userId - The user ID for organization
 * @returns Promise with upload result
 */
export async function uploadProfilePicture(
  file: File,
  userId: string
): Promise<CloudinaryUploadResponse> {
  try {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      console.error("Cloudinary credentials not configured");
      return {
        success: false,
        error: "Cloudinary is not properly configured. Please set environment variables.",
      };
    }

    // Validate file
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "Please select an image file",
      };
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      return {
        success: false,
        error: "File size must be less than 5MB",
      };
    }

    // Create FormData for upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", `vaanikaam/profiles/${userId}`);
    formData.append("resource_type", "auto");

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || "Upload failed",
      };
    }

    const data = await response.json();

    // Save profile picture URL to backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    if (API_URL) {
      try {
        await fetch(`${API_URL}/api/users/profile-picture`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profilePictureUrl: data.secure_url,
            publicId: data.public_id,
          }),
        });
      } catch (error) {
        console.warn("Failed to save profile picture URL to backend", error);
        // Continue anyway - the URL is still usable from Cloudinary
      }
    }

    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
    };
  } catch (error) {
    console.error("Profile picture upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete a profile picture from Cloudinary
 * Requires server-side API call for security (API secret needed)
 * @param publicId - The Cloudinary public ID of the image
 * @returns Promise indicating success or failure
 */
export async function deleteProfilePicture(publicId: string): Promise<boolean> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  if (!API_URL) {
    console.error("API URL not configured");
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/users/profile-picture`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicId,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to delete profile picture:", error);
    return false;
  }
}

/**
 * Generate an optimized Cloudinary image URL
 * @param imageUrl - The Cloudinary image URL
 * @param width - Optional width for resizing
 * @param height - Optional height for resizing
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  width?: number,
  height?: number
): string {
  if (!imageUrl) return "";

  // If it's already a Cloudinary URL, we can optimize it
  if (imageUrl.includes("cloudinary.com")) {
    // Extract the upload part and insert transformations
    const parts = imageUrl.split("/upload/");
    if (parts.length === 2) {
      const transformations = [];

      if (width && height) {
        transformations.push(`w_${width},h_${height},c_fill`);
      } else if (width) {
        transformations.push(`w_${width},c_limit`);
      } else if (height) {
        transformations.push(`h_${height},c_limit`);
      }

      transformations.push("q_auto,f_auto"); // Auto quality and format

      return `${parts[0]}/upload/${transformations.join(",")}/${parts[1]}`;
    }
  }

  return imageUrl;
}
