/**
 * VoicePhoneInput Component
 * Integrates voice input with phone number field
 * Features:
 * - Web Speech API for voice input
 * - Text-to-Speech feedback
 * - Real-time validation
 * - Mobile keyboard voice support
 */

"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSpeechInput } from "@/lib/useSpeechInput";

interface VoicePhoneInputProps {
  readonly phoneNumber: string;
  readonly onPhoneNumberChange: (phone: string) => void;
  readonly language?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly showHelper?: boolean;
  readonly autoSpeak?: boolean;
}

export default function VoicePhoneInput({
  phoneNumber,
  onPhoneNumberChange,
  language = "en",
  placeholder = "Enter 10 digit number",
  disabled = false,
  showHelper = true,
  autoSpeak = true,
}: Readonly<VoicePhoneInputProps>) {  console.log("[VoicePhoneInput] Received language prop:", language);  const { isListening, isSpeaking, isSupported, transcribedText, error, startListening, stopListening, speak, clearError } = useSpeechInput({
    language,
    onPhoneNumberChange,
    autoSpeakOnMount: autoSpeak,
    initialGreeting: getGreeting(language),
  });

  const [isValid, setIsValid] = useState(false);
  const [showError, setShowError] = useState(false);

  // Validate phone number
  useEffect(() => {
    const cleaned = phoneNumber.replaceAll(/\D/g, "");
    const valid = cleaned.length === 10;
    setIsValid(valid);
  }, [phoneNumber]);

  const handleMicClick = async () => {
    if (isListening) {
      stopListening();
    } else {
      try {
        clearError();
        await startListening();
      } catch {
        setShowError(true);
      }
    }
  };

  const handleSpeakClick = async () => {
    await speak(getGreeting(language));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replaceAll(/\D/g, "").slice(0, 10);
    onPhoneNumberChange(digitsOnly);
    clearError();
  };

  const handleBlur = () => {
    if (phoneNumber && !isValid) {
      setShowError(true);
    }
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <Label className="text-sm font-medium flex items-center gap-2">
        <span>Mobile number</span>
        {isSpeaking && <Volume2 className="w-4 h-4 text-blue-500 animate-pulse" />}
      </Label>

      {/* Input with Mic Button */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="tel"
            placeholder={placeholder}
            value={phoneNumber}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled || isListening}
            maxLength={10}
            className={cn(
              "rounded-2xl border border-input bg-background/40 px-4 py-6 text-base font-semibold shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
              isValid && phoneNumber && "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/20",
              showError && !isValid && phoneNumber && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
            )}
          />

          {/* Status indicators */}
          {isValid && phoneNumber && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Mic Button */}
        {isSupported && (
          <>
            <Button
              type="button"
              onClick={handleMicClick}
              disabled={disabled || isSpeaking}
              size="icon"
              variant="outline"
              className={cn(
                "rounded-2xl border-2 h-12 w-12 transition-all",
                isListening
                  ? "border-red-500 bg-red-50 text-red-600 hover:bg-red-100"
                  : "border-input hover:border-primary hover:bg-primary/5"
              )}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>

            {/* Speaker Button - Replay Instructions */}
            <Button
              type="button"
              onClick={handleSpeakClick}
              disabled={disabled || isListening}
              size="icon"
              variant="outline"
              aria-label="Play instruction"
              className={cn(
                "rounded-2xl border-2 h-12 w-12 transition-all",
                isSpeaking
                  ? "border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "border-input hover:border-blue-500 hover:bg-blue-50"
              )}
              title="Replay instructions"
            >
              {isSpeaking ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
          </>
        )}
      </div>

      {/* Helper Text */}
      {showHelper && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="text-base">🎤</span>
          {" "}
          You can use your keyboard mic to speak your number
        </p>
      )}

      {/* Error Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-red-800 text-xs">{error}</p>
        </div>
      )}

      {showError && !isValid && phoneNumber && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <p className="text-orange-800 text-xs">
            Please enter a valid 10-digit phone number
          </p>
        </div>
      )}

      {/* Transcription Display (if available) */}
      {isListening && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
          <p className="text-blue-700 text-xs font-medium">Listening... speak your number</p>
          {transcribedText ? (
            <p className="mt-1 text-xs text-blue-900 wrap-break-word">
              Heard: {transcribedText}
            </p>
          ) : (
            <p className="mt-1 text-xs text-blue-600/80">Waiting for speech...</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Get localized greeting message
 */
function getGreeting(language: string): string {
  const greetings: Record<string, string> = {
    en: "Please enter your mobile number",
    hi: "कृपया अपना मोबाइल नंबर दर्ज करें",
    gu: "કૃપયા તમારો મોબાઈલ નંબર દાખલ કરો",
  };

  return greetings[language] || greetings.en;
}
