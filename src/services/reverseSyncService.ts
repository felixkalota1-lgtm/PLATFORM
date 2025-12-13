/**
 * Reverse Sync Service
 * 
 * Syncs product changes from Firestore back to Excel file
 * Keeps Excel in sync when users edit via the app
 * 
 * Called when:
 * - Product is updated in ProductEditor
 * - Product is deleted from ProductsList
 * - Products are uploaded via bulk import
 */

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

/**
 * Update product in Excel file
 * 
 * @param filePath Path to Excel file
 * @param productName Name of product to update/add
 * @param productData Updated product data
 */
export async function updateProductInExcel(
  filePath: string,
  productName: string,
  productData: any
): Promise<void> {
  try {
    console.log(`📝 Syncing to Excel: ${productName}`);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Excel file not found: ${filePath}`);
      return;
    }

    // Read existing workbook
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Find and update product
    const productIndex = data.findIndex(
      (row: any) => row.name?.toString().toLowerCase() === productName.toLowerCase()
    );

    if (productIndex !== -1) {
      // Update existing product
      data[productIndex] = {
        ...data[productIndex],
        name: productData.name,
        description: productData.description,
        category: productData.category,
        price: productData.price,
        sku: productData.sku,
        stock: productData.stock,
        supplier: productData.supplier,
      };
      console.log(`  ✏️ Updated existing product in Excel`);
    } else {
      // Add new product
      data.push({
        name: productData.name,
        description: productData.description,
        category: productData.category,
        price: productData.price,
        sku: productData.sku,
        stock: productData.stock,
        supplier: productData.supplier,
      });
      console.log(`  ➕ Added new product to Excel`);
    }

    // Create new worksheet from updated data
    const newWorksheet = XLSX.utils.json_to_sheet(data);
    workbook.Sheets[sheetName] = newWorksheet;

    // Write back to file
    XLSX.writeFile(workbook, filePath);
    console.log(`✅ Excel file updated: ${productName}`);
  } catch (error) {
    console.error('❌ Error updating Excel:', error);
  }
}

/**
 * Remove product from Excel file
 * 
 * @param filePath Path to Excel file
 * @param productName Name of product to remove
 */
export async function removeProductFromExcel(
  filePath: string,
  productName: string
): Promise<void> {
  try {
    console.log(`🗑️ Removing from Excel: ${productName}`);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Excel file not found: ${filePath}`);
      return;
    }

    // Read existing workbook
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Filter out product
    const filteredData = data.filter(
      (row: any) => row.name?.toString().toLowerCase() !== productName.toLowerCase()
    );

    if (filteredData.length === data.length) {
      console.warn(`⚠️ Product not found in Excel: ${productName}`);
      return;
    }

    // Create new worksheet from filtered data
    const newWorksheet = XLSX.utils.json_to_sheet(filteredData);
    workbook.Sheets[sheetName] = newWorksheet;

    // Write back to file
    XLSX.writeFile(workbook, filePath);
    console.log(`✅ Product removed from Excel: ${productName}`);
  } catch (error) {
    console.error('❌ Error removing from Excel:', error);
  }
}

/**
 * Get watched Excel file path from environment
 */
export function getWatchedExcelPath(): string | null {
  const watchFolder = process.env.EXCEL_WATCH_FOLDER || './excel-imports';
  
  if (!fs.existsSync(watchFolder)) {
    console.warn(`⚠️ Watch folder not found: ${watchFolder}`);
    return null;
  }

  const files = fs.readdirSync(watchFolder);
  const excelFile = files.find(f => f.endsWith('.xlsx') || f.endsWith('.xls'));

  if (!excelFile) {
    console.warn(`⚠️ No Excel file found in: ${watchFolder}`);
    return null;
  }

  return path.join(watchFolder, excelFile);
}

/**
 * Sync changes back to Excel (called from app)
 */
export async function syncChangeToExcel(
  action: 'update' | 'delete',
  productName: string,
  productData?: any
): Promise<void> {
  const excelPath = getWatchedExcelPath();
  
  if (!excelPath) {
    console.log('ℹ️ No Excel file to sync to');
    return;
  }

  try {
    if (action === 'update') {
      await updateProductInExcel(excelPath, productName, productData);
    } else if (action === 'delete') {
      await removeProductFromExcel(excelPath, productName);
    }
  } catch (error) {
    console.error('❌ Error syncing to Excel:', error);
  }
}
