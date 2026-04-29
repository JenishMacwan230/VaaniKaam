import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import User, { allowedRoles } from "../models/User";
import OtpCode from "../models/OtpCode";
import { verifyFirebaseToken } from "../config/firebase";

const AUTH_COOKIE_NAME = "authToken";
const AUTH_COOKIE_MAX_AGE_MS = 15 * 24 * 60 * 60 * 1000;

// Helper function to format user response with id field
const formatUserResponse = (user: any) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  if (userObj._id && !userObj.id) {
    userObj.id = userObj._id.toString();
  }
  return userObj;
};

const createToken = (user: any) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ userId: user._id.toString(), activeRole: user.activeRole }, secret, { expiresIn: "15d" });
};

const setAuthCookie = (res: Response, token: string) => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    path: "/",
  });
};

const clearAuthCookie = (res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
};

// FIRST TIME: Firebase Phone Verification + Set Password
export const firebaseAuth = async (req: Request, res: Response) => {
  try {
    const { firebaseToken, name, email, password, location, accountType } = req.body || {};
    
    if (!firebaseToken) {
      return res.status(400).json({ message: "Firebase token is required" });
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

    const decodedToken = await verifyFirebaseToken(firebaseToken);
    
    if (!decodedToken) {
      return res.status(401).json({ message: "Invalid Firebase token" });
    }

    const phone = decodedToken.phone_number;
    
    if (!phone) {
      return res.status(400).json({ message: "Phone number not found in token" });
    }

    // Check if user already exists
    let user = await User.findOne({ phone });

    if (user) {
      return res.status(409).json({ 
        message: "Phone number already registered. Please login with password.", 
        shouldUsePasswordLogin: true 
      });
    }

    // Create new user with password
    const passwordHash = await bcrypt.hash(password, 10);
    const initialRole = accountType === "contractor" ? "individual" : "worker";
    
    user = await User.create({
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

    return res.json({
      message: "Registration successful",
      user: formatUserResponse(user),
      token,
    });
  } catch (error) {
    console.error("Firebase auth error:", error);
    return res.status(500).json({
      message: "Failed to authenticate with Firebase",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// RETURNING USERS: Password Login
export const loginWithPassword = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body || {};
    
    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password are required" });
    }

    if (/\s/.test(password)) {
      return res.status(400).json({ message: "Password must not contain spaces" });
    }

    const user = await User.findOne({ phone });
    
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

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid phone or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const token = createToken(user);
    setAuthCookie(res, token);
    return res.json({ user: formatUserResponse(user), token });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Failed to login" });
  }
};

// FORGOT PASSWORD: Request OTP
export const requestPasswordResetOtp = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body || {};
    
    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(404).json({ message: "Phone number not registered" });
    }

    if (!user.isPhoneVerified) {
      return res.status(403).json({ message: "Phone not verified" });
    }

    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await OtpCode.deleteMany({ phone, purpose: "password-reset" });
    await OtpCode.create({ phone, codeHash, expiresAt, purpose: "password-reset" });
    
    const response: any = { message: "OTP sent for password reset" };
    
    // Debug mode: return OTP in response
    if (process.env.OTP_DEBUG === "true") {
      response.otp = code;
      response.note = "Debug mode: OTP shown in response";
    }
    
    return res.json(response);
  } catch (error) {
    console.error("Request password reset OTP error:", error);
    return res.status(500).json({ message: "Failed to request OTP" });
  }
};

// FORGOT PASSWORD: Verify OTP and Reset Password
export const resetPasswordWithOtp = async (req: Request, res: Response) => {
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

    const otpRecord = await OtpCode.findOne({ phone, purpose: "password-reset" });
    
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(401).json({ message: "OTP expired or not found" });
    }

    const isOtpValid = await bcrypt.compare(otp, otpRecord.codeHash);
    
    if (!isOtpValid) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Delete used OTP
    await OtpCode.deleteMany({ phone, purpose: "password-reset" });

    const token = createToken(user);
    setAuthCookie(res, token);
    
    return res.json({ 
      message: "Password reset successful",
      user: formatUserResponse(user),
      token 
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
};

export const addRole = async (req: Request & any, res: Response) => {
  try {
    const { role } = req.body || {};
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: "Invalid role" });
    if (!user.roles.includes(role)) user.roles.push(role);
    if (!user.activeRole) user.activeRole = role;
    await user.save();
    return res.json({ user: formatUserResponse(user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add role" });
  }
};

export const switchRole = async (req: Request & any, res: Response) => {
  try {
    const { role } = req.body || {};
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: "Invalid role" });
    if (!user.roles.includes(role)) return res.status(403).json({ message: "Role not assigned" });
    user.activeRole = role;
    await user.save();
    return res.json({ user: formatUserResponse(user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to switch role" });
  }
};

export const getMe = async (req: Request & any, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    return res.json({ user: formatUserResponse(req.user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};

export const updateProfile = async (req: Request & any, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const {
      name,
      location,
      normalizedLocation,
      latitude,
      longitude,
      profession,
      skills,
      experienceYears,
      pricingType,
      pricingAmount,
      availability,
      languages,
      about,
    } = req.body || {};

    if (typeof name === "string") user.name = name.trim();
    if (typeof location === "string") user.location = location.trim();
    if (typeof normalizedLocation === "string") user.normalizedLocation = normalizedLocation.trim();

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

    if (typeof profession === "string") user.profession = profession.trim();

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
    } else if (pricingAmount === "") {
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
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

export const logout = async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  return res.json({ message: "Logged out" });
};

// CHECK IF PHONE EXISTS
export const checkPhoneExists = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body || {};
    
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const user = await User.findOne({ phone });
    
    return res.json({ 
      exists: !!user,
      message: user ? "Phone number already registered. Please login with password." : "Phone number available"
    });
  } catch (error) {
    console.error("Check phone exists error:", error);
    return res.status(500).json({ message: "Failed to check phone number" });
  }
};

// VERIFY RECAPTCHA TOKEN
// Firebase Phone Authentication is handled client-side
// Client receives SMS via Firebase, verifies code, then sends token to /register endpoint

// SAVE PROFILE PICTURE URL
export const saveProfilePicture = async (req: Request & any, res: Response) => {
  try {
    const { profilePictureUrl, publicId } = req.body || {};
    const user = req.user;

    if (!user) return res.status(401).json({ message: "Unauthorized" });

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
  } catch (error) {
    console.error("Save profile picture error:", error);
    return res.status(500).json({ message: "Failed to save profile picture" });
  }
};

// DELETE PROFILE PICTURE
export const deleteProfilePicture = async (req: Request & any, res: Response) => {
  try {
    const { publicId } = req.body || {};
    const user = req.user;

    if (!user) return res.status(401).json({ message: "Unauthorized" });

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
      } else {
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = crypto
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
    } catch (error) {
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
  } catch (error) {
    console.error("Delete profile picture error:", error);
    return res.status(500).json({ message: "Failed to delete profile picture" });
  }
};

