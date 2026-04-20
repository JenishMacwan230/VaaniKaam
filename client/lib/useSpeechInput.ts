/**
 * React Hook for managing voice input
 * Handles speech-to-text and text-to-speech functionality
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  startSpeechRecognition,
  stopSpeechRecognition,
  speakText,
  extractDigitsFromSpeech,
  validatePhoneNumber,
  getLanguageCode,
  isSpeechAPIAvailable,
} from "./speechUtils";

export interface UseSpeechInputOptions {
  language?: string;
  onPhoneNumberChange?: (phone: string) => void;
  autoSpeakOnMount?: boolean;
  initialGreeting?: string;
  mode?: "phone" | "text"; // "phone" = extract digits, "text" = raw transcription
}

export interface UseSpeechInputResult {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  transcribedText: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  clearError: () => void;
}

export const useSpeechInput = (
  options: UseSpeechInputOptions = {}
): UseSpeechInputResult => {
  const {
    language = "en",
    onPhoneNumberChange,
    autoSpeakOnMount = true,
    initialGreeting = "Please enter your mobile number",
    mode = "phone",
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const languageCode = getLanguageCode(language);
  console.log("[useSpeechInput] Language received:", language, "→ Language code:", languageCode);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (recognitionRef.current) {
        try {
          stopSpeechRecognition();
        } catch {
          // Silently ignore cleanup errors
        }
      }
    };
  }, []);

  // Detect browser speech API support only after mount to avoid SSR/client hydration mismatch.
  useEffect(() => {
    const apiAvailability = isSpeechAPIAvailable();
    setIsSupported(apiAvailability.speechRecognition && apiAvailability.speechSynthesis);
  }, []);

  // Auto-speak greeting on mount
  useEffect(() => {
    if (autoSpeakOnMount && isSupported && mountedRef.current) {
      speak(initialGreeting);
    }
  }, [autoSpeakOnMount, isSupported, initialGreeting]);

  const speak = useCallback(
    async (text: string) => {
      if (!isSupported) {
        console.warn("Text-to-Speech not supported");
        return;
      }

      try {
        if (!mountedRef.current) return;
        setIsSpeaking(true);
        setError(null);

        await speakText(text, {
          language: languageCode,
          rate: 0.9,
          pitch: 1,
          volume: 1,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to speak text";
        if (!errorMessage.includes("not-allowed") && mountedRef.current) {
          setError(errorMessage);
        }
      } finally {
        if (mountedRef.current) {
          setIsSpeaking(false);
        }
      }
    },
    [isSupported, languageCode]
  );

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    try {
      if (!mountedRef.current) return;
      setIsListening(true);
      setError(null);
      setTranscribedText("");

      const result = await startSpeechRecognition({
        language: languageCode,
        onResult: (text, isFinal) => {
          if (mountedRef.current) {
            setTranscribedText(text);

            // Handle based on mode
            if (isFinal) {
              if (mode === "phone") {
                // Phone mode: extract digits and validate
                const digits = extractDigitsFromSpeech(text);
                if (validatePhoneNumber(digits)) {
                  if (mountedRef.current) {
                    onPhoneNumberChange?.(digits);
                    // Speak confirmation
                    speak("Phone number recorded successfully");
                  }
                }
              } else if (mountedRef.current) {
                // Text mode: pass raw transcription
                onPhoneNumberChange?.(text.trim());
              }
            }
          }
        },
        onError: (errorMsg) => {
          if (mountedRef.current) {
            setError(errorMsg);
          }
        },
        onEnd: () => {
          if (mountedRef.current) {
            setIsListening(false);
          }
        },
      });

      // If no final result was obtained, try to extract from what we have
      if (result && mountedRef.current) {
        if (mode === "phone") {
          const digits = extractDigitsFromSpeech(result);
          if (digits.length > 0) {
            onPhoneNumberChange?.(digits);
          }
        } else {
          // Text mode: pass raw result
          onPhoneNumberChange?.(result.trim());
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start listening";
      if (mountedRef.current) {
        setError(errorMessage);
        setIsListening(false);
      }
    }
  }, [isSupported, languageCode, onPhoneNumberChange, speak, mode]);

  const stopListening = useCallback(() => {
    try {
      stopSpeechRecognition();
      setIsListening(false);
    } catch (err) {
      console.error("Error stopping listening:", err);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isListening,
    isSpeaking,
    isSupported,
    transcribedText,
    error,
    startListening,
    stopListening,
    speak,
    clearError,
  };
};
