import { Request, Response } from "express";
import { Notification } from "../models/Notification";

// Get all notifications for a user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id?.toString();

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get latest 50 notifications, sorted by created date
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// Get unread count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id?.toString();

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    return res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return res.status(500).json({ message: "Failed to fetch unread count" });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id?.toString();
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ message: "Failed to update notification" });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id?.toString();

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    await Notification.updateMany({ userId, read: false }, { read: true });

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    return res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error marking all as read:", error);
    return res.status(500).json({ message: "Failed to update notifications" });
  }
};

// Delete a notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id?.toString();
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({ message: "Failed to delete notification" });
  }
};
