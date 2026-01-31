import mongoose, { Document, Schema } from "mongoose";

export interface IJobApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  workerId: mongoose.Types.ObjectId;
  status: string;
}

const jobApplicationSchema: Schema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    workerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["applied", "accepted", "rejected"],
      default: "applied",
    },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ jobId: 1, workerId: 1 }, { unique: true });

export default mongoose.model<IJobApplication>("JobApplication", jobApplicationSchema);
