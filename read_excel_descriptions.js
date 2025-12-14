import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Excel files to check
const files = [
  'sample_products.xlsx',
  'warehouse-imports/test-warehouse.xlsx',
  'services/excel-file-watcher/excel-imports/inventory-2025-12-13.xlsx',
  'services/excel-file-watcher/excel-imports/EPIROC.xlsx'
];

console.log('\n=== EXCEL FILE DESCRIPTIONS ===\n');

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${file} - NOT FOUND\n`);
    return;
  }

  try {
    const wb = XLSX.readFile(fullPath);
    console.log(`✅ ${file}`);
    console.log(`   Sheets: ${wb.SheetNames.join(', ')}`);
    
    // Read first sheet
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws);
    
    console.log(`   Rows: ${data.length}`);
    console.log(`   Columns: ${Object.keys(data[0] || {}).join(', ')}\n`);
    
    // Show first few rows
    console.log(`   First 5 items:`);
    data.slice(0, 5).forEach((row, i) => {
      console.log(`   ${i+1}. ${JSON.stringify(row).substring(0, 150)}...`);
    });
    console.log('\n');
    
  } catch (err) {
    console.log(`❌ ${file} - Error: ${err.message}\n`);
  }
});
