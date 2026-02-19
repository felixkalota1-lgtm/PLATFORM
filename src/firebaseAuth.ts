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

    // Check if username already exists
    if (db) {
      const existingUsername = await getDocs(
        query(
          collection(db, "userProfiles"),
          where("username", "==", username),
        ),
      );
      if (existingUsername.docs.length > 0) {
        throw new Error("username-taken");
      }
    }

    // Step 1: Create Firebase Auth user
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
      // Don't fail signup if verification email fails
    }

    // Step 3: Create searchable fields
    const companyNameSearchable = companyName.toLowerCase().trim();
    const usernameSearchable = username.toLowerCase().trim();
    const emailSearchable = email.toLowerCase().trim();

    // Step 4: Create userProfiles document
    const userProfileData = {
      uid: uid,
      username: username,
      usernameSearchable: usernameSearchable,
      email: email,
      emailSearchable: emailSearchable,
      companyName: companyName.trim(),
      companyNameSearchable: companyNameSearchable,
      activeTab: "products",
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await setDoc(doc(db, "userProfiles", uid), userProfileData, {
        merge: false,
      });
      console.log("✅ AUTH: User profile created in userProfiles");
    }

    // Step 5: Create vendorDirectory entry
    const vendorData = {
      uid: uid,
      username: username,
      usernameSearchable: usernameSearchable,
      email: email,
      emailSearchable: emailSearchable,
      companyName: companyName.trim(),
      companyNameSearchable: companyNameSearchable,
      phone: "",
      address: "",
      website: "",
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await setDoc(doc(db, "vendorDirectory", uid), vendorData, {
        merge: false,
      });
      console.log("✅ AUTH: Vendor entry created - SEARCH ENABLED");
    }

    console.log("✅ AUTH: Signup complete for:", username);
    return {
      uid: uid,
      email: email,
      username: username,
      success: true,
    };
  } catch (error: any) {
    console.error("❌ AUTH: Signup error:", error);

    // Handle specific Firebase errors
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
