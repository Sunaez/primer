// File: components/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import Constants from "expo-constants";
// Define or import the ENV object
// const ENV = Constants.manifest.extra;


// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAn2GayNuV9pCA0D6UujtePJtgGsFBJmxs",
    authDomain: "primer-42069.firebaseapp.com",
    projectId: "primer-42069",
    storageBucket: "primer-42069.appspot.com",
    messagingSenderId: "109040540523",
    appId: "1:109040540523:web:959ef92697835bf6308a2e",
    measurementId: "G-H9CHGB26KY",
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialise Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Conditionally initialise Analytics
let analytics;
if (typeof window !== "undefined") {
  const { getAnalytics } = require("firebase/analytics");
  analytics = getAnalytics(app);
}

export { app, auth, db, storage, analytics };
