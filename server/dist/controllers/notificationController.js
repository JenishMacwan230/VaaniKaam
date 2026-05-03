"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const Notification_1 = require("../models/Notification");
// Get all notifications for a user
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        // Get latest 50 notifications, sorted by created date
        const notifications = await Notification_1.Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);
        return res.status(200).json({
            notifications,
            count: notifications.length,
        });
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ message: "Failed to fetch notifications" });
    }
};
exports.getNotifications = getNotifications;
// Get unread count
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        const unreadCount = await Notification_1.Notification.countDocuments({
            userId,
            read: false,
        });
        return res.status(200).json({ unreadCount });
    }
    catch (error) {
        console.error("Error fetching unread count:", error);
        return res.status(500).json({ message: "Failed to fetch unread count" });
    }
};
exports.getUnreadCount = getUnreadCount;
// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const userId = req.user?._id?.toString();
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        const notification = await Notification_1.Notification.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        return res.status(200).json({ notification });
    }
    catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({ message: "Failed to update notification" });
    }
};
exports.markAsRead = markAsRead;
// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        await Notification_1.Notification.updateMany({ userId, read: false }, { read: true });
        const unreadCount = await Notification_1.Notification.countDocuments({
            userId,
            read: false,
        });
        return res.status(200).json({ unreadCount });
    }
    catch (error) {
        console.error("Error marking all as read:", error);
        return res.status(500).json({ message: "Failed to update notifications" });
    }
};
exports.markAllAsRead = markAllAsRead;
// Delete a notification
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user?._id?.toString();
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        const notification = await Notification_1.Notification.findOneAndDelete({
            _id: id,
            userId,
        });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        return res.status(200).json({ message: "Notification deleted" });
    }
    catch (error) {
        console.error("Error deleting notification:", error);
        return res.status(500).json({ message: "Failed to delete notification" });
    }
};
exports.deleteNotification = deleteNotification;
