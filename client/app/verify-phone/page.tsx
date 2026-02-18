"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Phone, Lock, Mail, User, AlertCircle, CheckCircle } from "lucide-react";

export default function VerifyPhonePage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "details">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  // Initialize reCAPTCHA
  useEffect(() => {
    const initRecaptcha = () => {
      if (window.grecaptcha && recaptchaRef.current) {
        window.grecaptcha.render(recaptchaRef.current, {
          sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
          theme: "light",
          callback: onRecaptchaSuccess,
          "expired-callback": onRecaptchaExpired,
        });
      }
    };

    // Wait for grecaptcha to be available
    if (!window.grecaptcha) {
      const checkInterval = setInterval(() => {
        if (window.grecaptcha) {
          clearInterval(checkInterval);
          initRecaptcha();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    } else {
      initRecaptcha();
    }
  }, []);

  const onRecaptchaSuccess = (token: string) => {
    setRecaptchaToken(token);
    setError(null);
  };

  const onRecaptchaExpired = () => {
    setRecaptchaToken(null);
    setError("reCAPTCHA expired. Please verify again.");
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!phoneNumber) {
      setError("Please enter a valid phone number");
      return;
    }

    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification");
      return;
    }

    setLoading(true);

    try {
      // Format phone number
      const formattedPhone = phoneNumber.startsWith("+") 
        ? phoneNumber 
        : `+91${phoneNumber}`;

      // Verify reCAPTCHA on server
      const verifyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/verify-recaptcha`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: recaptchaToken,
            action: "send_otp",
          }),
        }
      );

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.message || "reCAPTCHA verification failed");
      }

      // Send OTP
      const otpResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: formattedPhone,
            recaptchaToken,
          }),
        }
      );

      const otpData = await otpResponse.json();

      if (!otpResponse.ok) {
        throw new Error(otpData.message || "Failed to send OTP");
      }

      setSuccess("OTP sent successfully!");
      setStep("otp");
      resetRecaptcha();
    } catch (err: any) {
      console.error("Send OTP error:", err);
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: phoneNumber.startsWith("+") 
              ? phoneNumber 
              : `+91${phoneNumber}`,
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      setSuccess("OTP verified! Please enter your details.");
      setStep("details");
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      setError(err.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: phoneNumber.startsWith("+") 
              ? phoneNumber 
              : `+91${phoneNumber}`,
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Store token and redirect
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccess("Registration successful! Redirecting...");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const resetRecaptcha = () => {
    if (window.grecaptcha) {
      window.grecaptcha.reset();
      setRecaptchaToken(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-center mb-2">VaaniKaam</h1>
          <p className="text-center text-gray-600 mb-8">
            {step === "phone" && "Verify your phone number"}
            {step === "otp" && "Enter OTP"}
            {step === "details" && "Complete your profile"}
          </p>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          {/* Phone Number Step */}
          {step === "phone" && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-2" />
                  Phone Number
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">+91</span>
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    maxLength={10}
                    disabled={loading}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* reCAPTCHA Container */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div ref={recaptchaRef}></div>
              </div>

              <Button
                type="submit"
                disabled={loading || !phoneNumber || !recaptchaToken}
                className="w-full"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <a href="/login" className="text-blue-600 hover:underline">
                  Login
                </a>
              </p>
            </form>
          )}

          {/* OTP Step */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="inline w-4 h-4 mr-2" />
                  Enter OTP
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  disabled={loading}
                  className="text-center text-2xl tracking-widest font-bold"
                />
              </div>

              <Button type="submit" disabled={loading || !otp} className="w-full">
                {loading ? "Verifying OTP..." : "Verify OTP"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError(null);
                  resetRecaptcha();
                }}
                className="w-full text-blue-600 hover:underline text-sm"
              >
                Back to phone number
              </button>
            </form>
          )}

          {/* Details Step */}
          {step === "details" && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-2" />
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="inline w-4 h-4 mr-2" />
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? "Completing Registration..." : "Complete Registration"}
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}

// Declare grecaptcha global
declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
        }
      ) => void;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
    };
  }
}
