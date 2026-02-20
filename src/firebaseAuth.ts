// Firebase Authentication Module
// Handles all auth-related operations with Firebase Authentication

import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  User,
} from "firebase/auth";
import {
  setDoc,
  doc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  initTurso,
  insertUserProfile,
  checkUsernameExists,
} from "./utils/tursoConfig";

/**
 * Sign up a new user with Firebase Authentication
 * Creates both userProfiles and vendorDirectory documents
 *
 * @param email User email
 * @param password User password
 * @param username Desired username
 * @param companyName User's company name
 * @returns Object with uid, email, username, or error
 */
export async function signUpWithEmailAndPassword({
  email,
  password,
  username,
  companyName,
}: {
  email: string;
  password: string;
  username: string;
  companyName: string;
}) {
  try {
    console.log("🔐 AUTH: Starting signup with email:", email);

    // Initialize Turso
    console.log("🔐 AUTH: Initializing Turso...");
    await initTurso();
    console.log("✅ AUTH: Turso initialized");

    // Check if username already exists in Turso
    console.log("🔐 AUTH: Checking if username exists:", username);
    const usernameExists = await checkUsernameExists(username);
    console.log("🔐 AUTH: Username exists check result:", usernameExists);
    if (usernameExists) {
      throw new Error("username-taken");
    }

    // Step 1: Create Firebase Auth user
    console.log("🔐 AUTH: Creating Firebase Auth user...");
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const uid = userCredential.user.uid;
    console.log("✅ AUTH: Firebase Auth user created with UID:", uid);

    // Step 2: Send email verification
    try {
      await sendEmailVerification(userCredential.user);
      console.log("📧 AUTH: Email verification sent to:", email);
    } catch (emailError) {
      console.warn("⚠️ AUTH: Email verification failed:", emailError);
    }

    // Step 3: Save to Turso database
    console.log("🔐 AUTH: Saving user profile to Turso...");
    const profileData = {
      uid: uid,
      username: username,
      email: email,
      password: password,
      companyName: companyName,
      authMethod: "email",
    };
    console.log("🔐 AUTH: Profile data:", profileData);

    await insertUserProfile(profileData);
    console.log("✅ AUTH: User profile created in Turso");

    console.log("✅ AUTH: Signup complete for:", username);
    return {
      uid: uid,
      email: email,
      username: username,
      success: true,
    };
  } catch (error: any) {
    console.error("❌ AUTH: Signup error:", error);
    console.error("❌ AUTH: Error message:", error.message);
    console.error("❌ AUTH: Error stack:", error.stack);

    const errorCode = error.code || error.message;
    if (errorCode === "auth/email-already-in-use") {
      throw new Error("email-already-in-use");
    } else if (errorCode === "auth/weak-password") {
      throw new Error("weak-password");
    } else if (errorCode === "username-taken") {
      throw new Error("username-taken");
    } else {
      throw error;
    }
  }
}

/**
 * Sign in user with email and password
 *
 * @param email User email
 * @param password User password
 * @returns Firebase Auth User object
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    console.log("🔐 AUTH: Signing in with email:", email);
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    console.log("✅ AUTH: Sign in successful");
    return userCredential.user;
  } catch (error: any) {
    console.error("❌ AUTH: Sign in error:", error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser() {
  try {
    console.log("🔐 AUTH: Signing out");
    await signOut(auth);
    console.log("✅ AUTH: Signed out successfully");
  } catch (error) {
    console.error("❌ AUTH: Sign out error:", error);
    throw error;
  }
}

/**
 * Get current auth user
 */
export function getCurrentAuthUser(): User | null {
  return auth.currentUser;
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return auth.onAuthStateChanged(callback);
}
