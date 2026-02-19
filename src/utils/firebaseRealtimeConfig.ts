import {
  Database,
  getDatabase,
  ref,
  get,
  set,
  update,
  remove,
} from "firebase/database";

// Firebase Realtime Database configuration
export const FIREBASE_RTDB_URL =
  "https://platform-sale-and-procurement-default-rtdb.firebaseio.com";
export const FIREBASE_PROJECT_ID = "platform-sale-and-procurement";

/**
 * Get or initialize Realtime Database reference
 */
export function initializeRealtimeDatabase(): Database {
  return getDatabase();
}

/**
 * Generic database write operation
 */
export async function writeToDatabase(path: string, data: any): Promise<void> {
  try {
    const db = getDatabase();
    const dbRef = ref(db, path);
    await set(dbRef, data);
  } catch (error) {
    console.error(`Error writing to database path ${path}:`, error);
    throw error;
  }
}

/**
 * Generic database read operation
 */
export async function readFromDatabase(path: string): Promise<any> {
  try {
    const db = getDatabase();
    const dbRef = ref(db, path);
    const snapshot = await get(dbRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error(`Error reading from database path ${path}:`, error);
    throw error;
  }
}

/**
 * Generic database update operation
 */
export async function updateDatabase(
  path: string,
  updates: Record<string, any>,
): Promise<void> {
  try {
    const db = getDatabase();
    const dbRef = ref(db, path);
    await update(dbRef, updates);
  } catch (error) {
    console.error(`Error updating database path ${path}:`, error);
    throw error;
  }
}

/**
 * Generic database delete operation
 */
export async function deleteFromDatabase(path: string): Promise<void> {
  try {
    const db = getDatabase();
    const dbRef = ref(db, path);
    await remove(dbRef);
  } catch (error) {
    console.error(`Error deleting from database path ${path}:`, error);
    throw error;
  }
}

/**
 * Convert email for use as database key (replaces . and @ with underscores)
 */
export function encodeEmail(email: string): string {
  return email.replace(/[.@]/g, "_");
}

/**
 * Decode email from database key
 */
export function decodeEmail(encoded: string): string {
  // This is lossy - you should store the email separately if you need to decode it
  return encoded.replace(/_/g, ".");
}

/**
 * Ensure user structure exists in database
 */
export async function ensureUserStructure(userId: string): Promise<void> {
  try {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      await set(userRef, {
        createdAt: Date.now(),
        emailAccounts: {},
        emailHistory: {},
        inboxMetadata: {
          unreadCount: 0,
          lastFetch: 0,
        },
      });
    }
  } catch (error) {
    console.error(`Error ensuring user structure for ${userId}:`, error);
    throw error;
  }
}

/**
 * Validate email account structure
 */
export function validateEmailAccount(account: any): boolean {
  return (
    account &&
    typeof account === "object" &&
    "email" in account &&
    "provider" in account &&
    "accessToken" in account &&
    "connectedAt" in account
  );
}

/**
 * Validate email history entry structure
 */
export function validateEmailHistory(entry: any): boolean {
  return (
    entry &&
    typeof entry === "object" &&
    "documentId" in entry &&
    "documentType" in entry &&
    "recipientEmail" in entry &&
    "senderEmail" in entry &&
    "timestamp" in entry &&
    "status" in entry
  );
}
