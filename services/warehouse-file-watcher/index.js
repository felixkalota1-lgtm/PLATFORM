/**
 * Warehouse File Watcher Service - Enhanced Edition
 * 
 * Real-time bidirectional sync between CSV files and Firebase Firestore
 * 
 * Features:
 * - File modification time (mtime) based change detection
 * - Real-time monitoring of warehouse CSV files
 * - Automatic CSV parsing and validation
 * - Batch Firestore uploads
 * - File locking detection and retry
 * - Duplicate detection and prevention
 * - Memory-efficient auto-cleanup
 */

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import dotenv from 'dotenv';
import https from 'https';
import admin from 'firebase-admin';
import FileTracker from '../FileTracker.js';
import { parseWarehouseCSV } from './services/csvParser.js';
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
      console.log(`\n🏭 Processing Warehouse CSV: ${fileName}`);
      await waitForFileUnlock(filePath);
      
      const data = await parseWarehouseCSV(filePath);
      if (!data || data.length === 0) {
        console.error('❌ No data in file');
        return;
      }
      
      const result = await syncWarehouseData(data, fileName);
      console.log(`\n✅ Sync Result: ${result.synced} items synced`);
      
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

  watcher.on('add', (filePath) => handleFileChange(filePath));
  watcher.on('change', (filePath) => handleFileChange(filePath));

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
    console.log('│   🏭 Warehouse File Watcher Started    │');
    console.log('└─────────────────────────────────────────┘');
    console.log(`📁 Watching: ${WATCH_FOLDER}`);
    console.log(`🏢 Tenant ID: ${TENANT_ID}`);
    console.log(`⏱️ Debounce time: ${DEBOUNCE_TIME}ms`);
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
