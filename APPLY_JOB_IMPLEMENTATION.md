# Apply Job Feature Implementation Guide

## Overview
This implementation adds a complete "Apply Job" workflow for the VaaniKaam job marketplace, including:
- Worker side: Apply to jobs with a single click
- Contractor side: View applicants with masked phone numbers and reveal contact functionality
- Duplicate prevention: Prevent the same worker from applying to the same job twice
- UI feedback: Dynamic button states (Apply → Applied)

## Features Implemented

### 1. **Phone Masking Utility** (`client/lib/phoneMasking.ts`)
- `maskPhoneNumber(phone)`: Masks phone number to show only first 2 and last 4 digits
  - Example: `9876543210` → `98XXXX3210`
- `formatPhoneForDisplay(phone, masked)`: Formats phone with optional masking
- `isPhoneMasked(phone)`: Checks if phone is already masked

### 2. **Job Application API Utilities** (`client/lib/jobApplicationApi.ts`)
- `applyToJob(jobId)`: Submit job application
  - Handles duplicate applications (returns 409 error if already applied)
  - Returns application data
  
- `getContractorJobApplicants()`: Fetch all applicants for contractor's jobs
  
- `getJobApplicants(jobId)`: Fetch applicants for a specific job
  
- `updateApplicationStatus(applicationId, action)`: Accept/reject applications

### 3. **ApplyJobButton Component** (`client/components/ApplyJobButton.tsx`)
✨ Features:
- One-click job application
- Dynamic button state (Apply → Applied)
- Loading state with spinner
- Error handling with user-friendly messages
- Prevents duplicate clicks
- Callbacks: `onApplySuccess`, `onApplyError`

Props:
```typescript
interface ApplyJobButtonProps {
  jobId: string;
  onApplySuccess?: () => void;
  onApplyError?: (error: string) => void;
  isAlreadyApplied?: boolean;
}
```

### 4. **ApplicantsList Component** (`client/components/ApplicantsList.tsx`)
✨ Features:
- Display all applicants for a job
- **Masked phone numbers** by default (98XXXX3210)
- **"Reveal Contact" button** to toggle between masked/full phone
- Accept/Reject buttons for pending applications
- Status badges (Applied, Accepted, Rejected)
- Application date display
- Real-time status updates
- Error handling

Props:
```typescript
interface ApplicantsListProps {
  applicants: Applicant[];
  jobTitle?: string;
  applicationIds?: Record<string, string>; // Map of applicant ID to application ID
  onStatusUpdate?: () => void;
}
```

### 5. **Integration Points**

#### Project Listing Page (`client/app/[locale]/projects/page.tsx`)
- Imported `ApplyJobButton` component
- Replaced static "Accept Job" button with dynamic ApplyJobButton
- Shows "Applied" state for previously applied jobs
- Shows "Apply Now" button for new opportunities

#### Contractor Job Details (`client/app/[locale]/dashboard/contractor/[jobId]/page.tsx`)
- Imported `ApplicantsList` component
- Replaced manual applicant rendering with ApplicantsList
- Uses masked phone numbers for privacy
- Provides "Eye" icon to reveal/hide phone numbers
- Accept/Reject functionality for each applicant
- Real-time status updates after actions

## Backend Endpoints Used

All endpoints already exist in the backend:

1. **POST** `/api/jobs/apply`
   - Create application
   - Prevents duplicates with unique index
   - Returns: Application data

2. **GET** `/api/jobs/:jobId`
   - Fetch job details with all applications
   - Returns: Job with full applicant information

3. **PATCH** `/api/jobs/applications/:applicationId/:action`
   - Update application status (accept/reject)
   - Returns: Updated application

4. **GET** `/api/jobs/contractor/applications`
   - Fetch all applications for contractor's jobs
   - Returns: Array of applications

5. **GET** `/api/jobs/contractor/jobs`
   - Fetch contractor's jobs with applicant counts
   - Returns: Array of jobs with applications

## Workflow Diagrams

### Worker Applying to Job
```
1. Worker views job in Projects page
2. Clicks "Apply Now" button
3. ApplyJobButton component:
   - Shows "Applying..." state
   - Calls applyToJob(jobId)
   - Backend checks for duplicates
4. On success:
   - Button changes to "Applied"
   - Optional callback fired
5. On error:
   - Shows error message
   - Button remains "Apply Now"
```

