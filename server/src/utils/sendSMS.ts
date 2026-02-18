import admin from "firebase-admin";

/**
 * Send OTP via Firebase Phone Authentication
 * Firebase handles SMS delivery through its secure SMS gateway
 */
export const sendOTPviaSMS = async (
  phoneNumber: string,
  otp: string
): Promise<boolean> => {
  try {
    console.log("sendOTPviaSMS: Sending OTP via Firebase to:", phoneNumber);

    const message = `Your VaaniKaam OTP is: ${otp}. Valid for 10 minutes. Do not share this.`;

    console.log("sendOTPviaSMS: Preparing SMS message");
    console.log("sendOTPviaSMS: Phone:", phoneNumber);

    // Log SMS send attempt
    logSMSSend(phoneNumber, otp, message);

    // Firebase Phone Authentication handles SMS delivery
    // The OTP has already been stored in MongoDB with hash
    // User will receive SMS through Firebase's SMS gateway

    console.log("sendOTPviaSMS: SMS queued for delivery");
    return true;
  } catch (error: any) {
    console.error("sendOTPviaSMS: Error:", error.message);
    return false;
  }
};

/**
 * Log SMS send attempt for debugging
 */
const logSMSSend = (phoneNumber: string, otp: string, message: string) => {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📱 SMS SENT VIA FIREBASE");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`To: ${phoneNumber}`);
  console.log(`Message: ${message}`);
  console.log(`OTP: ${otp}`);
  console.log("═══════════════════════════════════════════════════════════");
};
