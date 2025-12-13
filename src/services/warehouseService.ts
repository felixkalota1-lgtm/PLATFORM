/**
 * Warehouse Service - Client-side API for Firestore operations
 * 
 * Used by the app to read/write warehouse inventory data
 * Works in tandem with warehouse-file-watcher for bidirectional sync
 */

import { db } from '../firebase.config';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

const WAREHOUSE_COLLECTION = 'warehouse_inventory';

/**
 * Get all warehouse inventory
 */
export async function getAllWarehouseInventory() {
  try {
    const q = query(collection(db, WAREHOUSE_COLLECTION));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting warehouse inventory:', error);
    throw error;
  }
}

/**
 * Get inventory for specific location
 */
export async function getLocationInventory(location) {
  try {
    const q = query(
      collection(db, WAREHOUSE_COLLECTION),
      where('location', '==', location.toUpperCase())
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting location inventory for ${location}:`, error);
    throw error;
  }
}

/**
 * Get inventory for specific SKU across all locations
 */
export async function getSKUInventory(sku) {
  try {
    const q = query(
      collection(db, WAREHOUSE_COLLECTION),
      where('sku', '==', sku.toUpperCase())
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting SKU inventory for ${sku}:`, error);
    throw error;
  }
}

/**
 * Get specific warehouse item by location and SKU
 */
export async function getWarehouseItem(location, sku) {
  try {
    const docId = `${location.toUpperCase()}_${sku.toUpperCase()}`;
    const docRef = doc(db, WAREHOUSE_COLLECTION, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting warehouse item ${location} ${sku}:`, error);
    throw error;
  }
}

/**
 * Update warehouse item quantity
 */
export async function updateItemQuantity(location, sku, quantity) {
  try {
    const docId = `${location.toUpperCase()}_${sku.toUpperCase()}`;
    const docRef = doc(db, WAREHOUSE_COLLECTION, docId);
    
    await updateDoc(docRef, {
      quantity: quantity,
      updatedAt: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error(`Error updating quantity for ${location} ${sku}:`, error);
    throw error;
  }
}

/**
 * Add/Update warehouse item
 */
export async function addWarehouseItem(item) {
  try {
    if (!item.location || !item.sku || item.quantity === undefined) {
      throw new Error('Missing required fields: location, sku, quantity');
    }

    const docId = `${item.location.toUpperCase()}_${item.sku.toUpperCase()}`;
    const docRef = doc(db, WAREHOUSE_COLLECTION, docId);
    
    await setDoc(docRef, {
      ...item,
      location: item.location.toUpperCase(),
      sku: item.sku.toUpperCase(),
      updatedAt: Timestamp.now()
    }, { merge: true });
    
    return docId;
  } catch (error) {
    console.error('Error adding warehouse item:', error);
    throw error;
  }
}

/**
 * Delete warehouse item
 */
export async function deleteWarehouseItem(location, sku) {
  try {
    const docId = `${location.toUpperCase()}_${sku.toUpperCase()}`;
    const docRef = doc(db, WAREHOUSE_COLLECTION, docId);
    
    await deleteDoc(docRef);
    
    return true;
  } catch (error) {
    console.error(`Error deleting warehouse item ${location} ${sku}:`, error);
    throw error;
  }
}

/**
 * Batch update inventory (for receiving stock, shipping, adjustments)
 */
export async function batchUpdateInventory(updates) {
  try {
    const batch = writeBatch(db);
    
    for (const update of updates) {
      const docId = `${update.location.toUpperCase()}_${update.sku.toUpperCase()}`;
      const docRef = doc(db, WAREHOUSE_COLLECTION, docId);
      
      batch.update(docRef, {
        quantity: update.quantity,
        updatedAt: Timestamp.now(),
        note: update.note || ''
      });
    }
    
    await batch.commit();
    
    return {
      success: true,
      count: updates.length
    };
  } catch (error) {
    console.error('Error batch updating inventory:', error);
    throw error;
  }
}

/**
 * Search warehouse items by SKU or location
 */
export async function searchWarehouse(searchTerm) {
  try {
    const term = searchTerm.toUpperCase();
    const allItems = await getAllWarehouseInventory();
    
    return allItems.filter(item => 
      item.sku.includes(term) ||
      item.location.includes(term) ||
      (item.productName && item.productName.toUpperCase().includes(term))
    );
  } catch (error) {
    console.error('Error searching warehouse:', error);
    throw error;
  }
}

/**
 * Get warehouse statistics
 */
export async function getWarehouseStatistics() {
  try {
    const items = await getAllWarehouseInventory();
    
    const stats = {
      totalItems: items.length,
      totalQuantity: 0,
      locations: new Set(),
      skus: new Set(),
      categories: new Set(),
      lowStockItems: [],
      zeroStockItems: []
    };

    items.forEach(item => {
      stats.totalQuantity += item.quantity || 0;
      stats.locations.add(item.location);
      stats.skus.add(item.sku);
      if (item.category) stats.categories.add(item.category);
      
      if (item.quantity === 0) {
        stats.zeroStockItems.push({
          location: item.location,
          sku: item.sku,
          productName: item.productName
        });
      } else if (item.quantity < 10) {
        stats.lowStockItems.push({
          location: item.location,
          sku: item.sku,
          productName: item.productName,
          quantity: item.quantity
        });
      }
    });

    return {
      ...stats,
      locations: Array.from(stats.locations),
      skus: Array.from(stats.skus),
      categories: Array.from(stats.categories),
      locationCount: stats.locations.length,
      skuCount: stats.skus.length,
      categoryCount: stats.categories.length
    };
  } catch (error) {
    console.error('Error getting warehouse statistics:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time warehouse updates
 */
export function subscribeToWarehouse(callback) {
  try {
    const q = query(collection(db, WAREHOUSE_COLLECTION));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      callback(items);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to warehouse updates:', error);
    throw error;
  }
}

/**
 * Subscribe to specific location inventory updates
 */
export function subscribeToLocation(location, callback) {
  try {
    const q = query(
      collection(db, WAREHOUSE_COLLECTION),
      where('location', '==', location.toUpperCase())
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      callback(items);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error(`Error subscribing to location ${location}:`, error);
    throw error;
  }
}

export default {
  getAllWarehouseInventory,
  getLocationInventory,
  getSKUInventory,
  getWarehouseItem,
  updateItemQuantity,
  addWarehouseItem,
  deleteWarehouseItem,
  batchUpdateInventory,
  searchWarehouse,
  getWarehouseStatistics,
  subscribeToWarehouse,
  subscribeToLocation
};
