const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  error_codes?: string[];
}

/**
 * Verify reCAPTCHA v2 token on server side
 * @param token The reCAPTCHA token from client
 * @returns Promise with verification result
 */
export const verifyRecaptchaToken = async (
  token: string
): Promise<RecaptchaVerifyResponse> => {
  try {
    if (!token) {
      console.warn("reCAPTCHA: No token provided");
      return {
        success: false,
        error_codes: ["missing-input-response"],
      };
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error("reCAPTCHA: RECAPTCHA_SECRET_KEY is not set in environment variables");
      return {
        success: false,
        error_codes: ["missing-secret-key"],
      };
    }

    console.log("reCAPTCHA: Verifying token with Google API...");
    console.log("reCAPTCHA: Token length:", token.length);
    console.log("reCAPTCHA: Secret key length:", secretKey.length);

    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(
        token
      )}`,
    });

    console.log("reCAPTCHA: Google API response status:", response.status);

    if (!response.ok) {
      console.error(
        "reCAPTCHA: Google API error:",
        response.status,
        response.statusText
      );
      const errorText = await response.text();
      console.error("reCAPTCHA: Error body:", errorText);
      return {
        success: false,
        error_codes: ["recaptcha-api-error"],
      };
    }

    const data = (await response.json()) as RecaptchaVerifyResponse;
    console.log("reCAPTCHA: Google API response:", {
      success: data.success,
      error_codes: data.error_codes,
      action: data.action,
    });

    return data;
  } catch (error: any) {
    console.error("reCAPTCHA: Verification error:", error.message);
    console.error("reCAPTCHA: Error stack:", error.stack);
    return {
      success: false,
      error_codes: ["recaptcha-verification-failed"],
    };
  }
};

/**
 * Verify reCAPTCHA token and check if it's valid
 * @param token The reCAPTCHA token from client
 * @param threshold Minimum score for v3 (not used for v2)
 * @returns boolean indicating if verification passed
 */
export const isRecaptchaValid = async (
  token: string,
  threshold: number = 0.5
): Promise<boolean> => {
  try {
    const result = await verifyRecaptchaToken(token);

    if (!result.success) {
      console.warn("reCAPTCHA: Validation failed with error codes:", result.error_codes);
      return false;
    }

    console.log("reCAPTCHA: Token verified successfully");
    // For v2, just check success flag
    // For v3, you could check score: result.score && result.score >= threshold
    return true;
  } catch (error: any) {
    console.error("reCAPTCHA: Validation exception:", error.message);
    return false;
  }
};
