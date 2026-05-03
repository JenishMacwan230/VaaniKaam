"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyAuthToken_1 = __importDefault(require("../middleware/verifyAuthToken"));
const notificationController_1 = require("../controllers/notificationController");
const router = express_1.default.Router();
// Get all notifications for the authenticated user
router.get("/", verifyAuthToken_1.default, notificationController_1.getNotifications);
// Get unread notification count
router.get("/unread-count", verifyAuthToken_1.default, notificationController_1.getUnreadCount);
// Mark all notifications as read (specific route MUST come before generic :id route)
router.patch("/read/all", verifyAuthToken_1.default, notificationController_1.markAllAsRead);
// Mark a specific notification as read
router.patch("/:id/read", verifyAuthToken_1.default, notificationController_1.markAsRead);
// Delete a specific notification
router.delete("/:id", verifyAuthToken_1.default, notificationController_1.deleteNotification);
exports.default = router;
