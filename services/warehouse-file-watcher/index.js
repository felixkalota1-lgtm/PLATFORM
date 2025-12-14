/**
 * Warehouse File Watcher Service - Enhanced Edition
 * 
 * Real-time bidirectional sync between Excel/CSV files and Firebase Firestore
 * With rate limiting to stay within Free Tier limits
 * 
 * Features:
 * - File modification time (mtime) based change detection
 * - Real-time monitoring of warehouse Excel and CSV files
 * - Automatic parsing and validation (same logic as inventory)
 * - Duplicate detection within file and against existing stock
 * - Batch Firestore uploads with rate limiting
 * - Daily scheduled processing to spread uploads over multiple days
 * - File locking detection and retry
 * - Memory-efficient auto-cleanup
 */

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import dotenv from 'dotenv';
import https from 'https';
import admin from 'firebase-admin';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import FileTracker from './FileTracker.js';
import { parseWarehouseCSV } from './services/csvParser.js';
import { parseWarehouseExcel } from './services/excelParser.js';
import { syncWarehouseData, getWarehouseStats } from './services/warehouseFirestore.js';
import UploadRateLimiter from './services/uploadRateLimiter.js';
import DailyUploadScheduler from './services/dailyUploadScheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../../.env.local');

dotenv.config({ path: envPath });

const WATCH_FOLDER = process.env.WAREHOUSE_IMPORT_PATH || './warehouse-imports';
const TENANT_ID = process.env.TENANT_ID || 'default';
const DEBOUNCE_TIME = parseInt(process.env.DEBOUNCE_TIME || '2000');
const FILE_LOCK_TIMEOUT = parseInt(process.env.FILE_LOCK_TIMEOUT || '5000');

// Rate limiting options
const USE_RATE_LIMITING = process.env.USE_RATE_LIMITING !== 'false'; // Enabled by default
const DAILY_UPLOAD_LIMIT = parseInt(process.env.DAILY_UPLOAD_LIMIT || '18000'); // 18k writes/day
const UPLOAD_SCHEDULE_TIME = process.env.UPLOAD_SCHEDULE_TIME || '00:00'; // Midnight UTC
const USE_QUEUE = process.env.USE_QUEUE !== 'false'; // Queue large imports by default

const processingFiles = new Set();
const debounceTimers = new Map();

// Initialize rate limiter and scheduler
let rateLimiter = null;
let uploadScheduler = null;

// Initialize file tracker with mtime-based detection
const fileTracker = new FileTracker({
  skipWindow: 2000,           // Skip duplicates within 2 seconds
  reprocessWindow: 30000,     // Allow reprocess after 30 seconds
  lockRetryDelay: 1000,       // Retry locked files after 1 second
  systemType: 'warehouse'     // For multi-system support
});

function initializeFirebase() {
  try {
    if (admin.apps.length > 0) {
      console.log('✅ Firebase Admin already initialized');
      return;
    }

    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      throw new Error('Missing Firebase credentials in environment variables');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail
      })
    });

    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    process.exit(1);
  }
}

function shouldProcessFile(filePath) {
  const check = fileTracker.checkFile(filePath);
  
  if (!check.should) {
    if (check.reason === 'File locked') {
      console.log(`⏳ ${path.basename(filePath)}: ${check.reason}`);
    } else if (check.reason !== 'No file changes detected') {
      console.log(`⏭️ ${path.basename(filePath)}: ${check.reason}`);
    }
  }
  
  return check.should;
}

function markFileProcessed(filePath) {
  fileTracker.markAsProcessed(filePath);
}

async function waitForFileUnlock(filePath, maxWait = FILE_LOCK_TIMEOUT) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    try {
      const fd = fs.openSync(filePath, 'r');
      fs.closeSync(fd);
      return true;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error(`File timeout: ${path.basename(filePath)}`);
}

/**
 * Normalize item data - flexible column mapping
 */
function normalizeItem(item) {
  // Map various column names to standard fields
  const normalized = {
    sku: item.sku || item.SKU || item.code || item.Code || item.PRODUCT_ID || item.productId || item.product_id || null,
    productName: item.productName || item.name || item.Name || item.NAME || item.Product || item.PRODUCT || item.product || item.description || item.Description || null,
    quantity: item.quantity || item.qty || item.Qty || item.QUANTITY || item.count || item.Count || item.stock || item.Stock || 0,
    category: item.category || item.Category || item.CATEGORY || 'Uncategorized',
    location: item.location || item.Location || item.LOCATION || item.warehouse || item.bin || item.Bin || 'MAIN',
  };
  return normalized;
}

/**
 * Validate warehouse item data - FLEXIBLE
 */
