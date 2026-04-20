import { Schema, model, Document } from "mongoose";

export type NotificationType = "application" | "job_update" | "payment" | "message";

export interface INotification extends Document {
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
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["application", "job_update", "payment", "message"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export const Notification = model<INotification>("Notification", notificationSchema);
