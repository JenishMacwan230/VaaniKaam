/**
 * Phone number masking utilities for privacy protection
 */

/**
 * Mask phone number to show only first 2 and last 4 digits
 * Example: 9876543210 -> 98XXXX3210
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) {
    return phone;
  }

  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length < 6) {
    return phone;
  }

  const first = cleaned.substring(0, 2);
  const last = cleaned.substring(cleaned.length - 4);

  return `${first}XXXX${last}`;
}

/**
 * Check if a phone number is masked
 */
export function isPhoneMasked(phone: string): boolean {
  return phone.includes("XXXX");
}

/**
 * Format phone number for display (add country code if needed)
 */
export function formatPhoneForDisplay(phone: string, masked: boolean = true): string {
  const cleaned = phone.replace(/\D/g, "");

  if (masked) {
    return maskPhoneNumber(cleaned);
  }

  // Format as: +91 9876 543210
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
  }

  return phone;
}