### Contractor Viewing Applicants
```
1. Contractor navigates to job details
2. ApplicantsList component shows:
   - Masked phone numbers (98XXXX1234)
   - Worker name and location
   - Application status
3. Contractor can:
   - Click "Eye" icon to reveal full phone
   - Click "Accept" to accept applicant
   - Click "Reject" to reject applicant
4. After action:
   - Status updates in real-time
   - Phone toggle resets
5. All changes saved to database
```

## Usage Examples

### For Workers (Projects Page)
```tsx
import ApplyJobButton from "@/components/ApplyJobButton";

// In your job card:
<ApplyJobButton
  jobId={job._id}
  isAlreadyApplied={job.tab === "applied"}
  onApplySuccess={() => {
    // Refresh job list, show toast, etc.
  }}
  onApplyError={(error) => {
    console.log("Apply failed:", error);
  }}
/>
```

### For Contractors (Job Details)
```tsx
import ApplicantsList from "@/components/ApplicantsList";

// In your job details page:
<ApplicantsList
  applicants={applicants}
  jobTitle={job.title}
  applicationIds={applicationIdMap}
  onStatusUpdate={() => {
    // Refresh data
  }}
/>
```

## Error Handling

### Common Errors

1. **"You have already applied to this job"** (409)
   - Shown when worker tries to apply twice
   - Button remains disabled
   
2. **"Failed to apply to job"** (5xx)
   - Network or server error
   - User can retry
   
3. **"Application ID not found"**
   - Issue with component props
   - Check that applicationIds map is passed correctly

## Security Features

1. **Authentication**
   - All endpoints require valid auth token
   - Backend verifies user permissions

2. **Phone Privacy**
   - Phone numbers masked by default (98XXXX1234)
   - Only unmasked on explicit user action (click Eye icon)
   - Not stored in masked format, only displayed

3. **Duplicate Prevention**
   - Unique index on (jobId, workerId) in database
   - Prevents duplicate applications at DB level

4. **Authorization**
   - Workers can only apply if authenticated
   - Contractors can only see their own jobs' applicants
   - Contractors can only update applications for their jobs

## Testing Checklist

### Worker Side
- [ ] View projects page
- [ ] Click "Apply Now" button on a job
- [ ] Verify "Applied" state appears
- [ ] Attempt to apply again (should show error)
- [ ] Try applying to multiple jobs
- [ ] Check network requests in DevTools

### Contractor Side
- [ ] Navigate to job details page
- [ ] Verify applicants are listed
- [ ] Verify phone numbers are masked (98XXXX1234)
- [ ] Click Eye icon to reveal phone
- [ ] Verify full phone is shown
- [ ] Click Eye icon again to hide phone
- [ ] Click "Accept" on an applicant
- [ ] Verify status changes to "Accepted"
- [ ] Click "Reject" on another applicant
- [ ] Verify status changes to "Rejected"

### Edge Cases
- [ ] Apply with poor network (should show retry)
- [ ] Accept/Reject with poor network
- [ ] Apply as worker, check contractor view updates
- [ ] Multiple tabs open (sync issues?)

## Database Impact

Nothing changes in database schema - all uses existing structures:
- JobApplication model (already had unique index)
- User model
- Job model

## API Contract

Headers required:
```
Authorization: Bearer {token}
Content-Type: application/json
```

Typical flow:
1. Worker applies: `POST /api/jobs/apply` → Application created
2. Contractor views: `GET /api/jobs/{jobId}` → See applicants
3. Contractor accepts: `PATCH /api/jobs/applications/{appId}/accept` → Status updated

## Future Enhancements

Possible improvements beyond this scope:
- [ ] Email notifications when applicant joins/leaves
- [ ] Bulk actions (accept/reject multiple)
- [ ] Applicant search/filter
- [ ] Ratings/reviews after job completion
- [ ] Favorites/saved jobs for workers
- [ ] Application withdrawal by worker
- [ ] WhatsApp integration for contact reveal

## Files Modified/Created

### New Files Created:
1. `client/lib/phoneMasking.ts` - Phone masking utilities
2. `client/lib/jobApplicationApi.ts` - API utilities
3. `client/components/ApplyJobButton.tsx` - Apply button with state
4. `client/components/ApplicantsList.tsx` - Applicants list with reveal contact

### Files Modified:
1. `client/app/[locale]/projects/page.tsx` - Added ApplyJobButton import and usage
2. `client/app/[locale]/dashboard/contractor/[jobId]/page.tsx` - Added ApplicantsList import and usage

## Version Info
- **Created**: April 12, 2026
- **Framework**: Next.js 14+ (App Router, TypeScript, TailwindCSS)
- **Icons**: Lucide React
- **UI Components**: Custom shadcn/ui components
- **Backend**: Express.js with MongoDB

