'use client';

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import VoiceTextInput from "@/components/VoiceTextInput";
import VoicePhoneInput from "@/components/VoicePhoneInput";

// Language code mapping for voice
const getVoiceLanguage = (locale: string): string => {
  const mapping: Record<string, string> = {
    en: "en",
    hi: "hi",
    gu: "gu",
  };
  return mapping[locale] || "en";
}

const getOtpHint = (locale: string) => {
  switch(locale) {
    case 'hi': return 'कृपया अपने फोन पर भेजा गया छह अंकों का ओटीपी बोलें';
    case 'gu': return 'કૃપયા તમારા ફોન પર મોકલેલો છ આંકડાનો ઓટીપી બોલો';
    default: return 'Please say the 6-digit OTP sent to your phone';
  }
};

const getPasswordHint = (locale: string) => {
  switch(locale) {
    case 'hi': return 'कृपया अपना नया पासवर्ड बोलें या टाइप करें';
    case 'gu': return 'કૃપયા તમારો નવો પાસવર્ડ બોલો અથવા ટાઇપ કરો';
    default: return 'Please speak or type your new password';
  }
};

const getConfirmPasswordHint = (locale: string) => {
  switch(locale) {
    case 'hi': return 'पुष्टि करने के लिए कृपया अपना पासवर्ड फिर से बोलें या टाइप करें';
    case 'gu': return 'કન્ફર્મ કરવા માટે કૃપયા તમારો પાસવર્ડ ફરીથી બોલો અથવા ટાઇપ કરો';
    default: return 'Please speak or type your password again to confirm';
  }
};

function ForgotPasswordContent() {
  const params = useParams();
  const voiceLanguage = getVoiceLanguage((params?.locale as string) || "en");
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = (searchParams?.get("step") as "phone" | "otp" | "newPassword") || "phone";
  const [step, setStepState] = useState<"phone" | "otp" | "newPassword">(initialStep);

  const setStep = (newStep: "phone" | "otp" | "newPassword") => {
    if (newStep === "otp" || newStep === "newPassword") {
      sessionStorage.setItem("forgot_phone", phone);
    }
    setStepState(newStep);
    router.replace(`?step=${newStep}`, { scroll: false });
  };

  React.useEffect(() => {
    const stepParam = searchParams?.get("step");
    if (stepParam === "otp" || stepParam === "newPassword") {
      const saved = sessionStorage.getItem("forgot_phone");
      if (saved) setPhone(saved);
    }
  }, [searchParams]);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpFromServer, setOtpFromServer] = useState("");

  const handlePasswordChange = (val: string) => setNewPassword(val.replace(/\s/g, ""));
  const handleConfirmPasswordChange = (val: string) => setConfirmPassword(val.replace(/\s/g, ""));

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
      sessionStorage.removeItem("forgot_phone"); // Clear session storage

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
              <VoicePhoneInput
                phoneNumber={phone}
                onPhoneNumberChange={setPhone}
                language={voiceLanguage}
                placeholder="Enter 10 digit number"
                disabled={loading}
                showHelper={true}
                autoSpeak={false}
              />

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

              <VoiceTextInput
                value={otp}
                onChange={(val) => setOtp(val.replace(/\D/g, "").slice(0, 6))}
                label=""
                placeholder="Enter 6-digit OTP"
                language={voiceLanguage}
                disabled={loading}
                type="tel"
                maxLength={6}
                showHelper={true}
                autoSpeak={true}
                hint={getOtpHint(voiceLanguage)}
              />

              <div className="space-y-2 text-sm font-medium">
                <span>New password</span>
                <VoiceTextInput
                  value={newPassword}
                  onChange={handlePasswordChange}
                  label=""
                  placeholder="Min. 6 characters"
                  language={voiceLanguage}
                  disabled={loading}
                  type="text"
                  showHelper={true}
                  autoSpeak={false}
                  hint={getPasswordHint(voiceLanguage)}
                />
              </div>

              <div className="space-y-2 text-sm font-medium">
                <span>Confirm password</span>
                <VoiceTextInput
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  label=""
                  placeholder="Re-enter password"
                  language={voiceLanguage}
                  disabled={loading}
                  type="text"
                  showHelper={true}
                  autoSpeak={false}
                  hint={getConfirmPasswordHint(voiceLanguage)}
                />
              </div>

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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
