import mongoose, { Document, Schema } from "mongoose";

export interface ICompanyProfile extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  contactPerson?: string;
  address?: string;
}

const companyProfileSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    companyName: { type: String, trim: true, required: true },
    contactPerson: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICompanyProfile>("CompanyProfile", companyProfileSchema);
