import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

export type NotificationType = "application" | "job_update" | "payment" | "message";

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const POLL_INTERVAL = 15000; // 15 seconds

/**
 * Hook to fetch and manage notifications with polling
 * Shows toast only for new unread notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const previousNotificationIdsRef = useRef<Set<string>>(new Set());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getAuthToken = useCallback(() => {
    if (globalThis.window === undefined) return null;
    return localStorage.getItem("firebaseToken") || localStorage.getItem("token");
  }, []);

  const buildRequestHeaders = useCallback(() => {
    const token = getAuthToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }

    return headers;
  }, [getAuthToken]);

  const fetchNotifications = useCallback(async () => {
    try {
      if (!API_BASE_URL) return;

      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: "GET",
        headers: buildRequestHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status !== 401) {
          console.error("Failed to fetch notifications:", response.status);
        }
        return;
      }

      const data = await response.json();
      const fetchedNotifications = data.notifications || [];

      // Check for new unread notifications (show toast)
      const currentUnreadIds = new Set<string>(
        fetchedNotifications.filter((n: Notification) => !n.read).map((n: Notification) => n._id)
      );

      currentUnreadIds.forEach((id) => {
        if (!previousNotificationIdsRef.current.has(id)) {
          // This is a new notification, show toast
          const notif = fetchedNotifications.find((n: Notification) => n._id === id);
          if (notif) {
            showNotificationToast(notif);
          }
        }
      });

      previousNotificationIdsRef.current = currentUnreadIds;
      setNotifications(fetchedNotifications);
      setError(null);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch notifications");
    }
  }, [buildRequestHeaders]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      if (!API_BASE_URL) return;

      const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
        method: "GET",
        headers: buildRequestHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status !== 401) {
          console.error("Failed to fetch unread count:", response.status);
        }
        return;
      }

      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, [buildRequestHeaders]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        if (!API_BASE_URL) return;

        const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
          method: "PATCH",
          headers: buildRequestHeaders(),
          credentials: "include",
        });

        if (response.ok) {
          // Update local state
          setNotifications((prev) =>
            prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    },
    [buildRequestHeaders]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      if (!API_BASE_URL) return;

      const response = await fetch(`${API_BASE_URL}/api/notifications/read/all`, {
        method: "PATCH",
        headers: buildRequestHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, [buildRequestHeaders]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        if (!API_BASE_URL) return;

        const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
          method: "DELETE",
          headers: buildRequestHeaders(),
          credentials: "include",
        });

        if (response.ok) {
          setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
          // Recalculate unread count
          fetchUnreadCount();
        }
      } catch (err) {
        console.error("Error deleting notification:", err);
      }
    },
    [buildRequestHeaders, fetchUnreadCount]
  );

  // Initial fetch + polling
  useEffect(() => {
    // Fetch immediately
    void fetchNotifications();
    void fetchUnreadCount();

    // Set up polling
    pollIntervalRef.current = setInterval(() => {
      void fetchNotifications();
      void fetchUnreadCount();
    }, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}

/**
 * Show appropriate toast based on notification type
 */
function showNotificationToast(notification: Notification) {
  const icons: Record<NotificationType, string> = {
    application: "📋",
    job_update: "💼",
    payment: "💰",
    message: "💬",
  };

  const icon = icons[notification.type] || "🔔";

  toast.info(`${icon} ${notification.title}`, {
    description: notification.message,
    duration: 5000,
  });
}
