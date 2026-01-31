import express from "express";
import verifyAuthToken from "../middleware/verifyAuthToken";
import { requireRole, requireAnyRole } from "../middleware/requireRole";
import { createJob, listJobs, applyToJob } from "../controllers/jobController";

const router = express.Router();

router.post("/", verifyAuthToken, requireAnyRole(["individual", "company"]) as any, createJob as any);
router.get("/", listJobs as any);
router.post("/apply", verifyAuthToken, requireRole("worker") as any, applyToJob as any);

export default router;