function validateWarehouseItem(item, index) {
  // First normalize the item keys
  const normalized = normalizeItem(item);
  const errors = [];
  
  if (!normalized.sku || String(normalized.sku).trim() === '') {
    errors.push('Missing SKU/Code');
  }
  if (!normalized.productName || String(normalized.productName).trim() === '') {
    errors.push('Missing Product Name/Description');
  }
  if (normalized.quantity === undefined || normalized.quantity === '' || normalized.quantity === null) {
    errors.push('Missing Quantity');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors, item: {} };
  }

  // Convert quantity safely
  let quantity = normalized.quantity;
  if (typeof quantity === 'string') {
    // Extract number from string like "500" or "500 units"
    quantity = parseInt(quantity.toString().replace(/[^\d]/g, '')) || 0;
  } else {
    quantity = parseInt(quantity) || 0;
  }

  if (isNaN(quantity) || quantity < 0) {
    quantity = 0;  // Default to 0 instead of failing
  }

  return {
    valid: true,
    errors: [],
    item: {
      sku: String(normalized.sku).trim().toUpperCase(),
      productName: String(normalized.productName).trim(),
      quantity: quantity,
      category: String(normalized.category).trim() || 'Uncategorized',
      location: String(normalized.location).trim().toUpperCase() || 'MAIN',
    },
  };
}

/**
 * Detect duplicates within the file
 */
function detectDuplicatesWithinFile(items) {
  const duplicates = [];
  const seenSkus = new Set();

  items.forEach((item, i) => {
    if (!item.sku) return;

    const skuKey = item.sku.toUpperCase();
    if (seenSkus.has(skuKey)) {
      duplicates.push({
        sourceProduct: `${item.productName} (SKU: ${item.sku})`,
        reason: 'Same SKU appears multiple times in file',
        location: 'within-file',
      });
    }
    seenSkus.add(skuKey);
  });

  return duplicates;
}

/**
 * Detect duplicates in existing warehouse inventory
 */
async function detectDuplicatesInWarehouse(items, tenantId = TENANT_ID) {
  if (!admin.apps.length) return [];

  try {
    const db = admin.firestore();
    const snapshot = await db.collection('warehouse_inventory').get();
    const existing = snapshot.docs.map(d => ({
      sku: d.data().sku,
      productName: d.data().productName,
      location: d.data().location,
    }));

    const duplicates = [];
    items.forEach(item => {
      if (!item.sku) return;

      const skuMatch = existing.find(
        e => e.sku === item.sku && e.location === item.location
      );
      
      if (skuMatch) {
        duplicates.push({
          sourceProduct: `${item.productName} (SKU: ${item.sku})`,
          location: item.location,
          reason: 'Same SKU at same location already exists',
        });
        return;
      }
    });
    
    return duplicates;
  } catch (error) {
    console.warn('⚠️ Warehouse duplicate check failed:', error.message);
    return [];
  }
}

/**
 * Parse Excel file (same format as inventory watcher)
 */
function parseExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) return { data: [], columns: [] };

    const columns = Object.keys(data[0]);
    console.log(`📄 Parsed: ${data.length} rows, ${columns.length} columns`);
    console.log(`📋 Columns: ${columns.join(', ')}`);
    
    return { data, columns };
  } catch (error) {
    console.error('❌ Parse error:', error.message);
    return { data: [], columns: [] };
  }
}

/**
 * Process items for warehouse upload (validation + duplicate detection)
 */
