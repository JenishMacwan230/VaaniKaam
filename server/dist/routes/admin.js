"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyAuthToken_1 = __importDefault(require("../middleware/verifyAuthToken"));
const requireRole_1 = require("../middleware/requireRole");
const adminController_1 = require("../controllers/adminController");
const router = express_1.default.Router();
router.use(verifyAuthToken_1.default, (0, requireRole_1.requireRole)("admin"));
router.get("/users", adminController_1.getAllUsers);
router.patch("/users/:id/status", adminController_1.updateUserStatus);
router.get("/jobs", adminController_1.getAllJobs);
router.delete("/jobs/:id", adminController_1.deleteJob);
router.get("/stats", adminController_1.getStats);
exports.default = router;
