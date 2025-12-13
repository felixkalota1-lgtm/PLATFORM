import XLSX from 'xlsx';
import { readFileSync } from 'fs';

const filePath = './excel-imports/inventory-2025-12-13.xlsx';

try {
  const buffer = readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log('\n📊 EXCEL SKU ANALYSIS\n');

  // Track products by name and SKU
  const productIndex = {};
  const emptySkuProducts = [];
  const allSkus = new Set();

  data.forEach((row, idx) => {
    const name = row.Name || '';
    const sku = String(row.SKU || '').trim();
    
    if (!name) return;

    if (!sku || sku === '' || sku === 'undefined') {
      emptySkuProducts.push({ name, rowNumber: idx + 2 });
    } else {
      allSkus.add(sku);
    }

    if (!productIndex[name]) {
      productIndex[name] = [];
    }
    productIndex[name].push(sku);
  });

  console.log(`Total rows: ${data.length}`);
  console.log(`Unique product names: ${Object.keys(productIndex).length}`);
  console.log(`Products with empty SKU: ${emptySkuProducts.length}\n`);

  if (emptySkuProducts.length > 0) {
    console.log('🔴 PRODUCTS WITH EMPTY SKU:');
    emptySkuProducts.forEach(p => {
      console.log(`   Row ${p.rowNumber}: "${p.name}"`);
    });
  }

  console.log('\n📋 PRODUCTS WITH MULTIPLE ROWS:\n');
  Object.entries(productIndex).forEach(([name, skus]) => {
    const uniqueSkus = [...new Set(skus.filter(s => s && s.trim() !== ''))];
    if (skus.length > 1) {
      console.log(`"${name}" appears ${skus.length} times`);
      uniqueSkus.forEach(sku => {
        const count = skus.filter(s => s === sku).length;
        console.log(`   SKU: "${sku}" (${count} time${count > 1 ? 's' : ''})`);
      });
    }
  });

  console.log(`\n✅ Total unique SKUs with values: ${allSkus.size}`);
  
} catch (error) {
  console.error('Error:', error.message);
}
