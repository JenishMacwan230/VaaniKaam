/**
 * capacitorPlatform.ts
 *
 * Thin wrappers around Capacitor's platform detection helpers.
 *
 * Import these instead of calling Capacitor directly so that:
 *   1. The code stays fully tree-shakeable on the web bundle.
 *   2. We never import @capacitor/core in a server-side context (SSR / static
 *      export pre-render), which would crash because the Capacitor bridge does
 *      not exist outside a native WebView.
 */

/**
 * Returns `true` when the code is executing inside a Capacitor-wrapped
 * Android / iOS WebView, `false` in a regular browser or during SSR/SSG.
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;           // SSR guard
  try {
    // @capacitor/core is an optional peer dependency; fall back gracefully.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Capacitor } = require('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Returns the current platform string: 'android', 'ios', or 'web'.
 */
export function getPlatform(): 'android' | 'ios' | 'web' {
  if (typeof window === 'undefined') return 'web';
  try {
    const { Capacitor } = require('@capacitor/core');
    return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
  } catch {
    return 'web';
  }
}

/**
 * Reads a JWT auth token.
 *
 *  - On native (Android/iOS): reads from localStorage (cookies are unreliable
 *    in WebView, httpOnly cookies cannot be set cross-origin on Android).
 *  - On web: reads from localStorage (the web layer already stores it there
 *    via LoginCard / PhoneAuthCard).
 *
 * The server middleware already accepts both the Authorization: Bearer header
 * AND the authToken cookie, so this helper is the single source of truth for
 * which storage location is used on the client side.
 */
export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

/**
 * Stores the JWT auth token.
 * Always uses localStorage so native and web code share the same path.
 */
export function setStoredAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('authToken', token);
}

/**
 * Removes the stored JWT token (logout).
 */
export function clearStoredAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('authToken');
}
