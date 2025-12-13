/**
 * Sample Excel Warehouse File Generator
 * Creates template Excel files for testing
 */

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createSampleWarehouseExcel() {
  // Sample inventory data
  const inventoryData = [
    { sku: 'SKU001', productName: 'Monitor 27-inch', category: 'Electronics', quantity: 500, bin: 'A1', aisle: 1, shelf: 3, unitCost: 199.99, reorderLevel: 50 },
    { sku: 'SKU002', productName: 'Keyboard Mechanical', category: 'Electronics', quantity: 300, bin: 'A2', aisle: 1, shelf: 4, unitCost: 89.99, reorderLevel: 30 },
    { sku: 'SKU003', productName: 'Mouse Wireless', category: 'Electronics', quantity: 400, bin: 'B1', aisle: 2, shelf: 1, unitCost: 29.99, reorderLevel: 100 },
    { sku: 'SKU004', productName: 'USB-C Cable', category: 'Cables', quantity: 1200, bin: 'B2', aisle: 2, shelf: 2, unitCost: 5.99, reorderLevel: 200 },
    { sku: 'SKU005', productName: 'HDMI Cable 6ft', category: 'Cables', quantity: 800, bin: 'C1', aisle: 3, shelf: 1, unitCost: 7.99, reorderLevel: 150 },
    { sku: 'SKU006', productName: 'Monitor Stand', category: 'Accessories', quantity: 250, bin: 'C2', aisle: 3, shelf: 2, unitCost: 34.99, reorderLevel: 25 },
    { sku: 'SKU007', productName: 'Desk Lamp LED', category: 'Lighting', quantity: 180, bin: 'D1', aisle: 4, shelf: 1, unitCost: 24.99, reorderLevel: 20 },
    { sku: 'SKU008', productName: 'Webcam HD', category: 'Electronics', quantity: 150, bin: 'D2', aisle: 4, shelf: 2, unitCost: 49.99, reorderLevel: 15 },
  ];

  // Sample locations data
  const locationsData = [
    { bin: 'A1', aisle: 1, shelf: 3, capacity: 100, active: 'YES' },
    { bin: 'A2', aisle: 1, shelf: 4, capacity: 100, active: 'YES' },
    { bin: 'B1', aisle: 2, shelf: 1, capacity: 100, active: 'YES' },
    { bin: 'B2', aisle: 2, shelf: 2, capacity: 100, active: 'YES' },
    { bin: 'C1', aisle: 3, shelf: 1, capacity: 100, active: 'YES' },
    { bin: 'C2', aisle: 3, shelf: 2, capacity: 100, active: 'YES' },
    { bin: 'D1', aisle: 4, shelf: 1, capacity: 100, active: 'YES' },
    { bin: 'D2', aisle: 4, shelf: 2, capacity: 100, active: 'YES' },
  ];

  // Sample foul water data
  const foulWaterData = [
    { sku: 'SKU001', defective: 5, expired: 0, damaged: 2, returned: 3, notes: 'Shipping damage' },
    { sku: 'SKU003', defective: 0, expired: 1, damaged: 0, returned: 2, notes: 'Customer returns' },
    { sku: 'SKU007', defective: 2, expired: 0, damaged: 1, returned: 0, notes: 'Manufacturing defect' },
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Add Inventory sheet
  const inventoryWs = XLSX.utils.json_to_sheet(inventoryData);
  inventoryWs['!cols'] = [
    { wch: 10 }, // sku
    { wch: 25 }, // productName
    { wch: 15 }, // category
    { wch: 10 }, // quantity
    { wch: 8 },  // bin
    { wch: 8 },  // aisle
    { wch: 8 },  // shelf
    { wch: 12 }, // unitCost
    { wch: 12 }  // reorderLevel
  ];
  XLSX.utils.book_append_sheet(wb, inventoryWs, 'Inventory');

  // Add Locations sheet
  const locationsWs = XLSX.utils.json_to_sheet(locationsData);
  locationsWs['!cols'] = [
    { wch: 8 },  // bin
    { wch: 8 },  // aisle
    { wch: 8 },  // shelf
    { wch: 10 }, // capacity
    { wch: 10 }  // active
  ];
  XLSX.utils.book_append_sheet(wb, locationsWs, 'Locations');

  // Add Foul Water sheet
  const foulWaterWs = XLSX.utils.json_to_sheet(foulWaterData);
  foulWaterWs['!cols'] = [
    { wch: 10 }, // sku
    { wch: 10 }, // defective
    { wch: 10 }, // expired
    { wch: 10 }, // damaged
    { wch: 10 }, // returned
    { wch: 30 }  // notes
  ];
  XLSX.utils.book_append_sheet(wb, foulWaterWs, 'Foul Water');

  // Write to file
  const filePath = path.join(__dirname, 'sample_warehouse.xlsx');
  XLSX.writeFile(wb, filePath);

  console.log(`✓ Created sample Excel file: ${filePath}`);
  return filePath;
}

// Create the file
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleWarehouseExcel();
}

export { createSampleWarehouseExcel };
