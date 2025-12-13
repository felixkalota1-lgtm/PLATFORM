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

async function analyzeInventory() {
  try {
    console.log('\n📊 INVENTORY ANALYSIS');
    console.log('='.repeat(80));

    const tenant = 'default';
    const productsRef = db.collection('tenants').doc(tenant).collection('products');

    // Get all products
    const snapshot = await productsRef.get();
    const products = [];
    let totalStock = 0;
    const skuCount = {};
    const nameCount = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      products.push({
        id: doc.id,
        name: data.name,
        sku: data.sku,
        stock: data.stock || 0,
        alternateSkus: data.alternateSkus || []
      });
      totalStock += (data.stock || 0);

      // Track SKU occurrences
      if (!skuCount[data.sku]) {
        skuCount[data.sku] = [];
      }
      skuCount[data.sku].push(data.name);

      // Track name occurrences
      if (!nameCount[data.name]) {
        nameCount[data.name] = [];
      }
      nameCount[data.name].push(data.sku);
    });

    console.log(`\n📦 TOTAL PRODUCTS: ${products.length}`);
    console.log(`📊 TOTAL STOCK: ${totalStock}`);

    // Find duplicate SKUs
    console.log('\n🔍 SKU ANALYSIS:');
    const duplicateSkus = Object.entries(skuCount).filter(([sku, names]) => names.length > 1);
    console.log(`   Unique SKUs: ${Object.keys(skuCount).length}`);
    console.log(`   Duplicate SKUs: ${duplicateSkus.length}`);

    if (duplicateSkus.length > 0) {
      console.log('\n   ⚠️  Products with duplicate SKUs:');
      duplicateSkus.forEach(([sku, names]) => {
        console.log(`      SKU: ${sku} (appears ${names.length} times)`);
        names.forEach(name => {
          const product = products.find(p => p.sku === sku && p.name === name);
          console.log(`         - ${name} (Stock: ${product.stock})`);
        });
      });
    }

    // Find duplicate names
    console.log('\n🏷️  NAME ANALYSIS:');
    const duplicateNames = Object.entries(nameCount).filter(([name, skus]) => skus.length > 1);
    console.log(`   Unique Names: ${Object.keys(nameCount).length}`);
    console.log(`   Names with multiple SKUs: ${duplicateNames.length}`);

    if (duplicateNames.length > 0) {
      console.log('\n   ✅ Products with same name but different SKUs (intended):');
      duplicateNames.forEach(([name, skus]) => {
        console.log(`      Name: "${name}" (${skus.length} different SKUs)`);
        skus.forEach(sku => {
          const product = products.find(p => p.sku === sku && p.name === name);
          console.log(`         - SKU: ${sku} (Stock: ${product.stock})`);
        });
      });
    }

    // Stock breakdown
    console.log('\n📈 STOCK SUMMARY:');
    const stockByProduct = {};
    products.forEach(p => {
      if (!stockByProduct[p.name]) {
        stockByProduct[p.name] = [];
      }
      stockByProduct[p.name].push({
        sku: p.sku,
        stock: p.stock
      });
    });

    let combinedStock = 0;
    Object.entries(stockByProduct).forEach(([name, variants]) => {
      const nameStock = variants.reduce((sum, v) => sum + v.stock, 0);
      combinedStock += nameStock;
      if (variants.length > 1) {
        console.log(`   ${name}: ${nameStock} total (${variants.length} variants)`);
        variants.forEach(v => {
          console.log(`      - ${v.sku}: ${v.stock}`);
        });
      }
    });

    console.log(`\n💾 STOCK VERIFICATION:`);
    console.log(`   Sum of all stocks: ${totalStock}`);
    console.log(`   Combined product stock: ${combinedStock}`);
    console.log(`   Match: ${totalStock === combinedStock ? '✅ YES' : '❌ NO'}`);

    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error analyzing inventory:', error.message);
  } finally {
    await admin.app().delete();
  }
}

analyzeInventory();
