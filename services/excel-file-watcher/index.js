/**
 * Excel File Watcher Service
 * 
 * Real-time monitoring of Excel files with bidirectional sync to Firestore
 * 
 * Features:
 * - Watches for changes in Excel files
 * - Parses updated Excel data
 * - Syncs to Firestore automatically
 * - Handles file locking during edits
 * - Supports multiple Excel sheets
 */

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import * as XLSX from 'xlsx';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Configuration
const WATCH_FOLDER = process.env.EXCEL_WATCH_FOLDER || './excel-imports';
const TENANT_ID = process.env.VITE_FIREBASE_TENANT_ID || 'default';
const DEBOUNCE_TIME = 2000; // Wait 2s after file change (handles saving)
const FILE_LOCK_TIMEOUT = 5000; // Max time to wait for file lock

// Track files being processed to avoid duplicates
const processingFiles = new Set();
const debounceTimers = new Map();

/**
 * Check if file is locked by Excel
 */
async function isFileLocked(filePath) {
  try {
    const file = await fs.promises.open(filePath, 'r+');
    await file.close();
    return false;
  } catch {
    return true;
  }
}

/**
 * Wait for file to be unlocked
 */
async function waitForFileUnlock(filePath, maxWait = FILE_LOCK_TIMEOUT) {
  const startTime = Date.now();
  while (isFileLocked(filePath)) {
    if (Date.now() - startTime > maxWait) {
      console.warn(`⚠️ File still locked after ${maxWait}ms, proceeding anyway:`, filePath);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Parse Excel file
 */
function parseExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📄 Parsed Excel: ${data.length} rows from "${sheetName}"`);
    return data;
  } catch (error) {
    console.error('❌ Error parsing Excel file:', error.message);
    return null;
  }
}

/**
 * Validate product data
 */
function validateProduct(product, index) {
  const errors = [];
  
  if (!product.name || product.name.toString().trim() === '') {
    errors.push('Missing product name');
  }
  if (!product.description || product.description.toString().trim() === '') {
    errors.push('Missing description');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    product: {
      name: product.name?.toString().trim() || '',
      description: product.description?.toString().trim() || '',
      category: product.category?.toString().trim() || 'Uncategorized',
      price: parseFloat(product.price) || 0,
      sku: product.sku?.toString().trim() || '',
      stock: parseInt(product.stock) || 0,
      supplier: product.supplier?.toString().trim() || '',
    },
  };
}

/**
 * Sync products to Firestore
 */
async function syncToFirestore(products, sourceFile) {
  console.log(`\n🔄 Syncing ${products.length} products to Firestore...`);
  
  const validProducts = [];
  const errors = [];
  
  // Validate all products
  products.forEach((product, index) => {
    const validation = validateProduct(product, index);
    if (validation.valid) {
      validProducts.push(validation.product);
    } else {
      errors.push({ row: index + 2, product: product.name, errors: validation.errors });
    }
  });
  
  if (errors.length > 0) {
    console.warn(`⚠️ Validation errors for ${errors.length} products:`);
    errors.forEach(err => {
      console.warn(`  Row ${err.row} (${err.product}): ${err.errors.join(', ')}`);
    });
  }
  
  if (validProducts.length === 0) {
    console.error('❌ No valid products to sync');
    return { synced: 0, skipped: errors.length };
  }
  
  try {
    const batch = db.batch();
    const productsRef = db.collection('tenants').doc(TENANT_ID).collection('products');
    
    // Get existing products for duplicate detection
    const existingSnapshot = await productsRef.where('active', '==', true).get();
    const existingProducts = new Map();
    existingSnapshot.forEach(doc => {
      existingProducts.set(doc.data().name.toLowerCase(), doc.id);
    });
    
    let syncedCount = 0;
    
    for (const product of validProducts) {
      const existingId = existingProducts.get(product.name.toLowerCase());
      
      if (existingId) {
        // Update existing product
        const docRef = productsRef.doc(existingId);
        batch.set(docRef, {
          ...product,
          updatedAt: new Date(),
          active: true,
          syncedFrom: sourceFile,
        }, { merge: true });
        console.log(`  ✏️ Update: ${product.name}`);
      } else {
        // Create new product
        const docRef = productsRef.doc();
        batch.set(docRef, {
          ...product,
          createdAt: new Date(),
          updatedAt: new Date(),
          active: true,
          tenantId: TENANT_ID,
          syncedFrom: sourceFile,
        });
        console.log(`  ➕ Create: ${product.name}`);
      }
      
      syncedCount++;
    }
    
    await batch.commit();
    console.log(`✅ Successfully synced ${syncedCount} products to Firestore`);
    
    return { synced: syncedCount, skipped: errors.length };
  } catch (error) {
    console.error('❌ Error syncing to Firestore:', error.message);
    return { synced: 0, skipped: errors.length };
  }
}

/**
 * Handle file change
 */
async function handleFileChange(filePath) {
  const fileName = path.basename(filePath);
  
  // Skip if already processing
  if (processingFiles.has(filePath)) {
    console.log(`⏭️ Already processing ${fileName}, skipping...`);
    return;
  }
  
  // Clear existing debounce timer
  if (debounceTimers.has(filePath)) {
    clearTimeout(debounceTimers.get(filePath));
  }
  
  // Set new debounce timer
  const timer = setTimeout(async () => {
    processingFiles.add(filePath);
    debounceTimers.delete(filePath);
    
    try {
      console.log(`\n📥 File change detected: ${fileName}`);
      
      // Wait for file to be unlocked
      await waitForFileUnlock(filePath);
      
      // Parse Excel
      const products = parseExcelFile(filePath);
      if (!products) {
        console.error('❌ Failed to parse Excel file');
        return;
      }
      
      // Sync to Firestore
      const result = await syncToFirestore(products, fileName);
      console.log(`📊 Sync result: ${result.synced} synced, ${result.skipped} skipped`);
      
    } catch (error) {
      console.error('❌ Error processing file:', error.message);
    } finally {
      processingFiles.delete(filePath);
    }
  }, DEBOUNCE_TIME);
  
  debounceTimers.set(filePath, timer);
}

/**
 * Start watching folder
 */
export function startWatcher(watchFolder = WATCH_FOLDER) {
  // Create folder if it doesn't exist
  if (!fs.existsSync(watchFolder)) {
    fs.mkdirSync(watchFolder, { recursive: true });
    console.log(`📁 Created watch folder: ${watchFolder}`);
  }
  
  console.log(`\n🔍 Starting Excel file watcher...`);
  console.log(`📂 Watching folder: ${watchFolder}`);
  console.log(`🏢 Tenant ID: ${TENANT_ID}`);
  console.log(`⏱️ Debounce time: ${DEBOUNCE_TIME}ms\n`);
  
  const watcher = chokidar.watch(watchFolder, {
    ignored: /(^|[\/\\])\.|\.tmp$/,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  });
  
  watcher
    .on('add', filePath => {
      if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
        console.log(`📄 New file detected: ${path.basename(filePath)}`);
        handleFileChange(filePath);
      }
    })
    .on('change', filePath => {
      if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
        handleFileChange(filePath);
      }
    })
    .on('error', error => {
      console.error('❌ Watcher error:', error);
    });
  
  console.log('✅ File watcher started. Press Ctrl+C to stop.\n');
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down file watcher...');
    watcher.close();
    process.exit(0);
  });
  
  return watcher;
}

// Start watcher if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startWatcher();
}

export default startWatcher;
