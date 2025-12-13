/**
 * Enhanced Warehouse Service - Multi-location inventory management
 * 
 * Features:
 * - Central warehouse stock management
 * - Multi-branch inventory tracking
 * - Stock movement between locations
 * - Foul water (waste) tracking
 * - Real-time Firestore subscriptions
 * - Bidirectional sync with file watcher
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
  serverTimestamp,
  addDoc,
  Timestamp,
  writeBatch,
  QueryConstraint
} from 'firebase/firestore';

const WAREHOUSE_COLLECTION = 'warehouse_inventory';
const BRANCH_COLLECTION = 'branch_inventory';
const MOVEMENTS_COLLECTION = 'stock_movements';
const BRANCHES_COLLECTION = 'warehouses';
const FOUL_WATER_COLLECTION = 'foul_water_history';

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
export async function getLocationInventory(location: string) {
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
export async function getSKUInventory(sku: string) {
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
export async function getWarehouseItem(location: string, sku: string) {
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
export async function updateItemQuantity(location: string, sku: string, quantity: number) {
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
export async function addWarehouseItem(item: any) {
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
export async function deleteWarehouseItem(location: string, sku: string) {
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
export async function batchUpdateInventory(updates: any[]) {
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
export async function searchWarehouse(searchTerm: string) {
  try {
    const term = searchTerm.toUpperCase();
    const allItems = await getAllWarehouseInventory();
    
    return allItems.filter((item: any) => 
      (item.sku && item.sku.includes(term)) ||
      (item.location && item.location.includes(term)) ||
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
    
    const stats: any = {
      totalItems: items.length,
      totalQuantity: 0,
      locations: new Set(),
      skus: new Set(),
      categories: new Set(),
      lowStockItems: [] as any[],
      zeroStockItems: [] as any[]
    };

    items.forEach((item: any) => {
      stats.totalQuantity += item.quantity || 0;
      if (item.location) stats.locations.add(item.location);
      if (item.sku) stats.skus.add(item.sku);
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
      locationCount: stats.locations.size,
      skuCount: stats.skus.size,
      categoryCount: stats.categories.size
    };
  } catch (error) {
    console.error('Error getting warehouse statistics:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time warehouse updates
 */
