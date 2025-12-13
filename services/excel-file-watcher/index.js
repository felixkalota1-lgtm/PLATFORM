/**
 * Excel File Watcher Service - Enhanced Edition
 * 
 * Implements the same validation and duplicate detection logic as bulk upload
 * Features:
 * - Real-time monitoring of Excel files using FileTracker (mtime-based)
 * - Automatic change detection without manual hash calculation
 * - Same validation logic as bulk upload
 * - Duplicate detection within file and against inventory
 * - Batch Firestore uploads
 * - Foundation ready for warehouse integration
 */

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import XLSX from 'xlsx';
import dotenv from 'dotenv';
import https from 'https';
import admin from 'firebase-admin';
import crypto from 'crypto';
import FileTracker from './FileTracker.js';

dotenv.config();

const WATCH_FOLDER = process.env.EXCEL_IMPORT_PATH || './excel-imports';
const TENANT_ID = process.env.TENANT_ID || 'default';
const DEBOUNCE_TIME = parseInt(process.env.DEBOUNCE_TIME || '2000');
const FILE_LOCK_TIMEOUT = parseInt(process.env.FILE_LOCK_TIMEOUT || '5000');

const processingFiles = new Set();
const debounceTimers = new Map();
const columnMappingCache = new Map();

// Initialize file tracker with mtime-based detection
const fileTracker = new FileTracker({
  skipWindow: 2000,           // Skip duplicates within 2 seconds
  reprocessWindow: 30000,     // Allow reprocess after 30 seconds
  lockRetryDelay: 1000,       // Retry locked files after 1 second
  systemType: 'inventory'     // For multi-system support
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
      throw new Error('Missing Firebase credentials in .env');
    }

    admin.initializeApp({
      credential: admin.credential.cert({projectId, privateKey, clientEmail}),
      projectId,
    });

    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
  }
}

/**
 * Check if file should be processed using FileTracker
 * FileTracker handles all mtime-based logic centrally
 */
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

/**
 * Mark file as successfully processed
 */
function markFileProcessed(filePath) {
  fileTracker.markAsProcessed(filePath);
}

async function detectColumnMapping(columns) {
  try {
    const cacheKey = columns.join('|');
    if (columnMappingCache.has(cacheKey)) {
      console.log('✅ Using cached column mapping');
      return columnMappingCache.get(cacheKey);
    }

    const directMapping = createDirectMapping(columns);
    if (Object.values(directMapping).some(v => v !== null)) {
      columnMappingCache.set(cacheKey, directMapping);
      return directMapping;
    }

    const prompt = `Map Excel columns to product fields: ${columns.join(', ')}
Return JSON: {"mapping": {"col": "field"}}`;

    const response = await callHuggingFaceAPI(prompt);
    const mapping = JSON.parse(response);
    columnMappingCache.set(cacheKey, mapping.mapping);
    return mapping.mapping;
  } catch (error) {
    console.warn('⚠️ AI mapping failed, using basic mapping');
    return createBasicMapping(columns);
  }
}

function createDirectMapping(columns) {
  const mapping = {};
  const standardFields = {
    productName: ['Name', 'name', 'Product', 'product', 'Title', 'title'],
    productDescription: ['Description', 'description', 'Desc', 'desc', 'Details'],
    price: ['Price', 'price', 'Cost', 'cost'],
    quantity: ['Stock', 'stock', 'Qty', 'qty', 'Quantity'],
    sku: ['SKU', 'sku', 'Code', 'code', 'PartNumber'],
    alternateSkus: ['Alternate SKUs', 'Alternate SKU', 'Part Numbers', 'Part Number', 'AlternateSkus', 'alternateSkus', 'Alternate Code'],
    supplier: ['Supplier', 'supplier', 'Vendor'],
    category: ['Category', 'category', 'Type'],
  };

  columns.forEach(col => {
    let matched = false;
    for (const [field, keywords] of Object.entries(standardFields)) {
      if (keywords.includes(col)) {
        mapping[col] = field;
        matched = true;
        break;
      }
    }
    if (!matched) mapping[col] = null;
  });

  return mapping;
}

