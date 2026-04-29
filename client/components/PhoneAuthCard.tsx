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
import { useTranslations } from "next-intl";

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

export default function PhoneAuthCard({ onStepChange }: PhoneAuthCardProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const voiceLanguage = getVoiceLanguage(locale);
  const t = useTranslations("createAccount");

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
      title: t("workerTitle"),
      description: t("workerDesc"),
      badge: t("workerBadge"),
      Icon: Hammer,
      accentClassName: "from-sky-500/20 via-sky-500/10 to-transparent text-sky-700",
    },
    {
      value: "contractor",
      title: t("contractorTitle"),
      description: t("contractorDesc"),
      badge: t("contractorBadge"),
      Icon: Building2,
      accentClassName: "from-emerald-500/20 via-emerald-500/10 to-transparent text-emerald-700",
    },
  ];

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
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!phoneNumber) {
        setError("Please enter a valid phone number");
        setLoading(false);
        return;
      }

      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;

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
        setError(t("alreadyRegistered"));
        setLoading(false);
        return;
      }

      if (!window.recaptchaVerifier) {
        try {
          const verifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            { 
              size: "invisible",
              callback: (response: string) => {}
            }
          );
          window.recaptchaVerifier = verifier;
        } catch (e) {
          setError("reCAPTCHA initialization failed. Please reload the page.");
          setLoading(false);
          return;
        }
      }

      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier
      );

      setConfirmationResult(result);
      confirmationResultRef.current = result;
      setSuccess("SMS sent! Enter the code sent to your phone.");
      setStep("otp");
      onStepChange?.("otp");

      try {
        window.recaptchaVerifier?.clear();
        delete window.recaptchaVerifier;
      } catch (e) {}
    } catch (err: any) {
      if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number. Please check the number and try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again tomorrow.");
      } else {
        setError(err.message || "Failed to send SMS. Please try again.");
      }
      try {
        window.recaptchaVerifier?.clear();
        delete window.recaptchaVerifier;
      } catch (e) {}
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
        setError(t("invalidCode"));
        setLoading(false);
        return;
      }

      const result = confirmationResultRef.current;
      if (!result) {
        setError(t("pleaseRequestNewSms"));
        setLoading(false);
        return;
      }

      const userCredential = await result.confirm(otp);
      const idToken = await userCredential.user.getIdToken();

      setSuccess("Code verified! Please enter your details.");
      setStep("details");
      onStepChange?.("details");

      localStorage.setItem("firebaseToken", idToken);
    } catch (err: any) {
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
        setError(t("fillAllFields"));
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError(t("passwordsNoMatch"));
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError(t("passwordTooShort"));
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
            firebaseToken,
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
          throw new Error(t("alreadyRegistered"));
        }
        throw new Error(data.message || "Registration failed");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      globalThis.window.dispatchEvent(new Event("auth-changed"));
      localStorage.removeItem("firebaseToken");
      sessionStorage.removeItem("reg_phone");

      setSuccess(t("registrationSuccess"));
      setTimeout(() => {
        window.location.href = `/${locale}`;
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const resetVerification = () => {
    setConfirmationResult(null);
    confirmationResultRef.current = null;
    setOtp("");
    setError(null);
    
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
        delete window.recaptchaVerifier;
      } catch (e) {}
    }
  };

  return (
    <section className="relative rounded-3xl border border-border bg-card p-8 shadow-2xl">
      <div className="absolute inset-x-12 top-6 h-1 rounded-full bg-linear-to-r from-primary via-secondary to-accent opacity-60" />
      <div className="relative space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t("firstTimeReg")}</p>
          <h2 className="text-3xl font-semibold">{t("title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        <div id="recaptcha-container"></div>

        <div className="space-y-5" style={{ display: step === "phone" ? "block" : "none" }}>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
            </div>
            <VoicePhoneInput
              phoneNumber={phoneNumber}
              onPhoneNumberChange={setPhoneNumber}
              language={voiceLanguage}
              placeholder={t("phonePlaceholder")}
              disabled={loading}
              showHelper={true}
              autoSpeak={step === "phone"}
            />

            <Button
              onClick={sendOTP}
              disabled={loading || phoneNumber.length !== 10}
              className="w-full rounded-2xl bg-linear-to-r from-primary via-secondary to-accent py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("sendingSms") : t("sendSms")}
            </Button>
          </div>

        <div className="space-y-5" style={{ display: step === "otp" ? "block" : "none" }}>
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-sm text-green-700">{t("smsSent")}{phoneNumber}</p>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">{t("enterCode")}</Label>
            </div>
            <VoiceTextInput
              value={otp}
              onChange={(val) => setOtp(val.replace(/\D/g, "").slice(0, 6))}
              label=""
              placeholder={t("codePlaceholder")}
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
              {loading ? t("verifying") : t("verifyCode")}
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep("phone");
                resetVerification();
              }}
              className="w-full text-primary hover:underline text-sm font-medium"
            >
              {t("backToPhone")}
            </button>
          </div>

        <div className="space-y-5" style={{ display: step === "details" ? "block" : "none" }}>
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-sm text-green-700">{t("phoneVerified")}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <Label className="text-sm font-medium">{t("accountType")}</Label>
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
              <Label className="text-sm font-medium">{t("nameLabel")}</Label>
            </div>
            <VoiceTextInput
              value={name}
              onChange={setName}
              label=""
              placeholder={t("namePlaceholder")}
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
              <Label className="text-sm font-medium">{t("locationLabel")}</Label>
            </div>
            <VoiceTextInput
              value={location}
              onChange={setLocation}
              label=""
              placeholder={t("locationPlaceholder")}
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
              <Label className="text-sm font-medium">{t("emailLabel")}</Label>
            </div>
            <Input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="rounded-2xl border border-input bg-background/40 px-4 py-3 text-base font-semibold shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />

            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">{t("passwordLabel")}</Label>
            </div>
            <VoiceTextInput
              value={password}
              onChange={setPassword}
              label=""
              placeholder={t("passwordPlaceholder")}
              language={voiceLanguage}
              disabled={loading}
              type="text"
              showHelper={true}
              autoSpeak={false}
              hint={getPasswordHint(voiceLanguage)}
            />

            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">{t("confirmPasswordLabel")}</Label>
            </div>
            <VoiceTextInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              label=""
              placeholder={t("confirmPasswordPlaceholder")}
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
              {loading ? t("creatingAccount") : t("createAccountBtn")}
            </Button>
          </div>

        <p className="text-center text-sm text-muted-foreground">
          {t("alreadyHaveAccount")}{" "}
          <a href={`/${locale}/login`} className="text-primary underline-offset-4 hover:underline">
            {t("signIn")}
          </a>
        </p>
      </div>
    </section>
  );
}
