/**
 * Multi-Warehouse Management Service
 * Handles role-based access control and warehouse operations
 */

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
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import type {
  Warehouse,
  WarehouseUser,
  InventoryItem,
  StockMovement,
  WarehouseStats,
} from '../types/warehouse';

const WAREHOUSES_COLLECTION = 'warehouses';
const USERS_COLLECTION = 'warehouse_users';
const INVENTORY_COLLECTION = 'warehouse_inventory';
const MOVEMENTS_COLLECTION = 'stock_movements';

/**
 * Get user's role and assigned warehouses
 */
export async function getUserWarehouseAccess(userId: string): Promise<WarehouseUser | null> {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      return userDoc.data() as WarehouseUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting user warehouse access:', error);
    return null;
  }
}

/**
 * Get all warehouses (directors/admins only)
 */
export async function getAllWarehouses(userRole: string): Promise<Warehouse[]> {
  try {
    if (userRole !== 'director' && userRole !== 'admin' && userRole !== 'ceo') {
      console.warn('Insufficient permissions to view all warehouses');
      return [];
    }

    const q = query(collection(db, WAREHOUSES_COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Warehouse[];
  } catch (error) {
    console.error('Error getting all warehouses:', error);
    return [];
  }
}

/**
 * Get user's assigned warehouses
 */
export async function getUserWarehouses(userId: string): Promise<Warehouse[]> {
  try {
    const userAccess = await getUserWarehouseAccess(userId);
    if (!userAccess) return [];

    const warehouseIds = userAccess.assignedWarehouses || [];
    if (warehouseIds.length === 0) return [];

    const warehouses: Warehouse[] = [];
    for (const warehouseId of warehouseIds) {
      const warehouseDoc = await getDoc(doc(db, WAREHOUSES_COLLECTION, warehouseId));
      if (warehouseDoc.exists()) {
        warehouses.push({
          id: warehouseDoc.id,
          ...warehouseDoc.data()
        } as Warehouse);
      }
    }

    return warehouses;
  } catch (error) {
    console.error('Error getting user warehouses:', error);
    return [];
  }
}

/**
 * Get single warehouse (with permission check)
 */
export async function getWarehouse(
  warehouseId: string,
  userId: string,
  userRole: string
): Promise<Warehouse | null> {
  try {
    // Directors and admins can see any warehouse
    if (userRole === 'director' || userRole === 'admin' || userRole === 'ceo') {
      const warehouseDoc = await getDoc(doc(db, WAREHOUSES_COLLECTION, warehouseId));
      return warehouseDoc.exists()
        ? ({ id: warehouseDoc.id, ...warehouseDoc.data() } as Warehouse)
        : null;
    }

    // Regular staff can only see assigned warehouses
    const userAccess = await getUserWarehouseAccess(userId);
    if (!userAccess?.assignedWarehouses.includes(warehouseId)) {
      console.warn('User does not have access to this warehouse');
      return null;
    }

    const warehouseDoc = await getDoc(doc(db, WAREHOUSES_COLLECTION, warehouseId));
    return warehouseDoc.exists()
      ? ({ id: warehouseDoc.id, ...warehouseDoc.data() } as Warehouse)
      : null;
  } catch (error) {
    console.error('Error getting warehouse:', error);
    return null;
  }
}

/**
 * Create new warehouse (directors only)
 */
export async function createWarehouse(
  warehouse: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>,
  userRole: string
): Promise<string | null> {
  try {
    if (userRole !== 'director' && userRole !== 'admin' && userRole !== 'ceo') {
      throw new Error('Only directors can create warehouses');
    }

    const warehouseId = `warehouse_${warehouse.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    const warehouseData = {
      ...warehouse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, WAREHOUSES_COLLECTION, warehouseId), warehouseData);
    return warehouseId;
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return null;
  }
}

/**
 * Assign user to warehouse (directors only)
 */
export async function assignUserToWarehouse(
  userId: string,
  warehouseId: string,
  userRole: string,
  isPrimary: boolean = false
): Promise<boolean> {
  try {
    if (userRole !== 'director' && userRole !== 'admin' && userRole !== 'ceo') {
      throw new Error('Only directors can assign users');
    }

    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const assignedWarehouses = userData.assignedWarehouses || [];

    if (!assignedWarehouses.includes(warehouseId)) {
      assignedWarehouses.push(warehouseId);
    }

    await updateDoc(userRef, {
      assignedWarehouses,
      primaryWarehouse: isPrimary ? warehouseId : userData.primaryWarehouse,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error assigning user to warehouse:', error);
    return false;
  }
}

/**
 * Get inventory for warehouse (with permission check)
 */
export async function getWarehouseInventory(
  warehouseId: string,
  userId: string,
  userRole: string
): Promise<InventoryItem[]> {
  try {
    // Check permissions
    if (userRole !== 'director' && userRole !== 'admin' && userRole !== 'ceo') {
      const userAccess = await getUserWarehouseAccess(userId);
      if (!userAccess?.assignedWarehouses.includes(warehouseId)) {
        console.warn('User does not have access to this warehouse');
        return [];
      }
    }

    const q = query(
      collection(db, INVENTORY_COLLECTION),
      where('warehouseId', '==', warehouseId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InventoryItem[];
  } catch (error) {
    console.error('Error getting warehouse inventory:', error);
    return [];
  }
}

/**
 * Send goods between warehouses (creates movement)
 */
export async function sendGoodsToWarehouse(
  sourceWarehouseId: string,
  destinationWarehouseId: string,
  sku: string,
  quantity: number,
  userId: string,
  userRole: string,
  notes?: string
): Promise<string | null> {
  try {
    // Check permissions
    if (userRole !== 'director' && userRole !== 'admin' && userRole !== 'ceo') {
      throw new Error('Only directors can send goods between warehouses');
    }

    // Get inventory item
    const q = query(
      collection(db, INVENTORY_COLLECTION),
      where('warehouseId', '==', sourceWarehouseId),
      where('sku', '==', sku)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error('Item not found in source warehouse');
    }

    const inventoryDoc = snapshot.docs[0];
    const inventory = inventoryDoc.data() as InventoryItem;

    if ((inventory.availableQuantity || inventory.quantity) < quantity) {
      throw new Error('Insufficient quantity available');
    }

    const batch = writeBatch(db);
    const movementId = `move_${Date.now()}`;

    // Create movement record
    const movementData: Partial<StockMovement> = {
      type: 'warehouse_to_branch',
      sourceWarehouseId,
      destinationWarehouseId,
      sku,
      quantity,
      status: 'pending',
      initiatedBy: userId,
      createdAt: serverTimestamp() as any,
      notes,
    };

    batch.set(doc(db, MOVEMENTS_COLLECTION, movementId), movementData);

    // Update source inventory (decrease quantity)
    batch.update(inventoryDoc.ref, {
      quantity: (inventory.quantity || 0) - quantity,
      reservedQuantity: (inventory.reservedQuantity || 0) + quantity,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    // Notify staff at destination warehouse
    console.log(`✅ Goods sent to warehouse. Movement ID: ${movementId}`);

    return movementId;
  } catch (error) {
    console.error('Error sending goods:', error);
    return null;
  }
}

/**
 * Receive goods at destination warehouse
 */
export async function receiveGoodsAtWarehouse(
  movementId: string,
  destinationWarehouseId: string,
  userId: string
): Promise<boolean> {
  try {
    const movementDoc = await getDoc(doc(db, MOVEMENTS_COLLECTION, movementId));
    if (!movementDoc.exists()) {
      throw new Error('Movement not found');
    }

    const movement = movementDoc.data() as StockMovement;

    // Get or create inventory item at destination
    const q = query(
      collection(db, INVENTORY_COLLECTION),
      where('warehouseId', '==', destinationWarehouseId),
      where('sku', '==', movement.sku)
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);

    if (snapshot.empty) {
      // Create new inventory item at destination
      const sourceInventory = await getDoc(doc(db, INVENTORY_COLLECTION, `${movement.sourceWarehouseId}_${movement.sku}`));
      const sourceData = sourceInventory.data() || {};

      const newItemId = `${destinationWarehouseId}_${movement.sku}`;
      batch.set(doc(db, INVENTORY_COLLECTION, newItemId), {
        warehouseId: destinationWarehouseId,
        sku: movement.sku,
        productName: sourceData.productName || '',
        category: sourceData.category || '',
        quantity: movement.quantity,
        reservedQuantity: 0,
        unitCost: sourceData.unitCost || 0,
        reorderLevel: sourceData.reorderLevel || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Update existing inventory
      const inventoryDoc = snapshot.docs[0];
      const inventory = inventoryDoc.data() as InventoryItem;

      batch.update(inventoryDoc.ref, {
        quantity: (inventory.quantity || 0) + movement.quantity,
        updatedAt: serverTimestamp(),
      });
    }

    // Update movement status
    batch.update(doc(db, MOVEMENTS_COLLECTION, movementId), {
      status: 'completed',
      deliveredAt: serverTimestamp(),
    });

    // Update source inventory (release reserved)
    const sourceQ = query(
      collection(db, INVENTORY_COLLECTION),
      where('warehouseId', '==', movement.sourceWarehouseId),
      where('sku', '==', movement.sku)
    );
    const sourceSnapshot = await getDocs(sourceQ);
    if (!sourceSnapshot.empty) {
      const sourceInventory = sourceSnapshot.docs[0].data() as InventoryItem;
      batch.update(sourceSnapshot.docs[0].ref, {
        reservedQuantity: Math.max(0, (sourceInventory.reservedQuantity || 0) - movement.quantity),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    console.log(`✅ Goods received at warehouse`);
    return true;
  } catch (error) {
    console.error('Error receiving goods:', error);
    return false;
  }
}

/**
 * Subscribe to warehouse inventory changes
 */
export function subscribeToWarehouseInventory(
  warehouseId: string,
  callback: (items: InventoryItem[]) => void
): (() => void) {
  try {
    const q = query(
      collection(db, INVENTORY_COLLECTION),
      where('warehouseId', '==', warehouseId)
    );

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];
      callback(items);
    });
  } catch (error) {
    console.error('Error subscribing to warehouse inventory:', error);
    return () => {};
  }
}

/**
 * Get warehouse statistics
 */
export async function getWarehouseStats(
  warehouseId: string,
  userId: string,
  userRole: string
): Promise<WarehouseStats | null> {
  try {
    const warehouse = await getWarehouse(warehouseId, userId, userRole);
    if (!warehouse) return null;

    const inventory = await getWarehouseInventory(warehouseId, userId, userRole);

    let totalQuantity = 0;
    let totalValue = 0;
    let totalWaste = 0;

    inventory.forEach(item => {
      totalQuantity += item.quantity || 0;
      totalValue += (item.quantity || 0) * (item.unitCost || 0);
      totalWaste += item.foulWater?.totalWaste || 0;
    });

    const utilizationPercentage = warehouse.capacity > 0
      ? ((totalQuantity / warehouse.capacity) * 100).toFixed(2)
      : '0';

    return {
      warehouseId,
      warehouseName: warehouse.name,
      totalItems: inventory.length,
      totalQuantity,
      totalValue: parseFloat(totalValue.toFixed(2)),
      utilizationPercentage,
      totalWaste,
      staffCount: warehouse.staff?.length || 0,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting warehouse stats:', error);
    return null;
  }
}
