"use client";

import { useState } from "react";
import { signInWithPhoneNumber, ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function PhoneAuthCard() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [step, setStep] = useState<"phone" | "otp" | "details">("phone");

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
      });
    }
    return (window as any).recaptchaVerifier;
  };

  const sendOTP = async () => {
    setLoading(true);
    setError(null);

    try {
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
      const recaptchaVerifier = setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      
      setConfirmationResult(confirmation);
      setStep("otp");
      setError(null);
    } catch (err: any) {
      console.error("Send OTP error:", err);
      
      if (err.code === "auth/billing-not-enabled") {
        setError("Firebase Phone Auth requires Blaze plan. Please upgrade or use test numbers.");
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

  const verifyOTP = async () => {
    if (!confirmationResult) {
      setError("Please request OTP first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();
      
      setStep("details");
      setError(null);
    } catch (err: any) {
      console.error("Verify OTP error:", err);

      if (err.code === "auth/invalid-verification-code") {
        setError("Invalid OTP. Please try again.");
      } else if (err.code === "auth/code-expired") {
        setError("OTP expired. Please request a new one.");
      } else {
        setError(err.message || "Failed to verify OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Authentication failed");
        return;
      }

      const firebaseToken = await user.getIdToken();

      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          firebaseToken,
          name,
          email,
          password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.shouldUsePasswordLogin) {
          // Phone already registered, redirect to login
          window.location.href = "/login";
          return;
        }
        setError(data.message || "Registration failed");
        return;
      }

      // Store token
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Redirect to home
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
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

        <div id="recaptcha-container"></div>

        {step === "phone" && (
          <div className="space-y-5">
            <label className="space-y-2 text-sm font-medium">
              <span>Mobile number</span>
              <input
                type="tel"
                placeholder="Enter 10 digit number"
                value={phoneNumber}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhoneNumber(digitsOnly);
                }}
                disabled={loading}
                maxLength={10}
                className="w-full rounded-2xl border border-input bg-background/40 px-4 py-3 text-base shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </label>
            
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button 
              onClick={sendOTP} 
              disabled={loading || phoneNumber.length !== 10}
              className="w-full rounded-2xl bg-linear-to-r from-primary via-secondary to-accent py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-5">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-sm text-green-700">OTP sent to +91{phoneNumber}</p>
            </div>

            <label className="space-y-2 text-sm font-medium">
              <span>Enter OTP</span>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                disabled={loading}
                className="w-full rounded-2xl border border-input bg-background/40 px-4 py-3 text-base shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </label>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button 
              onClick={verifyOTP} 
              disabled={loading || otp.length !== 6}
              className="w-full rounded-2xl bg-linear-to-r from-primary via-secondary to-accent py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-5">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-sm text-green-700">✓ Phone verified! Complete your profile.</p>
            </div>

            <label className="space-y-2 text-sm font-medium">
              <span>Name</span>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full rounded-2xl border border-input bg-background/40 px-4 py-3 text-base shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              <span>Email (optional)</span>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-2xl border border-input bg-background/40 px-4 py-3 text-base shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              <span>Password</span>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-2xl border border-input bg-background/40 px-4 py-3 text-base shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              <span>Confirm Password</span>
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-2xl border border-input bg-background/40 px-4 py-3 text-base shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </label>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button 
              onClick={completeRegistration} 
              disabled={loading || !password || !name}
              className="w-full rounded-2xl bg-linear-to-r from-primary via-secondary to-accent py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
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
