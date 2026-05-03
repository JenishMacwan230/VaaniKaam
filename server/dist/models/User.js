"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedRoles = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.allowedRoles = ["admin", "worker", "company", "individual"];
const userSchema = new mongoose_1.Schema({
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true, required: true, unique: true },
    location: { type: String, trim: true },
    normalizedLocation: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    accountType: { type: String, enum: ["worker", "contractor"] },
    passwordHash: { type: String },
    roles: { type: [String], enum: exports.allowedRoles, default: [] },
    activeRole: { type: String, enum: exports.allowedRoles },
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
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
}, { timestamps: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
exports.default = mongoose_1.default.model("User", userSchema);
