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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicStats = exports.getWorkerProfile = exports.getPublicWorkers = exports.deleteProfilePicture = exports.saveProfilePicture = exports.checkPhoneExists = exports.logout = exports.updateProfile = exports.getMe = exports.switchRole = exports.addRole = exports.resetPasswordWithOtp = exports.requestPasswordResetOtp = exports.loginWithPassword = exports.firebaseAuth = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const User_1 = __importStar(require("../models/User"));
const Job_1 = __importDefault(require("../models/Job"));
const OtpCode_1 = __importDefault(require("../models/OtpCode"));
const firebase_1 = require("../config/firebase");
const AUTH_COOKIE_NAME = "authToken";
const AUTH_COOKIE_MAX_AGE_MS = 15 * 24 * 60 * 60 * 1000;
// Helper function to format user response with id field
const formatUserResponse = (user) => {
    const userObj = user.toObject ? user.toObject() : { ...user };
    if (userObj._id && !userObj.id) {
        userObj.id = userObj._id.toString();
    }
    return userObj;
};
const createToken = (user) => {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error("JWT_SECRET is not set");
    return jsonwebtoken_1.default.sign({ userId: user._id.toString(), activeRole: user.activeRole }, secret, { expiresIn: "15d" });
};
const setAuthCookie = (res, token) => {
    res.cookie(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: AUTH_COOKIE_MAX_AGE_MS,
        path: "/",
    });
};
const clearAuthCookie = (res) => {
    res.clearCookie(AUTH_COOKIE_NAME, {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });
};
const firebaseAuth = async (req, res) => {
    try {
        const { firebaseToken, name, email, password, location, accountType } = req.body || {};
        if (!firebaseToken) {
            console.warn("⚠️ Registration attempted without Firebase token");
            return res.status(400).json({
                message: "Firebase token is required. Please complete phone verification."
            });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: "Password is required and must be at least 6 characters" });
        }
        if (/\s/.test(password)) {
            return res.status(400).json({ message: "Password must not contain spaces" });
        }
        if (!location || typeof location !== "string" || !location.trim()) {
            return res.status(400).json({ message: "Location is required" });
        }
        if (accountType !== "worker" && accountType !== "contractor") {
            return res.status(400).json({ message: "Valid account type is required" });
        }
        console.log("📝 Attempting Firebase token verification for registration...");
        const decodedToken = await (0, firebase_1.verifyFirebaseToken)(firebaseToken);
        if (!decodedToken) {
            console.error("❌ Firebase token verification failed - token invalid or Firebase not configured");
            return res.status(401).json({
                message: "Phone verification failed. Please request a new SMS code and try again.",
                error: "FIREBASE_TOKEN_INVALID"
            });
        }
        const phone = decodedToken.phone_number;
        if (!phone) {
            console.error("❌ Phone number not found in Firebase token");
            return res.status(400).json({ message: "Phone number not found in verification token" });
        }
        console.log("✅ Firebase token verified. Phone:", phone);
        // Check if user already exists
        let user = await User_1.default.findOne({ phone });
        if (user) {
            console.log("⚠️ User already exists with phone:", phone);
            return res.status(409).json({
                message: "Phone number already registered. Please login with password.",
                shouldUsePasswordLogin: true
            });
        }
        // Create new user with password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const initialRole = accountType === "contractor" ? "individual" : "worker";
        user = await User_1.default.create({
            name: name || decodedToken.name,
            email: email || decodedToken.email,
            phone,
            location: location.trim(),
            accountType,
            passwordHash,
            roles: [initialRole],
            activeRole: initialRole,
            isPhoneVerified: true,
        });
        const token = createToken(user);
        setAuthCookie(res, token);
        console.log("✅ New user registered successfully. Phone:", phone);
        return res.json({
            message: "Registration successful",
            user: formatUserResponse(user),
            token,
        });
    }
    catch (error) {
        console.error("❌ Firebase auth error:", error);
        return res.status(500).json({
            message: "Failed to authenticate with Firebase",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.firebaseAuth = firebaseAuth;
// RETURNING USERS: Password Login
const loginWithPassword = async (req, res) => {
    try {
        const { phone, password } = req.body || {};
        if (!phone || !password) {
            return res.status(400).json({ message: "Phone and password are required" });
        }
        if (/\s/.test(password)) {
            return res.status(400).json({ message: "Password must not contain spaces" });
        }
        const user = await User_1.default.findOne({ phone });
        if (!user) {
            return res.status(401).json({ message: "Invalid phone or password" });
        }
        if (!user.isPhoneVerified) {
            return res.status(403).json({
                message: "Phone not verified. Please complete phone verification first.",
                shouldVerifyPhone: true
            });
        }
        if (!user.passwordHash) {
            return res.status(401).json({
                message: "No password set. Please complete registration first.",
                shouldVerifyPhone: true
            });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid phone or password" });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: "Account is deactivated" });
        }
        const token = createToken(user);
        setAuthCookie(res, token);
        return res.json({ user: formatUserResponse(user), token });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Failed to login" });
    }
};
exports.loginWithPassword = loginWithPassword;
// FORGOT PASSWORD: Request OTP
const requestPasswordResetOtp = async (req, res) => {
    try {
        const { phone } = req.body || {};
        if (!phone) {
            return res.status(400).json({ message: "Phone is required" });
        }
        const user = await User_1.default.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: "Phone number not registered" });
        }
        if (!user.isPhoneVerified) {
            return res.status(403).json({ message: "Phone not verified" });
        }
        // Generate OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const codeHash = await bcryptjs_1.default.hash(code, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await OtpCode_1.default.deleteMany({ phone, purpose: "password-reset" });
        await OtpCode_1.default.create({ phone, codeHash, expiresAt, purpose: "password-reset" });
        const response = { message: "OTP sent for password reset" };
        // Debug mode: return OTP in response
        if (process.env.OTP_DEBUG === "true") {
            response.otp = code;
            response.note = "Debug mode: OTP shown in response";
        }
        return res.json(response);
    }
    catch (error) {
        console.error("Request password reset OTP error:", error);
        return res.status(500).json({ message: "Failed to request OTP" });
    }
};
exports.requestPasswordResetOtp = requestPasswordResetOtp;
// FORGOT PASSWORD: Verify OTP and Reset Password
const resetPasswordWithOtp = async (req, res) => {
    try {
        const { phone, otp, newPassword } = req.body || {};
        if (!phone || !otp || !newPassword) {
            return res.status(400).json({ message: "Phone, OTP, and new password are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        if (/\s/.test(newPassword)) {
            return res.status(400).json({ message: "Password must not contain spaces" });
        }
        const otpRecord = await OtpCode_1.default.findOne({ phone, purpose: "password-reset" });
        if (!otpRecord || otpRecord.expiresAt < new Date()) {
            return res.status(401).json({ message: "OTP expired or not found" });
        }
        const isOtpValid = await bcryptjs_1.default.compare(otp, otpRecord.codeHash);
        if (!isOtpValid) {
            return res.status(401).json({ message: "Invalid OTP" });
        }
        const user = await User_1.default.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Update password
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        await user.save();
        // Delete used OTP
        await OtpCode_1.default.deleteMany({ phone, purpose: "password-reset" });
        const token = createToken(user);
        setAuthCookie(res, token);
        return res.json({
            message: "Password reset successful",
            user: formatUserResponse(user),
            token
        });
    }
    catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ message: "Failed to reset password" });
    }
};
exports.resetPasswordWithOtp = resetPasswordWithOtp;
const addRole = async (req, res) => {
    try {
        const { role } = req.body || {};
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        if (!User_1.allowedRoles.includes(role))
            return res.status(400).json({ message: "Invalid role" });
        if (!user.roles.includes(role))
            user.roles.push(role);
        if (!user.activeRole)
            user.activeRole = role;
        await user.save();
        return res.json({ user: formatUserResponse(user) });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to add role" });
    }
};
exports.addRole = addRole;
const switchRole = async (req, res) => {
    try {
        const { role } = req.body || {};
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        if (!User_1.allowedRoles.includes(role))
            return res.status(400).json({ message: "Invalid role" });
        if (!user.roles.includes(role))
            return res.status(403).json({ message: "Role not assigned" });
        user.activeRole = role;
        await user.save();
        return res.json({ user: formatUserResponse(user) });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to switch role" });
    }
};
exports.switchRole = switchRole;
const getMe = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        return res.json({ user: formatUserResponse(req.user) });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to fetch user" });
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        const { name, location, normalizedLocation, latitude, longitude, profession, skills, experienceYears, pricingType, pricingAmount, availability, languages, about, } = req.body || {};
        if (typeof name === "string")
            user.name = name.trim();
        if (typeof location === "string")
            user.location = location.trim();
        if (typeof normalizedLocation === "string")
            user.normalizedLocation = normalizedLocation.trim();
        if (latitude !== undefined && latitude !== null) {
            const parsedLatitude = Number(latitude);
            if (Number.isNaN(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) {
                return res.status(400).json({ message: "Invalid latitude" });
            }
            user.latitude = parsedLatitude;
        }
        if (longitude !== undefined && longitude !== null) {
            const parsedLongitude = Number(longitude);
            if (Number.isNaN(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
                return res.status(400).json({ message: "Invalid longitude" });
            }
            user.longitude = parsedLongitude;
        }
        if (typeof profession === "string")
            user.profession = profession.trim();
        if (Array.isArray(skills)) {
            user.skills = skills.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean);
        }
        if (typeof experienceYears === "number" && Number.isFinite(experienceYears)) {
            user.experienceYears = Math.max(0, Math.min(40, Math.round(experienceYears)));
        }
        if (pricingType === "hour" || pricingType === "day" || pricingType === "job") {
            user.pricingType = pricingType;
        }
        if (pricingAmount !== undefined && pricingAmount !== null && pricingAmount !== "") {
            const parsedPrice = Number(pricingAmount);
            if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
                return res.status(400).json({ message: "Invalid pricing amount" });
            }
            user.pricingAmount = parsedPrice;
        }
        else if (pricingAmount === "") {
            user.pricingAmount = undefined;
        }
        if (typeof availability === "boolean") {
            user.availability = availability;
        }
        if (Array.isArray(languages)) {
            user.languages = languages.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean);
        }
        if (typeof about === "string") {
            user.about = about.trim().slice(0, 500);
        }
        await user.save();
        return res.json({
            message: "Profile updated successfully",
            user: formatUserResponse(user),
        });
    }
    catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({ message: "Failed to update profile" });
    }
};
exports.updateProfile = updateProfile;
const logout = async (_req, res) => {
    clearAuthCookie(res);
    return res.json({ message: "Logged out" });
};
exports.logout = logout;
// CHECK IF PHONE EXISTS
const checkPhoneExists = async (req, res) => {
    try {
        const { phone } = req.body || {};
        if (!phone) {
            return res.status(400).json({ message: "Phone number is required" });
        }
        const user = await User_1.default.findOne({ phone });
        return res.json({
            exists: !!user,
            message: user ? "Phone number already registered. Please login with password." : "Phone number available"
        });
    }
    catch (error) {
        console.error("Check phone exists error:", error);
        return res.status(500).json({ message: "Failed to check phone number" });
    }
};
exports.checkPhoneExists = checkPhoneExists;
// VERIFY RECAPTCHA TOKEN
// Firebase Phone Authentication is handled client-side
// Client receives SMS via Firebase, verifies code, then sends token to /register endpoint
// SAVE PROFILE PICTURE URL
const saveProfilePicture = async (req, res) => {
    try {
        const { profilePictureUrl, publicId } = req.body || {};
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        if (!profilePictureUrl) {
            return res.status(400).json({ message: "Profile picture URL is required" });
        }
        // Update user with new profile picture
        user.profilePictureUrl = profilePictureUrl;
        user.profilePicturePublicId = publicId || null;
        await user.save();
        return res.json({
            message: "Profile picture saved successfully",
            user: formatUserResponse(user)
        });
    }
    catch (error) {
        console.error("Save profile picture error:", error);
        return res.status(500).json({ message: "Failed to save profile picture" });
    }
};
exports.saveProfilePicture = saveProfilePicture;
// DELETE PROFILE PICTURE
const deleteProfilePicture = async (req, res) => {
    try {
        const { publicId } = req.body || {};
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        if (!publicId) {
            return res.status(400).json({ message: "Public ID is required" });
        }
        // Delete from Cloudinary using backend API
        try {
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            const apiKey = process.env.CLOUDINARY_API_KEY;
            const apiSecret = process.env.CLOUDINARY_API_SECRET;
            if (!cloudName || !apiKey || !apiSecret) {
                console.warn("Cloudinary credentials not configured for deletion");
            }
            else {
                const timestamp = Math.floor(Date.now() / 1000);
                const signature = node_crypto_1.default
                    .createHash("sha1")
                    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
                    .digest("hex");
                await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        public_id: publicId,
                        api_key: apiKey,
                        timestamp: timestamp.toString(),
                        signature,
                    }).toString(),
                });
            }
        }
        catch (error) {
            console.warn("Failed to delete from Cloudinary:", error);
            // Continue anyway - remove from database
        }
        // Remove from user profile
        user.profilePictureUrl = undefined;
        user.profilePicturePublicId = undefined;
        await user.save();
        return res.json({
            message: "Profile picture deleted successfully",
            user: formatUserResponse(user)
        });
    }
    catch (error) {
        console.error("Delete profile picture error:", error);
        return res.status(500).json({ message: "Failed to delete profile picture" });
    }
};
exports.deleteProfilePicture = deleteProfilePicture;
// GET PUBLIC WORKERS
const getPublicWorkers = async (_req, res) => {
    try {
        const workers = await User_1.default.find({ roles: "worker", isActive: true })
            .select("name phone location profession availability averageRating totalRatings profilePictureUrl latitude longitude skills")
            .lean();
        return res.json({
            success: true,
            workers: workers.map((w) => ({
                ...w,
                id: w._id.toString()
            }))
        });
    }
    catch (error) {
        console.error("Get public workers error:", error);
        return res.status(500).json({ message: "Failed to fetch workers" });
    }
};
exports.getPublicWorkers = getPublicWorkers;
const getWorkerProfile = async (req, res) => {
    try {
        const { id } = req.params;
        // Return public profile for any active user (worker or contractor)
        const user = await User_1.default.findOne({ _id: id, isActive: true })
            .select("name phone email location profession availability averageRating totalRatings profilePictureUrl latitude longitude skills about languages experienceYears pricingType pricingAmount normalizedLocation accountType roles")
            .lean();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Normalize response shape expected by client
        return res.json({
            user: {
                ...user,
                id: user._id ? user._id.toString() : undefined,
                description: user.about,
            },
        });
    }
    catch (error) {
        console.error("Get worker profile error:", error);
        return res.status(500).json({ message: "Failed to fetch user profile" });
    }
};
exports.getWorkerProfile = getWorkerProfile;
// GET PUBLIC STATS
const getPublicStats = async (_req, res) => {
    try {
        const totalUsers = await User_1.default.countDocuments({ isActive: true });
        const totalJobs = await Job_1.default.countDocuments();
        const usersWithRatings = await User_1.default.aggregate([
            { $match: { totalRatings: { $gt: 0 } } },
            { $group: { _id: null, avgRating: { $avg: "$averageRating" } } }
        ]);
        const avgRating = usersWithRatings.length > 0 ? Number(usersWithRatings[0].avgRating.toFixed(1)) : 4.8;
        return res.json({
            success: true,
            stats: {
                totalUsers,
                totalJobs,
                avgRating
            }
        });
    }
    catch (error) {
        console.error("Get public stats error:", error);
        return res.status(500).json({ message: "Failed to fetch stats" });
    }
};
exports.getPublicStats = getPublicStats;
