import express from "express";
import verifyAuthToken from "../middleware/verifyAuthToken";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController";

const router = express.Router();

// Get all notifications for the authenticated user
router.get("/", verifyAuthToken as any, getNotifications as any);

// Get unread notification count
router.get("/unread-count", verifyAuthToken as any, getUnreadCount as any);

// Mark all notifications as read (specific route MUST come before generic :id route)
router.patch("/read/all", verifyAuthToken as any, markAllAsRead as any);

// Mark a specific notification as read
router.patch("/:id/read", verifyAuthToken as any, markAsRead as any);

// Delete a specific notification
router.delete("/:id", verifyAuthToken as any, deleteNotification as any);

export default router;
