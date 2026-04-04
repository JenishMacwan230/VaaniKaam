import mongoose, { Document, Schema } from "mongoose";

export interface IJob extends Document {
  title: string;
  description?: string;
  skillRequired: string[];
  location?: string;
  wage?: number;
  date?: Date;
  category?: string;
  pricingType?: "hour" | "day" | "job";
  urgency?: "Immediate" | "Today" | "Flexible";
  status: string;
  postedBy: mongoose.Types.ObjectId;
}

const jobSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    skillRequired: { type: [String], default: [] },
    location: { type: String, trim: true },
    wage: { type: Number },
    date: { type: Date },
    category: { type: String, trim: true },
    pricingType: {
      type: String,
      enum: ["hour", "day", "job"],
      default: "day",
    },
    urgency: {
      type: String,
      enum: ["Immediate", "Today", "Flexible"],
      default: "Flexible",
    },
    status: {
      type: String,
      enum: ["open", "assigned", "completed", "cancelled"],
      default: "open",
    },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IJob>("Job", jobSchema);
