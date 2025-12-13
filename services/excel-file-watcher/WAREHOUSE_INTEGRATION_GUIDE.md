# Warehouse System - FileTracker Integration Guide

## Overview

When you build the warehouse system, you can reuse the **FileTracker** module from the inventory watcher. This guide shows exactly how.

## Step 1: Structure for Warehouse

```
warehouse-file-watcher/
├── index.js                    # Main warehouse watcher
├── FileTracker.js             # Reuse from inventory
├── services/
│   ├── warehouseService.js    # Warehouse-specific logic
│   ├── csvParser.js           # Parse CSV files
│   └── warehouseFirestore.js  # Warehouse Firestore operations
└── README.md
```

## Step 2: Import FileTracker

The FileTracker is designed to be shared. Simplest approach:

**Option A: Copy file**
```bash
cp services/excel-file-watcher/FileTracker.js services/warehouse-file-watcher/FileTracker.js
```

**Option B: Shared location (better long-term)**
```
services/
├── FileTracker.js              # Shared module
├── excel-file-watcher/
│   ├── index.js               # References ../FileTracker.js
│   └── ...
└── warehouse-file-watcher/
    ├── index.js               # References ../FileTracker.js
    └── ...
```

## Step 3: Create Warehouse Watcher

**warehouse-file-watcher/index.js**

```javascript
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import dotenv from 'dotenv';
import FileTracker from '../FileTracker.js';
import { parseWarehouseCSV } from './services/csvParser.js';
import { syncWarehouseData } from './services/warehouseFirestore.js';

dotenv.config();

// Configuration - similar to inventory but for warehouse
const WATCH_FOLDER = process.env.WAREHOUSE_IMPORT_PATH || './warehouse-imports';
const DEBOUNCE_TIME = parseInt(process.env.DEBOUNCE_TIME || '2000');

// Processing state
const processingFiles = new Set();
const debounceTimers = new Map();

// Initialize FileTracker for warehouse
const fileTracker = new FileTracker({
  skipWindow: 2000,           // Skip duplicates within 2 seconds
  reprocessWindow: 30000,     // Allow reprocess after 30 seconds
  lockRetryDelay: 1000,       // Retry locked files after 1 second
  maxTrackedFiles: 100,       // Track up to 100 files
  systemType: 'warehouse'     // Different from inventory
});

console.log('🏭 Warehouse File Watcher Starting...');
console.log(`📁 Watching: ${WATCH_FOLDER}`);

// Create watch folder if doesn't exist
if (!fs.existsSync(WATCH_FOLDER)) {
  fs.mkdirSync(WATCH_FOLDER, { recursive: true });
}

// Initialize watcher
const watcher = chokidar.watch(WATCH_FOLDER, {
  ignored: /(^|[\/\\])\.|\.tmp/,
  persistent: true,
  awaitWriteFinish: { stabilityThreshold: 1000 }
});

// File change handler
watcher.on('add', (filePath) => handleFileChange(filePath));
watcher.on('change', (filePath) => handleFileChange(filePath));

// Main file processing function
async function handleFileChange(filePath) {
  const fileName = path.basename(filePath);
  
  if (processingFiles.has(filePath)) {
    console.log(`⏭️ Already processing ${fileName}`);
    return;
  }

  // Use FileTracker to check if should process
  if (!shouldProcessFile(filePath)) {
    return;
  }
  
  // Debounce rapid changes
  if (debounceTimers.has(filePath)) {
    clearTimeout(debounceTimers.get(filePath));
  }
  
  const timer = setTimeout(async () => {
    processingFiles.add(filePath);
    debounceTimers.delete(filePath);
    
    try {
      console.log(`\n🏭 Processing Warehouse: ${fileName}`);
      
      // Parse warehouse CSV
      const data = parseWarehouseCSV(filePath);
      if (!data || data.length === 0) {
        console.error('❌ No data in file');
        return;
      }
      
      // Sync to Firestore warehouse collection
      const result = await syncWarehouseData(data, fileName);
      console.log(`\n✅ Synced: ${result.synced} items`);
      
      // Mark file as processed
      fileTracker.markAsProcessed(filePath);
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      processingFiles.delete(filePath);
      fileTracker.cleanup();  // Periodic cleanup
    }
  }, DEBOUNCE_TIME);
  
  debounceTimers.set(filePath, timer);
}

// Check if file should be processed using FileTracker
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

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Warehouse watcher stopping...');
  watcher.close();
  process.exit(0);
});

console.log('✅ Warehouse watcher ready!');
```

## Step 4: Warehouse Services

**warehouse-file-watcher/services/csvParser.js**

```javascript
import fs from 'fs';
import csv from 'csv-parser';

export function parseWarehouseCSV(filePath) {
  const data = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        data.push({
          location: row.location,
          sku: row.sku,
          quantity: parseInt(row.quantity),
          lastUpdated: new Date(),
          source: 'warehouse-csv'
        });
      })
      .on('end', () => resolve(data))
      .on('error', reject);
  });
}
```

