import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- CONFIGURATION REQUIRED ---
// To enable Google API Database (Firestore) persistence:
// 1. Go to console.firebase.google.com
// 2. Create a new project
// 3. Add a Web App to the project
// 4. Copy the 'firebaseConfig' object and paste it below.
// 5. Ensure Firestore Database is created in test mode (or set appropriate rules).

const firebaseConfig = {
  // Replace these with your actual config from Firebase Console
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

let db = null;

try {
  // We check if the user has actually updated the placeholder config
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } else {
    console.warn("Firebase config is default. Falling back to local storage.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

export { db };