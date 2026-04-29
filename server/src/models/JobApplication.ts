import mongoose, { Document, Schema } from "mongoose";

export interface IJobApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  workerId: mongoose.Types.ObjectId;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paidAt?: Date;
  workerRating?: {
    score: number;
    review?: string;
    givenAt: Date;
  };
  contractorRating?: {
    score: number;
    review?: string;
    givenAt: Date;
  };
}

const jobApplicationSchema: Schema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    workerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["applied", "accepted", "rejected", "completion_pending", "completed"],
      default: "applied",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "confirmed_paid", "disputed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "other"],
    },
    paidAt: {
      type: Date,
    },
    workerRating: {
      score: { type: Number, min: 1, max: 5 },
      review: { type: String, maxlength: 200 },
      givenAt: { type: Date },
    },
    contractorRating: {
      score: { type: Number, min: 1, max: 5 },
      review: { type: String, maxlength: 200 },
      givenAt: { type: Date },
    },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ jobId: 1, workerId: 1 }, { unique: true });

export default mongoose.model<IJobApplication>("JobApplication", jobApplicationSchema);
