/**
 * Excel Parser for Warehouse Inventory - INTELLIGENT FLEXIBLE MODE
 * 
 * Features:
 * - Auto-detects inventory sheet (any name)
 * - Fuzzy column matching (not rigid)
 * - Intelligent data type conversion
 * - Handles missing/extra columns gracefully
 * - AI-like data detection and extraction
 * - Works with various Excel structures
 */

import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

/**
 * Parse warehouse Excel file with flexible/intelligent detection
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<{inventory: Array, locations: Array, foulWater: Array}>}
 */
export async function parseWarehouseExcel(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const workbook = XLSX.readFile(filePath);
      
      // Auto-detect inventory sheet (any name)
      const inventory = parseInventorySheetFlexible(workbook);
      
      // Try to find locations sheet (by keyword matching)
      const locations = parseLocationsSheetFlexible(workbook);
      
      // Try to find foul water sheet (by keyword matching)
      const foulWater = parseFoulWaterSheetFlexible(workbook);
      
      if (inventory.length === 0) {
        throw new Error('No inventory data found in Excel file. File should contain product/inventory information.');
      }
      
      resolve({
        inventory: inventory || [],
        locations: locations || [],
        foulWater: foulWater || [],
        fileName: path.basename(filePath),
        detectedColumns: getDetectedColumns(inventory)
      });
    } catch (error) {
      reject(new Error(`Failed to parse Excel file: ${error.message}`));
    }
  });
}

/**
 * Intelligent fuzzy match - finds similar column names
 * Handles: "sku", "SKU", "product id", "item code", etc.
 */
function fuzzyColumnMatch(headers, targetPatterns) {
  const normalized = headers.map(h => h.toLowerCase().replace(/[_\s-]/g, ''));
  
  for (const target of targetPatterns) {
    const targetNorm = target.toLowerCase().replace(/[_\s-]/g, '');
    for (let i = 0; i < normalized.length; i++) {
      // Exact match after normalization
      if (normalized[i] === targetNorm) return i;
      // Partial match
      if (normalized[i].includes(targetNorm) || targetNorm.includes(normalized[i])) return i;
    }
  }
  return -1;
}

/**
 * Parse inventory with intelligent, flexible detection
 * - Auto-detects sheet by content
 * - Fuzzy matches column names
 * - Intelligently converts data types
 * - Handles missing columns gracefully
 */
function parseInventorySheetFlexible(workbook) {
  // Try to find inventory sheet - check each sheet
  let inventory = [];
  
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    if (rawData.length === 0) continue;
    
    // Check if this sheet looks like inventory (has sku/product columns)
    const firstRow = rawData[0];
    const headers = Object.keys(firstRow);
    
    const hasSKU = fuzzyColumnMatch(headers, ['sku', 'code', 'product id', 'item', 'product']) >= 0;
    const hasProduct = fuzzyColumnMatch(headers, ['product', 'name', 'item name', 'description']) >= 0;
    const hasQty = fuzzyColumnMatch(headers, ['quantity', 'qty', 'count', 'stock']) >= 0;
    
    // If this sheet has inventory-like columns, parse it
    if (hasSKU || hasProduct || hasQty) {
      inventory = rawData.map((row, index) => {
        try {
          return parseFlexibleInventoryRow(row, headers, index);
        } catch (err) {
          console.warn(`⚠️  Row ${index + 2} skipped: ${err.message}`);
          return null;
        }
      }).filter(item => item !== null && item !== undefined);
      
      if (inventory.length > 0) {
        console.log(`📊 Found inventory in sheet: "${sheetName}" (${inventory.length} items)`);
        break;
      }
    }
  }
  
  return inventory;
}

/**
 * Parse single row with intelligent, flexible detection
 */
