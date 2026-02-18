/**
 * CLEANUP SCRIPT - Wipes all test data from Firestore
 * Run with: node cleanup-db.js
 * 
 * This permanently deletes all documents from all collections.
 * NO UNDO!
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

// Firebase config (same as in firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyBT3_F43xrxJ8nVR6b1h_TQTL67XiFEDqU",
  authDomain: "platform-sales-procurement.firebaseapp.com",
  projectId: "platform-sales-procurement",
  storageBucket: "platform-sales-procurement.appspot.com",
  messagingSenderId: "876906979551",
  appId: "1:876906979551:web:d6df6f1de2d7c54db60c17",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections to clear
const COLLECTIONS_TO_CLEAR = [
  "userProfiles",
  "userSettings",
  "vendorDirectory",
  "vendorConnections",
  "vendorSearchIndex",
  "PDFTemplates",
];

async function deleteCollection(collectionName) {
  console.log(`\n🗑️  Deleting collection: ${collectionName}`);
  
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    console.log(`   Found ${querySnapshot.docs.length} documents`);
    
    let deletedCount = 0;
    for (const docSnapshot of querySnapshot.docs) {
      await deleteDoc(doc(db, collectionName, docSnapshot.id));
      deletedCount++;
      console.log(`   ✓ Deleted: ${docSnapshot.id}`);
    }
    
    console.log(`✅ ${collectionName}: ${deletedCount} documents deleted`);
    return deletedCount;
  } catch (error) {
    console.error(`❌ Error clearing ${collectionName}:`, error.message);
    return 0;
  }
}

async function cleanupAllData() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║         FIRESTORE CLEANUP - DELETING ALL TEST DATA      ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");
  
  let totalDeleted = 0;
  
  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    const count = await deleteCollection(collectionName);
    totalDeleted += count;
  }
  
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log(`║ ✅ CLEANUP COMPLETE - ${totalDeleted} documents deleted total           ║`);
  console.log("╚════════════════════════════════════════════════════════╝\n");
  
  console.log("📋 NEXT STEP - DELETE FIREBASE AUTH USERS:");
  console.log("   1. Go to: https://console.firebase.google.com");
  console.log("   2. Select project: platform-sales-procurement");
  console.log("   3. Go to Authentication > Users tab");
  console.log("   4. Delete each user manually (Firebase doesn't provide bulk delete via SDK)");
  console.log("   5. After deleting auth users, the app will be COMPLETELY CLEAN\n");
  
  console.log("✨ Ready for testing with authentic emails!\n");
  
  process.exit(0);
}

// Run cleanup
cleanupAllData().catch((error) => {
  console.error("❌ FATAL ERROR:", error);
  process.exit(1);
});
