/**
 * Foul Water Tracking Service
 * Manages waste, defects, expired items, returns, and damaged goods
 * Integrated with warehouse and branch inventory
 */

import admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Record foul water item in warehouse
 */
export async function recordWarehouseFoulWater(
  warehouseId,
  sku,
  foulWaterType,
  quantity,
  notes = ''
) {
  try {
    const itemId = `${warehouseId}_${sku}`;
    const docRef = db.collection('warehouse_inventory').doc(itemId);
    
    // Get current document
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Item ${sku} not found in warehouse`);
    }
    
    const currentData = doc.data();
    const currentFoulWater = currentData.foulWater || {};
    
    // Update foul water count based on type
    const updateData = { foulWater: { ...currentFoulWater } };
    
    switch (foulWaterType.toLowerCase()) {
      case 'defective':
        updateData.foulWater.defectiveCount = (currentFoulWater.defectiveCount || 0) + quantity;
        break;
      case 'expired':
        updateData.foulWater.expiredCount = (currentFoulWater.expiredCount || 0) + quantity;
        break;
      case 'damaged':
        updateData.foulWater.damageCount = (currentFoulWater.damageCount || 0) + quantity;
        break;
      case 'returned':
        updateData.foulWater.returnedCount = (currentFoulWater.returnedCount || 0) + quantity;
        break;
      default:
        throw new Error(`Invalid foul water type: ${foulWaterType}`);
    }
    
    // Recalculate total waste
    updateData.foulWater.totalWaste = 
      updateData.foulWater.defectiveCount +
      updateData.foulWater.expiredCount +
      updateData.foulWater.damageCount +
      updateData.foulWater.returnedCount;
    
    // Decrease available quantity
    updateData.quantity = Math.max(0, (currentData.quantity || 0) - quantity);
    updateData.availableQuantity = Math.max(0, (currentData.availableQuantity || 0) - quantity);
    updateData.lastUpdated = admin.firestore.Timestamp.now();
    
    // Update document
    await docRef.update(updateData);
    
    // Log to foul water history
    await logFoulWaterHistory({
      location: 'warehouse',
      locationId: warehouseId,
      sku,
      type: foulWaterType,
      quantity,
      notes,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✓ Recorded ${quantity} ${foulWaterType} items for SKU ${sku} in warehouse`);
    
    return {
      success: true,
      itemId,
      foulWater: updateData.foulWater,
      newQuantity: updateData.quantity
    };
  } catch (error) {
    console.error(`✗ Failed to record warehouse foul water: ${error.message}`);
    throw error;
  }
}

/**
 * Record foul water item in branch inventory
 */
export async function recordBranchFoulWater(
  branchId,
  sku,
  foulWaterType,
  quantity,
  notes = ''
) {
  try {
    const itemId = `${branchId}_${sku}`;
    const docRef = db.collection('branch_inventory').doc(itemId);
    
    // Get current document
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Item ${sku} not found in branch ${branchId}`);
    }
    
    const currentData = doc.data();
    const currentFoulWater = currentData.foulWater || {};
    
    // Update foul water count
    const updateData = { foulWater: { ...currentFoulWater } };
    
    switch (foulWaterType.toLowerCase()) {
      case 'defective':
        updateData.foulWater.defectiveCount = (currentFoulWater.defectiveCount || 0) + quantity;
        break;
      case 'expired':
        updateData.foulWater.expiredCount = (currentFoulWater.expiredCount || 0) + quantity;
        break;
      case 'damaged':
        updateData.foulWater.damageCount = (currentFoulWater.damageCount || 0) + quantity;
        break;
      case 'returned':
        updateData.foulWater.returnedCount = (currentFoulWater.returnedCount || 0) + quantity;
        break;
      default:
        throw new Error(`Invalid foul water type: ${foulWaterType}`);
    }
    
    // Recalculate total waste
    updateData.foulWater.totalWaste = 
      updateData.foulWater.defectiveCount +
      updateData.foulWater.expiredCount +
      updateData.foulWater.damageCount +
      updateData.foulWater.returnedCount;
    
    // Decrease quantity
    updateData.quantity = Math.max(0, (currentData.quantity || 0) - quantity);
    updateData.lastUpdated = admin.firestore.Timestamp.now();
    
    // Update document
    await docRef.update(updateData);
    
    // Log to foul water history
    await logFoulWaterHistory({
      location: 'branch',
      locationId: branchId,
      sku,
      type: foulWaterType,
      quantity,
      notes,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✓ Recorded ${quantity} ${foulWaterType} items for SKU ${sku} in branch ${branchId}`);
    
    return {
      success: true,
      itemId,
      foulWater: updateData.foulWater,
      newQuantity: updateData.quantity
    };
  } catch (error) {
    console.error(`✗ Failed to record branch foul water: ${error.message}`);
    throw error;
  }
}

/**
 * Get foul water report for warehouse
 */
