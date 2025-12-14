/**
 * Warehouse File Watcher Service - Enhanced Edition
 * 
 * Real-time bidirectional sync between Excel/CSV files and Firebase Firestore
 * 
 * Features:
 * - File modification time (mtime) based change detection
 * - Real-time monitoring of warehouse Excel and CSV files
 * - Automatic parsing and validation (same logic as inventory)
 * - Duplicate detection within file and against existing stock
 * - Batch Firestore uploads
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
import FileTracker from './FileTracker.js';
import { parseWarehouseCSV } from './services/csvParser.js';
import { parseWarehouseExcel } from './services/excelParser.js';
import { syncWarehouseData, getWarehouseStats } from './services/warehouseFirestore.js';

dotenv.config();

const WATCH_FOLDER = process.env.WAREHOUSE_IMPORT_PATH || './warehouse-imports';
const TENANT_ID = process.env.TENANT_ID || 'default';
const DEBOUNCE_TIME = parseInt(process.env.DEBOUNCE_TIME || '2000');
const FILE_LOCK_TIMEOUT = parseInt(process.env.FILE_LOCK_TIMEOUT || '5000');

const processingFiles = new Set();
const debounceTimers = new Map();

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
 * Validate warehouse item data
 */
function validateWarehouseItem(item, index) {
  const errors = [];
  
  if (!item.sku) {
    errors.push('Missing SKU');
  }
  if (!item.productName) {
    errors.push('Missing Product Name');
  }
  if (item.quantity === undefined || item.quantity === '') {
    errors.push('Missing Quantity');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors, item: {} };
  }

  const quantity = parseInt(item.quantity);
  if (isNaN(quantity) || quantity < 0) {
    return { 
      valid: false, 
      errors: [`Invalid quantity: ${item.quantity}`], 
      item: {} 
    };
  }

  return {
    valid: true,
    errors: [],
    item: {
      sku: String(item.sku).trim().toUpperCase(),
      productName: String(item.productName).trim(),
      quantity: quantity,
      category: item.category ? String(item.category).trim() : 'Uncategorized',
      location: item.location ? String(item.location).trim().toUpperCase() : 'MAIN',
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
    return { ready: 0, skipped: validationErrors.length, synced: 0, failed: 0, dupFound: 0 };
  }

  const fileDups = detectDuplicatesWithinFile(validItems);
  if (fileDups.length > 0) {
    console.warn(`⚠️ ${fileDups.length} duplicates within file`);
  }

  const warehouseDups = await detectDuplicatesInWarehouse(validItems);
  if (warehouseDups.length > 0) {
    console.warn(`⚠️ ${warehouseDups.length} duplicates in warehouse`);
  }

  console.log(`\n📊 Syncing ${validItems.length} items:`);
  validItems.slice(0, 10).forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.productName} (Qty: ${item.quantity}, Location: ${item.location})`);
  });
  if (validItems.length > 10) console.log(`  ... and ${validItems.length - 10} more`);

  const syncResult = await syncWarehouseData(validItems, sourceFile, TENANT_ID);
  
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
  shouldProcessFile,
  markFileProcessed,
  fileTracker
};
