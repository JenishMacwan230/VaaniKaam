'use client';

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"phone" | "otp" | "newPassword">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpFromServer, setOtpFromServer] = useState("");

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digitsOnly);
  };

  const requestOTP = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${phone}` }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to send OTP");
        return;
      }

      // In debug mode, OTP is returned in response
      if (data.otp) {
        setOtpFromServer(data.otp);
      }

      setStep("otp");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `+91${phone}`,
          otp,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to reset password");
        return;
      }

      // Store token
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to home
      window.location.href = "/";
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-16">
      <section className="relative w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <div className="absolute inset-x-12 top-6 h-1 rounded-full bg-linear-to-r from-primary via-secondary to-accent opacity-60" />
        <div className="relative space-y-8">
          <div>
            <p className="text-sm font-medium text-primary">Password recovery</p>
            <h2 className="text-3xl font-semibold">Reset password</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === "phone" && "Enter your registered mobile number"}
              {step === "otp" && "Enter the OTP sent to your phone"}
              {step === "newPassword" && "Set your new password"}
            </p>
          </div>

          {step === "phone" && (
            <div className="space-y-5">
              <label className="space-y-2 text-sm font-medium">
                <span>Mobile number</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="^\\d{10}$"
                  maxLength={10}
                  placeholder="Enter 10 digit number"
                  value={phone}
                  onChange={handlePhoneChange}
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
                onClick={requestOTP}
                disabled={loading || phone.length !== 10}
                className="w-full rounded-2xl bg-linear-to-r from-primary via-secondary to-accent py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-5">
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <p className="text-sm text-green-700">OTP sent to +91{phone}</p>
                {otpFromServer && (
                  <p className="text-xs text-green-600 mt-1">Debug: OTP is {otpFromServer}</p>
                )}
              </div>

              <label className="space-y-2 text-sm font-medium">
                <span>Enter OTP</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={loading}
                  className="w-full rounded-2xl border border-input bg-background/40 px-4 py-3 text-base shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span>New password</span>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-2xl border border-input bg-background/40 px-4 py-3 text-base shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span>Confirm password</span>
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
                onClick={resetPassword}
                disabled={loading || otp.length !== 6 || !newPassword || !confirmPassword}
                className="w-full rounded-2xl bg-linear-to-r from-primary via-secondary to-accent py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
