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
/**
 * Helper to persist seen notifications across page reloads
 */
const getSeenIds = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(sessionStorage.getItem("seenNotifications") || "[]"));
  } catch {
    return new Set();
  }
};

const addSeenId = (id: string) => {
  if (typeof window === "undefined") return;
  try {
    const seen = getSeenIds();
    seen.add(id);
    sessionStorage.setItem("seenNotifications", JSON.stringify(Array.from(seen)));
  } catch {}
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getAuthToken = useCallback(() => {
    if (globalThis.window === undefined) return null;
    // Prefer explicit token in localStorage, but fall back to auth cookie if present
    const token = localStorage.getItem("authToken");
    if (token) return token;
    // Check for auth cookie named 'authToken'
    const match = document.cookie.match(new RegExp('(?:^|; )' + 'authToken' + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
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

  const requestWithAuthFallback = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const headers = buildRequestHeaders();
      const hadAuthorizationHeader = Boolean(headers.Authorization);

      const response = await fetch(url, {
        ...init,
        headers,
        credentials: "include",
      });

      if (response.status === 401 && hadAuthorizationHeader) {
        return fetch(url, {
          ...init,
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      }

      return response;
    },
    [buildRequestHeaders]
  );

  const fetchNotifications = useCallback(async () => {
    try {
      // Don't require a readable token here: server accepts httpOnly cookie via credentials
      if (!API_BASE_URL) return;

      const response = await requestWithAuthFallback(`${API_BASE_URL}/api/notifications`, {
        method: "GET",
      });

      if (!response.ok) {
        if (response.status !== 401) {
          console.error("Failed to fetch notifications:", response.status);
        }
        return;
      }

      const data = await response.json();
      
      // Only keep unread notifications
      const fetchedNotifications = (data.notifications || []).filter((n: Notification) => !n.read);

      const seen = getSeenIds();

      fetchedNotifications.forEach((n: Notification) => {
        if (!seen.has(n._id)) {
          showNotificationToast(n);
          addSeenId(n._id);
        }
      });

      setNotifications(fetchedNotifications);
      setError(null);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch notifications");
    }
  }, [buildRequestHeaders]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      // Allow cookie-only auth (httpOnly) so don't bail out if token isn't readable
      if (!API_BASE_URL) return;

      const response = await requestWithAuthFallback(`${API_BASE_URL}/api/notifications/unread-count`, {
        method: "GET",
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

        const response = await requestWithAuthFallback(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
          method: "PATCH",
        });

        if (response.ok) {
          // Update local state by removing the read notification
          setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    },
    [requestWithAuthFallback]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      if (!API_BASE_URL) return;

      const response = await requestWithAuthFallback(`${API_BASE_URL}/api/notifications/read/all`, {
        method: "PATCH",
      });

      if (response.ok) {
        // Update local state by removing all read notifications
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, [requestWithAuthFallback]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        if (!API_BASE_URL) return;

        const response = await requestWithAuthFallback(`${API_BASE_URL}/api/notifications/${notificationId}`, {
          method: "DELETE",
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
    [fetchUnreadCount, requestWithAuthFallback]
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
 * Translate common notification titles and messages based on locale
 */
function translateNotification(title: string, message: string, locale: string) {
  if (locale === "en") return { title, message };

  let tTitle = title;
  let tMessage = message;

  // Title translations
  const titles: Record<string, Record<string, string>> = {
    "New Application Received": { hi: "नया आवेदन प्राप्त हुआ", gu: "નવી અરજી મળી" },
    "Application Accepted!": { hi: "आवेदन स्वीकृत!", gu: "અરજી સ્વીકારવામાં આવી!" },
    "Job Completion Review": { hi: "कार्य पूर्णता समीक्षा", gu: "કામ પૂર્ણતા સમીક્ષા" },
    "Job Completed ✓": { hi: "कार्य पूर्ण ✓", gu: "કામ પૂર્ણ ✓" },
    "Payment Confirmed": { hi: "भुगतान की पुष्टि हुई", gu: "ચૂકવણીની પુષ્ટિ થઈ" },
    "Job Marked Paid": { hi: "कार्य का भुगतान चिह्नित किया गया", gu: "કામ ચૂકવેલ ચિહ્નિત" },
    "Payment Dispute Reported": { hi: "भुगतान विवाद दर्ज", gu: "ચૂકવણી વિવાદ નોંધાયો" },
  };

  if (titles[title] && titles[title][locale]) {
    tTitle = titles[title][locale];
  }

  // Message translations using regex patterns
  if (message.includes('applied for')) {
    const match = message.match(/(.+) applied for "(.+)"/);
    if (match) {
      if (locale === "hi") tMessage = `${match[1]} ने "${match[2]}" के लिए आवेदन किया`;
      if (locale === "gu") tMessage = `${match[1]} એ "${match[2]}" માટે અરજી કરી`;
    }
  } else if (message.includes('Your application for') && message.includes('has been accepted')) {
    const match = message.match(/Your application for "(.+)" has been accepted/);
    if (match) {
      if (locale === "hi") tMessage = `"${match[1]}" के लिए आपका आवेदन स्वीकृत कर लिया गया है। अब आप काम शुरू कर सकते हैं।`;
      if (locale === "gu") tMessage = `"${match[1]}" માટેની તમારી અરજી સ્વીકારવામાં આવી છે. હવે તમે કામ શરૂ કરી શકો છો.`;
    }
  } else if (message.includes('marked') && message.includes('as complete. Please confirm')) {
    const match = message.match(/(.+) marked "(.+)" as complete\. Please confirm/);
    if (match) {
      if (locale === "hi") tMessage = `${match[1]} ने "${match[2]}" को पूर्ण चिह्नित किया है। कृपया पुष्टि करें।`;
      if (locale === "gu") tMessage = `${match[1]} એ "${match[2]}" ને પૂર્ણ ચિહ્નિત કર્યું છે. કૃપા કરીને પુષ્ટિ કરો.`;
    }
  } else if (message.includes('confirmed completion of')) {
    const match = message.match(/(.+) confirmed completion of "(.+)"/);
    if (match) {
      if (locale === "hi") tMessage = `${match[1]} ने "${match[2]}" के पूरा होने की पुष्टि की है।`;
      if (locale === "gu") tMessage = `${match[1]} એ "${match[2]}" ની પૂર્ણતાની પુષ્ટિ કરી છે.`;
    }
  } else if (message.includes('confirmed payment receipt for')) {
    const match = message.match(/(.+) confirmed payment receipt for "(.+)"/);
    if (match) {
      if (locale === "hi") tMessage = `${match[1]} ने "${match[2]}" के भुगतान की रसीद की पुष्टि की है।`;
      if (locale === "gu") tMessage = `${match[1]} એ "${match[2]}" માટે ચૂકવણીની રસીદની પુષ્ટિ કરી છે.`;
    }
  } else if (message.includes('marked') && message.includes('as paid and completed')) {
    const match = message.match(/(.+) marked "(.+)" as paid and completed/);
    if (match) {
      if (locale === "hi") tMessage = `${match[1]} ने "${match[2]}" को भुगतान किया और पूरा कर दिया।`;
      if (locale === "gu") tMessage = `${match[1]} એ "${match[2]}" ને ચૂકવેલ અને પૂર્ણ ચિહ્નિત કર્યું છે.`;
    }
  } else if (message.includes('reported a payment issue for')) {
    const match = message.match(/(.+) reported a payment issue for "(.+)"/);
    if (match) {
      if (locale === "hi") tMessage = `${match[1]} ने "${match[2]}" के लिए भुगतान समस्या की सूचना दी।`;
      if (locale === "gu") tMessage = `${match[1]} એ "${match[2]}" માટે ચૂકવણી સમસ્યાની જાણ કરી.`;
    }
  }

  return { title: tTitle, message: tMessage };
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

  let locale = "en";
  if (typeof window !== "undefined") {
    const segment = window.location.pathname.split("/")[1];
    if (["en", "hi", "gu"].includes(segment)) {
      locale = segment;
    }
  }

  const { title, message } = translateNotification(
    notification.title,
    notification.message,
    locale
  );

  const handleRedirect = () => {
    let accountType = "worker";
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        accountType = user.accountType === "contractor" ? "contractor" : "worker";
      }
    } catch (e) {}

    window.location.href = `/${locale}/dashboard/${accountType}`;
  };

  toast.info(`${icon} ${title}`, {
    description: message,
    duration: 3000,
    action: {
      label: locale === "hi" ? "देखें" : locale === "gu" ? "જુઓ" : "View",
      onClick: handleRedirect,
    },
  });
}
