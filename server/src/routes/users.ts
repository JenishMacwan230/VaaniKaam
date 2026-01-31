import express from "express";
import verifyAuthToken from "../middleware/verifyAuthToken";
import { 
  firebaseAuth, 
  loginWithPassword, 
  requestPasswordResetOtp, 
  resetPasswordWithOtp,
  addRole, 
  switchRole, 
  getMe 
} from "../controllers/userController";

const router = express.Router();

// FIRST TIME: Phone verification + Set password
router.post("/register", firebaseAuth);

// RETURNING USERS: Password login
router.post("/login", loginWithPassword);

// FORGOT PASSWORD: Request OTP
router.post("/forgot-password", requestPasswordResetOtp);

// FORGOT PASSWORD: Verify OTP and reset
router.post("/reset-password", resetPasswordWithOtp);

router.post("/add-role", verifyAuthToken, addRole as any);
router.post("/switch-role", verifyAuthToken, switchRole as any);
router.get("/me", verifyAuthToken, getMe as any);

export default router;
