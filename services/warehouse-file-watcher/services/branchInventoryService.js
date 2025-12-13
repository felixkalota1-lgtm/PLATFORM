/**
 * Branch Inventory Management Service
 * Handles multiple branch locations with independent inventory
 * Manages warehouse-to-branch stock transfers
 */

import admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Create a new branch/warehouse location
 */
export async function createBranch(branchData) {
  try {
    const {
      name,
      location,
      type = 'branch', // 'warehouse' | 'branch'
      isMainWarehouse = false,
      capacity = 1000,
      parentWarehouseId = null
    } = branchData;
    
    if (!name || !location) {
      throw new Error('Branch name and location are required');
    }
    
    const branchId = `warehouse_${type}_${name.toLowerCase().replace(/\s+/g, '_')}`;
    
    const branch = {
      id: branchId,
      name,
      type,
      location,
      isMainWarehouse,
      parentWarehouseId,
      capacity,
      currentOccupancy: 0,
      linkedBranches: isMainWarehouse ? [] : [],
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };
    
    await db.collection('warehouses').doc(branchId).set(branch);
    
    // If this is a branch, link it to parent
    if (!isMainWarehouse && parentWarehouseId) {
      await db.collection('warehouses').doc(parentWarehouseId).update({
        linkedBranches: admin.firestore.FieldValue.arrayUnion(branchId)
      });
    }
    
    console.log(`✓ Created ${type}: ${name} (${branchId})`);
    return { ...branch, id: branchId };
  } catch (error) {
    console.error(`✗ Failed to create branch: ${error.message}`);
    throw error;
  }
}

/**
 * Get branch details
 */
export async function getBranch(branchId) {
  try {
    const doc = await db.collection('warehouses').doc(branchId).get();
    
    if (!doc.exists) {
      throw new Error(`Branch ${branchId} not found`);
    }
    
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error(`✗ Failed to get branch: ${error.message}`);
    throw error;
  }
}

/**
 * Get all branches
 */