function createBasicMapping(columns) {
  const mapping = {};
  const standardFields = {
    productName: ['name', 'product', 'item', 'title'],
    productDescription: ['description', 'details', 'notes'],
    price: ['price', 'cost', 'amount'],
    quantity: ['quantity', 'stock', 'qty', 'count'],
    sku: ['sku', 'code', 'part', 'partnumber'],
    alternateSkus: ['alternate', 'alternalte', 'part', 'number'],
    supplier: ['supplier', 'vendor'],
    category: ['category', 'type'],
  };

  columns.forEach(col => {
    const colLower = col.toLowerCase().trim();
    let matched = false;
    for (const [field, keywords] of Object.entries(standardFields)) {
      if (keywords.some(kw => colLower.includes(kw))) {
        mapping[col] = field;
        matched = true;
        break;
      }
    }
    if (!matched) mapping[col] = null;
  });

  return mapping;
}

function callHuggingFaceAPI(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({inputs: prompt, parameters: {max_length: 500}});
    const options = {
      hostname: 'api-inference.huggingface.co',
      path: '/models/mistralai/Mistral-7B-Instruct-v0.1',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_HF_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed[0]?.generated_text) {
            const jsonMatch = parsed[0].generated_text.match(/\{[\s\S]*\}/);
            resolve(jsonMatch ? jsonMatch[0] : parsed[0].generated_text);
          } else {
            reject(new Error('Invalid response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function isFileLocked(filePath) {
  try {
    const file = await fs.promises.open(filePath, 'r+');
    await file.close();
    return false;
  } catch {
    return true;
  }
}

async function waitForFileUnlock(filePath, maxWait = FILE_LOCK_TIMEOUT) {
  const startTime = Date.now();
  while (await isFileLocked(filePath)) {
    if (Date.now() - startTime > maxWait) {
      console.warn(`⚠️ File still locked, proceeding anyway`);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

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

function validateProduct(product, columnMapping, index) {
  const getValueByField = (field) => {
    const col = Object.entries(columnMapping).find(([_, f]) => f === field)?.[0];
    return col ? String(product[col] || '').trim() : '';
  };

  const name = getValueByField('productName');
  if (!name) {
    return { valid: false, errors: ['Missing product name'], product: {} };
  }

  return {
    valid: true,
    errors: [],
    product: {
      name,
      description: getValueByField('productDescription') || '(No description)',
      category: getValueByField('category') || 'Uncategorized',
      price: parseFloat(getValueByField('price')) || 0,
      sku: getValueByField('sku') || '',
      alternateSkus: getValueByField('alternateSkus') || '',
      stock: parseInt(getValueByField('quantity')) || 0,
      supplier: getValueByField('supplier') || '',
    },
  };
}

function detectDuplicatesWithinFile(products) {
  const duplicates = [];
  const seenSkus = new Set();

  products.forEach((product, i) => {
    if (!product.sku) return; // Skip auto-generated SKUs

    // Check for duplicate SKUs within the file
    if (seenSkus.has(product.sku)) {
      duplicates.push({
        sourceProduct: `${product.name} (SKU: ${product.sku})`,
        reason: 'Same SKU appears multiple times in file',
        location: 'within-file',
      });
    }
    seenSkus.add(product.sku);
  });

  return duplicates;
}

async function detectDuplicatesInInventory(products, tenantId = TENANT_ID) {
  if (!admin.apps.length) return [];

  try {
    const db = admin.firestore();
    const snapshot = await db.collection('tenants').doc(tenantId).collection('products').where('active', '==', true).get();
    const existing = snapshot.docs.map(d => {
      const data = d.data();
      return {
        sku: data.sku,
        alternateSkus: data.alternateSkus ? (typeof data.alternateSkus === 'string' ? data.alternateSkus.split(',').map(s => s.trim()) : data.alternateSkus) : [],
        name: data.name,
        description: data.description || '',
      };
    });

    const duplicates = [];
    products.forEach(product => {
      if (!product.sku) return; // Skip auto-generated SKUs from duplicate check
      
      // STRICT: Check for exact SKU match only (100% same)
      const skuMatch = existing.find(
        e => e.sku === product.sku || e.alternateSkus.includes(product.sku)
      );
      if (skuMatch) {
        duplicates.push({
          sourceProduct: `${product.name} (SKU: ${product.sku})`,
          matchedProduct: `${skuMatch.name} (SKU: ${skuMatch.sku})`,
          similarity: 100,
          reason: 'Exact SKU match - same product already exists',
        });
        return;
      }

      // No longer check for name similarity - allow same names with different SKUs
    });
    return duplicates;
  } catch (error) {
    console.warn('⚠️ Inventory check failed:', error.message);
    return [];
  }
}

function calculateProductSimilarity(uploaded, existing) {
  const ns = stringSimilarity(uploaded.name, existing.name);
  const ds = stringSimilarity(uploaded.description || '', existing.description || '');
  return (ns * 0.7) + (ds * 0.3);
}

function stringSimilarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  const ed = getEditDistance(longer, shorter);
  return (longer.length - ed) / longer.length;
}

function getEditDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

async function syncProductsToFirestore(products, tenantId = TENANT_ID) {
  if (!admin.apps.length) return {synced: 0, failed: 0, errors: []};

  let synced = 0, failed = 0;
  const errors = [];

  try {
    const db = admin.firestore();
    const productsCollection = db.collection('tenants').doc(tenantId).collection('products');

    console.log(`🔄 Syncing ${products.length} products with batch operation...`);

    // First pass: collect all existing SKUs and alternate SKUs
    const existingSnapshot = await productsCollection.get();
    const existingSkuMap = new Map(); // SKU -> docId
    const existingNameMap = new Map(); // Name -> SKU (for products with empty SKUs)
    const existingProducts = [];
    
    existingSnapshot.forEach(doc => {
      const data = doc.data();
      const sku = data.sku;
      existingSkuMap.set(sku, doc.id);
      
      // Map product names to their SKUs (so empty SKU products can reuse them)
      if (data.name && !existingNameMap.has(data.name)) {
        existingNameMap.set(data.name, sku);
      }
      
      // Also map alternate SKUs
      if (data.alternateSkus) {
        const altSkus = typeof data.alternateSkus === 'string'
          ? data.alternateSkus.split(',').map(s => s.trim())
          : data.alternateSkus;
        altSkus.forEach(altSku => {
          existingSkuMap.set(altSku, doc.id);
        });
      }
      
      existingProducts.push({
        id: doc.id,
        sku,
        alternateSkus: data.alternateSkus || [],
        name: data.name,
        description: data.description || '',
      });
    });

    console.log(`📦 Found ${existingSkuMap.size} existing SKUs in inventory`);

    // Second pass: create batch operations
    const batch = db.batch();
    const productsRef = productsCollection;
    const processedSkus = new Set();

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        // IMPORTANT: SKU is the PRIMARY KEY
        let finalSku = product.sku ? String(product.sku).trim() : null;
        
        if (!finalSku) {
          // If no SKU: check if product with same name already exists
          if (existingNameMap.has(product.name)) {
            // Reuse the existing product's SKU
            finalSku = existingNameMap.get(product.name);
            console.log(`  ℹ️  Using existing SKU for "${product.name}": ${finalSku}`);
          } else {
            // Auto-generate SKU if not provided and product is new
            finalSku = `AUTO-${product.name.substring(0, 3).toUpperCase()}-${Date.now()}-${i}`;
          }
        }

        // Skip if already processed in this batch
        if (processedSkus.has(finalSku)) {
          console.log(`  ⏭️  Skipped: ${product.name} (SKU: ${finalSku}) - Duplicate in batch`);
          failed++;
          continue;
        }
        processedSkus.add(finalSku);

        // Parse alternate SKUs from product data
        const alternateSkusList = product.alternateSkus
          ? product.alternateSkus.split(',').map(s => s.trim()).filter(s => s && s !== finalSku)
          : [];

        const productData = {
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          stock: product.stock,
          sku: finalSku,
          skuKey: finalSku.toLowerCase(),
          alternateSkus: alternateSkusList.length > 0 ? alternateSkusList.join(',') : '',
          supplier: product.supplier,
          active: true,
          lastUpdated: new Date().toISOString(),
          syncedFrom: 'excel-watcher',
        };

        // Check if SKU already exists
        if (existingSkuMap.has(finalSku)) {
          // UPDATE existing product
          const existingDocId = existingSkuMap.get(finalSku);
          if (existingDocId) {
            batch.update(productsRef.doc(existingDocId), productData);
            console.log(`  ✏️ Updated: ${product.name} (SKU: ${finalSku}) with ${alternateSkusList.length} alternate SKUs`);
          }
        } else {
          // CREATE new product (new SKU)
          const newDocRef = productsRef.doc();
          batch.set(newDocRef, productData);
          console.log(`  ➕ Created: ${product.name} (SKU: ${finalSku}) with ${alternateSkusList.length} alternate SKUs`);
          // Mark as processed with actual docId
          existingSkuMap.set(finalSku, newDocRef.id);
          
          // Also add alternate SKUs to map
          alternateSkusList.forEach(altSku => {
            existingSkuMap.set(altSku, newDocRef.id);
          });
        }
        synced++;
      } catch (error) {
        failed++;
        errors.push({product: product.name, error: error.message});
        console.error(`  ❌ ${product.name}: ${error.message}`);
      }
    }

    await batch.commit();
    console.log(`✅ Batch committed: ${synced} synced, ${failed} failed`);
    return {synced, failed, errors};
  } catch (error) {
    console.error('❌ Batch failed:', error.message);
    return {synced: 0, failed: products.length, errors: [{product: 'batch', error: error.message}]};
  }
}

async function processProductsForUpload(products, columnMapping, sourceFile) {
  console.log(`\n🔄 Found ${products.length} products`);
  
  const validProducts = [];
  const validationErrors = [];
  
  products.forEach((product, index) => {
    const validation = validateProduct(product, columnMapping, index);
    if (validation.valid) {
      validProducts.push(validation.product);
    } else {
      validationErrors.push({row: index + 2, errors: validation.errors});
    }
  });
  
  if (validationErrors.length > 0) {
    console.warn(`⚠️ Validation errors for ${validationErrors.length} products`);
  }
  
  if (validProducts.length === 0) {
    console.error('❌ No valid products');
    return {ready: 0, skipped: validationErrors.length, synced: 0, failed: 0, dupFound: 0};
  }

  const fileDups = detectDuplicatesWithinFile(validProducts);
  if (fileDups.length > 0) {
    console.warn(`⚠️ ${fileDups.length} duplicates within file`);
  }

  const invDups = await detectDuplicatesInInventory(validProducts);
  if (invDups.length > 0) {
    console.warn(`⚠️ ${invDups.length} duplicates in inventory`);
  }

  console.log(`\n📊 Syncing ${validProducts.length} products:`);
  validProducts.slice(0, 10).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} (Stock: ${p.stock})`);
  });
  if (validProducts.length > 10) console.log(`  ... and ${validProducts.length - 10} more`);

  const syncResult = await syncProductsToFirestore(validProducts, TENANT_ID);
  
  return {
    ready: validProducts.length,
    skipped: validationErrors.length,
    dupFound: fileDups.length + invDups.length,
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
      console.log(`\n📥 Processing: ${fileName}`);
      await waitForFileUnlock(filePath);
      
      const {data: products, columns} = parseExcelFile(filePath);
      if (!products || products.length === 0) {
        console.error('❌ No data in file');
        return;
      }
      
      const columnMapping = await detectColumnMapping(columns);
      const result = await processProductsForUpload(products, columnMapping, fileName);
      console.log(`\n📊 Result: ${result.synced} synced, ${result.failed} failed, ${result.dupFound} duplicates detected`);
      
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

export function startWatcher(watchFolder = WATCH_FOLDER) {
  if (!fs.existsSync(watchFolder)) {
    fs.mkdirSync(watchFolder, {recursive: true});
  }
  
  console.log(`\n🔍 Excel Watcher (Enhanced - Bulk Upload Logic)`);
  console.log(`📂 Folder: ${watchFolder}`);
  console.log(`🏢 Tenant: ${TENANT_ID}`);
  console.log(`📋 Features: File hash check, Duplicate detection, Batch sync\n`);
  
  const watcher = chokidar.watch(watchFolder, {
    ignored: /(^|[\/\\])\.|\.tmp$/,
    persistent: true,
    awaitWriteFinish: {stabilityThreshold: 2000, pollInterval: 100},
  });
  
  watcher
    .on('add', filePath => {
      if (filePath.match(/\.(xlsx|xls)$/)) {
        console.log(`📄 New file: ${path.basename(filePath)}`);
        handleFileChange(filePath);
      }
    })
    .on('change', filePath => {
      if (filePath.match(/\.(xlsx|xls)$/)) handleFileChange(filePath);
    })
    .on('error', error => console.error('❌ Watcher error:', error));
  
  console.log('✅ Watcher started. Press Ctrl+C to stop.\n');
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping watcher...');
    watcher.close();
    process.exit(0);
  });
  
  return watcher;
}

console.log('Initializing File Watcher...');
initializeFirebase();
startWatcher();

export default startWatcher;
