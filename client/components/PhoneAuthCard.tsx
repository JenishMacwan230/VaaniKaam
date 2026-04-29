"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Phone, Lock, Mail, User, Shield, AlertCircle, CheckCircle, Building2, Hammer, MapPin } from "lucide-react";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from "firebase/auth";
import { app } from "@/lib/firebase";
import VoicePhoneInput from "@/components/VoicePhoneInput";
import VoiceTextInput from "@/components/VoiceTextInput";

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

type AccountType = "worker" | "contractor";

// Language code mapping for voice
const getVoiceLanguage = (locale: string): string => {
  const mapping: Record<string, string> = {
    en: "en",
    hi: "hi",
    gu: "gu",
  };
  return mapping[locale] || "en";
};

const getOtpHint = (locale: string) => {
  switch(locale) {
    case 'hi': return 'कृपया अपने फोन पर भेजा गया छह अंकों का सत्यापन कोड बोलें';
    case 'gu': return 'કૃપયા તમારા ફોન પર મોકલેલો છ આંકડાનો વેરિફિકેશન કોડ બોલો';
    default: return 'Please say the 6-digit verification code from your SMS';
  }
};

const getPasswordHint = (locale: string) => {
  switch(locale) {
    case 'hi': return 'कृपया अपना पासवर्ड बोलें या टाइप करें';
    case 'gu': return 'કૃપયા તમારો પાસવર્ડ બોલો અથવા ટાઇપ કરો';
    default: return 'Please speak or type your password';
  }
};

const getConfirmPasswordHint = (locale: string) => {
  switch(locale) {
    case 'hi': return 'पुष्टि करने के लिए कृपया अपना पासवर्ड फिर से बोलें या टाइप करें';
    case 'gu': return 'કન્ફર્મ કરવા માટે કૃપયા તમારો પાસવર્ડ ફરીથી બોલો અથવા ટાઇપ કરો';
    default: return 'Please speak or type your password again to confirm';
  }
};

const accountTypeOptions: Array<{
  value: AccountType;
  title: string;
  description: string;
  badge: string;
  Icon: typeof Hammer;
  accentClassName: string;
}> = [
  {
    value: "worker",
    title: "Worker",
    description: "I want to find jobs and offer my skills.",
    badge: "Find work",
    Icon: Hammer,
    accentClassName: "from-sky-500/20 via-sky-500/10 to-transparent text-sky-700",
  },
  {
    value: "contractor",
    title: "Contractor",
    description: "I want to hire workers and manage projects.",
    badge: "Hire talent",
    Icon: Building2,
    accentClassName: "from-emerald-500/20 via-emerald-500/10 to-transparent text-emerald-700",
  },
];

