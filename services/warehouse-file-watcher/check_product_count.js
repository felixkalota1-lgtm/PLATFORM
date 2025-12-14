import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  })
});

const db = admin.firestore();

async function checkProducts() {
  try {
    const snapshot = await db.collection('tenants').doc('default').collection('products').get();
    
    console.log('\n=== WAREHOUSE PRODUCT COUNT ===\n');
    console.log(`Total Products in Firestore: ${snapshot.size}`);
    
    const grouped = {};
    snapshot.docs.forEach(doc => {
      const source = doc.data().sourceFile || 'unknown';
      grouped[source] = (grouped[source] || 0) + 1;
    });
    
    console.log('\nBreakdown by Source File:');
    Object.entries(grouped).sort((a, b) => b[1] - a[1]).forEach(([file, count]) => {
      console.log(`  ${file}: ${count.toLocaleString()}`);
    });
    
    console.log('\n=== EXPECTED vs ACTUAL ===\n');
    console.log(`Expected: 51,000 products`);
    console.log(`Actual: ${snapshot.size.toLocaleString()} products`);
    console.log(`Status: ${snapshot.size === 51000 ? '✅ COMPLETE' : snapshot.size > 0 ? '⚠️ PARTIAL' : '❌ EMPTY'}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

checkProducts();