**warehouse-file-watcher/services/warehouseFirestore.js**

```javascript
import admin from 'firebase-admin';

export async function syncWarehouseData(items, fileName) {
  const db = admin.firestore();
  const batch = db.batch();
  
  let synced = 0;
  
  for (const item of items) {
    try {
      const docRef = db.collection('warehouse_inventory')
        .doc(`${item.location}_${item.sku}`);
      
      batch.set(docRef, item, { merge: true });
      synced++;
    } catch (error) {
      console.error('Error processing item:', error);
    }
  }
  
  await batch.commit();
  
  return {
    synced,
    failed: items.length - synced
  };
}
```

## Step 5: Package.json

Add warehouse watcher to your services:

```json
{
  "scripts": {
    "watcher:inventory": "node services/excel-file-watcher/index.js",
    "watcher:warehouse": "node services/warehouse-file-watcher/index.js",
    "watchers": "concurrently \"npm run watcher:inventory\" \"npm run watcher:warehouse\"",
    "dev": "vite",
    "build": "tsc && vite build"
  },
  "dependencies": {
    "chokidar": "^3.5.3",
    "csv-parser": "^3.0.0",
    "xlsx": "^0.18.5",
    "firebase-admin": "^12.0.0",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

## Step 6: Environment Setup

**.env**
```env
# Inventory
EXCEL_IMPORT_PATH=./excel-imports
DEBOUNCE_TIME=2000
FILE_LOCK_TIMEOUT=5000

# Warehouse (add)
WAREHOUSE_IMPORT_PATH=./warehouse-imports
```

## Step 7: Running Both Systems

```bash
# Start both watchers simultaneously
npm run watchers

# Or separately in different terminals
npm run watcher:inventory
npm run watcher:warehouse
```

## Multi-System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   File System                            │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  excel-imports/  │      │warehouse-imports/│        │
│  │  products.xlsx   │      │  locations.csv   │        │
│  └──────────────────┘      └──────────────────┘        │
└────────┬──────────────────────────────────┬──────────────┘
         │                                  │
         ↓                                  ↓
┌──────────────────────┐        ┌──────────────────────┐
│ Inventory Watcher    │        │ Warehouse Watcher    │
│ (inventory system)   │        │ (warehouse system)   │
└──────────┬───────────┘        └──────────┬───────────┘
           │                               │
           │ Uses FileTracker             │ Uses FileTracker
           │ (systemType: inventory)      │ (systemType: warehouse)
           │                               │
           ↓                               ↓
    ┌────────────────┐          ┌────────────────┐
    │ Firestore      │          │ Firestore      │
    │ (inventory)    │          │ (warehouse)    │
    └────────────────┘          └────────────────┘
```

## Benefits of This Approach

### Code Reuse
- ✅ **One FileTracker module** used by both systems
- ✅ **Same proven logic** for change detection
- ✅ **Minimal duplication** - just the business logic differs

### Independent Operation
- ✅ **Separate tracking states** - no interference
- ✅ **Different watch folders** - clean separation
- ✅ **Different Firestore collections** - clean data

### Scalability
- ✅ Can add more watchers (e.g., POS, suppliers) same way
- ✅ All use same FileTracker for consistency
- ✅ Easy to monitor/debug across all systems

### Performance
- ✅ Each watcher is independent process
- ✅ FileTracker's O(1) checks means low CPU
- ✅ Can run multiple watchers on same machine

## Testing Multi-System

1. **Start both watchers:**
   ```bash
   npm run watchers
   ```

2. **Add test files:**
   ```bash
   # Add to inventory watch
   cp sample_products.xlsx excel-imports/test.xlsx
   
   # Add to warehouse watch
   cp sample_locations.csv warehouse-imports/test.csv
   ```

3. **Monitor logs:**
   - Inventory watcher processes Excel
   - Warehouse watcher processes CSV
   - No interference between them

4. **Check Firestore:**
   - `inventory_products` collection updated
   - `warehouse_inventory` collection updated
   - Both collections independent

## Troubleshooting Multi-System

| Issue | Solution |
|-------|----------|
| Both watchers fight over same file | Use different watch folders (✅ done) |
| Warehouse system interferes with inventory | Different Firestore collections (✅ done) |
| Can't tell which logs from which watcher | FileTracker has `systemType` logging (✅ ready) |
| Memory grows unbounded | Both use fileTracker.cleanup() (✅ done) |

## Next Steps

When warehouse is built:
1. Copy FileTracker to warehouse-file-watcher
2. Create warehouse-specific services
3. Use same patterns from inventory watcher
4. Add to docker-compose or PM2 for production

This ensures:
- Consistency across systems
- Proven reliability
- Easy maintenance
- Clear separation of concerns
