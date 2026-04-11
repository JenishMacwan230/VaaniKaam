/**
 * Job application API utilities
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface JobApplicationData {
  _id: string;
  jobId: string;
  workerId: string;
  status: "applied" | "accepted" | "rejected" | "completion_pending" | "completed";
  createdAt: string;
  updatedAt: string;
}

interface ApplicantData {
  _id: string;
  jobId: string;
  workerId: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    proficiency?: string;
    location?: string;
  };
  status: "applied" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

/**
 * Apply to a job
 */
export async function applyToJob(jobId: string): Promise<JobApplicationData> {
  if (!API_BASE_URL) {
    throw new Error("API configuration missing");
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("firebaseToken") || localStorage.getItem("token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/jobs/apply`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ jobId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 409) {
      throw new Error("You have already applied to this job");
    }

    throw new Error(errorData.message || `Failed to apply to job (${response.status})`);
  }

  const data = await response.json();
  return data.application;
}

/**
 * Get all applicants for jobs posted by contractor
 */
export async function getContractorJobApplicants(): Promise<ApplicantData[]> {
  if (!API_BASE_URL) {
    throw new Error("API configuration missing");
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("firebaseToken") || localStorage.getItem("token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/jobs/contractor/applications`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch applicants (${response.status})`);
  }

  const data = await response.json();
  return data.applications || [];
}

/**
 * Get applicants for a specific job
 */
export async function getJobApplicants(
  jobId: string
): Promise<ApplicantData["workerId"][]> {
  if (!API_BASE_URL) {
    throw new Error("API configuration missing");
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("firebaseToken") || localStorage.getItem("token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch job applicants (${response.status})`);
  }

  const data = await response.json();

  if (!data.job?.applications) {
    return [];
  }

  // Extract worker info from applications
  return data.job.applications.map(
    (app: ApplicantData) => app.workerId
  );
}

/**
 * Update application status (accept/reject)
 */
export async function updateApplicationStatus(
  applicationId: string,
  action: "accept" | "reject"
): Promise<JobApplicationData> {
  if (!API_BASE_URL) {
    throw new Error("API configuration missing");
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("firebaseToken") || localStorage.getItem("token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/jobs/applications/${applicationId}/${action}`,
    {
      method: "PATCH",
      headers,
      credentials: "include",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Failed to update application (${response.status})`
    );
  }

  const data = await response.json();
  return data.application;
}

/**
 * Get all applications by current worker
 */
export async function getWorkerApplications(): Promise<
  Array<{
    _id: string;
    jobId: {
      _id: string;
      title: string;
      description?: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      pricingAmount?: number;
      pricingType?: string;
      category?: string;
      urgency?: string;
      jobDate?: string;
      duration_value?: number;
      duration_unit?: string;
      status: string;
      postedBy?: {
        _id: string;
        name: string;
        email: string;
      };
    };
    workerId: string;
    status: "applied" | "accepted" | "rejected";
    createdAt: string;
    updatedAt: string;
  }>
> {
  if (!API_BASE_URL) {
    throw new Error("API configuration missing");
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("firebaseToken") || localStorage.getItem("token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/jobs/worker/applications`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch applications (${response.status})`);
  }

  const data = await response.json();
  return data.applications || [];
}

/**
 * Get all ACCEPTED jobs for current worker (Active work)
 */
export async function getWorkerAcceptedJobs(): Promise<
  Array<{
    _id: string;
    jobId: {
      _id: string;
      title: string;
      description?: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      pricingAmount?: number;
      pricingType?: string;
      category?: string;
      urgency?: string;
      jobDate?: string;
      duration_value?: number;
      duration_unit?: string;
      status: string;
      postedBy?: {
        _id: string;
        name: string;
        email: string;
      };
      createdAt: string;
    };
    workerId: string;
    status: "accepted";
    createdAt: string;
    updatedAt: string;
  }>
> {
  if (!API_BASE_URL) {
    throw new Error("API configuration missing");
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("firebaseToken") || localStorage.getItem("token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/jobs/worker/accepted-jobs`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch accepted jobs (${response.status})`);
  }

  const data = await response.json();
  return data.applications || [];
}

/**
 * Mark job as complete (Contractor action)
 */
export async function markJobComplete(applicationId: string): Promise<JobApplicationData> {
  if (!API_BASE_URL) {
    throw new Error("API configuration missing");
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("firebaseToken") || localStorage.getItem("token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/mark-complete`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ applicationId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Failed to mark job complete (${response.status})`;
      console.error("Mark complete error response:", { status: response.status, errorMessage });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.application;
  } catch (error) {
    console.error("Mark complete request error:", error);
    throw error;
  }
}

/**
 * Get jobs pending worker confirmation of completion
 */
export async function getWorkerPendingCompletion(): Promise<
  Array<{
    _id: string;
    jobId: {
      _id: string;
      title: string;
      description?: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      pricingAmount?: number;
      pricingType?: string;
      category?: string;
      urgency?: string;
      jobDate?: string;
      duration_value?: number;
      duration_unit?: string;
      status: string;
      postedBy?: {
        _id: string;
        name: string;
        email: string;
      };
      createdAt: string;
    };
    workerId: string;
    status: "completion_pending";
    createdAt: string;
    updatedAt: string;
  }>
> {
  if (!API_BASE_URL) {
    throw new Error("API configuration missing");
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("firebaseToken") || localStorage.getItem("token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/jobs/worker/pending-completion`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch pending completion jobs (${response.status})`);
  }

  const data = await response.json();
  return data.applications || [];
}

/**
 * Confirm job completion (Worker confirms)
 */
export async function confirmJobCompletion(applicationId: string): Promise<JobApplicationData> {
  if (!API_BASE_URL) {
    throw new Error("API configuration missing");
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("firebaseToken") || localStorage.getItem("token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/confirm-completion`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ applicationId }),
    });

    if (!response.ok) {
      const rawErrorText = await response.text().catch(() => "");
      let parsedMessage = "";
      if (rawErrorText) {
        try {
          const parsed = JSON.parse(rawErrorText);
          parsedMessage = parsed?.message || "";
        } catch {
          parsedMessage = rawErrorText;
        }
      }
      const errorMessage = parsedMessage || `Failed to confirm completion (${response.status})`;
      console.error("Confirm completion error response:", { status: response.status, errorMessage });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.application;
  } catch (error) {
    console.error("Confirm completion request error:", error);
    throw error;
  }
}

/**
 * Reject job completion (Worker rejects back to accepted)
 */
export async function rejectJobCompletion(applicationId: string): Promise<JobApplicationData> {
  if (!API_BASE_URL) {
    throw new Error("API configuration missing");
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("firebaseToken") || localStorage.getItem("token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/reject-completion`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ applicationId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Failed to reject completion (${response.status})`;
      console.error("Reject completion error response:", { status: response.status, errorMessage });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.application;
  } catch (error) {
    console.error("Reject completion request error:", error);
    throw error;
  }
}

/**
 * Get worker's completed jobs
 */
export async function getWorkerCompletedJobs(): Promise<
  Array<{
    _id: string;
    jobId: {
      _id: string;
      title: string;
      description?: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      pricingAmount?: number;
      pricingType?: string;
      category?: string;
      urgency?: string;
      jobDate?: string;
      duration_value?: number;
      duration_unit?: string;
      status: string;
      postedBy?: {
        _id: string;
        name: string;
        email: string;
      };
      createdAt: string;
    };
    workerId: string;
    status: "completed";
    createdAt: string;
    updatedAt: string;
  }>
> {
  if (!API_BASE_URL) {
    throw new Error("API configuration missing");
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("firebaseToken") || localStorage.getItem("token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/jobs/worker/completed-jobs`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch completed jobs (${response.status})`);
  }

  const data = await response.json();
  return data.applications || [];
}

