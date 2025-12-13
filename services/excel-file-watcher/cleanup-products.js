import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

admin.initializeApp({
  credential: admin.credential.cert({projectId, privateKey, clientEmail}),
  projectId,
});

const db = admin.firestore();

async function cleanupAllProducts() {
  try {
    const productsRef = db.collection('tenants').doc('default').collection('products');
    
    const snapshot = await productsRef.get();
    console.log('🗑️  Deleting', snapshot.size, 'products...');
    
    let deleted = 0;
    for (const doc of snapshot.docs) {
      await productsRef.doc(doc.id).delete();
      deleted++;
      if (deleted % 10 === 0) console.log('  Deleted:', deleted);
    }
    
    console.log('\n✅ All products deleted:', deleted);
    console.log('Firestore is now clean and ready for fresh sync');
    process.exit(0);
  } catch(error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupAllProducts();
