import { Notification, NotificationType } from "../models/Notification";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    jobId?: string;
    applicationId?: string;
    senderId?: string;
    [key: string]: any;
  };
}

/**
 * Helper function to create a notification
 * Use this across the app when important events happen
 */
export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const notification = new Notification({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data || {},
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
};

/**
 * Example usage in job application:
 *
 * // When worker applies for a job
 * await createNotification({
 *   userId: jobPosterId,
 *   type: "application",
 *   title: "New Application",
 *   message: `${workerName} applied for "${jobTitle}"`,
 *   data: { jobId, applicationId, workerId }
 * });
 *
 * // When new job is posted nearby
 * await createNotification({
 *   userId: workerId,
 *   type: "job_update",
 *   title: "Job Match Found",
 *   message: `"${jobTitle}" near you - ${distance}km away`,
 *   data: { jobId }
 * });
 *
 * // Payment related
 * await createNotification({
 *   userId: workerId,
 *   type: "payment",
 *   title: "Payment Received",
 *   message: `You received ₹${amount} for "${jobTitle}"`,
 *   data: { jobId }
 * });
 */