export async function getWarehouseFoulWaterReport(warehouseId, timeRange = '30d') {
  try {
    // Get all items in warehouse
    const snapshot = await db
      .collection('warehouse_inventory')
      .where('warehouseId', '==', warehouseId)
      .get();
    
    const items = [];
    let totalDefective = 0;
    let totalExpired = 0;
    let totalDamaged = 0;
    let totalReturned = 0;
    let totalWaste = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const fw = data.foulWater || {};
      
      if (fw.totalWaste && fw.totalWaste > 0) {
        items.push({
          sku: data.sku,
          productName: data.productName,
          ...fw
        });
        
        totalDefective += fw.defectiveCount || 0;
        totalExpired += fw.expiredCount || 0;
        totalDamaged += fw.damageCount || 0;
        totalReturned += fw.returnedCount || 0;
        totalWaste += fw.totalWaste || 0;
      }
    });
    
    return {
      warehouseId,
      timeRange,
      summary: {
        totalDefective,
        totalExpired,
        totalDamaged,
        totalReturned,
        totalWaste,
        wastePercentage: items.length > 0 ? ((totalWaste / items.length) * 100).toFixed(2) : 0
      },
      items: items.sort((a, b) => b.totalWaste - a.totalWaste),
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`✗ Failed to get warehouse foul water report: ${error.message}`);
    throw error;
  }
}

/**
 * Get foul water report for branch
 */
export async function getBranchFoulWaterReport(branchId, timeRange = '30d') {
  try {
    // Get all items in branch
    const snapshot = await db
      .collection('branch_inventory')
      .where('branchId', '==', branchId)
      .get();
    
    const items = [];
    let totalDefective = 0;
    let totalExpired = 0;
    let totalDamaged = 0;
    let totalReturned = 0;
    let totalWaste = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const fw = data.foulWater || {};
      
      if (fw.totalWaste && fw.totalWaste > 0) {
        items.push({
          sku: data.sku,
          productName: data.productName,
          ...fw
        });
        
        totalDefective += fw.defectiveCount || 0;
        totalExpired += fw.expiredCount || 0;
        totalDamaged += fw.damageCount || 0;
        totalReturned += fw.returnedCount || 0;
        totalWaste += fw.totalWaste || 0;
      }
    });
    
    return {
      branchId,
      timeRange,
      summary: {
        totalDefective,
        totalExpired,
        totalDamaged,
        totalReturned,
        totalWaste,
        wastePercentage: items.length > 0 ? ((totalWaste / items.length) * 100).toFixed(2) : 0
      },
      items: items.sort((a, b) => b.totalWaste - a.totalWaste),
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`✗ Failed to get branch foul water report: ${error.message}`);
    throw error;
  }
}

/**
 * Get overall foul water report (all locations)
 */
export async function getAllFoulWaterReport() {
  try {
    // Get warehouse report
    const warehouseSnapshot = await db.collection('warehouse_inventory').get();
    let warehouseWaste = {
      defective: 0,
      expired: 0,
      damaged: 0,
      returned: 0,
      total: 0
    };
    
    warehouseSnapshot.forEach(doc => {
      const fw = doc.data().foulWater || {};
      warehouseWaste.defective += fw.defectiveCount || 0;
      warehouseWaste.expired += fw.expiredCount || 0;
      warehouseWaste.damaged += fw.damageCount || 0;
      warehouseWaste.returned += fw.returnedCount || 0;
      warehouseWaste.total += fw.totalWaste || 0;
    });
    
    // Get branch reports
    const branchSnapshot = await db.collection('branch_inventory').get();
    let branchWaste = {
      defective: 0,
      expired: 0,
      damaged: 0,
      returned: 0,
      total: 0
    };
    
    branchSnapshot.forEach(doc => {
      const fw = doc.data().foulWater || {};
      branchWaste.defective += fw.defectiveCount || 0;
      branchWaste.expired += fw.expiredCount || 0;
      branchWaste.damaged += fw.damageCount || 0;
      branchWaste.returned += fw.returnedCount || 0;
      branchWaste.total += fw.totalWaste || 0;
    });
    
    return {
      warehouse: warehouseWaste,
      branches: branchWaste,
      combined: {
        defective: warehouseWaste.defective + branchWaste.defective,
        expired: warehouseWaste.expired + branchWaste.expired,
        damaged: warehouseWaste.damaged + branchWaste.damaged,
        returned: warehouseWaste.returned + branchWaste.returned,
        total: warehouseWaste.total + branchWaste.total
      },
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`✗ Failed to get all foul water report: ${error.message}`);
    throw error;
  }
}

/**
 * Log foul water event to history
 */
async function logFoulWaterHistory(event) {
  try {
    await db.collection('foul_water_history').add({
      ...event,
      timestamp: admin.firestore.Timestamp.now()
    });
  } catch (error) {
    console.error(`✗ Failed to log foul water history: ${error.message}`);
  }
}

/**
 * Get foul water history
 */
export async function getFoulWaterHistory(limit = 100) {
  try {
    const snapshot = await db
      .collection('foul_water_history')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    const history = [];
    snapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return history;
  } catch (error) {
    console.error(`✗ Failed to get foul water history: ${error.message}`);
    throw error;
  }
}

export default {
  recordWarehouseFoulWater,
  recordBranchFoulWater,
  getWarehouseFoulWaterReport,
  getBranchFoulWaterReport,
  getAllFoulWaterReport,
  getFoulWaterHistory
};
