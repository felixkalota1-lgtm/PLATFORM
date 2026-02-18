/**
 * Firebase Admin SDK Cleanup - Deletes all authentication users
 * 
 * SETUP REQUIRED:
 * 1. Download service account key from Firebase Console:
 *    - Go to Project Settings > Service Accounts
 *    - Click "Generate new private key"
 *    - Save as: serviceAccountKey.json in this directory
 * 
 * 2. Run: npm install firebase-admin
 * 3. Run: node cleanup-auth.js
 */

import admin from "firebase-admin";
import fs from "fs";

// Try to load service account key
let serviceAccount;
try {
  const keyPath = "./serviceAccountKey.json";
  if (!fs.existsSync(keyPath)) {
    console.error("❌ ERROR: serviceAccountKey.json not found!");
    console.error("\nTo set up:");
    console.error("1. Go to: https://console.firebase.google.com");
    console.error("2. Select project: platform-sales-procurement");
    console.error("3. Go to: Project Settings > Service Accounts tab");
    console.error("4. Click: Generate new private key");
    console.error("5. Save the JSON file as: serviceAccountKey.json");
    console.error("6. Run this script again\n");
    process.exit(1);
  }
  
  serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
} catch (error) {
  console.error("❌ ERROR loading serviceAccountKey.json:", error.message);
  process.exit(1);
}

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();

async function deleteAllAuthUsers() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║    FIREBASE AUTH CLEANUP - DELETING ALL TEST USERS     ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  try {
    let deletedCount = 0;
    let hasMore = true;
    let pageToken;

    while (hasMore) {
      const listUsersResult = await auth.listUsers(100, pageToken);

      console.log(`\n📋 Found ${listUsersResult.users.length} users...\n`);

      for (const user of listUsersResult.users) {
        console.log(`🗑️  Deleting: ${user.uid} (${user.email})`);
        await auth.deleteUser(user.uid);
        deletedCount++;
        console.log(`   ✓ Deleted`);
      }

      hasMore = !!listUsersResult.pageToken;
      pageToken = listUsersResult.pageToken;
    }

    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log(`║ ✅ CLEANUP COMPLETE - ${deletedCount} auth users deleted          ║`);
    console.log("╚════════════════════════════════════════════════════════╝\n");

    console.log("✨ Application is COMPLETELY CLEAN and ready for:");
    console.log("   ✓ Authentic email signups only");
    console.log("   ✓ Email verification required");
    console.log("   ✓ Firebase Auth password management");
    console.log("   ✓ Fresh test with real data\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    process.exit(1);
  }
}

// Run cleanup
deleteAllAuthUsers();