export function subscribeToWarehouse(callback: (items: any[]) => void) {
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
export function subscribeToLocation(location: string, callback: (items: any[]) => void) {
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

// ============= BRANCH OPERATIONS =============

/**
 * Get all branches
 */
export async function getAllBranches() {
  try {
    const q = query(collection(db, BRANCHES_COLLECTION));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting branches:', error);
    throw error;
  }
}

/**
 * Get branch inventory
 */
export async function getBranchInventory(branchId: string) {
  try {
    const q = query(
      collection(db, BRANCH_COLLECTION),
      where('branchId', '==', branchId)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting branch inventory:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time branch inventory
 */
export function subscribeToBranchInventory(
  branchId: string,
  callback: (items: any[]) => void
) {
  try {
    return onSnapshot(
      query(
        collection(db, BRANCH_COLLECTION),
        where('branchId', '==', branchId)
      ),
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(items);
      }
    );
  } catch (error) {
    console.error('Error subscribing to branch inventory:', error);
    throw error;
  }
}

/**
 * Get branch statistics
 */
export async function getBranchStats(branchId: string) {
  try {
    const items = await getBranchInventory(branchId);
    
    let totalQuantity = 0;
    let totalValue = 0;
    let totalSold = 0;
    let totalWaste = 0;
    
    items.forEach((item: any) => {
      totalQuantity += item.quantity || 0;
      totalValue += ((item.quantity || 0) * (item.unitCost || 0));
      totalSold += item.soldCount || 0;
      totalWaste += item.foulWater?.totalWaste || 0;
    });
    
    return {
      branchId,
      totalItems: items.length,
      totalQuantity,
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalSold,
      totalWaste
    };
  } catch (error) {
    console.error('Error getting branch stats:', error);
    throw error;
  }
}

// ============= STOCK MOVEMENT OPERATIONS =============

/**
 * Move stock from warehouse to branch
 */
export async function moveStockToBranch(
  warehouseId: string,
  branchId: string,
  sku: string,
  quantity: number
) {
  try {
    const movementData = {
      type: 'warehouse_to_branch',
      sourceLocation: {
        type: 'warehouse',
        id: warehouseId
      },
      destinationLocation: {
        type: 'branch',
        id: branchId
      },
      sku,
      quantity,
      status: 'pending',
      createdAt: serverTimestamp(),
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    };
    
    const docRef = await addDoc(collection(db, MOVEMENTS_COLLECTION), movementData);
    
    return {
      movementId: docRef.id,
      ...movementData
    };
  } catch (error) {
    console.error('Error moving stock to branch:', error);
    throw error;
  }
}

/**
 * Record sale from branch
 */
export async function recordBranchSale(
  branchId: string,
  sku: string,
  quantity: number
) {
  try {
    const movementData = {
      type: 'sale',
      sourceLocation: {
        type: 'branch',
        id: branchId
      },
      sku,
      quantity,
      status: 'completed',
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, MOVEMENTS_COLLECTION), movementData);
    
    return {
      movementId: docRef.id,
      ...movementData
    };
  } catch (error) {
    console.error('Error recording branch sale:', error);
    throw error;
  }
}

/**
 * Get stock movement history
 */
export async function getStockMovementHistory(filters: any = {}) {
  try {
    const constraints: QueryConstraint[] = [];
    
    if (filters.sku) {
      constraints.push(where('sku', '==', filters.sku));
    }
    
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    let q = constraints.length > 0
      ? query(collection(db, MOVEMENTS_COLLECTION), ...constraints)
      : query(collection(db, MOVEMENTS_COLLECTION));
    
    const snapshot = await getDocs(q);
    const movements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter by location if specified
    if (filters.sourceId) {
      return movements.filter((m: any) => m.sourceLocation?.id === filters.sourceId);
    }
    if (filters.destinationId) {
      return movements.filter((m: any) => m.destinationLocation?.id === filters.destinationId);
    }
    
    return movements;
  } catch (error) {
    console.error('Error getting movement history:', error);
    throw error;
  }
}

// ============= FOUL WATER OPERATIONS =============

/**
 * Record foul water item
 */
export async function recordFoulWater(
  location: 'warehouse' | 'branch',
  locationId: string,
  sku: string,
  type: 'defective' | 'expired' | 'damaged' | 'returned',
  quantity: number,
  notes: string = ''
) {
  try {
    const foulWaterData = {
      location,
      locationId,
      sku,
      type,
      quantity,
      notes,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, FOUL_WATER_COLLECTION), foulWaterData);
    
    return {
      id: docRef.id,
      ...foulWaterData
    };
  } catch (error) {
    console.error('Error recording foul water:', error);
    throw error;
  }
}

/**
 * Get foul water report
 */
export async function getFoulWaterReport(location?: 'warehouse' | 'branch') {
  try {
    let q = location
      ? query(collection(db, FOUL_WATER_COLLECTION), where('location', '==', location))
      : query(collection(db, FOUL_WATER_COLLECTION));
    
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const summary: any = {
      defective: 0,
      expired: 0,
      damaged: 0,
      returned: 0,
      total: 0
    };
    
    history.forEach((item: any) => {
      if (item.type && summary.hasOwnProperty(item.type)) {
        summary[item.type] = (summary[item.type] || 0) + (item.quantity || 0);
      }
      summary.total += item.quantity || 0;
    });
    
    return {
      summary,
      history
    };
  } catch (error) {
    console.error('Error getting foul water report:', error);
    throw error;
  }
}

/**
 * Get enhanced warehouse statistics
 */
export async function getEnhancedWarehouseStats(warehouseId: string = 'warehouse_main_nebraska') {
  try {
    const items = await getAllWarehouseInventory();
    const filtered = items.filter((i: any) => !warehouseId || i.warehouseId === warehouseId);
    
    let totalQuantity = 0;
    let totalValue = 0;
    let totalReserved = 0;
    let totalWaste = 0;
    let occupiedLocations = 0;
    
    filtered.forEach((item: any) => {
      totalQuantity += item.quantity || 0;
      totalValue += ((item.quantity || 0) * (item.unitCost || 0));
      totalReserved += item.reservedQuantity || 0;
      totalWaste += item.foulWater?.totalWaste || 0;
      if ((item.quantity || 0) > 0) occupiedLocations++;
    });
    
    return {
      warehouseId,
      totalItems: filtered.length,
      totalQuantity,
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalReserved,
      availableQuantity: totalQuantity - totalReserved,
      totalWaste,
      occupiedLocations,
      utilizationPercentage: filtered.length > 0 
        ? ((occupiedLocations / filtered.length) * 100).toFixed(2)
        : 0
    };
  } catch (error) {
    console.error('Error getting warehouse stats:', error);
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
  subscribeToLocation,
  getAllBranches,
  getBranchInventory,
  subscribeToBranchInventory,
  getBranchStats,
  moveStockToBranch,
  recordBranchSale,
  getStockMovementHistory,
  recordFoulWater,
  getFoulWaterReport,
  getEnhancedWarehouseStats
};
