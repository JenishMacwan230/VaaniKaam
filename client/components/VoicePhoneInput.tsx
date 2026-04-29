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
}: Readonly<VoicePhoneInputProps>) {
  const { isListening, isSpeaking, isSupported, transcribedText, error, startListening, stopListening, speak, clearError, isGlobalMicListening } = useSpeechInput({
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
    if (valid) setShowError(false); // auto-clear error on valid
  }, [phoneNumber]);

  const handleMicClick = async () => {
    if (isListening) {
      stopListening();
    } else {
      try {
        clearError();
        setShowError(false); // clear stale errors before new attempt
        await startListening();
      } catch {
        setShowError(true);
      }
    }
  };

  const handleSpeakClick = async () => {
    if (!isSpeaking) {
      await speak(getGreeting(language));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replaceAll(/\D/g, "").slice(0, 10);
    onPhoneNumberChange(digitsOnly);
    clearError();
  };

  const handleBlur = () => {
    if (phoneNumber) {
      setShowError(!isValid); // clears automatically when valid
    }
  };

  return (
    <div className="space-y-3">
      {/* Label with inline Speaker Button */}
      <div className="flex items-center gap-2 mb-1">
        {isSupported && (
          <button
            type="button"
            onClick={handleSpeakClick}
            disabled={disabled || isListening}
            aria-label="Play instruction"
            className="focus:outline-none transition-colors"
            title="Replay instructions"
          >
            {isSpeaking ? (
              <Volume2 className="w-4 h-4 animate-pulse text-blue-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-muted-foreground hover:text-blue-500" />
            )}
          </button>
        )}
        <Label className="text-sm font-medium">Mobile number</Label>
      </div>

      {/* Input with Mic Button */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="tel"
            placeholder={placeholder}
            value={phoneNumber}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
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
              disabled={disabled || isSpeaking || isGlobalMicListening}
              size="icon"
              variant="outline"
              className={cn(
                "rounded-2xl border-2 h-12 w-12 transition-all",
                isListening
                  ? "border-green-500 bg-green-50 text-green-600 hover:bg-green-100"
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
          </>
        )}
      </div>

      {/* Helper Text */}
      {showHelper && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="text-base">🎤</span>
          {" "}
          {getHelperText(language)}
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

/**
 * Get localized helper text
 */
function getHelperText(language: string): string {
  const helperTexts: Record<string, string> = {
    en: "You can use your keyboard mic to speak your number",
    hi: "अपना नंबर बोलने के लिए माइक का उपयोग करें",
    gu: "તમારો નંબર બોલવા માટે માઇક વાપરો",
  };

  return helperTexts[language] || helperTexts.en;
}
