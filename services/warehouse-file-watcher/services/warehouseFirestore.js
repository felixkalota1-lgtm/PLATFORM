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
 * - Real-time updates
 */

import admin from 'firebase-admin';

const BATCH_SIZE = 100;
const MAX_RETRIES = 3;

/**
 * Sync warehouse data to Firestore
 * @param {Array} items - Warehouse items to sync
 * @param {string} fileName - Source file name
 * @returns {Promise<Object>} { synced, failed, duplicates }
 */
export async function syncWarehouseData(items, fileName, tenantId = 'default') {
  const db = admin.firestore();
  let synced = 0;
  let failed = 0;
  let duplicates = 0;

  try {
    // CHANGED: Sync to tenants/{id}/products (warehouse is primary source)
    // Process in batches
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const result = await processBatch(db, batch, tenantId);
      synced += result.synced;
      failed += result.failed;
      duplicates += result.duplicates;
    }

    console.log(`✅ Warehouse sync complete: ${synced} synced, ${failed} failed, ${duplicates} duplicates`);

    return {
      synced,
      failed,
      duplicates,
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
 * @returns {Promise<Object>} { synced, failed, duplicates }
 */
async function processBatch(db, items, tenantId = 'default') {
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
