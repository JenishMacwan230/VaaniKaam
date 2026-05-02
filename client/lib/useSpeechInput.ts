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
  mode?: "phone" | "text" | "digits"; // "phone" = validate 10 digits, "digits" = extract digits without length validation
}

export interface UseSpeechInputResult {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  supportsSpeechRecognition: boolean;
  supportsSpeechSynthesis: boolean;
  transcribedText: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  clearError: () => void;
  isGlobalMicListening: boolean;
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
  const [supportsSpeechRecognition, setSupportsSpeechRecognition] = useState(false);
  const [supportsSpeechSynthesis, setSupportsSpeechSynthesis] = useState(false);
  const [globalListening, setGlobalListening] = useState(false);
  const mountedRef = useRef(true);
  const finalProcessedRef = useRef(false);
  const greetingSpokenRef = useRef(false);
  const speakRef = useRef<(text: string) => Promise<void>>(async () => {});

  const languageCode = getLanguageCode(language);

  const successMessages: Record<string, string> = {
    "en-US": "Phone number recorded successfully",
    "hi-IN": "मोबाइल नंबर सफलतापूर्वक दर्ज किया गया",
    "gu-IN": "મોબાઈલ નંબર સફળતાપૂર્વક દાખલ થયો",
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      try {
        stopSpeechRecognition();
      } catch {
        // Silently ignore cleanup errors
      }
    };
  }, []);

  // Detect browser speech API support only after mount to avoid SSR/client hydration mismatch.
  useEffect(() => {
    const apiAvailability = isSpeechAPIAvailable();
    setSupportsSpeechRecognition(apiAvailability.speechRecognition);
    setSupportsSpeechSynthesis(apiAvailability.speechSynthesis);

    const handleStart = () => setGlobalListening(true);
    const handleStop = () => setGlobalListening(false);
    
    globalThis.addEventListener("speech-listening-started", handleStart);
    globalThis.addEventListener("speech-listening-stopped", handleStop);
    
    return () => {
      globalThis.removeEventListener("speech-listening-started", handleStart);
      globalThis.removeEventListener("speech-listening-stopped", handleStop);
    };
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!supportsSpeechSynthesis) {
        console.warn("Text-to-Speech not supported");
        return;
      }

      try {
        if (!mountedRef.current) return;
        setIsSpeaking(true);
        setError(null);

        // Language-specific rate optimization
        const rateMap: Record<string, number> = {
          "en-US": 0.9,
          "hi-IN": 0.82,
          "gu-IN": 0.78, // Gujarati voices tend to be faster by default
        };

        await speakText(text, {
          language: languageCode,
          rate: rateMap[languageCode] ?? 0.85,
          pitch: 1,
          volume: 1,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to speak text";
        if (mountedRef.current) {
          if (errorMessage.includes("not-allowed")) {
            setError("Speaker blocked by browser. Please allow audio in site settings.");
          } else {
            setError(errorMessage);
          }
        }
      } finally {
        if (mountedRef.current) {
          setIsSpeaking(false);
        }
      }
    },
    [supportsSpeechSynthesis, languageCode]
  );

  // Keep speak ref in sync
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  // Auto-speak greeting on mount (only once)
  useEffect(() => {
    if (autoSpeakOnMount && supportsSpeechSynthesis && mountedRef.current && !greetingSpokenRef.current) {
      greetingSpokenRef.current = true;
      speak(initialGreeting);
    }
  }, [autoSpeakOnMount, supportsSpeechSynthesis, initialGreeting, speak]);

  const processFinalResult = useCallback(
    (text: string) => {
      if (!mountedRef.current) return;

      if (mode === "phone") {
        const digits = extractDigitsFromSpeech(text);
        console.log(`[useSpeechInput] processFinalResult called with text: "${text}" → digits: "${digits}"`);
        
        if (validatePhoneNumber(digits)) {
          console.log(`[useSpeechInput] Valid phone number: "${digits}", calling onPhoneNumberChange`);
          onPhoneNumberChange?.(digits);
          speakRef.current(successMessages[languageCode] ?? successMessages["en-US"]);
        } else if (digits.length > 0) {
          console.log(`[useSpeechInput] Invalid phone (only ${digits.length} digits), still updating: "${digits}"`);
          onPhoneNumberChange?.(digits);
        } else {
          console.log(`[useSpeechInput] No digits extracted from: "${text}"`);
        }
        return;
      }

      if (mode === "digits") {
        const digits = extractDigitsFromSpeech(text);
        console.log(`[useSpeechInput] digits mode: "${text}" → "${digits}"`);
        if (digits.length > 0) {
          onPhoneNumberChange?.(digits);
        } else {
          onPhoneNumberChange?.(text.trim());
        }
        return;
      }

      onPhoneNumberChange?.(text.trim());
    },
    [mode, onPhoneNumberChange, languageCode]
  );

  const startListening = useCallback(async () => {
    if (!supportsSpeechRecognition) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    try {
      if (!mountedRef.current) return;
      setIsListening(true);
      setError(null);
      setTranscribedText("");
      finalProcessedRef.current = false;
      console.log(`[useSpeechInput] Starting speech recognition for language: ${languageCode}`);

      const result = await startSpeechRecognition({
        language: languageCode,
        onResult: (text, isFinal) => {
          if (!mountedRef.current) return;
          console.log(`[useSpeechInput] onResult: text="${text}", isFinal=${isFinal}`);
          setTranscribedText(text);
          if (!isFinal) return;
          if (!finalProcessedRef.current) {
            finalProcessedRef.current = true;
            console.log(`[useSpeechInput] Processing final result: "${text}"`);
            processFinalResult(text);
          }
        },
        onError: (errorMsg) => {
          if (mountedRef.current) {
            if (errorMsg.toLowerCase().includes("aborted")) {
              console.log("[useSpeechInput] Speech aborted (likely by another mic)");
              setIsListening(false);
            } else {
              console.error(`[useSpeechInput] Speech error: ${errorMsg}`);
              setError(errorMsg);
              setIsListening(false);
            }
          }
        },
        onEnd: () => {
          if (mountedRef.current) {
            console.log(`[useSpeechInput] Speech recognition ended`);
            setIsListening(false);
          }
        },
      });

      // If no final result was obtained, try to extract from what we have
      if (result && mountedRef.current && !finalProcessedRef.current) {
        finalProcessedRef.current = true;
        console.log(`[useSpeechInput] Using fallback result: "${result}"`);
        processFinalResult(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start listening";
      console.error(`[useSpeechInput] startListening error: ${errorMessage}`);
      if (mountedRef.current) {
        setError(errorMessage);
        setIsListening(false);
      }
    }
  }, [supportsSpeechRecognition, languageCode, processFinalResult]);

  const stopListening = useCallback(() => {
    try {
      stopSpeechRecognition();
      setIsListening(false);
      setTranscribedText(""); // clear stale transcript
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
    isSupported: supportsSpeechRecognition || supportsSpeechSynthesis,
    supportsSpeechRecognition,
    supportsSpeechSynthesis,
    transcribedText,
    error,
    startListening,
    stopListening,
    speak,
    clearError,
    isGlobalMicListening: globalListening && !isListening,
  };
};
