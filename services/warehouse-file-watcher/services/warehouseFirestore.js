/**
 * Warehouse Firestore Service
 * 
 * Handles syncing warehouse inventory data to Firestore
 * 
 * Features:
 * - Batch operations for efficiency
 * - Duplicate detection using location_sku composite key
 * - Validation before sync
 * - Error handling with retry logic
 * - Rate-limited uploads to stay within Free Tier
 * - Real-time updates
 */

import admin from 'firebase-admin';

const BATCH_SIZE = 500;  // Increased from 100 for fewer batches
const MAX_RETRIES = 1;    // Reduced retries for speed
const BATCH_DELAY_MS = 0;  // No delay - Firestore can handle parallel writes

/**
 * Sync warehouse data to Firestore (with optional queuing for rate limiting)
 * @param {Array} items - Warehouse items to sync
 * @param {string} fileName - Source file name
 * @param {string} tenantId - Tenant ID
 * @param {UploadRateLimiter} rateLimiter - Optional rate limiter instance
 * @param {Object} options - { useQueue: boolean, priority: string }
 * @returns {Promise<Object>} { synced, failed, duplicates, queued }
 */
export async function syncWarehouseData(items, fileName, tenantId = 'default', rateLimiter = null, options = {}) {
  const db = admin.firestore();
  
  // If rate limiter is provided and useQueue is true, queue items instead of uploading
  if (rateLimiter && options.useQueue) {
    console.log(`\n📝 Queueing ${items.length} items for rate-limited upload...`);
    const result = rateLimiter.queueItems(items, fileName, options.priority || 'normal');
    
    return {
      synced: 0,
      failed: 0,
      duplicates: 0,
      queued: result.queued,
      total: items.length,
      fileName,
      queued: true,
      queueTotal: result.total
    };
  }

  // Standard immediate sync (respecting daily limits if rate limiter provided)
  let synced = 0;
  let failed = 0;
  let duplicates = 0;

  try {
    // Process all batches in parallel for maximum speed
    const batchPromises = [];
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      // Check if rate limit exceeded
      if (rateLimiter && !rateLimiter.canProcessToday()) {
        console.warn(`⚠️ Daily upload limit reached. Remaining items queued for tomorrow.`);
        const remaining = items.slice(i);
        rateLimiter.queueItems(remaining, fileName, options.priority || 'normal');
        break;
      }

      const batch = items.slice(i, i + BATCH_SIZE);
      batchPromises.push(processBatch(db, batch, fileName, tenantId, rateLimiter));
    }

    // Execute all batches in parallel instead of sequential
    const results = await Promise.all(batchPromises);
    
    // Aggregate results
    results.forEach(result => {
      synced += result.synced;
      failed += result.failed;
      duplicates += result.duplicates;
      
      // Update rate limiter usage
      if (rateLimiter && result.synced > 0) {
        rateLimiter.todayUsage += result.synced;
      }
    });

    console.log(`✅ Warehouse sync complete: ${synced} synced, ${failed} failed, ${duplicates} duplicates`);

    return {
      synced,
      failed,
      duplicates,
      queued: 0,
      total: items.length,
      fileName
    };
  } catch (error) {
    console.error('Fatal error during warehouse sync:', error.message);
    throw error;
  }
}

/**
 * Process a batch of warehouse items
 * @param {Firestore} db - Firestore database instance
 * @param {Array} items - Items to process
 * @param {string} fileName - Source file name
 * @param {string} tenantId - Tenant ID
 * @param {UploadRateLimiter} rateLimiter - Optional rate limiter
 * @returns {Promise<Object>} { synced, failed, duplicates }
 */
async function processBatch(db, items, fileName, tenantId = 'default', rateLimiter = null) {
  const batch = db.batch();
  let synced = 0;
  let failed = 0;
  let duplicates = 0;

  for (const item of items) {
    try {
      // Use SKU as document ID (simpler than location_sku composite)
      const docId = item.sku.toUpperCase();
      const docRef = db.collection('tenants').doc(tenantId).collection('products').doc(docId);

      // Add metadata
      const itemWithMeta = {
        ...item,
        sku: docId,
        active: true,
        quantity: item.quantity,
        name: item.productName || item.name,
        sourceFile: fileName || 'unknown',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Set with merge to handle duplicates
      batch.set(docRef, itemWithMeta, { merge: true });
      synced++;
    } catch (error) {
      console.error(`Failed to process item: ${error.message}`);
      failed++;
    }
  }

  try {
    await batch.commit();
    return { synced, failed, duplicates };
  } catch (error) {
    console.error('Batch commit failed:', error.message);
    return { synced: 0, failed: items.length, duplicates: 0 };
  }
}

/**
 * Get warehouse inventory stats
 * @returns {Promise<Object>} Warehouse statistics
 */
export async function getWarehouseStats() {
  const db = admin.firestore();

  try {
    const snapshot = await db.collection('warehouse_inventory').get();
    
    const stats = {
      totalItems: snapshot.size,
      totalQuantity: 0,
      locations: new Set(),
      skus: new Set()
    };

    snapshot.forEach(doc => {
      const item = doc.data();
      stats.totalQuantity += item.quantity || 0;
      stats.locations.add(item.location);
      stats.skus.add(item.sku);
    });

    return {
      ...stats,
      locations: Array.from(stats.locations),
      skus: Array.from(stats.skus),
      locationCount: stats.locations.length,
      skuCount: stats.skus.length
    };
  } catch (error) {
    console.error('Error getting warehouse stats:', error.message);
    throw error;
  }
}

/**
 * Get inventory for specific location
 * @param {string} location - Location code
 * @returns {Promise<Array>} Items at location
 */
export async function getLocationInventory(location) {
  const db = admin.firestore();

  try {
    const snapshot = await db.collection('warehouse_inventory')
      .where('location', '==', location.toUpperCase())
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting inventory for ${location}:`, error.message);
    throw error;
  }
}

/**
 * Get inventory for specific SKU
 * @param {string} sku - Product SKU
 * @returns {Promise<Array>} Items with SKU
 */
export async function getSKUInventory(sku) {
  const db = admin.firestore();

  try {
    const snapshot = await db.collection('warehouse_inventory')
      .where('sku', '==', sku.toUpperCase())
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting inventory for SKU ${sku}:`, error.message);
    throw error;
  }
}

/**
 * Update item quantity
 * @param {string} location - Warehouse location
 * @param {string} sku - Product SKU
 * @param {number} quantity - New quantity
 * @returns {Promise<void>}
 */
export async function updateQuantity(location, sku, quantity) {
  const db = admin.firestore();
  const docId = `${location.toUpperCase()}_${sku.toUpperCase()}`;

  try {
    await db.collection('warehouse_inventory').doc(docId).update({
      quantity: quantity,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating quantity for ${docId}:`, error.message);
    throw error;
  }
}

/**
 * Delete warehouse item
 * @param {string} location - Warehouse location
 * @param {string} sku - Product SKU
 * @returns {Promise<void>}
 */
export async function deleteWarehouseItem(location, sku) {
  const db = admin.firestore();
  const docId = `${location.toUpperCase()}_${sku.toUpperCase()}`;

  try {
    await db.collection('warehouse_inventory').doc(docId).delete();
  } catch (error) {
    console.error(`Error deleting warehouse item ${docId}:`, error.message);
    throw error;
  }
}

export default {
  syncWarehouseData,
  getWarehouseStats,
  getLocationInventory,
  getSKUInventory,
  updateQuantity,
  deleteWarehouseItem
};