async function processItemsForWarehouse(items, sourceFile) {
  console.log(`\n🔄 Found ${items.length} items`);
  
  const validItems = [];
  const validationErrors = [];
  
  items.forEach((item, index) => {
    const validation = validateWarehouseItem(item, index);
    if (validation.valid) {
      validItems.push(validation.item);
    } else {
      validationErrors.push({ row: index + 2, errors: validation.errors });
    }
  });
  
  if (validationErrors.length > 0) {
    console.warn(`⚠️ Validation errors for ${validationErrors.length} items`);
  }
  
  if (validItems.length === 0) {
    console.error('❌ No valid items');
    return { ready: 0, skipped: validationErrors.length, synced: 0, failed: 0, dupFound: 0, queued: 0 };
  }

  const fileDups = detectDuplicatesWithinFile(validItems);
  if (fileDups.length > 0) {
    console.warn(`⚠️ ${fileDups.length} duplicates within file`);
  }

  const warehouseDups = await detectDuplicatesInWarehouse(validItems);
  if (warehouseDups.length > 0) {
    console.warn(`⚠️ ${warehouseDups.length} duplicates in warehouse`);
  }

  console.log(`\n📊 Processing ${validItems.length} items:`);
  validItems.slice(0, 10).forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.productName} (Qty: ${item.quantity}, Location: ${item.location})`);
  });
  if (validItems.length > 10) console.log(`  ... and ${validItems.length - 10} more`);

  // Decide: Queue or sync based on settings
  let syncResult;
  
  if (USE_RATE_LIMITING && USE_QUEUE && validItems.length > 1000) {
    // Queue large imports
    console.log(`\n📝 Large import (${validItems.length} items) - Queuing for rate-limited upload...`);
    const queueResult = rateLimiter.queueItems(validItems, sourceFile, 'normal');
    syncResult = {
      synced: 0,
      failed: 0,
      queued: queueResult.queued,
      queueTotal: queueResult.total
    };
  } else {
    // Small uploads: sync immediately with rate limiting check
    syncResult = await syncWarehouseData(validItems, sourceFile, TENANT_ID, rateLimiter, {
      useQueue: false
    });
  }
  
  return {
    ready: validItems.length,
    skipped: validationErrors.length,
    dupFound: fileDups.length + warehouseDups.length,
    ...syncResult
  };
}

async function handleFileChange(filePath) {
  const fileName = path.basename(filePath);
  
  if (processingFiles.has(filePath)) {
    console.log(`⏭️ Already processing ${fileName}`);
    return;
  }

  if (!shouldProcessFile(filePath)) {
    return;
  }
  
  if (debounceTimers.has(filePath)) {
    clearTimeout(debounceTimers.get(filePath));
  }
  
  const timer = setTimeout(async () => {
    processingFiles.add(filePath);
    debounceTimers.delete(filePath);
    
    try {
      console.log(`\n🏭 Processing Warehouse File: ${fileName}`);
      await waitForFileUnlock(filePath);
      
      let data;
      const isExcel = filePath.match(/\.(xlsx|xls)$/i);
      
      if (isExcel) {
        // Parse Excel file with same validation as inventory
        console.log(`📊 Parsing Excel file...`);
        const { data: excelData, columns } = parseExcelFile(filePath);
        if (!excelData || excelData.length === 0) {
          console.error('❌ No data in file');
          return;
        }
        
        // Process items with validation and duplicate detection
        const result = await processItemsForWarehouse(excelData, fileName);
        console.log(`\n📊 Result: ${result.synced} synced, ${result.failed} failed, ${result.dupFound} duplicates detected`);
      } else {
        // Parse CSV file
        console.log(`📋 Parsing CSV file...`);
        data = await parseWarehouseCSV(filePath);
        if (!data || data.length === 0) {
          console.error('❌ No data in file');
          return;
        }
        
        const result = await syncWarehouseData(data, fileName, TENANT_ID);
        console.log(`\n✅ Sync Result: ${result.synced} items synced`);
      }
      
      // Mark file as successfully processed
      markFileProcessed(filePath);
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      processingFiles.delete(filePath);
      // Periodic cleanup of old tracking entries
      fileTracker.cleanup();
    }
  }, DEBOUNCE_TIME);
  
  debounceTimers.set(filePath, timer);
}

/**
 * Handle file deletion - Remove items from warehouse that were imported from this file
 */
async function handleFileDelete(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n🗑️ File deleted: ${fileName}`);
  
  try {
    if (!admin.apps.length) {
      console.warn('⚠️ Firebase not initialized, skipping deletion sync');
      return;
    }

    const db = admin.firestore();
    
    // Find all items in warehouse that were imported from this file
    // Items are stored in: tenants/{tenantId}/products/{sku}
    const snapshot = await db.collection('tenants')
      .doc(TENANT_ID)
      .collection('products')
      .where('sourceFile', '==', fileName)
      .get();

    if (snapshot.empty) {
      console.log(`ℹ️ No items found from ${fileName} in warehouse`);
      return;
    }

    const itemCount = snapshot.size;
    console.log(`🔍 Found ${itemCount} items imported from ${fileName}`);
    console.log(`🗑️ Removing items from warehouse...`);

    // Delete items in batches
    const batch = db.batch();
    let deleted = 0;

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deleted++;
      
      if (deleted <= 5) {
        console.log(`  - Removing: ${doc.data().name || doc.data().productName} (SKU: ${doc.data().sku})`);
      }
    });

    if (deleted > 5) {
      console.log(`  ... and ${deleted - 5} more items`);
    }

    await batch.commit();
    console.log(`✅ Successfully removed ${deleted} items from warehouse`);

  } catch (error) {
    console.error(`❌ Error removing items: ${error.message}`);
  }
}

