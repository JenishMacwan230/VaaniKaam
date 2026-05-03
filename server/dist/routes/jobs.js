"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyAuthToken_1 = __importDefault(require("../middleware/verifyAuthToken"));
const requireRole_1 = require("../middleware/requireRole");
const jobController_1 = require("../controllers/jobController");
const router = express_1.default.Router();
router.post("/", verifyAuthToken_1.default, (0, requireRole_1.requireAnyRole)(["individual", "company"]), jobController_1.createJob);
router.get("/", jobController_1.listJobs);
router.post("/apply", verifyAuthToken_1.default, (0, requireRole_1.requireRole)("worker"), jobController_1.applyToJob);
router.post("/withdraw", verifyAuthToken_1.default, (0, requireRole_1.requireRole)("worker"), jobController_1.withdrawApplication);
// Get worker's own applications
router.get("/worker/applications", verifyAuthToken_1.default, (0, requireRole_1.requireRole)("worker"), jobController_1.getWorkerApplications);
// Get worker's accepted jobs (active work)
router.get("/worker/accepted-jobs", verifyAuthToken_1.default, (0, requireRole_1.requireRole)("worker"), jobController_1.getWorkerAcceptedJobs);
// Get worker's jobs pending completion confirmation
router.get("/worker/pending-completion", verifyAuthToken_1.default, (0, requireRole_1.requireRole)("worker"), jobController_1.getWorkerPendingCompletion);
// Get worker's completed jobs
router.get("/worker/completed-jobs", verifyAuthToken_1.default, (0, requireRole_1.requireRole)("worker"), jobController_1.getWorkerCompletedJobs);
// Contractor marks job as complete
router.post("/mark-complete", verifyAuthToken_1.default, (0, requireRole_1.requireAnyRole)(["individual", "company"]), jobController_1.markJobComplete);
// Contractor marks all accepted applications as complete (atomic operation)
router.post("/mark-all-complete", verifyAuthToken_1.default, (0, requireRole_1.requireAnyRole)(["individual", "company"]), jobController_1.markAllJobsComplete);
// Worker confirms job completion
router.post("/confirm-completion", verifyAuthToken_1.default, (0, requireRole_1.requireRole)("worker"), jobController_1.confirmJobCompletion);
// Worker rejects job completion
router.post("/reject-completion", verifyAuthToken_1.default, (0, requireRole_1.requireRole)("worker"), jobController_1.rejectJobCompletion);
// Worker confirms payment receipt
router.post("/confirm-payment", verifyAuthToken_1.default, (0, requireRole_1.requireRole)("worker"), jobController_1.confirmPayment);
// Worker disputes payment
router.post("/dispute-payment", verifyAuthToken_1.default, (0, requireRole_1.requireRole)("worker"), jobController_1.disputePayment);
// Rate user (worker rates contractor or contractor rates worker)
// No role restriction needed - authorization happens in the endpoint based on job assignment
router.post("/rate", verifyAuthToken_1.default, jobController_1.rateUser);
// Get ratings for a worker
router.get("/ratings/:workerId", jobController_1.getWorkerRatings);
// Get specific job by ID
router.get("/:jobId", jobController_1.getJobById);
// Update application status (accept/reject)
router.patch("/applications/:applicationId/:action", verifyAuthToken_1.default, jobController_1.updateApplicationStatus);
// Delete a job
router.delete("/:jobId", verifyAuthToken_1.default, jobController_1.deleteJob);
// Contractor routes
router.get("/contractor/jobs", verifyAuthToken_1.default, (0, requireRole_1.requireAnyRole)(["individual", "company"]), jobController_1.getContractorJobs);
router.get("/contractor/stats", verifyAuthToken_1.default, (0, requireRole_1.requireAnyRole)(["individual", "company"]), jobController_1.getContractorStats);
router.get("/contractor/applications", verifyAuthToken_1.default, (0, requireRole_1.requireAnyRole)(["individual", "company"]), jobController_1.getRecentApplications);
exports.default = router;
