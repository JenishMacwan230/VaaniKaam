
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDaOcaKl8w8TQYWZqKOFpKCFjwtHsQUcgQ",
  authDomain: "vaanikaam-firebase.firebaseapp.com",
  projectId: "vaanikaam-firebase",
  storageBucket: "vaanikaam-firebase.firebasestorage.app",
  messagingSenderId: "407549825814",
  appId: "1:407549825814:web:92c8f5e57282517e08f637",
  measurementId: "G-932KZ7SC1T"
};

console.log("1. Testing Identity Toolkit API connectivity...");

// Test API Key directly with REST to see the raw error
async function testApiKey() {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${firebaseConfig.apiKey}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId: 'google.com', continueUri: 'http://localhost:3000' })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("\n❌ API Key Error:");
      console.error("Status:", response.status);
      console.error("Error Message:", data.error.message);
      console.error("Details:", JSON.stringify(data.error.errors, null, 2));
    } else {
      console.log("✅ API Key is VALID and Identity Toolkit is accessible via REST.");
    }
  } catch (e) {
    console.error("Network failed:", e);
  }
}

testApiKey();
