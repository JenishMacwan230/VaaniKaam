import mongoose, { Document, Schema } from "mongoose";

export interface IOtpCode extends Document {
  phone: string;
  codeHash: string;
  expiresAt: Date;
  purpose: "phone-verification" | "password-reset";
}

const otpCodeSchema: Schema = new Schema(
  {
    phone: { type: String, required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    purpose: { 
      type: String, 
      enum: ["phone-verification", "password-reset"], 
      default: "phone-verification" 
    },
  },
  { timestamps: true }
);

otpCodeSchema.index({ phone: 1, purpose: 1 });
otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IOtpCode>("OtpCode", otpCodeSchema);
