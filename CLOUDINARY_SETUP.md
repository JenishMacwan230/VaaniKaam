# VaaniKaam - Cloudinary Setup Guide

## Cloudinary Integration for Profile Pictures

This guide helps you set up Cloudinary for managing profile pictures in VaaniKaam.

### 📋 Prerequisites

- Cloudinary account (https://cloudinary.com/users/register/free)
- Node.js and npm/pnpm installed

### 🚀 Step 1: Get Cloudinary Credentials

1. Log in to [Cloudinary Console](https://console.cloudinary.com)
2. Go to **Dashboard** to find your credentials:
   - **Cloud Name**: Displayed at the top of dashboard
   - **API Key**: Found in account settings
   - **API Secret**: Found in account settings

3. (Optional) Create an **Upload Preset**:
   - Go to **Settings → Upload**
   - Scroll to "Upload presets"
   - Create an unsigned upload preset (for client-side uploads)
   - Name it (e.g., `vaanikaam-profile-unsigned`)

### 🔧 Step 2: Configure Environment Variables

#### Server Setup (`server/.env`)

Copy `server/.env.example` to `server/.env`:

```bash
cp server/.env.example server/.env
```

Fill in your Cloudinary credentials:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Client Setup (`client/.env.local`)

Copy `client/.env.local.example` to `client/.env.local`:

```bash
cp client/.env.local.example client/.env.local
```

Fill in your Cloudinary public credentials:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name
```

### 📦 Step 3: Install Dependencies

#### Server
```bash
cd server
pnpm install cloudinary
```

#### Client
```bash
cd client
pnpm install cloudinary next-cloudinary
```

### 💻 Step 4: Initialize Cloudinary

In your server's main file (`server/src/index.ts`), add:

```typescript
import { initializeCloudinary } from "./config/cloudinary";

// Initialize Cloudinary
initializeCloudinary();
```

### 🎨 Step 5: Use in Your Application

#### Server-side Upload (from file buffer)

```typescript
import { uploadProfilePicture, deleteProfilePicture } from "./utils/cloudinaryUtils";

// Upload
const result = await uploadProfilePicture(fileBuffer, userId, fileName);
if (result.success) {
  console.log("Uploaded to:", result.url);
  console.log("Public ID:", result.publicId);
}

// Delete
await deleteProfilePicture(publicId);

// Get signature for client-side uploads
const sig = await getUploadSignature();
```

#### Client-side Upload

```typescript
import { getOptimizedProfileUrl, getProfileThumbnailUrl } from "@/lib/cloudinary";

// Get optimized URL
const profileUrl = getOptimizedProfileUrl(publicId);

// Get thumbnail
const thumbUrl = getProfileThumbnailUrl(publicId);
```

### 📁 Folder Structure

All profile pictures are stored under:
```
vaanikaam/profile-pictures/
├── [userId]-profile (original)
```

### 🔒 Security Notes

- **API Secret**: Keep this secret! Only use on server-side.
- **Upload Preset**: Can be unsigned for client-side uploads.
- **Signed Uploads**: Use `getUploadSignature()` for more control over uploads.

### 🧹 Cleanup

To delete old profile pictures when users update:

```typescript
// Delete old picture
if (oldPublicId) {
  await deleteProfilePicture(oldPublicId);
}

// Upload new picture
const newResult = await uploadProfilePicture(newFile, userId, fileName);
```

### 🆘 Troubleshooting

**"Missing Cloudinary environment variables"**
- Check that all three environment variables are set in `.env`
- Restart your development server

**"Unauthorized upload"**
- Verify API Key and API Secret are correct
- Check that the upload preset exists (for unsigned uploads)

**Images not loading**
- Verify Cloud Name is correct
- Check CORS settings in Cloudinary dashboard

### 📚 Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Image Transformation Guide](https://cloudinary.com/documentation/image_transformation_reference)
