import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDaOcaKl8w8TQYWZqKOFpKCFjwtHsQUcgQ",
  authDomain: "vaanikaam-firebase.firebaseapp.com",
  projectId: "vaanikaam-firebase",
  storageBucket: "vaanikaam-firebase.firebasestorage.app",
  messagingSenderId: "407549825814",
  appId: "1:407549825814:web:92c8f5e57282517e08f637",
  measurementId: "G-932KZ7SC1T"
};

// Initialize Firebase (only once)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Configure reCAPTCHA for phone auth
export const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
  return new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
    "expired-callback": () => {
      // Response expired
    },
  });
};

export { app, auth };
