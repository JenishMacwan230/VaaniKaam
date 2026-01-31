"use client";

import { useState } from "react";
import {
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth, setupRecaptcha } from "@/lib/firebase";

interface UsePhoneAuthReturn {
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  otp: string;
  setOtp: (otp: string) => void;
  loading: boolean;
  error: string | null;
  confirmationResult: ConfirmationResult | null;
  sendOTP: () => Promise<void>;
  verifyOTP: () => Promise<string | null>;
  quotaExceeded: boolean;
}

export const usePhoneAuth = (): UsePhoneAuthReturn => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const sendOTP = async () => {
    setLoading(true);
    setError(null);
    setQuotaExceeded(false);

    try {
      // Format phone number to E.164 format (+91XXXXXXXXXX)
      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+91${phoneNumber}`;

      // Setup reCAPTCHA
      const recaptchaVerifier = setupRecaptcha("recaptcha-container");

      // Send OTP via Firebase
      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifier
      );

      setConfirmationResult(confirmation);
      setError(null);
    } catch (err: any) {
      console.error("Send OTP error:", err);

      // Handle quota exceeded (10 SMS/day limit)
      if (err.code === "auth/quota-exceeded") {
        setQuotaExceeded(true);
        setError("Daily SMS limit exceeded (10/day). Try again tomorrow or use test numbers.");
      } else if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number format. Use +91XXXXXXXXXX");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.");
      } else {
        setError(err.message || "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (): Promise<string | null> => {
    if (!confirmationResult) {
      setError("Please request OTP first");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Verify OTP with Firebase
      const result = await confirmationResult.confirm(otp);
      
      // Get Firebase ID token
      const idToken = await result.user.getIdToken();
      
      setError(null);
      return idToken;
    } catch (err: any) {
      console.error("Verify OTP error:", err);

      if (err.code === "auth/invalid-verification-code") {
        setError("Invalid OTP. Please try again.");
      } else if (err.code === "auth/code-expired") {
        setError("OTP expired. Please request a new one.");
      } else {
        setError(err.message || "Failed to verify OTP");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    phoneNumber,
    setPhoneNumber,
    otp,
    setOtp,
    loading,
    error,
    confirmationResult,
    sendOTP,
    verifyOTP,
    quotaExceeded,
  };
};
