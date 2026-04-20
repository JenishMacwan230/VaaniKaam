/**
 * Example: Standalone Voice Phone Input Usage
 * This file demonstrates how to use VoicePhoneInput component independently
 */

"use client";

import { useState } from "react";
import VoicePhoneInput from "@/components/VoicePhoneInput";

export default function StandalonePhoneInputExample() {
  const [phoneNumber, setPhoneNumber] = useState("");

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Voice-Enabled Phone Input</h1>

      <VoicePhoneInput
        phoneNumber={phoneNumber}
        onPhoneNumberChange={setPhoneNumber}
        language="en"
        placeholder="Enter 10 digit number"
        showHelper={true}
        autoSpeak={true}
      />

      {phoneNumber && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">Phone number: +91 {phoneNumber}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Usage with different languages:
 *
 * English:
 * <VoicePhoneInput language="en" ... />
 *
 * Hindi:
 * <VoicePhoneInput language="hi" ... />
 *
 * Gujarati:
 * <VoicePhoneInput language="gu" ... />
 */

/**
 * Direct API Usage (Advanced):
 *
 * import { useSpeechInput } from "@/lib/useSpeechInput";
 *
 * export default function CustomVoiceInput() {
 *   const { startListening, stopListening, speak, isListening, error } = useSpeechInput({
 *     language: "en",
 *     onPhoneNumberChange: (phone) => console.log("Phone:", phone),
 *     autoSpeakOnMount: true,
 *   });
 *
 *   return (
 *     <>
 *       <button onClick={startListening} disabled={isListening}>
 *         {isListening ? "Stop" : "Start"} Listening
 *       </button>
 *       <button onClick={() => speak("Your phone number has been recorded")}>
 *         Speak
 *       </button>
 *       {error && <p>{error}</p>}
 *     </>
 *   );
 * }
 */

/**
 * Utility Functions (Advanced):
 *
 * import {
 *   extractDigitsFromSpeech,
 *   formatPhoneNumber,
 *   validatePhoneNumber,
 *   isSpeechAPIAvailable,
 * } from "@/lib/speechUtils";
 *
 * // Extract digits from spoken text
 * const digits = extractDigitsFromSpeech("nine one one two three four five");
 * // Result: "9112345"
 *
 * // Format for display
 * const formatted = formatPhoneNumber("9112345678");
 * // Result: "911-234-5678"
 *
 * // Validate 10 digits
 * const isValid = validatePhoneNumber("9112345678");
 * // Result: true
 *
 * // Check API availability
 * const { speechRecognition, speechSynthesis } = isSpeechAPIAvailable();
 */
