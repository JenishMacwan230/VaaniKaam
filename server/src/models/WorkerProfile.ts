import mongoose, { Document, Schema } from "mongoose";

export interface IWorkerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  skills: string[];
  expectedWage?: number;
  location?: string; // Original location
  normalizedLocation?: string; // Standardized format
  latitude?: number; // GPS coordinates
  longitude?: number;
  availability?: string;
}

const workerProfileSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    skills: { type: [String], default: [] },
    expectedWage: { type: Number },
    location: { type: String, trim: true }, // Original location
    normalizedLocation: { type: String, trim: true }, // Standardized format
    latitude: { type: Number }, // GPS coordinates
    longitude: { type: Number },
    availability: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<IWorkerProfile>("WorkerProfile", workerProfileSchema);
