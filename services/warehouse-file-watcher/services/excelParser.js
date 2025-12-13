/**
 * Excel Parser for Warehouse Inventory
 * Supports .xlsx files with multiple sheets
 * 
 * Sheets:
 * - "Inventory" - Main stock data
 * - "Locations" (optional) - 3D bin mapping
 * - "Foul Water" (optional) - Waste tracking
 */

import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

/**
 * Parse warehouse Excel file
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<{inventory: Array, locations: Array, foulWater: Array}>}
 */
export async function parseWarehouseExcel(filePath) {
  return new Promise((resolve, reject) => {
    try {
      // Read Excel file
      const workbook = XLSX.readFile(filePath);
      
      // Parse inventory sheet
      const inventory = parseInventorySheet(workbook);
      
      // Parse locations sheet (optional)
      const locations = workbook.SheetNames.includes('Locations')
        ? parseLocationsSheet(workbook)
        : [];
      
      // Parse foul water sheet (optional)
      const foulWater = workbook.SheetNames.includes('Foul Water')
        ? parseFoulWaterSheet(workbook)
        : [];
      
      resolve({
        inventory: inventory || [],
        locations: locations || [],
        foulWater: foulWater || [],
        fileName: path.basename(filePath)
      });
    } catch (error) {
      reject(new Error(`Failed to parse Excel file: ${error.message}`));
    }
  });
}

/**
 * Parse Inventory sheet from workbook
 * Required columns: sku, productName, quantity, bin, aisle, shelf
 * Optional columns: category, unitCost, reorderLevel
 */
function parseInventorySheet(workbook) {
  if (!workbook.SheetNames.includes('Inventory')) {
    throw new Error('Excel file must contain "Inventory" sheet');
  }
  
  const sheet = workbook.Sheets['Inventory'];
  const rawData = XLSX.utils.sheet_to_json(sheet);
  
  return rawData.map((row, index) => {
    // Normalize column names (handle spaces, case)
    const normalized = normalizeRow(row);
    
    // Validate required fields
    const errors = [];
    if (!normalized.sku) errors.push('SKU');
    if (!normalized.productName) errors.push('Product Name');
    if (normalized.quantity === undefined || normalized.quantity === '') errors.push('Quantity');
    if (!normalized.bin) errors.push('Bin');
    if (normalized.aisle === undefined || normalized.aisle === '') errors.push('Aisle');
    if (normalized.shelf === undefined || normalized.shelf === '') errors.push('Shelf');
    
    if (errors.length > 0) {
      throw new Error(`Row ${index + 2} missing required fields: ${errors.join(', ')}`);
    }
    
    // Validate quantity is a number
    const qty = parseInt(normalized.quantity, 10);
    if (isNaN(qty) || qty < 0) {
      throw new Error(`Row ${index + 2} has invalid quantity: ${normalized.quantity}`);
    }
    
    // Validate aisle/shelf are numbers
    const aisleNum = parseInt(normalized.aisle, 10);
    const shelfNum = parseInt(normalized.shelf, 10);
    if (isNaN(aisleNum) || isNaN(shelfNum)) {
      throw new Error(`Row ${index + 2} has invalid aisle/shelf numbers`);
    }
    
    return {
      sku: String(normalized.sku).trim().toUpperCase(),
      productName: String(normalized.productName).trim(),
      category: normalized.category ? String(normalized.category).trim() : 'Uncategorized',
      quantity: qty,
      location: {
        bin: String(normalized.bin).trim().toUpperCase(),
        aisle: aisleNum,
        shelf: shelfNum,
        position: `${String(normalized.bin).trim().toUpperCase()}-${aisleNum}-${shelfNum}`
      },
      unitCost: normalized.unitCost ? parseFloat(normalized.unitCost) : 0,
      reorderLevel: normalized.reorderLevel ? parseInt(normalized.reorderLevel, 10) : 50,
      reservedQuantity: 0,
      availableQuantity: qty,
      foulWater: {
        defectiveCount: 0,
        expiredCount: 0,
        damageCount: 0,
        returnedCount: 0,
        totalWaste: 0
      }
    };
  }).filter(item => item); // Remove undefined items
}

