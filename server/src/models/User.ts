import mongoose, { Document, Schema } from "mongoose";

export const allowedRoles = ["admin", "worker", "company", "individual"] as const;

export interface IUser extends Document {
  name?: string;
  email?: string;
  phone: string;
  passwordHash?: string;
  roles: string[];
  activeRole?: string;
  isActive: boolean;
  isPhoneVerified: boolean;
}

const userSchema: Schema = new Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true, required: true, unique: true },
    passwordHash: { type: String },
    roles: { type: [String], enum: allowedRoles as any, default: [] },
    activeRole: { type: String, enum: allowedRoles as any },
    isActive: { type: Boolean, default: true },
    isPhoneVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });

export default mongoose.model<IUser>("User", userSchema);
