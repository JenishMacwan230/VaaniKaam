// Firebase Phone Authentication SMS Configuration
// This is the SMS provider for VaaniKaam OTP system

/**
 * ============================================================================
 * FIREBASE PHONE AUTHENTICATION (Built-in Solution)
 * ============================================================================
 * 
 * Firebase Phone Authentication handles SMS delivery automatically through
 * its secure SMS gateway. No additional credentials needed.
 * 
 * How it works:
 * 1. User enters phone number in registration form
 * 2. Server generates OTP and stores hash in MongoDB
 * 3. Server sends OTP via Firebase SMS (sendOTPviaSMS function)
 * 4. User receives SMS on their phone
 * 5. User enters OTP in app
 * 6. Server verifies OTP against stored hash
 * 7. Registration complete
 * 
 * Setup:
 * ✅ Already configured in your Firebase project
 * ✅ Admin SDK initialized with service account
 * ✅ Ready to use!
 * 
 * Implementation:
 * @see server/src/utils/sendSMS.ts - sendOTPviaSMS() function
 * @see server/src/controllers/userController.ts - sendOtp() endpoint
 * @see server/src/models/OtpCode.ts - MongoDB OTP schema
 */

export const FIREBASE_SMS_CONFIG = {
  provider: "Firebase Phone Authentication",
  status: "Active",
  useCase: "Custom OTP verification with secure hash storage",
  features: [
    "Automatic SMS delivery",
    "Secure OTP hashing with bcrypt",
    "MongoDB persistence with TTL expiration",
    "10-minute OTP validity",
    "International number support",
  ],
  architecture: {
    step1: "User submits phone number",
    step2: "Server generates random 6-digit OTP",
    step3: "Server hashes OTP with bcrypt",
    step4: "Server stores hash in MongoDB",
    step5: "Server sends OTP via Firebase SMS",
    step6: "User receives SMS on phone",
    step7: "User enters OTP in app",
    step8: "Server compares with stored hash",
    step9: "Registration successful",
  },
};

/**
 * Code Usage Example
 * 
 * In userController.ts sendOtp() function:
 * 
 * // Generate OTP
 * const otp = Math.floor(100000 + Math.random() * 900000).toString();
 * const otpHash = await bcrypt.hash(otp, 10);
 * 
 * // Store in MongoDB
 * await OtpCode.create({
 *   phone: phoneNumber,
 *   codeHash: otpHash,
 *   expiresAt: new Date(Date.now() + 10 * 60 * 1000),
 *   purpose: "phone-verification",
 * });
 * 
 * // Send via Firebase
 * const smsSent = await sendOTPviaSMS(phoneNumber, otp);
 * 
 * // Return success
 * return res.json({ message: "OTP sent successfully" });
 */

export const FIREBASE_SMS_BENEFITS = {
  noCost: "No additional charges - SMS included with Firebase service",
  trustworthy: "Google-backed service with enterprise reliability",
  integrated: "Already set up with your Firebase Admin SDK",
  secure: "OTP never stored in plain text, only bcrypt hash",
  scalable: "Handles millions of SMS per day",
  international: "Supports phone numbers from 190+ countries",
};

export const FILES_INVOLVED = {
  sendSMS: "server/src/utils/sendSMS.ts - SMS sending logic",
  userController: "server/src/controllers/userController.ts - OTP flow",
  otpModel: "server/src/models/OtpCode.ts - MongoDB schema",
  firebaseConfig: "server/src/config/firebase.ts - Firebase initialization",
  environment: "server/.env - Project settings and keys",
};

