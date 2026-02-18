import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { allowedRoles } from "../models/User";
import { verifyFirebaseToken } from "../config/firebase";

const createToken = (user: any) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ userId: user._id.toString(), activeRole: user.activeRole }, secret, { expiresIn: "7d" });
};

// FIRST TIME: Firebase Phone Verification + Set Password
export const firebaseAuth = async (req: Request, res: Response) => {
  try {
    const { firebaseToken, name, email, password } = req.body || {};
    
    if (!firebaseToken) {
      return res.status(400).json({ message: "Firebase token is required" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password is required and must be at least 6 characters" });
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
    
    user = await User.create({
      name: name || decodedToken.name,
      email: email || decodedToken.email,
      phone,
      passwordHash,
      roles: ["worker"],
      activeRole: "worker",
      isPhoneVerified: true,
    });

    const token = createToken(user);

    return res.json({
      message: "Registration successful",
      user,
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
    return res.json({ user, token });
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
    
    return res.json({ 
      message: "Password reset successful",
      user,
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
    return res.json({ user });
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
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to switch role" });
  }
};

export const getMe = async (req: Request & any, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    return res.json({ user: req.user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};

// VERIFY RECAPTCHA TOKEN
// Firebase Phone Authentication is handled client-side
// Client receives SMS via Firebase, verifies code, then sends token to /register endpoint

