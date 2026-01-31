import express from "express";
import verifyAuthToken from "../middleware/verifyAuthToken";
import { requireRole } from "../middleware/requireRole";
import { getAllUsers, updateUserStatus, getAllJobs, deleteJob, getStats } from "../controllers/adminController";

const router = express.Router();

router.use(verifyAuthToken as any, requireRole("admin") as any);

router.get("/users", getAllUsers as any);
router.patch("/users/:id/status", updateUserStatus as any);
router.get("/jobs", getAllJobs as any);
router.delete("/jobs/:id", deleteJob as any);
router.get("/stats", getStats as any);

export default router;