function parseFlexibleInventoryRow(row, headers, index) {
  // Find columns using fuzzy matching
  const skuIdx = fuzzyColumnMatch(headers, ['sku', 'code', 'productid', 'id', 'item']);
  const productIdx = fuzzyColumnMatch(headers, ['product', 'name', 'itemname', 'description', 'title']);
  const qtyIdx = fuzzyColumnMatch(headers, ['quantity', 'qty', 'count', 'stock', 'available']);
  const binIdx = fuzzyColumnMatch(headers, ['bin', 'location', 'shelf', 'warehouse']);
  const aisleIdx = fuzzyColumnMatch(headers, ['aisle', 'row', 'section']);
  const shelfIdx = fuzzyColumnMatch(headers, ['shelf', 'level', 'tier']);
  const catIdx = fuzzyColumnMatch(headers, ['category', 'type', 'class']);
  const costIdx = fuzzyColumnMatch(headers, ['cost', 'price', 'unitcost', 'unitprice']);
  const reorderIdx = fuzzyColumnMatch(headers, ['reorder', 'reorderlevel', 'minstock', 'minium']);
  
  const headerArray = headers;
  
  // Extract data intelligently
  const sku = getValueSafe(row, headerArray, skuIdx);
  const productName = getValueSafe(row, headerArray, productIdx);
  const quantity = getNumberSafe(row, headerArray, qtyIdx);
  const bin = getValueSafe(row, headerArray, binIdx) || generateBinFromCoordinates(
    getNumberSafe(row, headerArray, aisleIdx),
    getNumberSafe(row, headerArray, shelfIdx)
  );
  const aisle = getNumberSafe(row, headerArray, aisleIdx) || extractNumberFromString(bin);
  const shelf = getNumberSafe(row, headerArray, shelfIdx) || 1;
  
  // Validate minimum required data
  if (!sku && !productName) {
    throw new Error('No SKU or Product Name found');
  }
  
  return {
    sku: String(sku || `AUTO-${Date.now()}`).trim().toUpperCase(),
    productName: String(productName || sku || 'Unknown').trim(),
    category: String(getValueSafe(row, headerArray, catIdx) || 'Uncategorized').trim(),
    quantity: Math.max(0, quantity || 0),
    location: {
      bin: String(bin || 'BIN-AUTO').trim().toUpperCase(),
      aisle: Math.max(0, aisle || 1),
      shelf: Math.max(0, shelf || 1),
      position: `${String(bin || 'BIN-AUTO').trim().toUpperCase()}-${Math.max(0, aisle || 1)}-${Math.max(0, shelf || 1)}`
    },
    unitCost: parseFloat(getNumberSafe(row, headerArray, costIdx) || 0),
    reorderLevel: Math.max(0, getNumberSafe(row, headerArray, reorderIdx) || 50),
    reservedQuantity: 0,
    availableQuantity: Math.max(0, quantity || 0),
    foulWater: {
      defectiveCount: 0,
      expiredCount: 0,
      damageCount: 0,
      returnedCount: 0,
      totalWaste: 0
    }
  };
}

/**
 * Helper: Get string value safely from row
 */
function getValueSafe(row, headers, idx) {
  if (idx < 0 || !headers[idx]) return '';
  const val = row[headers[idx]];
  return val ? String(val).trim() : '';
}

/**
 * Helper: Get number value safely from row
 */
function getNumberSafe(row, headers, idx) {
  if (idx < 0 || !headers[idx]) return 0;
  const val = row[headers[idx]];
  if (!val) return 0;
  const num = parseInt(val, 10);
  return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Helper: Generate bin from coordinates
 */
function generateBinFromCoordinates(aisle, shelf) {
  aisle = Math.max(0, aisle || 1);
  shelf = Math.max(0, shelf || 1);
  return `BIN-${String.fromCharCode(64 + aisle)}-${shelf}`;
}

/**
 * Helper: Extract number from string (e.g., "BIN-A1" → 1)
 */
function extractNumberFromString(str) {
  const matches = String(str).match(/\d+/g);
  return matches ? parseInt(matches[0], 10) : 1;
}

/**
 * Helper: Get detected columns from parsed data
 */
function getDetectedColumns(inventory) {
  if (inventory.length === 0) return {};
  return {
    sku: 'auto-detected',
    productName: 'auto-detected',
    quantity: 'auto-detected',
    bin: 'auto-detected',
    location: 'auto-detected'
  };
}

/**
 * Parse Locations sheet with flexible detection
 */
function parseLocationsSheetFlexible(workbook) {
  for (const sheetName of workbook.SheetNames) {
    // Skip if it looks like inventory sheet
    if (sheetName.toLowerCase().includes('inventory') || 
        sheetName.toLowerCase().includes('product')) continue;
    
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    if (rawData.length === 0) continue;
    
    const headers = Object.keys(rawData[0]);
    const hasBin = fuzzyColumnMatch(headers, ['bin', 'location']) >= 0;
    const hasAisle = fuzzyColumnMatch(headers, ['aisle', 'row']) >= 0;
    
    // If this looks like a locations sheet
    if ((hasBin || hasAisle) && sheetName.toLowerCase().includes('location')) {
      const binIdx = fuzzyColumnMatch(headers, ['bin', 'location']);
      const aisleIdx = fuzzyColumnMatch(headers, ['aisle', 'row']);
      const shelfIdx = fuzzyColumnMatch(headers, ['shelf', 'level', 'tier']);
      const capIdx = fuzzyColumnMatch(headers, ['capacity', 'max', 'maxcapacity']);
      const activeIdx = fuzzyColumnMatch(headers, ['active', 'status', 'enabled']);
      
      return rawData.map((row, index) => {
        try {
          const bin = getValueSafe(row, headers, binIdx);
          const aisle = getNumberSafe(row, headers, aisleIdx);
          const shelf = getNumberSafe(row, headers, shelfIdx);
          const cap = getNumberSafe(row, headers, capIdx) || 100;
          const active = String(getValueSafe(row, headers, activeIdx) || 'true').toLowerCase() !== 'false';
          
          if (!bin) throw new Error('Missing bin');
          
          return {
            bin: String(bin).trim().toUpperCase(),
            aisle: Math.max(0, aisle || 1),
            shelf: Math.max(0, shelf || 1),
            position: `${String(bin).trim().toUpperCase()}-${Math.max(0, aisle || 1)}-${Math.max(0, shelf || 1)}`,
            capacity: Math.max(1, cap),
            occupied: 0,
            isActive: active
          };
        } catch (err) {
          console.warn(`⚠️  Locations row ${index + 2} skipped: ${err.message}`);
          return null;
        }
      }).filter(item => item);
    }
  }
  
  return [];
}

/**
 * Parse Foul Water sheet with flexible detection
 */
function parseFoulWaterSheetFlexible(workbook) {
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    if (rawData.length === 0) continue;
    
    const headers = Object.keys(rawData[0]);
    const hasSKU = fuzzyColumnMatch(headers, ['sku', 'code', 'productid']) >= 0;
    const hasWaste = fuzzyColumnMatch(headers, ['defective', 'expired', 'damaged', 'waste']) >= 0;
    
    // If this looks like foul water sheet
    if ((hasSKU && hasWaste) || sheetName.toLowerCase().includes('foul') || 
        sheetName.toLowerCase().includes('waste') || sheetName.toLowerCase().includes('damage')) {
      
      const skuIdx = fuzzyColumnMatch(headers, ['sku', 'code', 'productid']);
      const defIdx = fuzzyColumnMatch(headers, ['defective', 'defect', 'defectcount']);
      const expIdx = fuzzyColumnMatch(headers, ['expired', 'expiry', 'expiredcount']);
      const damIdx = fuzzyColumnMatch(headers, ['damaged', 'damage', 'damagecount']);
      const retIdx = fuzzyColumnMatch(headers, ['returned', 'return', 'returnedcount']);
      const noteIdx = fuzzyColumnMatch(headers, ['notes', 'note', 'remarks', 'comment']);
      
      return rawData.map((row, index) => {
        try {
          const sku = getValueSafe(row, headers, skuIdx);
          if (!sku) throw new Error('Missing SKU');
          
          return {
            sku: String(sku).trim().toUpperCase(),
            defectiveCount: getNumberSafe(row, headers, defIdx),
            expiredCount: getNumberSafe(row, headers, expIdx),
            damageCount: getNumberSafe(row, headers, damIdx),
            returnedCount: getNumberSafe(row, headers, retIdx),
            notes: String(getValueSafe(row, headers, noteIdx) || '').trim(),
            timestamp: new Date().toISOString()
          };
        } catch (err) {
          console.warn(`⚠️  Foul Water row ${index + 2} skipped: ${err.message}`);
          return null;
        }
      }).filter(item => item);
    }
  }
  
  return [];
}

