"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Phone, Lock, Mail, User, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from "firebase/auth";
import { app } from "@/lib/firebase";

// Extend Window interface for RecaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    grecaptcha?: any;
  }
}

interface PhoneAuthCardProps {
  onStepChange?: (step: "phone" | "otp" | "details") => void;
}

export default function PhoneAuthCard({ onStepChange }: PhoneAuthCardProps) {
  const auth = getAuth(app);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<"phone" | "otp" | "details">("phone");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Cleanup RecaptchaVerifier on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          delete window.recaptchaVerifier;
        } catch (error) {
          // Silently ignore cleanup errors
        }
      }
    };
  }, []);

  const sendOTP = async () => {
    console.log("sendOTP: Starting Firebase phone sign in");
    console.log("sendOTP: Phone number:", phoneNumber);

    // Prevent double submission
    if (loading) {
      console.warn("sendOTP: Already in progress");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!phoneNumber) {
        console.warn("sendOTP: No phone number");
        setError("Please enter a valid phone number");
        setLoading(false);
        return;
      }

      // Format phone number with +91 prefix for India
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
      console.log("sendOTP: Formatted phone:", formattedPhone);

      // Check if phone number already exists BEFORE sending OTP
      console.log("sendOTP: Checking if phone number is already registered");
      const checkResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/check-phone`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: formattedPhone }),
        }
      );

      const checkData = await checkResponse.json();

      if (checkData.exists) {
        console.log("sendOTP: Phone number already registered");
        setError("Phone number already registered. Please login with password.");
        setLoading(false);
        return;
      }

      console.log("sendOTP: Phone number available, proceeding with OTP");

      // Check if RecaptchaVerifier is initialized, if not create it
      if (!window.recaptchaVerifier) {
        console.log("sendOTP: RecaptchaVerifier not initialized, creating now");
        try {
          const verifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            { 
              size: "invisible",
              callback: (response: string) => {
                console.log("RecaptchaVerifier: Success");
              }
            }
          );
          
          // For invisible reCAPTCHA, Firebase handles rendering automatically
          // No need to call render() explicitly
          console.log("sendOTP: RecaptchaVerifier created successfully");
          
          window.recaptchaVerifier = verifier;
        } catch (e) {
          console.error("sendOTP: Failed to create RecaptchaVerifier:", e);
          setError("reCAPTCHA initialization failed. Please reload the page.");
          setLoading(false);
          return;
        }
      }

      console.log("sendOTP: Using RecaptchaVerifier for Firebase authentication");

      // Sign in with phone number - Firebase will send SMS automatically with reCAPTCHA verification
      console.log("sendOTP: Calling Firebase signInWithPhoneNumber");
      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier
      );

      console.log("sendOTP: Firebase sent SMS successfully");
      setConfirmationResult(result);
      setSuccess("SMS sent! Enter the code sent to your phone.");
      setStep("otp");
      onStepChange?.("otp");

      // Clear the verifier after successful use so a new one is created on retry
      // This prevents reuse issues and expired token problems
      try {
        window.recaptchaVerifier?.clear();
        delete window.recaptchaVerifier;
        console.log("sendOTP: Cleared verifier after successful send");
      } catch (e) {
        console.log("sendOTP: Couldn't clear verifier (already cleared)");
      }
    } catch (err: any) {
      console.error("sendOTP: Firebase error:", err);
      console.error("sendOTP: Error code:", err.code);
      console.error("sendOTP: Error message:", err.message);

      // Handle specific Firebase errors
      if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number. Please check the number and try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many requests. You've exceeded the SMS limit (10 per day). Please try again tomorrow or use test numbers for development.");
      } else if (err.code === "auth/invalid-app-credential") {
        setError("reCAPTCHA verification failed. This might be a domain authorization issue. Please check: 1) Firebase Console > Authentication > Sign-in method > Phone is enabled, 2) Your domain is authorized in Firebase Console.");
        // Clear invalid verifier so it can be recreated
        try {
          window.recaptchaVerifier?.clear();
          delete window.recaptchaVerifier;
        } catch (e) {
          console.log("Could not clear verifier");
        }
      } else if (err.code === "auth/missing-app-credential") {
        setError("Missing reCAPTCHA credential. Ensure reCAPTCHA script is loaded.");
        try {
          window.recaptchaVerifier?.clear();
          delete window.recaptchaVerifier;
        } catch (e) {
          console.log("Could not clear verifier");
        }
      } else if (err.code === "auth/quota-exceeded") {
        setError("Daily quota exceeded. Please try again tomorrow or contact support.");
      } else {
        setError(err.message || "Failed to send SMS. Please try again.");
      }

      // Clear the verifier on error too, so next attempt uses a fresh one
      try {
        window.recaptchaVerifier?.clear();
        delete window.recaptchaVerifier;
        console.log("sendOTP: Cleared verifier after error");
      } catch (e) {
        console.log("sendOTP: Couldn't clear verifier on error");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!otp || otp.length !== 6) {
        setError("Please enter a valid 6-digit code");
        setLoading(false);
        return;
      }

      if (!confirmationResult) {
        setError("Please request a new SMS code");
        setLoading(false);
        return;
      }

      console.log("verifyOTP: Verifying code with Firebase");

      // Confirm the code with Firebase
      const userCredential = await confirmationResult.confirm(otp);
      const idToken = await userCredential.user.getIdToken();

      console.log("verifyOTP: Firebase verification successful");
      setSuccess("Code verified! Please enter your details.");
      setStep("details");
      onStepChange?.("details");

      // Store Firebase token for later use
      localStorage.setItem("firebaseToken", idToken);
    } catch (err: any) {
      console.error("verifyOTP: Firebase error:", err);

      if (err.code === "auth/invalid-verification-code") {
        setError("Invalid code. Please check and try again.");
      } else if (err.code === "auth/code-expired") {
        setError("Code expired. Please request a new SMS.");
      } else {
        setError(err.message || "Failed to verify code");
      }
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!name || !password) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      const firebaseToken = localStorage.getItem("firebaseToken");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`,
            firebaseToken, // Firebase verification token
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.shouldLogin) {
          throw new Error("Phone already registered. Please login instead.");
        }
        throw new Error(data.message || "Registration failed");
      }

      // Store token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.removeItem("firebaseToken"); // Clean up

      setSuccess("Registration successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const resetVerification = () => {
    console.log("resetVerification: Resetting to phone step");
    setConfirmationResult(null);
    setOtp("");
    setError(null);
    
    // Clear verifier so a fresh one is created on next send attempt
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
        delete window.recaptchaVerifier;
        console.log("resetVerification: Cleared verifier for next attempt");
      } catch (e) {
        console.log("resetVerification: Could not clear verifier");
      }
    }
  };

  return (
    <section className="relative rounded-3xl border border-border bg-card p-8 shadow-2xl">
      <div className="absolute inset-x-12 top-6 h-1 rounded-full bg-linear-to-r from-primary via-secondary to-accent opacity-60" />
      <div className="relative space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">First time registration</p>
          <h2 className="text-3xl font-semibold">Create account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Verify your phone number to get started.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {step === "phone" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Mobile number</Label>
            </div>
            <Input
              type="tel"
              placeholder="Enter 10 digit number"
              value={phoneNumber}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                setPhoneNumber(digitsOnly);
              }}
              disabled={loading}
              maxLength={10}
              className="rounded-2xl border border-input bg-background/40 px-4 py-6 text-base font-semibold shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />

            {/* Firebase RecaptchaVerifier Container - Empty for invisible mode */}
            <div id="recaptcha-container"></div>

            <Button
              onClick={sendOTP}
              disabled={loading || phoneNumber.length !== 10}
              className="w-full rounded-2xl bg-linear-to-r from-primary via-secondary to-accent py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending SMS..." : "Send SMS"}
            </Button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-5">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-sm text-green-700">SMS code sent to +91 {phoneNumber}</p>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Enter verification code</Label>
            </div>
            <Input
              type="text"
              placeholder="Enter 6-digit code from SMS"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              disabled={loading}
              className="rounded-2xl border border-input bg-background/40 px-4 py-6 text-base font-semibold shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />

            <Button
              onClick={verifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full rounded-2xl bg-linear-to-r from-primary via-secondary to-accent py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep("phone");
                resetVerification();
              }}
              className="w-full text-primary hover:underline text-sm font-medium"
            >
              Back to phone number
            </button>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-5">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-sm text-green-700">✓ Phone verified! Complete your profile.</p>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Name</Label>
            </div>
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="rounded-2xl border border-input bg-background/40 px-4 py-3 text-base font-semibold shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Email (optional)</Label>
            </div>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="rounded-2xl border border-input bg-background/40 px-4 py-3 text-base font-semibold shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />

            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Password</Label>
            </div>
            <Input
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="rounded-2xl border border-input bg-background/40 px-4 py-3 text-base font-semibold shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />

            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Confirm Password</Label>
            </div>
            <Input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="rounded-2xl border border-input bg-background/40 px-4 py-3 text-base font-semibold shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />

            <Button
              onClick={completeRegistration}
              disabled={loading || !password || !name}
              className="w-full rounded-2xl bg-linear-to-r from-primary via-secondary to-accent py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </section>
  );
}
