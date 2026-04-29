/**
 * VoiceTextInput Component
 * Reusable voice input for any text field with TTS support
 * Features:
 * - Web Speech API for voice input
 * - Text-to-Speech feedback
 * - Real-time transcription
 * - Multi-language support
 */

"use client";

import { Mic, MicOff, Volume2, VolumeX, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSpeechInput } from "@/lib/useSpeechInput";

interface VoiceTextInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly language?: string;
  readonly disabled?: boolean;
  readonly type?: "text" | "number" | "tel";
  readonly showHelper?: boolean;
  readonly autoSpeak?: boolean;
  readonly icon?: React.ReactNode;
  readonly maxLength?: number;
  readonly hint?: string;
}

export default function VoiceTextInput({
  value,
  onChange,
  label = "Enter text",
  placeholder = "Enter text or use voice",
  language = "en",
  disabled = false,
  type = "text",
  showHelper = false,
  autoSpeak = false,
  icon,
  maxLength,
  hint,
}: Readonly<VoiceTextInputProps>) {
  const { isListening, isSpeaking, isSupported, transcribedText, error, startListening, stopListening, speak, clearError } = useSpeechInput({
    language,
    onPhoneNumberChange: onChange,
    autoSpeakOnMount: autoSpeak,
    initialGreeting: hint || `Please enter ${label.toLowerCase()}`,
    mode: "text",
  });

  const handleMicClick = async () => {
    if (isListening) {
      stopListening();
    } else {
      try {
        clearError();
        await startListening();
      } catch {
        // Ignore and keep UI responsive
      }
    }
  };

  const handleSpeakClick = async () => {
    await speak(hint || `Please enter ${label.toLowerCase()}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    if (type === "number" || type === "tel") {
      newValue = newValue.replaceAll(/\D/g, "");
    }
    
    if (maxLength) {
      newValue = newValue.slice(0, maxLength);
    }
    
    onChange(newValue);
    clearError();
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium flex items-center gap-2">
          <span>{label}</span>
          {isSpeaking && <Volume2 className="w-4 h-4 text-blue-500 animate-pulse" />}
        </Label>
      )}

      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type={type === "number" ? "tel" : type}
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            disabled={disabled || isListening}
            maxLength={maxLength}
            className={cn(
              "rounded-2xl border border-input bg-background/40 px-4 py-3 text-base font-semibold shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            )}
          />

          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>

        {isSupported && (
          <>
            {/* Mic Button */}
            <Button
              type="button"
              onClick={handleMicClick}
              disabled={disabled || isSpeaking}
              size="icon"
              variant="outline"
              className={cn(
                "rounded-2xl border-2 h-10 w-10 transition-all",
                isListening
                  ? "border-red-500 bg-red-50 text-red-600 hover:bg-red-100"
                  : "border-input hover:border-primary hover:bg-primary/5"
              )}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>

            {/* Speaker Button */}
            <Button
              type="button"
              onClick={handleSpeakClick}
              disabled={disabled || isListening}
              size="icon"
              variant="outline"
              aria-label="Play instruction"
              className={cn(
                "rounded-2xl border-2 h-10 w-10 transition-all",
                isSpeaking
                  ? "border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "border-input hover:border-blue-500 hover:bg-blue-50"
              )}
              title="Replay instructions"
            >
              {isSpeaking ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
          </>
        )}
      </div>

      {/* Helper Text */}
      {showHelper && isSupported && (
        <p className="text-xs text-muted-foreground">
          🎤 Click the mic or speaker button to use voice input
        </p>
      )}

      {/* Error Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-red-800 text-xs">{error}</p>
        </div>
      )}

      {/* Transcription Display */}
      {isListening && transcribedText && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-2">
          <p className="text-blue-700 text-xs font-medium">Heard: {transcribedText}</p>
        </div>
      )}
    </div>
  );
}
