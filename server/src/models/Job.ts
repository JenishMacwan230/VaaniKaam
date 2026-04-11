import mongoose, { Document, Schema } from "mongoose";

export interface IJob extends Document {
  title: string;
  description?: string;
  skillRequired: string[];
  location?: string; // Original location (user entered)
  normalizedLocation?: string; // Standardized format for system matching
  isLocationNormalized?: boolean; // Track if normalization via API succeeded
  latitude?: number; // GPS coordinates for distance matching
  longitude?: number;
  wage?: number;
  date?: Date;
  category?: string;
  pricingType?: "per_hour" | "per_day" | "per_job" | "hour" | "day" | "job";
  pricingAmount?: number; // Payment amount (₹)
  urgency?: "Immediate" | "Today" | "Flexible";
  // Structured duration fields
  duration_value?: number; // e.g., 1, 8, 5
  duration_unit?: "hour" | "day" | "week"; // Unit of duration
  workersRequired?: number; // Number of workers needed
  jobDate?: "today" | "tomorrow" | "pick" | "flexible"; // When job is needed
  selectedDate?: string; // ISO date string when jobDate is "pick"
  status: string;
  postedBy: mongoose.Types.ObjectId;
}

const jobSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    skillRequired: { type: [String], default: [] },
    location: { type: String, trim: true }, // Original location as entered by user
    normalizedLocation: { type: String, trim: true }, // Standardized format for matching
    isLocationNormalized: { type: Boolean, default: false }, // Track if API normalization succeeded
    latitude: { type: Number }, // GPS coordinates
    longitude: { type: Number },
    wage: { type: Number },
    pricingAmount: { type: Number }, // Payment amount (₹)
    date: { type: Date },
    category: { type: String, trim: true },
    pricingType: {
      type: String,
      enum: ["per_hour", "per_day", "per_job", "hour", "day", "job"],
      default: "per_day",
    },
    urgency: {
      type: String,
      enum: ["Immediate", "Today", "Flexible"],
      default: "Flexible",
    },
    // Structured duration fields
    duration_value: { type: Number, default: 1 }, // e.g., 1, 8, 5
    duration_unit: {
      type: String,
      enum: ["hour", "day", "week"],
      default: "day",
    },
    workersRequired: { type: Number, default: 1 }, // Number of workers needed
    jobDate: {
      type: String,
      enum: ["today", "tomorrow", "pick", "flexible"],
      default: "today",
    },
    selectedDate: { type: String }, // ISO date string when jobDate is "pick"
    status: {
      type: String,
      enum: ["open", "assigned", "in_progress", "completion_pending", "completed", "cancelled"],
      default: "open",
    },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IJob>("Job", jobSchema);
