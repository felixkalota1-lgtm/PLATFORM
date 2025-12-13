/**
 * Check stock values in Firestore
 */
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    privateKey,
    clientEmail,
  }),
  projectId,
});

const db = admin.firestore();

async function checkProducts() {
  try {
    console.log('📊 Checking Firestore stock values...\n');
    
    const snapshot = await db.collection('tenants').doc('default').collection('products').get();
    
    console.log(`Total products: ${snapshot.size}\n`);
    console.log('Product Stock Levels:');
    console.log('========================\n');
    
    let totalStock = 0;
    const products = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const stock = data.stock || 0;
      totalStock += stock;
      products.push({
        name: data.name,
        sku: data.sku,
        stock: stock,
        price: data.price,
      });
    });
    
    // Sort by name
    products.sort((a, b) => a.name.localeCompare(b.name));
    
    products.forEach(p => {
      console.log(`${p.name.padEnd(25)} | SKU: ${(p.sku || 'N/A').padEnd(10)} | Stock: ${p.stock.toString().padEnd(6)} | Price: ₹${p.price}`);
    });
    
    console.log('\n========================');
    console.log(`Total Stock Across All Products: ${totalStock}`);
    console.log(`\n✅ Check complete`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkProducts();
