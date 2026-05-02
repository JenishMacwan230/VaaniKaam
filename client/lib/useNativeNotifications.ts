"use client";

/**
 * useNativeNotifications.ts
 *
 * Capacitor Push + Local Notification hook for VaaniKaam Android.
 *
 * On web: No-ops (browser Notification API is handled elsewhere).
 * On Android: Registers FCM token, listens for foreground push events, and
 * exposes helpers to schedule local notifications.
 *
 * Usage:
 *   const { requestPermission, scheduleLocal, fcmToken } = useNativeNotifications();
 */

import { useEffect, useState, useCallback } from "react";
import { isNativePlatform } from "@/lib/capacitorPlatform";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocalNotificationRequest {
  title: string;
  body: string;
  /** Delay in milliseconds from now. Default: immediate (1 second). */
  delayMs?: number;
  /** Optional unique id (defaults to random integer). */
  id?: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNativeNotifications() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  /**
   * Request push-notification permission and register for FCM.
   * Safe to call multiple times – only registers once.
   */
  const requestPermission = useCallback(async () => {
    if (!isNativePlatform()) return;

    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");

      const status = await PushNotifications.requestPermissions();
      if (status.receive === "granted") {
        setPermissionGranted(true);
        await PushNotifications.register();
      }
    } catch (err) {
      console.warn("[useNativeNotifications] PushNotifications not available:", err);
    }
  }, []);

  /**
   * Schedule an immediate (or delayed) local notification.
   * Works on Android native only; silently skipped on web.
   */
  const scheduleLocal = useCallback(async (req: LocalNotificationRequest) => {
    if (!isNativePlatform()) return;

    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");

      const id = req.id ?? Math.floor(Math.random() * 100_000);
      const at = new Date(Date.now() + (req.delayMs ?? 1000));

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: req.title,
            body: req.body,
            schedule: { at },
            sound: "default",
            smallIcon: "ic_stat_icon_config_sample",
          },
        ],
      });
    } catch (err) {
      console.warn("[useNativeNotifications] LocalNotifications not available:", err);
    }
  }, []);

  // ── Register FCM listeners on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!isNativePlatform()) return;

    let pushNotifications: any;

    (async () => {
      try {
        const mod = await import("@capacitor/push-notifications");
        pushNotifications = mod.PushNotifications;

        // Successful FCM registration → store token
        await pushNotifications.addListener(
          "registration",
          (token: { value: string }) => {
            setFcmToken(token.value);
            // TODO: send token to your Express backend so you can send targeted push
            // fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/fcm-token`, {
            //   method: "POST",
            //   headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            //   body: JSON.stringify({ token: token.value }),
            // });
          }
        );

        // Registration error
        await pushNotifications.addListener("registrationError", (err: any) => {
          console.error("[PushNotifications] Registration error:", err);
        });

        // Foreground push received
        await pushNotifications.addListener(
          "pushNotificationReceived",
          (notification: any) => {
            console.log("[PushNotifications] Received:", notification);
            // Schedule a local notification to surface it to the user
            scheduleLocal({
              title: notification.title ?? "VaaniKaam",
              body: notification.body ?? "",
              delayMs: 500,
            });
          }
        );

        // User tapped the notification
        await pushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action: any) => {
            console.log("[PushNotifications] Action:", action);
          }
        );
      } catch (err) {
        console.warn("[useNativeNotifications] Setup error:", err);
      }
    })();

    return () => {
      // Cleanup listeners on unmount
      pushNotifications?.removeAllListeners?.();
    };
  }, [scheduleLocal]);

  return {
    fcmToken,
    permissionGranted,
    requestPermission,
    scheduleLocal,
  };
}
