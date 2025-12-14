#!/usr/bin/env node

/**
 * Upload Queue Manager CLI
 * 
 * Manage the upload queue from command line:
 * - View status
 * - Process queue manually
 * - Clear queue
 * - Adjust limits
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import UploadRateLimiter from './services/uploadRateLimiter.js';
import DailyUploadScheduler from './services/dailyUploadScheduler.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');

dotenv.config({ path: envPath });

// Initialize Firebase
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (projectId && privateKey && clientEmail) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      privateKey,
      clientEmail
    })
  });
}

const TENANT_ID = process.env.TENANT_ID || 'default';
const DAILY_UPLOAD_LIMIT = parseInt(process.env.DAILY_UPLOAD_LIMIT || '18000');

const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

// Initialize rate limiter
const rateLimiter = new UploadRateLimiter({
  dailyLimit: DAILY_UPLOAD_LIMIT,
  dataDir: './data'
});

async function init() {
  // No initialization needed for command-line
}

async function statusCommand() {
  console.log('\n');
  rateLimiter.displayStatus();
  
  // Show queue breakdown
  const priorities = {
    critical: rateLimiter.queue.items.filter(i => i.priority === 'critical').length,
    normal: rateLimiter.queue.items.filter(i => i.priority === 'normal').length,
    low: rateLimiter.queue.items.filter(i => i.priority === 'low').length
  };

  console.log('📊 Queue Breakdown by Priority:');
  console.log(`   Critical: ${priorities.critical}`);
  console.log(`   Normal:   ${priorities.normal}`);
  console.log(`   Low:      ${priorities.low}`);
  console.log('');

  // Show recent queue additions
  if (rateLimiter.queue.items.length > 0) {
    console.log('📋 Recent Queue Items:');
    rateLimiter.queue.items.slice(0, 5).forEach((item, i) => {
      const age = Math.round((Date.now() - item.queuedAt) / 1000 / 60); // minutes
      console.log(`   ${i + 1}. ${item.sku} (${item.productName}) - queued ${age}m ago`);
    });
    
    if (rateLimiter.queue.items.length > 5) {
      console.log(`   ... and ${rateLimiter.queue.items.length - 5} more`);
    }
  }
}

async function processCommand() {
  console.log('\n⚡ Starting immediate queue processing...\n');
  
  const uploadFn = async (item) => {
    if (!admin.apps.length) {
      throw new Error('Firebase not initialized');
    }

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
  };

  try {
    const result = await rateLimiter.processQueue(uploadFn);
    console.log(`\n✅ Queue processing complete!`);
    console.log(`   Processed: ${result.processed}`);
    console.log(`   Failed: ${result.failed}`);
    console.log(`   Remaining: ${result.queued}\n`);
  } catch (error) {
    console.error(`\n❌ Error processing queue: ${error.message}\n`);
  }
}

async function clearCommand() {
  if (arg1 !== '--confirm') {
    console.log('\n⚠️ Clear queue with: queue-manager clear --confirm');
    console.log(`   Current queue size: ${rateLimiter.queue.items.length} items\n`);
    return;
  }

  const count = rateLimiter.queue.items.length;
  rateLimiter.queue.items = [];
  rateLimiter.queue.total = 0;
  rateLimiter.saveQueue();

  console.log(`\n🗑️ Cleared ${count} items from queue\n`);
}

async function limitCommand() {
  if (!arg1) {
    console.log('\n📊 Current daily limit: ' + rateLimiter.dailyLimit.toLocaleString() + ' writes/day');
    console.log('Usage: queue-manager limit <new-limit>\n');
    return;
  }

  const newLimit = parseInt(arg1);
  if (isNaN(newLimit) || newLimit < 100) {
    console.log('\n❌ Invalid limit. Must be at least 100\n');
    return;
  }

  if (newLimit > 40000) {
    console.log('\n⚠️ Warning: Setting limit above 40,000 exceeds safe free tier margin\n');
  }

  rateLimiter.dailyLimit = newLimit;
  rateLimiter.saveStats();

  console.log(`\n✅ Daily limit updated to ${newLimit.toLocaleString()} writes/day\n`);
}

async function resetCommand() {
  if (arg1 !== '--confirm') {
    console.log('\n⚠️ Reset daily counter with: queue-manager reset --confirm');
    console.log(`   Current usage: ${rateLimiter.todayUsage.toLocaleString()} writes\n`);
    return;
  }

  rateLimiter.resetDaily();
  console.log(`\n✅ Daily counter reset\n`);
}

async function pruneCommand() {
  const daysToKeep = arg1 ? parseInt(arg1) : 30;
  
  if (isNaN(daysToKeep) || daysToKeep < 1) {
    console.log('\n❌ Invalid days to keep. Must be at least 1\n');
    return;
  }

  console.log(`\n🧹 Pruning stats older than ${daysToKeep} days...\n`);
  rateLimiter.pruneOldStats(daysToKeep);
  console.log('');
}

async function exportCommand() {
  const exportPath = arg1 || 'queue-export.json';
  const data = {
    queue: rateLimiter.queue,
    stats: rateLimiter.stats,
    exportedAt: new Date().toISOString()
  };

  fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
  console.log(`\n✅ Queue exported to ${exportPath}\n`);
}

async function priorityCommand() {
  const priority = arg1?.toLowerCase();
  
  if (!priority || !['critical', 'normal', 'low'].includes(priority)) {
    console.log('\n❌ Usage: queue-manager priority <critical|normal|low>');
    console.log('Shows count of items at each priority level\n');
    return;
  }

  const items = rateLimiter.queue.items.filter(i => 
    (i.priority || 'normal') === priority
  );

  console.log(`\n📋 Items with priority "${priority}":`);
  console.log(`   Count: ${items.length}\n`);

  if (items.length > 0 && items.length <= 10) {
    items.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.sku} - ${item.productName}`);
    });
  } else if (items.length > 10) {
    items.slice(0, 10).forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.sku} - ${item.productName}`);
    });
    console.log(`   ... and ${items.length - 10} more\n`);
  }
}

function helpCommand() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║          Upload Queue Manager - CLI Commands           ║
╚════════════════════════════════════════════════════════╝

STATUS
  queue-manager status
    Display queue status, stats, and breakdown

PROCESS
  queue-manager process
    Immediately process queued items (respects daily limit)

CLEAR
  queue-manager clear --confirm
    Delete all items from queue (requires confirmation)

LIMIT
  queue-manager limit <number>
    Get or set daily upload limit
    Example: queue-manager limit 15000

RESET
  queue-manager reset --confirm
    Reset today's usage counter (requires confirmation)

PRUNE
  queue-manager prune [days]
    Remove old stats (default: 30 days)
    Example: queue-manager prune 7

EXPORT
  queue-manager export [filename]
    Export queue and stats to JSON file
    Example: queue-manager export my-queue.json

PRIORITY
  queue-manager priority <critical|normal|low>
    Show items at given priority level

HELP
  queue-manager help
    Display this help message

EXAMPLES
  queue-manager status                 # Check queue status
  queue-manager process                # Process queue now
  queue-manager limit 12000            # Change daily limit to 12k
  queue-manager clear --confirm        # Clear entire queue
  queue-manager export backup.json     # Backup queue

  `);
}

async function main() {
  try {
    await init();

    switch (command) {
      case 'status':
        await statusCommand();
        break;
      case 'process':
        await processCommand();
        break;
      case 'clear':
        await clearCommand();
        break;
      case 'limit':
        await limitCommand();
        break;
      case 'reset':
        await resetCommand();
        break;
      case 'prune':
        await pruneCommand();
        break;
      case 'export':
        await exportCommand();
        break;
      case 'priority':
        await priorityCommand();
        break;
      case 'help':
      case undefined:
        helpCommand();
        break;
      default:
        console.log(`\n❌ Unknown command: ${command}`);
        console.log('Run "queue-manager help" for available commands\n');
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }

  // Exit cleanly
  if (admin.apps.length > 0) {
    await admin.app().delete();
  }
  process.exit(0);
}

main();
