/**
 * Speech Utilities - Text-to-Speech and Speech-to-Text functionality
 * No external APIs required - uses Web Speech API and SpeechSynthesis API
 */

// Types
export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  isFinal: boolean;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export interface SpeechToTextOptions {
  language?: string;
  onResult?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export interface TextToSpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

// Initialize Web Speech API with webkit fallback
const getSpeechRecognition = (): any => {
  const SpeechRecognitionAPI =
    (globalThis as any).SpeechRecognition || (globalThis as any).webkitSpeechRecognition;
  
  if (!SpeechRecognitionAPI) {
    throw new Error("Speech Recognition API not supported in this browser");
  }
  
  return new SpeechRecognitionAPI();
};

let activeRecognition: any = null;

const waitForVoices = async (synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> => {
  const existing = synth.getVoices();
  if (existing.length > 0) {
    return existing;
  }

  return new Promise((resolve) => {
    const timeout = globalThis.setTimeout(() => {
      synth.removeEventListener("voiceschanged", handleVoicesChanged);
      resolve(synth.getVoices());
    }, 400);

    const handleVoicesChanged = () => {
      globalThis.clearTimeout(timeout);
      synth.removeEventListener("voiceschanged", handleVoicesChanged);
      resolve(synth.getVoices());
    };

    synth.addEventListener("voiceschanged", handleVoicesChanged);
  });
};

/**
 * Extract digits from text (handles spoken numbers)
 * Converts number words to digits for multiple languages
 */
export const extractDigitsFromSpeech = (text: string): string => {
  const normalizedText = normalizeIndicDigits(text);

  // First pass: extract already-digit characters (handles space-separated digits from STT)
  const digits = normalizedText.replaceAll(/\D/g, "");
  if (digits.length > 0) {
    console.log(`[Speech] Extracted digits from STT: "${text}" → "${digits}"`);
    return digits.slice(0, 10);
  }

  const numberWords: Record<string, string> = {
    // English
    zero: "0",
    oh: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    // English teen numbers
    ten: "10",
    eleven: "11",
    twelve: "12",
    thirteen: "13",
    fourteen: "14",
    fifteen: "15",
    sixteen: "16",
    seventeen: "17",
    eighteen: "18",
    nineteen: "19",
    twenty: "20",
    thirty: "30",
    forty: "40",
    fifty: "50",
    sixty: "60",
    seventy: "70",
    eighty: "80",
    ninety: "90",

    // Hindi
    शून्य: "0",
    सून्य: "0",
    जीरो: "0",
    ओ: "0",
    एक: "1",
    दो: "2",
    तीन: "3",
    चार: "4",
    पाँच: "5",
    पांच: "5",
    पच: "5",
    छः: "6",
    छह: "6",
    सात: "7",
    आठ: "8",
    नौ: "9",
    नो: "9",
    दस: "10",
    ग्यारह: "11",
    गयारह: "11",
    बारह: "12",
    तेरह: "13",
    चौदह: "14",
    पंद्रह: "15",
    सोलह: "16",
    सत्रह: "17",
    अठारह: "18",
    उन्नीस: "19",
    बीस: "20",
    तीस: "30",
    चालीस: "40",
    पचास: "50",
    साठ: "60",
    सत्तर: "70",
    अस्सी: "80",
    नब्बे: "90",

    // Gujarati
    શૂન્ય: "0",
    જીરો: "0",
    સીફર: "0",
    ઝીરો: "0",
    એક: "1",
    બે: "2",
    ત્રણ: "3",
    ચાર: "4",
    પાંચ: "5",
    છ: "6",
    સાત: "7",
    આઠ: "8",
    નવ: "9",
    દસ: "10",
    અગિયાર: "11",
    બાર: "12",
    તેર: "13",
    ચૌદ: "14",
    પંદર: "15",
    સોળ: "16",
    સત્તર: "17",
    અઠાર: "18",
    ઓગણીસ: "19",
    વીસ: "20",
    તીસ: "30",
    ચાલીસ: "40",
    પચાસ: "50",
    સાઠ: "60",
    સિત્તેર: "70",
    આશી: "80",
    નેવું: "90",

    // Latin transliterations + STT variants
    shunya: "0",
    sifar: "0",
    jeero: "0",
    ek: "1",
    ekk: "1",
    do: "2",
    be: "2",
    teen: "3",
    tran: "3",
    trin: "3",
    char: "4",
    chaar: "4",
    panch: "5",
    paanch: "5",
    pach: "5",
    chah: "6",
    chh: "6",
    chhah: "6",
    sat: "7",
    saat: "7",
    aath: "8",
    aat: "8",
    nau: "9",
    nav: "9",
    nao: "9",
    nava: "9",
    das: "10",
    gyarah: "11",
    barah: "12",
  };

  // Single digit words only (for phone number building)
  const singleDigitKeys = new Set([
    "zero",
    "oh",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "शून्य",
    "सून्य",
    "जीरो",
    "ओ",
    "एक",
    "दो",
    "तीन",
    "चार",
    "पाँच",
    "पांच",
    "पच",
    "छः",
    "छह",
    "सात",
    "आठ",
    "नौ",
    "नो",
    "શૂન્ય",
    "જીરો",
    "સીફર",
    "ઝીરો",
    "એક",
    "બે",
    "ત્રણ",
    "ચાર",
    "પાંચ",
    "છ",
    "સાત",
    "આઠ",
    "નવ",
    "shunya",
    "sifar",
    "jeero",
    "ek",
    "ekk",
    "do",
    "be",
    "teen",
    "tran",
    "trin",
    "char",
    "chaar",
    "panch",
    "paanch",
    "pach",
    "chah",
    "chh",
    "chhah",
    "sat",
    "saat",
    "aath",
    "aat",
    "nau",
    "nav",
    "nao",
    "nava",
    "oh",
  ]);

  const words = normalizedText
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

  let result = "";

  for (const word of words) {
    const nfc = word.normalize("NFC");
    const mapped = numberWords[nfc] ?? numberWords[word];
    if (!mapped) continue;

    if (singleDigitKeys.has(nfc) || singleDigitKeys.has(word)) {
      // Phone digit mode: always single digit
      result += mapped.length > 1 ? mapped[mapped.length - 1] : mapped;
    } else {
      result += mapped;
    }
  }

  return result.slice(0, 10);
};

/**
 * Normalize Gujarati and Devanagari numerals to ASCII digits.
 */
const normalizeIndicDigits = (input: string): string => {
  const digitMap: Record<string, string> = {
    "૦": "0",
    "૧": "1",
    "૨": "2",
    "૩": "3",
    "૪": "4",
    "૫": "5",
    "૬": "6",
    "૭": "7",
    "૮": "8",
    "૯": "9",
    "०": "0",
    "१": "1",
    "२": "2",
    "३": "3",
    "४": "4",
    "५": "5",
    "६": "6",
    "७": "7",
    "८": "8",
    "९": "9",
  };

  return Array.from(input)
    .map((char) => digitMap[char] ?? char)
    .join("");
};

/**
 * Validate phone number - check for 10 digits
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replaceAll(/\D/g, "");
  return cleaned.length === 10;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replaceAll(/\D/g, "");
  if (cleaned.length !== 10) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

/**
 * Text-to-Speech: Speak text using Web Speech Synthesis API
 */
export const speakText = (
  text: string,
  options: TextToSpeechOptions = {}
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const { language = "en-US", pitch = 1, volume = 1 } = options;
    // Slower rate for Indic languages for clarity
    const defaultRate = language.startsWith("en") ? 0.9 : 0.8;
    const { rate = defaultRate } = options;

    if (!("speechSynthesis" in globalThis)) {
      reject(new Error("Text-to-Speech API not supported in this browser"));
      return;
    }

    const synth = (globalThis as any).speechSynthesis as SpeechSynthesis;

    // Some browsers keep synthesis paused after tab/audio interruptions.
    if (synth.paused) {
      synth.resume();
    }

    // Cancel any queued utterances before speaking the latest instruction.
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onend = () => resolve();
    utterance.onerror = (event) => {
      if (event.error === "not-allowed") {
        // Requested behavior: do not surface not-allowed as UI error.
        resolve();
      } else {
        console.warn(`Speech synthesis error: ${event.error}`);
        resolve();
      }
    };

    void (async () => {
      const voices = await waitForVoices(synth);
      const requestedBase = language.split("-")[0]?.toLowerCase() ?? "en";
      const exactVoice = voices.find((voice) => voice.lang.toLowerCase() === language.toLowerCase());
      const baseVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith(`${requestedBase}-`));
      const selectedVoice = exactVoice || baseVoice;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else if (!language.startsWith("en")) {
        // ✅ Warn if no Indic voice found on this device
        console.warn(`No TTS voice found for ${language}. Using browser default. User may need to install ${language} TTS in device settings.`);
      }
      // Always set the requested language — browser will use it even without a named voice
      utterance.lang = language;

      try {
        synth.speak(utterance);
      } catch (error) {
        console.warn("Speech synthesis speak() failed", error);
        resolve();
      }
    })();
  });
};

