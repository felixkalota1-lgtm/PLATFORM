import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOQoLX36qWOp5jjR_HIjiVspDIh98R2Xg",
  authDomain: "platform-sale-and-procurement.firebaseapp.com",
  projectId: "platform-sale-and-procurement",
  storageBucket: "platform-sale-and-procurement.firebasestorage.app",
  messagingSenderId: "328826778668",
  appId: "1:328826778668:web:e9824fa70eea825e064d89",
  measurementId: "G-185GNF60JV",
};

let db: any = null;
let auth: any = null;
let functions: any = null;

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  // Initialize Firestore
  db = getFirestore(app);

  // Initialize Firebase Authentication
  auth = getAuth(app);

  // Initialize Firebase Functions
  functions = getFunctions(app);
} catch (error) {
  console.warn("Firebase initialization failed. Using local fallback:", error);
  // If Firebase fails, db, auth, and functions will be null and we'll use localStorage fallback
}

export { db, auth, functions };
