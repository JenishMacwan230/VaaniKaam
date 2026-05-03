"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFirebaseToken = exports.initializeFirebase = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let firebaseInitialized = false;
const initializeFirebase = () => {
    if (firebaseInitialized)
        return;
    try {
        // Option 1: Using service account JSON file
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        if (serviceAccountPath) {
            // Resolve path relative to project root
            const resolvedPath = path_1.default.resolve(__dirname, "../../", serviceAccountPath);
            if (fs_1.default.existsSync(resolvedPath)) {
                const serviceAccount = JSON.parse(fs_1.default.readFileSync(resolvedPath, "utf8"));
                firebase_admin_1.default.initializeApp({
                    credential: firebase_admin_1.default.credential.cert(serviceAccount),
                });
                firebaseInitialized = true;
                console.log("Firebase initialized with service account from:", resolvedPath);
                return;
            }
            else {
                console.warn("Service account file not found at:", resolvedPath);
            }
        }
        // Option 2: Using environment variables
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
        if (projectId && clientEmail && privateKey) {
            try {
                firebase_admin_1.default.initializeApp({
                    credential: firebase_admin_1.default.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                });
                firebaseInitialized = true;
                console.log("✅ Firebase initialized with environment variables for project:", projectId);
            }
            catch (initError) {
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
    }
    catch (error) {
        console.error("Failed to initialize Firebase:", error);
    }
};
exports.initializeFirebase = initializeFirebase;
// Verify Firebase ID token from client
const verifyFirebaseToken = async (idToken) => {
    try {
        if (!firebaseInitialized) {
            console.error("❌ Firebase not initialized. Cannot verify token.");
            console.error("Check that FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.");
            throw new Error("Firebase not initialized");
        }
        const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(idToken);
        console.log("✅ Firebase token verified for phone:", decodedToken.phone_number);
        return decodedToken;
    }
    catch (error) {
        console.error("❌ Failed to verify Firebase token:", error instanceof Error ? error.message : error);
        return null;
    }
};
exports.verifyFirebaseToken = verifyFirebaseToken;
exports.default = firebase_admin_1.default;