/**
 * Parse Locations sheet (optional)
 * Columns: bin, aisle, shelf, capacity, active
 */
function parseLocationsSheet(workbook) {
  const sheet = workbook.Sheets['Locations'];
  const rawData = XLSX.utils.sheet_to_json(sheet);
  
  return rawData.map((row, index) => {
    const normalized = normalizeRow(row);
    
    if (!normalized.bin || normalized.aisle === undefined || normalized.shelf === undefined) {
      throw new Error(`Locations row ${index + 2} missing bin/aisle/shelf`);
    }
    
    return {
      bin: String(normalized.bin).trim().toUpperCase(),
      aisle: parseInt(normalized.aisle, 10),
      shelf: parseInt(normalized.shelf, 10),
      position: `${String(normalized.bin).trim().toUpperCase()}-${parseInt(normalized.aisle, 10)}-${parseInt(normalized.shelf, 10)}`,
      capacity: normalized.capacity ? parseInt(normalized.capacity, 10) : 100,
      occupied: 0,
      isActive: normalized.active !== 'false' && normalized.active !== 'FALSE' && normalized.active !== '0'
    };
  }).filter(item => item);
}

/**
 * Parse Foul Water sheet (optional)
 * Columns: sku, defective, expired, damaged, returned, notes
 */
function parseFoulWaterSheet(workbook) {
  const sheet = workbook.Sheets['Foul Water'];
  const rawData = XLSX.utils.sheet_to_json(sheet);
  
  return rawData.map((row, index) => {
    const normalized = normalizeRow(row);
    
    if (!normalized.sku) {
      throw new Error(`Foul Water row ${index + 2} missing SKU`);
    }
    
    return {
      sku: String(normalized.sku).trim().toUpperCase(),
      defectiveCount: normalized.defective ? parseInt(normalized.defective, 10) : 0,
      expiredCount: normalized.expired ? parseInt(normalized.expired, 10) : 0,
      damageCount: normalized.damaged ? parseInt(normalized.damaged, 10) : 0,
      returnedCount: normalized.returned ? parseInt(normalized.returned, 10) : 0,
      notes: normalized.notes ? String(normalized.notes).trim() : '',
      timestamp: new Date().toISOString()
    };
  }).filter(item => item);
}

/**
 * Normalize row keys - handle spaces, case variations
 */
function normalizeRow(row) {
  const normalized = {};
  
  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    
    // Normalize key: lowercase, remove spaces, handle common variations
    const normalizedKey = key
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[_-]/g, '');
    
    // Map variations to standard names
    const keyMap = {
      'sku': 'sku',
      'productname': 'productName',
      'product': 'productName',
      'name': 'productName',
      'category': 'category',
      'quantity': 'quantity',
      'qty': 'quantity',
      'count': 'quantity',
      'bin': 'bin',
      'location': 'bin',
      'aisle': 'aisle',
      'row': 'aisle',
      'shelf': 'shelf',
      'level': 'shelf',
      'unitcost': 'unitCost',
      'cost': 'unitCost',
      'price': 'unitCost',
      'reorderlevel': 'reorderLevel',
      'reorder': 'reorderLevel',
      'minstock': 'reorderLevel',
      'defective': 'defective',
      'defectivecount': 'defective',
      'expired': 'expired',
      'expiredcount': 'expired',
      'damaged': 'damaged',
      'damagedcount': 'damaged',
      'returned': 'returned',
      'returnedcount': 'returned',
      'notes': 'notes',
      'comments': 'notes',
      'active': 'active',
      'isactive': 'active',
      'capacity': 'capacity',
      'maxcapacity': 'capacity'
    };
    
    const standardKey = keyMap[normalizedKey] || key.toLowerCase();
    normalized[standardKey] = value;
  }
  
  return normalized;
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