export async function getAllBranches() {
  try {
    const snapshot = await db.collection('warehouses').get();
    const branches = [];
    
    snapshot.forEach(doc => {
      branches.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return branches;
  } catch (error) {
    console.error(`✗ Failed to get branches: ${error.message}`);
    throw error;
  }
}

/**
 * Get branch inventory
 */
export async function getBranchInventory(branchId) {
  try {
    const snapshot = await db
      .collection('branch_inventory')
      .where('branchId', '==', branchId)
      .get();
    
    const inventory = [];
    snapshot.forEach(doc => {
      inventory.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return inventory;
  } catch (error) {
    console.error(`✗ Failed to get branch inventory: ${error.message}`);
    throw error;
  }
}

/**
 * Move stock from warehouse to branch
 */
export async function moveStockToBranch(
  warehouseId,
  branchId,
  sku,
  quantity
) {
  try {
    // Validate warehouse exists
    const warehouseDoc = await db.collection('warehouses').doc(warehouseId).get();
    if (!warehouseDoc.exists) {
      throw new Error(`Warehouse ${warehouseId} not found`);
    }
    
    // Validate branch exists
    const branchDoc = await db.collection('warehouses').doc(branchId).get();
    if (!branchDoc.exists) {
      throw new Error(`Branch ${branchId} not found`);
    }
    
    // Get warehouse item
    const warehouseItemId = `${warehouseId}_${sku}`;
    const warehouseItemDoc = await db
      .collection('warehouse_inventory')
      .doc(warehouseItemId)
      .get();
    
    if (!warehouseItemDoc.exists) {
      throw new Error(`SKU ${sku} not found in warehouse`);
    }
    
    const warehouseItem = warehouseItemDoc.data();
    if ((warehouseItem.availableQuantity || 0) < quantity) {
      throw new Error(
        `Insufficient stock: requested ${quantity}, available ${warehouseItem.availableQuantity}`
      );
    }
    
    // Create movement record
    const movementId = `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const movement = {
      id: movementId,
      type: 'warehouse_to_branch',
      sourceLocation: {
        type: 'warehouse',
        id: warehouseId,
        name: warehouseDoc.data().name
      },
      destinationLocation: {
        type: 'branch',
        id: branchId,
        name: branchDoc.data().name
      },
      sku,
      productName: warehouseItem.productName,
      quantity,
      status: 'pending',
      createdAt: admin.firestore.Timestamp.now(),
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      actualDelivery: null
    };
    
    // Add movement to database
    await db.collection('stock_movements').doc(movementId).set(movement);
    
    // Update warehouse stock
    const newWarehouseQuantity = (warehouseItem.quantity || 0) - quantity;
    const newAvailableQuantity = (warehouseItem.availableQuantity || 0) - quantity;
    
    await db.collection('warehouse_inventory').doc(warehouseItemId).update({
      quantity: newWarehouseQuantity,
      availableQuantity: newAvailableQuantity,
      reservedQuantity: (warehouseItem.reservedQuantity || 0) + quantity,
      lastUpdated: admin.firestore.Timestamp.now()
    });
    
    console.log(`✓ Created movement: ${quantity} units of ${sku} from warehouse to ${branchDoc.data().name}`);
    
    return {
      movementId,
      ...movement
    };
  } catch (error) {
    console.error(`✗ Failed to move stock to branch: ${error.message}`);
    throw error;
  }
}

/**
 * Confirm branch receipt of shipment
 */
export async function confirmBranchReceipt(movementId, receivedQuantity) {
  try {
    // Get movement
    const movementDoc = await db.collection('stock_movements').doc(movementId).get();
    if (!movementDoc.exists) {
      throw new Error(`Movement ${movementId} not found`);
    }
    
    const movement = movementDoc.data();
    if (movement.type !== 'warehouse_to_branch') {
      throw new Error('Only warehouse-to-branch movements can be confirmed');
    }
    
    const actualQuantity = receivedQuantity || movement.quantity;
    if (actualQuantity <= 0 || actualQuantity > movement.quantity) {
      throw new Error(`Invalid received quantity: ${actualQuantity}`);
    }
    
    // Get or create branch inventory item
    const branchItemId = `${movement.destinationLocation.id}_${movement.sku}`;
    const branchItemDoc = await db
      .collection('branch_inventory')
      .doc(branchItemId)
      .get();
    
    if (branchItemDoc.exists) {
      // Update existing
      const branchItem = branchItemDoc.data();
      await db.collection('branch_inventory').doc(branchItemId).update({
        quantity: (branchItem.quantity || 0) + actualQuantity,
        lastRestockDate: admin.firestore.Timestamp.now(),
        lastRestockQuantity: actualQuantity,
        lastUpdated: admin.firestore.Timestamp.now()
      });
    } else {
      // Create new
      const warehouseItemId = `${movement.sourceLocation.id}_${movement.sku}`;
      const warehouseItemDoc = await db
        .collection('warehouse_inventory')
        .doc(warehouseItemId)
        .get();
      
      const warehouseItem = warehouseItemDoc.data();
      
      await db.collection('branch_inventory').doc(branchItemId).set({
        itemId: branchItemId,
        branchId: movement.destinationLocation.id,
        branchName: movement.destinationLocation.name,
        sku: movement.sku,
        productName: movement.productName,
        quantity: actualQuantity,
        soldCount: 0,
        lastRestockDate: admin.firestore.Timestamp.now(),
        lastRestockQuantity: actualQuantity,
        sourceWarehouse: movement.sourceLocation.id,
        foulWater: {
          defectiveCount: 0,
          returnedCount: 0,
          totalWaste: 0
        },
        lastUpdated: admin.firestore.Timestamp.now()
      });
    }
    
    // Update warehouse stock - decrease reserved
    const warehouseItemId = `${movement.sourceLocation.id}_${movement.sku}`;
    const warehouseItemDoc = await db
      .collection('warehouse_inventory')
      .doc(warehouseItemId)
      .get();
    
    const warehouseItem = warehouseItemDoc.data();
    await db.collection('warehouse_inventory').doc(warehouseItemId).update({
      reservedQuantity: Math.max(0, (warehouseItem.reservedQuantity || 0) - actualQuantity),
      lastUpdated: admin.firestore.Timestamp.now()
    });
    
    // Update movement status
    const damageQuantity = movement.quantity - actualQuantity;
    await db.collection('stock_movements').doc(movementId).update({
      status: 'completed',
      actualDelivery: admin.firestore.Timestamp.now(),
      actualQuantity,
      damageQuantity: damageQuantity > 0 ? damageQuantity : 0
    });
    
    console.log(`✓ Confirmed receipt: ${actualQuantity} units of ${movement.sku}`);
    
    return {
      movementId,
      status: 'completed',
      actualQuantity,
      damageQuantity
    };
  } catch (error) {
    console.error(`✗ Failed to confirm branch receipt: ${error.message}`);
    throw error;
  }
}

/**
 * Record sale from branch inventory
 */
export async function recordBranchSale(branchId, sku, quantity) {
  try {
    const branchItemId = `${branchId}_${sku}`;
    const doc = await db.collection('branch_inventory').doc(branchItemId).get();
    
    if (!doc.exists) {
      throw new Error(`SKU ${sku} not found in branch`);
    }
    
    const item = doc.data();
    if ((item.quantity || 0) < quantity) {
      throw new Error(
        `Insufficient stock: requested ${quantity}, available ${item.quantity}`
      );
    }
    
    // Update branch inventory
    await db.collection('branch_inventory').doc(branchItemId).update({
      quantity: (item.quantity || 0) - quantity,
      soldCount: (item.soldCount || 0) + quantity,
      lastUpdated: admin.firestore.Timestamp.now()
    });
    
    // Create movement record
    const movementId = `move_sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.collection('stock_movements').doc(movementId).set({
      id: movementId,
      type: 'sale',
      sourceLocation: {
        type: 'branch',
        id: branchId
      },
      sku,
      quantity,
      status: 'completed',
      createdAt: admin.firestore.Timestamp.now()
    });
    
    console.log(`✓ Recorded sale: ${quantity} units of ${sku} from branch ${branchId}`);
    
    return {
      movementId,
      status: 'completed',
      quantity
    };
  } catch (error) {
    console.error(`✗ Failed to record branch sale: ${error.message}`);
    throw error;
  }
}

/**
 * Get branch statistics
 */
export async function getBranchStats(branchId) {
  try {
    const branch = await getBranch(branchId);
    const inventory = await getBranchInventory(branchId);
    
    let totalItems = 0;
    let totalQuantity = 0;
    let totalValue = 0;
    let totalSold = 0;
    let totalWaste = 0;
    
    inventory.forEach(item => {
      totalItems++;
      totalQuantity += item.quantity || 0;
      totalValue += ((item.quantity || 0) * (item.unitCost || 0));
      totalSold += item.soldCount || 0;
      totalWaste += (item.foulWater?.totalWaste || 0);
    });
    
    return {
      branchId,
      branchName: branch.name,
      totalItems,
      totalQuantity,
      totalValue: totalValue.toFixed(2),
      totalSold,
      totalWaste,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`✗ Failed to get branch stats: ${error.message}`);
    throw error;
  }
}

/**
 * Get stock movements between locations
 */
export async function getStockMovements(filters = {}) {
  try {
    let query = db.collection('stock_movements');
    
    if (filters.sourceId) {
      query = query.where('sourceLocation.id', '==', filters.sourceId);
    }
    
    if (filters.destinationId) {
      query = query.where('destinationLocation.id', '==', filters.destinationId);
    }
    
    if (filters.sku) {
      query = query.where('sku', '==', filters.sku);
    }
    
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').limit(100).get();
    
    const movements = [];
    snapshot.forEach(doc => {
      movements.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return movements;
  } catch (error) {
    console.error(`✗ Failed to get stock movements: ${error.message}`);
    throw error;
  }
}

export default {
  createBranch,
  getBranch,
  getAllBranches,
  getBranchInventory,
  moveStockToBranch,
  confirmBranchReceipt,
  recordBranchSale,
  getBranchStats,
  getStockMovements
};
