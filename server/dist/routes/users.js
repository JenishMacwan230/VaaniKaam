"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyAuthToken_1 = __importDefault(require("../middleware/verifyAuthToken"));
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
// CHECK IF PHONE EXISTS (before sending OTP)
router.post("/check-phone", userController_1.checkPhoneExists);
// FIRST TIME: Firebase Phone Authentication + Set password
// Firebase handles SMS sending, client sends verified Firebase token
router.post("/register", userController_1.firebaseAuth);
// RETURNING USERS: Password login
router.post("/login", userController_1.loginWithPassword);
// FORGOT PASSWORD: Request OTP
router.post("/forgot-password", userController_1.requestPasswordResetOtp);
// FORGOT PASSWORD: Verify OTP and reset
router.post("/reset-password", userController_1.resetPasswordWithOtp);
router.post("/logout", userController_1.logout);
router.post("/add-role", verifyAuthToken_1.default, userController_1.addRole);
router.post("/switch-role", verifyAuthToken_1.default, userController_1.switchRole);
router.get("/me", verifyAuthToken_1.default, userController_1.getMe);
router.patch("/profile", verifyAuthToken_1.default, userController_1.updateProfile);
// PROFILE PICTURE MANAGEMENT
router.post("/profile-picture", verifyAuthToken_1.default, userController_1.saveProfilePicture);
router.delete("/profile-picture", verifyAuthToken_1.default, userController_1.deleteProfilePicture);
exports.default = router;
