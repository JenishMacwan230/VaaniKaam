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
// Contractor routes
router.get("/contractor/jobs", verifyAuthToken_1.default, (0, requireRole_1.requireAnyRole)(["individual", "company"]), jobController_1.getContractorJobs);
router.get("/contractor/stats", verifyAuthToken_1.default, (0, requireRole_1.requireAnyRole)(["individual", "company"]), jobController_1.getContractorStats);
router.get("/contractor/applications", verifyAuthToken_1.default, (0, requireRole_1.requireAnyRole)(["individual", "company"]), jobController_1.getRecentApplications);
exports.default = router;
