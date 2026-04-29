import express from "express";
import verifyAuthToken from "../middleware/verifyAuthToken";
import {
  firebaseAuth,
  loginWithPassword,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
  addRole,
  switchRole,
  getMe,
  updateProfile,
  logout,
  checkPhoneExists,
  saveProfilePicture,
  deleteProfilePicture,
  getPublicWorkers,
  getWorkerProfile,
} from "../controllers/userController";

const router = express.Router();

// CHECK IF PHONE EXISTS (before sending OTP)
router.post("/check-phone", checkPhoneExists);

// GET PUBLIC WORKERS
router.get("/public-workers", getPublicWorkers);

// GET PUBLIC WORKER PROFILE
router.get("/:id([0-9a-fA-F]{24})", getWorkerProfile);

// FIRST TIME: Firebase Phone Authentication + Set password
// Firebase handles SMS sending, client sends verified Firebase token
router.post("/register", firebaseAuth);

// RETURNING USERS: Password login
router.post("/login", loginWithPassword);

// FORGOT PASSWORD: Request OTP
router.post("/forgot-password", requestPasswordResetOtp);

// FORGOT PASSWORD: Verify OTP and reset
router.post("/reset-password", resetPasswordWithOtp);
router.post("/logout", logout);

router.post("/add-role", verifyAuthToken, addRole as any);
router.post("/switch-role", verifyAuthToken, switchRole as any);
router.get("/me", verifyAuthToken, getMe as any);
router.patch("/profile", verifyAuthToken, updateProfile as any);

// PROFILE PICTURE MANAGEMENT
router.post("/profile-picture", verifyAuthToken, saveProfilePicture as any);
router.delete("/profile-picture", verifyAuthToken, deleteProfilePicture as any);

export default router;
