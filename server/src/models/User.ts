import mongoose, { Document, Schema } from "mongoose";

export const allowedRoles = ["admin", "worker", "company", "individual"] as const;

export interface IUser extends Document {
  name?: string;
  email?: string;
  phone: string;
  location?: string;
  normalizedLocation?: string;
  latitude?: number;
  longitude?: number;
  accountType?: "worker" | "contractor";
  passwordHash?: string;
  roles: string[];
  activeRole?: string;
  isActive: boolean;
  isPhoneVerified: boolean;
  profilePictureUrl?: string;
  profilePicturePublicId?: string;
  profession?: string;
  skills?: string[];
  experienceYears?: number;
  pricingType?: "hour" | "day" | "job";
  pricingAmount?: number;
  availability?: boolean;
  languages?: string[];
  about?: string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true, required: true, unique: true },
    location: { type: String, trim: true },
    normalizedLocation: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    accountType: { type: String, enum: ["worker", "contractor"] },
    passwordHash: { type: String },
    roles: { type: [String], enum: allowedRoles as any, default: [] },
    activeRole: { type: String, enum: allowedRoles as any },
    isActive: { type: Boolean, default: true },
    isPhoneVerified: { type: Boolean, default: false },
    profilePictureUrl: { type: String, trim: true },
    profilePicturePublicId: { type: String, trim: true },
    profession: { type: String, trim: true },
    skills: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0 },
    pricingType: { type: String, enum: ["hour", "day", "job"] },
    pricingAmount: { type: Number },
    availability: { type: Boolean, default: true },
    languages: { type: [String], default: [] },
    about: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });

export default mongoose.model<IUser>("User", userSchema);
