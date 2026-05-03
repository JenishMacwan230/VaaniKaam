import admin from "firebase-admin";
import path from "path";
import fs from "fs";

let firebaseInitialized = false;

export const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    // Option 1: Using service account JSON file
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (serviceAccountPath) {
      // Resolve path relative to project root
      const resolvedPath = path.resolve(__dirname, "../../", serviceAccountPath);
      
      if (fs.existsSync(resolvedPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        firebaseInitialized = true;
        console.log("Firebase initialized with service account from:", resolvedPath);
        return;
      } else {
        console.warn("Service account file not found at:", resolvedPath);
      }
    }

    // Option 2: Using environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        firebaseInitialized = true;
        console.log("✅ Firebase initialized with environment variables for project:", projectId);
      } catch (initError) {
        console.error("❌ Failed to initialize Firebase with env vars:", initError);
      }
      return;
    }

    console.warn("⚠️ Firebase Admin credentials not found.");
    console.warn("Missing env vars:", {
      has_FIREBASE_PROJECT_ID: !!projectId,
      has_FIREBASE_CLIENT_EMAIL: !!clientEmail,
      has_FIREBASE_PRIVATE_KEY: !!privateKey,
    });
    console.warn("To enable Firebase: Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY");
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
};

// Verify Firebase ID token from client
export const verifyFirebaseToken = async (idToken: string): Promise<admin.auth.DecodedIdToken | null> => {
  try {
    if (!firebaseInitialized) {
      console.error("❌ Firebase not initialized. Cannot verify token.");
      console.error("Check that FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.");
      throw new Error("Firebase not initialized");
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("✅ Firebase token verified for phone:", decodedToken.phone_number);
    return decodedToken;
  } catch (error) {
    console.error("❌ Failed to verify Firebase token:", error instanceof Error ? error.message : error);
    return null;
  }
};

export default admin;
