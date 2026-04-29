import express from "express";
import verifyAuthToken from "../middleware/verifyAuthToken";
import { requireRole, requireAnyRole } from "../middleware/requireRole";
import { 
  createJob, 
  listJobs, 
  applyToJob, 
  getContractorJobs, 
  getContractorStats, 
  getRecentApplications,
  getJobById,
  updateApplicationStatus,
  deleteJob,
  getWorkerApplications,
  withdrawApplication,
  getWorkerAcceptedJobs,
  markJobComplete,
  markAllJobsComplete,
  getWorkerPendingCompletion,
  confirmJobCompletion,
  rejectJobCompletion,
  getWorkerCompletedJobs,
  confirmPayment,
  disputePayment,
  rateUser,
  getWorkerRatings,
} from "../controllers/jobController";

const router = express.Router();

router.post("/", verifyAuthToken, requireAnyRole(["individual", "company"]) as any, createJob as any);
router.get("/", listJobs as any);
router.post("/apply", verifyAuthToken, requireRole("worker") as any, applyToJob as any);
router.post("/withdraw", verifyAuthToken, requireRole("worker") as any, withdrawApplication as any);

// Get worker's own applications
router.get("/worker/applications", verifyAuthToken, requireRole("worker") as any, getWorkerApplications as any);

// Get worker's accepted jobs (active work)
router.get("/worker/accepted-jobs", verifyAuthToken, requireRole("worker") as any, getWorkerAcceptedJobs as any);

// Get worker's jobs pending completion confirmation
router.get("/worker/pending-completion", verifyAuthToken, requireRole("worker") as any, getWorkerPendingCompletion as any);

// Get worker's completed jobs
router.get("/worker/completed-jobs", verifyAuthToken, requireRole("worker") as any, getWorkerCompletedJobs as any);

// Contractor marks job as complete
router.post("/mark-complete", verifyAuthToken, requireAnyRole(["individual", "company"]) as any, markJobComplete as any);

// Contractor marks all accepted applications as complete (atomic operation)
router.post("/mark-all-complete", verifyAuthToken, requireAnyRole(["individual", "company"]) as any, markAllJobsComplete as any);

// Worker confirms job completion
router.post("/confirm-completion", verifyAuthToken, requireRole("worker") as any, confirmJobCompletion as any);

// Worker rejects job completion
router.post("/reject-completion", verifyAuthToken, requireRole("worker") as any, rejectJobCompletion as any);

// Worker confirms payment receipt
router.post("/confirm-payment", verifyAuthToken, requireRole("worker") as any, confirmPayment as any);

// Worker disputes payment
router.post("/dispute-payment", verifyAuthToken, requireRole("worker") as any, disputePayment as any);

// Rate user (worker rates contractor or contractor rates worker)
// No role restriction needed - authorization happens in the endpoint based on job assignment
router.post("/rate", verifyAuthToken, rateUser as any);

// Get ratings for a worker
router.get("/ratings/:workerId", getWorkerRatings as any);

// Get specific job by ID
router.get("/:jobId", getJobById as any);

// Update application status (accept/reject)
router.patch("/applications/:applicationId/:action", verifyAuthToken, updateApplicationStatus as any);

// Delete a job
router.delete("/:jobId", verifyAuthToken, deleteJob as any);

// Contractor routes
router.get("/contractor/jobs", verifyAuthToken, requireAnyRole(["individual", "company"]) as any, getContractorJobs as any);
router.get("/contractor/stats", verifyAuthToken, requireAnyRole(["individual", "company"]) as any, getContractorStats as any);
router.get("/contractor/applications", verifyAuthToken, requireAnyRole(["individual", "company"]) as any, getRecentApplications as any);

export default router;