/**
 * Get Excel template structure
 */
export function getExcelTemplate() {
  const template = {
    Inventory: [
      {
        sku: 'SKU001',
        productName: 'Monitor 27-inch',
        category: 'Electronics',
        quantity: 500,
        bin: 'A1',
        aisle: 1,
        shelf: 3,
        unitCost: 199.99,
        reorderLevel: 50
      },
      {
        sku: 'SKU002',
        productName: 'Keyboard Mechanical',
        category: 'Electronics',
        quantity: 300,
        bin: 'A2',
        aisle: 1,
        shelf: 4,
        unitCost: 89.99,
        reorderLevel: 30
      }
    ],
    Locations: [
      {
        bin: 'A1',
        aisle: 1,
        shelf: 3,
        capacity: 100,
        active: 'YES'
      },
      {
        bin: 'A2',
        aisle: 1,
        shelf: 4,
        capacity: 100,
        active: 'YES'
      }
    ],
    'Foul Water': [
      {
        sku: 'SKU001',
        defective: 5,
        expired: 0,
        damaged: 2,
        returned: 3,
        notes: 'Shipping damage'
      }
    ]
  };
  
  return template;
}

/**
 * Create Excel template file
 */
export function createExcelTemplate(outputPath) {
  try {
    const template = getExcelTemplate();
    const wb = XLSX.utils.book_new();
    
    // Add Inventory sheet
    const inventoryWs = XLSX.utils.json_to_sheet(template.Inventory);
    XLSX.utils.book_append_sheet(wb, inventoryWs, 'Inventory');
    
    // Add Locations sheet
    const locationsWs = XLSX.utils.json_to_sheet(template.Locations);
    XLSX.utils.book_append_sheet(wb, locationsWs, 'Locations');
    
    // Add Foul Water sheet
    const foulWaterWs = XLSX.utils.json_to_sheet(template['Foul Water']);
    XLSX.utils.book_append_sheet(wb, foulWaterWs, 'Foul Water');
    
    XLSX.writeFile(wb, outputPath);
    console.log(`✓ Excel template created: ${outputPath}`);
    
    return true;
  } catch (error) {
    console.error(`✗ Failed to create Excel template: ${error.message}`);
    return false;
  }
}

export default {
  parseWarehouseExcel,
  getExcelTemplate,
  createExcelTemplate
};