function initializeWatcher() {
  // Ensure watch directory exists
  if (!fs.existsSync(WATCH_FOLDER)) {
    console.log(`📁 Creating watch directory: ${WATCH_FOLDER}`);
    fs.mkdirSync(WATCH_FOLDER, { recursive: true });
  }

  const watcher = chokidar.watch(WATCH_FOLDER, {
    ignored: /(^|[\/\\])\.|\.tmp|\.lock/,
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 1000 }
  });

  watcher.on('add', (filePath) => {
    const isSupported = filePath.match(/\.(xlsx|xls|csv)$/i);
    if (isSupported) {
      console.log(`📄 New file: ${path.basename(filePath)}`);
      handleFileChange(filePath);
    }
  });

  watcher.on('change', (filePath) => {
    const isSupported = filePath.match(/\.(xlsx|xls|csv)$/i);
    if (isSupported) {
      handleFileChange(filePath);
    }
  });

  watcher.on('unlink', (filePath) => {
    const isSupported = filePath.match(/\.(xlsx|xls|csv)$/i);
    if (isSupported) {
      handleFileDelete(filePath);
    }
  });

  watcher.on('error', (error) => {
    console.error('❌ Watcher error:', error.message);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Warehouse watcher stopping...');
    watcher.close();
    process.exit(0);
  });

  return watcher;
}

async function displayWelcome() {
  try {
    const stats = await getWarehouseStats();
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 🏭 Warehouse File Watcher (Excel/CSV) │');
    console.log('└─────────────────────────────────────────┘');
    console.log(`📁 Watching: ${WATCH_FOLDER}`);
    console.log(`🏢 Tenant ID: ${TENANT_ID}`);
    console.log(`⏱️ Debounce time: ${DEBOUNCE_TIME}ms`);
    console.log(`📊 Supported formats: Excel (.xlsx, .xls) and CSV`);
    console.log(`✨ Features: Validation, Duplicate detection, Batch sync`);
    
    if (USE_RATE_LIMITING) {
      console.log(`\n📈 Rate Limiting: ENABLED`);
      console.log(`   Daily Limit: ${DAILY_UPLOAD_LIMIT.toLocaleString()} writes/day`);
      console.log(`   Schedule: ${UPLOAD_SCHEDULE_TIME} UTC daily`);
      console.log(`   Queue Mode: ${USE_QUEUE ? 'ON (queue large imports)' : 'OFF (immediate upload)'}`);
      rateLimiter.displayStatus();
    } else {
      console.log(`\n📈 Rate Limiting: DISABLED (unlimited uploads)`);
    }
    
    console.log('\n📊 Current Warehouse Status:');
    console.log(`   Total Items: ${stats.totalItems}`);
    console.log(`   Total Quantity: ${stats.totalQuantity}`);
    console.log(`   Locations: ${stats.locationCount}`);
    console.log(`   SKUs: ${stats.skuCount}`);
    console.log('\n✅ Warehouse watcher ready!');
    console.log('Press Ctrl+C to stop\n');
  } catch (error) {
    console.warn('⚠️ Could not load warehouse stats (Firestore may not be ready)');
    console.log('\n✅ Warehouse watcher ready!');
    console.log('Press Ctrl+C to stop\n');
  }
}

// Main startup sequence
async function main() {
  try {
    console.log('\n🚀 Starting Warehouse File Watcher...\n');
    
    // Initialize Firebase
    initializeFirebase();
    
    // Initialize rate limiter if enabled
    if (USE_RATE_LIMITING) {
      rateLimiter = new UploadRateLimiter({
        dailyLimit: DAILY_UPLOAD_LIMIT,
        dataDir: './data'
      });

      // Initialize daily scheduler
      uploadScheduler = new DailyUploadScheduler({
        dailyLimit: DAILY_UPLOAD_LIMIT,
        dataDir: './data',
        scheduleTime: UPLOAD_SCHEDULE_TIME,
        enabled: true,
        uploadBatchFn: async (item) => {
          // Function to upload a single item
          const db = admin.firestore();
          const docId = item.sku.toUpperCase();
          const docRef = db.collection('tenants').doc(TENANT_ID).collection('products').doc(docId);

          const itemWithMeta = {
            ...item,
            sku: docId,
            active: true,
            quantity: item.quantity,
            name: item.productName || item.name,
            sourceFile: item.sourceFile || 'unknown',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          await docRef.set(itemWithMeta, { merge: true });
        }
      });

      // Start the scheduler
      uploadScheduler.start();
    }
    
    // Initialize watcher
    initializeWatcher();
    
    // Display welcome message with stats
    await displayWelcome();
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Start the watcher
main();

export {
  handleFileChange,
  handleFileDelete,
  shouldProcessFile,
  markFileProcessed,
  fileTracker,
  rateLimiter,
  uploadScheduler
};
