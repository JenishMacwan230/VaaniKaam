# Cloudinary Integration Setup Guide

This document explains how to set up Cloudinary for storing and managing user profile pictures in the VaaniKaam application.

## What Has Been Implemented

✅ **Frontend**
- `cloudinaryUtils.ts` - Utility functions for uploading and managing profile pictures
- Updated `DashboardPage.tsx` - Uses Cloudinary for profile picture upload/deletion
- Updated `UserAvatar.tsx` - Displays Cloudinary profile pictures
- Cloudinary environment variables in `.env.local`

✅ **Backend**
- Updated `User` model - Added `profilePictureUrl` and `profilePicturePublicId` fields
- New API endpoints:
  - `POST /api/users/profile-picture` - Save profile picture URL
  - `DELETE /api/users/profile-picture` - Delete profile picture
- Cloudinary environment variables in `.env`

✅ **Dependencies**
- `next-cloudinary@6.17.5` - Already installed

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click "Sign Up for Free"
3. Complete the registration process
4. Verify your email

### 2. Get Cloudinary Credentials

1. Log in to your Cloudinary Dashboard
2. Go to **Account Details** (top-right corner → Account)
3. Copy the following values:
   - **Cloud Name** - e.g., `djzxxxxxx`
   - **API Key** - e.g., `123456789012345`
   - **API Secret** - e.g., `xxxxxxxxxxxxxxxxxxxxxxxx`

### 3. Create an Upload Preset

Upload presets allow client-side uploads without exposing API keys.

1. Go to **Settings** (bottom-left gear icon)
2. Click the **Upload** tab
3. Scroll to **Upload presets** section
4. Click **Add upload preset**
5. Configure:
   - **Preset Name**: `vaanikaam_profiles` (or your preferred name)
   - **Unsigned**: Toggle to **ON**
   - **Folder**: `vaanikaam/profiles` (optional, helps organize images)
6. Click **Save**
7. Copy the **Preset Name**

### 4. Update Environment Variables

#### Client Environment (.env.local)

Update `d:\WebDev\VaaniKaam\client\.env.local`:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name
```

**Example:**
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=djzxxxxx
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=vaanikaam_profiles
```

#### Server Environment (.env)

Update `d:\WebDev\VaaniKaam\server\.env`:

```env
# Cloudinary Configuration (for server-side image deletion)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=djzxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Restart Your Application

After updating environment variables:

```bash
# Kill and restart the client dev server
# Kill and restart the server dev server
```

## How It Works

### Image Upload Flow

1. **User Action**: User clicks their profile picture or "Upload Picture" button in Dashboard
2. **Browser**: Opens file picker, user selects image
3. **Validation**: File is validated (size < 5MB, is an image)
4. **Upload to Cloudinary**: 
   - Image sent to Cloudinary using the upload preset
   - Cloudinary returns secure URL and public ID
5. **Save to Database**: 
   - URL and public ID sent to backend
   - Backend saves to user profile in MongoDB
6. **Display**: 
   - Dashboard shows the uploaded image
   - UserAvatar in Navbar and MobilePageHeader displays it
   - Profile picture persists across sessions

### Image Deletion Flow

1. **User Action**: User clicks "Remove Picture" in Dashboard
2. **Backend**: Deletes image from Cloudinary using public ID
3. **Database**: Clears profilePictureUrl and publicId from user profile
4. **Display**: Avatar reverts to showing user initials

## Features

### Automatic Image Optimization
Images uploaded to Cloudinary are automatically:
- Resized and cropped
- Optimized for web (reduced file size)
- Delivered via CDN (fast globally)
- Cached for performance

### Validation
- **File Size**: Max 5MB
- **File Types**: JPG, PNG, GIF, WebP
- **Folder Organization**: `vaanikaam/profiles/{userId}`

### Storage Location
- **Profile Picture URL**: User document field `profilePictureUrl`
- **Cloudinary Public ID**: User document field `profilePicturePublicId` (needed for deletion)

## API Endpoints

### Save Profile Picture
```
POST /api/users/profile-picture
Content-Type: application/json
Cookie: authToken=...

{
  "profilePictureUrl": "https://res.cloudinary.com/...",
  "publicId": "vaanikaam/profiles/user123/image"
}

Response:
{
  "message": "Profile picture saved successfully",
  "user": { /* updated user object */ }
}
```

### Delete Profile Picture
```
DELETE /api/users/profile-picture
Content-Type: application/json
Cookie: authToken=...

{
  "publicId": "vaanikaam/profiles/user123/image"
}

Response:
{
  "message": "Profile picture deleted successfully",
  "user": { /* updated user object */ }
}
```

## File Structure

### Frontend
- `client/lib/cloudinaryUtils.ts` - Upload/delete functions
- `client/components/UserAvatar.tsx` - Avatar display component
- `client/app/[locale]/dashboard/page.tsx` - Profile management
- `client/.env.local` - Client configuration

### Backend
- `server/src/models/User.ts` - User model with profile picture fields
- `server/src/controllers/userController.ts` - Upload/delete handlers
- `server/src/routes/users.ts` - API endpoints
- `server/.env` - Server configuration

## Testing

### Manual Test Checklist
- [ ] Upload a profile picture → Should appear in Dashboard
- [ ] Picture appears in Navbar UserMenu → Desktop view
- [ ] Picture appears in MobilePageHeader → Mobile view
- [ ] Change profile picture → Old picture replaced
- [ ] Remove profile picture → Avatar shows user initials
- [ ] Log out and log back in → Picture persists

### Debugging
1. **Check browser console** for upload errors
2. **Check Network tab** in DevTools for failed requests
3. **Verify environment variables** are set
4. **Check Cloudinary Dashboard** to see uploaded images
5. **Backend logs** should show profile picture operations

## Troubleshooting

### Upload Fails with "Cloudinary is not properly configured"
- Verify `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` are set in `client/.env.local`
- Restart the development server

### Upload Succeeds but Image Doesn't Display
- Check if the returned URL is valid (copy to browser address bar)
- Verify the URL is stored in user profile (check MongoDB)
- Check if CORS issues in browser console

### Can't Delete Profile Picture
- Verify `CLOUDINARY_API_SECRET` is set in `server/.env`
- Check server logs for deletion errors
- Verify the publicId is stored correctly in MongoDB

### Images Appear Broken After Some Time
- Cloudinary free tier has storage limits
- Upgrade plan if hitting limits
- Check for API quota exceeded errors

## Security Notes

1. **Upload Preset is Unsigned** - This is safe for client-side uploads
2. **API Secret is Server-Only** - Never expose in client code
3. **Folder Structure** - Images organized by userId prevents conflicts
4. **File Validation** - Both client and server validate uploads

## Performance Optimization

### Current Implementation
- Images stored on Cloudinary CDN
- Auto-format and auto-quality applied
- Thumbnail versions created automatically

### Future Enhancements
- Add image cropping before upload
- Implement progressive image loading
- Add image compression on client-side
- Cache profile pictures locally

## Documentation Links

- [Cloudinary API Docs](https://cloudinary.com/documentation/image_upload_api)
- [Next.js Cloudinary Integration](https://cloudinary.com/documentation/next_js_integration)
- [Upload Presets](https://cloudinary.com/documentation/upload_presets)

## Support

For issues:
1. Check this guide's Troubleshooting section
2. Review Cloudinary Dashboard for image status
3. Check MongoDB for user profile data
4. Review browser/server console logs
