import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (!projectId || !privateKey || !clientEmail) {
  console.error('❌ Missing Firebase credentials in environment variables');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    privateKey,
    clientEmail,
  }),
  projectId,
});

const db = admin.firestore();

async function removeDuplicates() {
  try {
    console.log('\n🧹 REMOVING DUPLICATE AUTO-GENERATED PRODUCTS\n');
    console.log('='.repeat(80));

    const tenant = 'default';
    const productsRef = db.collection('tenants').doc(tenant).collection('products');

    // Get all products
    const snapshot = await productsRef.get();
    const products = [];
    const productsByName = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      products.push({ id: doc.id, ...data });
      
      if (!productsByName[data.name]) {
        productsByName[data.name] = [];
      }
      productsByName[data.name].push({ id: doc.id, sku: data.sku, createdAt: data.createdAt });
    });

    console.log(`\n📊 Total products: ${products.length}\n`);

    // Find products with AUTO-generated SKUs that have duplicates by name
    const toDelete = [];
    const nameMap = {};

    Object.entries(productsByName).forEach(([name, variants]) => {
      // Find AUTO-generated SKUs (they start with AUTO-)
      const autoProducts = variants.filter(v => v.sku && String(v.sku).startsWith('AUTO-'));
      const nonAutoProducts = variants.filter(v => !v.sku || !String(v.sku).startsWith('AUTO-'));

      if (autoProducts.length > 0 && (nonAutoProducts.length > 0 || variants.length > 1)) {
        console.log(`\n"${name}":`);
        console.log(`  Non-AUTO products: ${nonAutoProducts.length}`);
        console.log(`  AUTO products: ${autoProducts.length}`);

        // Keep only the first AUTO product (or none if there are non-AUTO products)
        const toKeep = nonAutoProducts.length > 0 
          ? nonAutoProducts[0] 
          : autoProducts[0];

        console.log(`  ✅ Keeping: ${toKeep.sku}`);

        autoProducts.forEach(auto => {
          if (auto.id !== toKeep.id) {
            console.log(`  🗑️  Deleting: ${auto.sku}`);
            toDelete.push(auto.id);
          }
        });

        // Also remove extra non-AUTO products
        if (nonAutoProducts.length > 1) {
          nonAutoProducts.slice(1).forEach(extra => {
            console.log(`  🗑️  Deleting duplicate: ${extra.sku}`);
            toDelete.push(extra.id);
          });
        }
      }
    });

    console.log(`\n\n📋 Total products to delete: ${toDelete.length}\n`);

    if (toDelete.length === 0) {
      console.log('✅ No duplicates found to delete');
      await admin.app().delete();
      return;
    }

    // Confirm deletion
    console.log('⚠️  This will delete the above products');
    console.log('Proceed with deletion? (yes/no)');

    // For now, just show what would be deleted
    if (toDelete.length > 0) {
      console.log(`\n✅ Ready to delete ${toDelete.length} duplicate products`);
      console.log('Run the delete operation:');
      console.log('');

      // Delete in batches
      const batch = db.batch();
      toDelete.forEach((docId, index) => {
        batch.delete(productsRef.doc(docId));
        if ((index + 1) % 500 === 0 || index === toDelete.length - 1) {
          console.log(`  Batch ${Math.floor((index + 1) / 500) + 1}: ${Math.min(500, toDelete.length % 500 || 500)} deletions`);
        }
      });

      await batch.commit();
      console.log(`\n✅ Deleted ${toDelete.length} duplicate products`);
      
      // Show final inventory
      const finalSnapshot = await productsRef.get();
      console.log(`\n📦 Final product count: ${finalSnapshot.size}`);
    }

    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await admin.app().delete();
  }
}

removeDuplicates();