export default function PhoneAuthCard({ onStepChange }: PhoneAuthCardProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const voiceLanguage = getVoiceLanguage(locale);
  console.log("[PhoneAuthCard] Locale:", locale, "→ Voice Language:", voiceLanguage);
  const auth = getAuth(app);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("worker");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = (searchParams?.get("step") as "phone" | "otp" | "details") || "phone";
  const [step, setStepState] = useState<"phone" | "otp" | "details">(initialStep);

  const setStep = (newStep: "phone" | "otp" | "details") => {
    if (newStep === "otp" || newStep === "details") {
      sessionStorage.setItem("reg_phone", phoneNumber);
    }
    setStepState(newStep);
    router.replace(`?step=${newStep}`, { scroll: false });
  };

  useEffect(() => {
    const stepParam = searchParams?.get("step");
    if (stepParam === "otp" || stepParam === "details") {
      const saved = sessionStorage.getItem("reg_phone");
      if (saved) setPhoneNumber(saved);
    }
  }, [searchParams]);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

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
      confirmationResultRef.current = result;
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

      const result = confirmationResultRef.current;
      if (!result) {
        setError("Please request a new SMS code");
        setLoading(false);
        return;
      }

      console.log("verifyOTP: Verifying code with Firebase");

      // Confirm the code with Firebase
      const userCredential = await result.confirm(otp);
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
      if (!name || !location || !password) {
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
          credentials: "include",
          body: JSON.stringify({
            phoneNumber: phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`,
            firebaseToken, // Firebase verification token
            name,
            location,
            accountType,
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

      // Store user info (JWT session is in httpOnly cookie)
      localStorage.setItem("user", JSON.stringify(data.user));
      globalThis.window.dispatchEvent(new Event("auth-changed"));
      localStorage.removeItem("firebaseToken"); // Clean up
      sessionStorage.removeItem("reg_phone"); // Clear session storage

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
    confirmationResultRef.current = null;
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

        {/* Firebase RecaptchaVerifier Container - Empty for invisible mode */}
        <div id="recaptcha-container"></div>

        <div className="space-y-5" style={{ display: step === "phone" ? "block" : "none" }}>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
            </div>
            <VoicePhoneInput
              phoneNumber={phoneNumber}
              onPhoneNumberChange={setPhoneNumber}
              language={voiceLanguage}
              placeholder="Enter 10 digit number"
              disabled={loading}
              showHelper={true}
              autoSpeak={step === "phone"}
            />

            <Button
              onClick={sendOTP}
              disabled={loading || phoneNumber.length !== 10}
              className="w-full rounded-2xl bg-linear-to-r from-primary via-secondary to-accent py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending SMS..." : "Send SMS"}
            </Button>
          </div>

        <div className="space-y-5" style={{ display: step === "otp" ? "block" : "none" }}>
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-sm text-green-700">SMS code sent to +91 {phoneNumber}</p>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Enter verification code</Label>
            </div>
            <VoiceTextInput
              value={otp}
              onChange={(val) => setOtp(val.replace(/\D/g, "").slice(0, 6))}
              label=""
              placeholder="Enter 6-digit code from SMS"
              language={voiceLanguage}
              disabled={loading}
              type="tel"
              maxLength={6}
              showHelper={true}
              autoSpeak={step === "otp"}
              hint={getOtpHint(voiceLanguage)}
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

        <div className="space-y-5" style={{ display: step === "details" ? "block" : "none" }}>
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-sm text-green-700">✓ Phone verified! Complete your profile.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <Label className="text-sm font-medium">Account type</Label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {accountTypeOptions.map(({ value, title, description, badge, Icon, accentClassName }) => {
                  const selected = accountType === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAccountType(value)}
                      disabled={loading}
                      className={cn(
                        "group relative overflow-hidden rounded-3xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
                        selected
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                          : "border-border bg-background/70 hover:border-primary/40 hover:bg-accent/20"
                      )}
                    >
                      <div className={cn("absolute inset-0 bg-linear-to-br opacity-90", accentClassName)} />
                      <div className="relative flex h-full flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <span className="rounded-full bg-background/85 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                            {badge}
                          </span>
                          {selected && <CheckCircle className="h-5 w-5 text-primary" />}
                        </div>
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-foreground">{title}</p>
                            <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
                          </div>
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background/80 shadow-sm ring-1 ring-black/5">
                            <Icon className="h-8 w-8 text-foreground" />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Name</Label>
            </div>
            <VoiceTextInput
              value={name}
              onChange={setName}
              label=""
              placeholder="Your name"
              language={voiceLanguage}
              disabled={loading}
              type="text"
              showHelper={true}
              autoSpeak={false}
              icon={null}
              hint="Please speak your full name"
            />

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Location</Label>
            </div>
            <VoiceTextInput
              value={location}
              onChange={setLocation}
              label=""
              placeholder="City or area"
              language={voiceLanguage}
              disabled={loading}
              type="text"
              showHelper={true}
              autoSpeak={false}
              icon={null}
              hint="Please speak your city or area name"
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
            <VoiceTextInput
              value={password}
              onChange={setPassword}
              label=""
              placeholder="Min. 6 characters"
              language={voiceLanguage}
              disabled={loading}
              type="text"
              showHelper={true}
              autoSpeak={false}
              hint={getPasswordHint(voiceLanguage)}
            />

            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Confirm Password</Label>
            </div>
            <VoiceTextInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              label=""
              placeholder="Re-enter password"
              language={voiceLanguage}
              disabled={loading}
              type="text"
              showHelper={true}
              autoSpeak={false}
              hint={getConfirmPasswordHint(voiceLanguage)}
            />

            <Button
              onClick={completeRegistration}
              disabled={loading || !password || !name || !location}
              className="w-full rounded-2xl bg-linear-to-r from-primary via-secondary to-accent py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </div>

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