/**
 * Speech-to-Text: Listen for speech input using Web Speech API
 */
export const startSpeechRecognition = (
  options: SpeechToTextOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const { language = "en-US", onResult, onError, onEnd } = options;

    try {
      const recognition = getSpeechRecognition();
      activeRecognition = recognition;
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      let finalTranscript = "";

      recognition.onstart = () => {
        // no-op; kept for lifecycle consistency
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          // Pick the highest confidence alternative, or the first one if all have 0 confidence
          let bestTranscript = event.results[i][0]?.transcript ?? "";
          let bestConfidence = event.results[i][0]?.confidence ?? 0;

          for (let j = 1; j < event.results[i].length; j++) {
            if (event.results[i][j].confidence > bestConfidence) {
              bestConfidence = event.results[i][j].confidence;
              bestTranscript = event.results[i][j].transcript;
            }
          }

          if (event.results[i].isFinal) {
            finalTranscript += bestTranscript + " ";
          } else {
            interimTranscript += bestTranscript;
          }
        }

        const currentText = finalTranscript + interimTranscript;
        onResult?.(currentText.trim(), event.results[event.results.length - 1].isFinal);

        if (event.results[event.results.length - 1].isFinal) {
          finalTranscript = finalTranscript.trim();
        }
      };

      recognition.onerror = (event: any) => {
        const errorMessage = mapSpeechErrorToMessage(event.error);
        if (errorMessage) {
          onError?.(errorMessage);
          reject(new Error(errorMessage));
        } else {
          onEnd?.();
          resolve(finalTranscript.trim());
        }
      };

      recognition.onend = () => {
        activeRecognition = null;
        onEnd?.();
        resolve(finalTranscript);
      };

      recognition.start();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Stop speech recognition
 */
export const stopSpeechRecognition = (): void => {
  try {
    if (activeRecognition) {
      activeRecognition.stop();
      activeRecognition = null;
    }
  } catch (error) {
    console.error("Error stopping speech recognition:", error);
  }
};

/**
 * Map speech recognition errors to user-friendly messages
 */
const mapSpeechErrorToMessage = (error: string): string | null => {
  const errorMap: Record<string, string | null> = {
    "no-speech": null,
    "audio-capture": "No microphone found. Please check your device.",
    "network": "Network error. Please try again.",
    "not-allowed": null,
    "service-not-allowed": "Speech recognition service not allowed.",
  };

  return errorMap[error] || `Speech error: ${error}`;
};

/**
 * Check if speech APIs are available
 */
export const isSpeechAPIAvailable = (): {
  speechRecognition: boolean;
  speechSynthesis: boolean;
} => {
  const SpeechRecognitionAPI =
    (globalThis as any).SpeechRecognition || (globalThis as any).webkitSpeechRecognition;

  return {
    speechRecognition: !!SpeechRecognitionAPI,
    speechSynthesis: "speechSynthesis" in globalThis,
  };
};

/**
 * Get language code based on locale
 */
export const getLanguageCode = (locale: string): string => {
  const languageMap: Record<string, string> = {
    en: "en-US",
    hi: "hi-IN",
    gu: "gu-IN",
  };

  return languageMap[locale] || "en-US";
};
