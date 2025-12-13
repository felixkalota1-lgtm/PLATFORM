/**
 * Warehouse CSV Parser Service
 * 
 * Parses CSV files containing warehouse inventory data
 * Expected columns: location, sku, quantity
 * 
 * Features:
 * - Stream-based parsing (memory efficient)
 * - Data validation
 * - Error handling
 * - Flexible column mapping
 */

import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

/**
 * Parse warehouse CSV file
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} Array of warehouse items
 */
export function parseWarehouseCSV(filePath) {
  const fileName = path.basename(filePath);
  const data = [];
  const errors = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          // Validate required fields
          if (!row.location || !row.sku || row.quantity === undefined) {
            errors.push({
              row,
              error: 'Missing required fields (location, sku, quantity)'
            });
            return;
          }

          // Parse and validate quantity
          const quantity = parseInt(row.quantity);
          if (isNaN(quantity) || quantity < 0) {
            errors.push({
              row,
              error: `Invalid quantity: ${row.quantity}`
            });
            return;
          }

          // Create warehouse item
          const item = {
            location: row.location.toString().trim(),
            sku: row.sku.toString().trim().toUpperCase(),
            quantity: quantity,
            lastUpdated: new Date().toISOString(),
            source: 'warehouse-csv',
            fileName: fileName
          };

          // Add optional fields if present
          if (row.productName) {
            item.productName = row.productName.toString().trim();
          }
          if (row.category) {
            item.category = row.category.toString().trim();
          }
          if (row.bin) {
            item.bin = row.bin.toString().trim();
          }
          if (row.aisle) {
            item.aisle = row.aisle.toString().trim();
          }

          data.push(item);
        } catch (error) {
          errors.push({
            row,
            error: error.message
          });
        }
      })
      .on('end', () => {
        if (errors.length > 0) {
          console.warn(`⚠️ ${errors.length} rows had errors:`);
          errors.slice(0, 5).forEach(e => {
            console.warn(`  - ${e.error}`, e.row);
          });
        }

        console.log(`📊 Parsed ${data.length} valid items from ${fileName}`);
        resolve(data);
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error.message);
        reject(error);
      });
  });
}

/**
 * Parse warehouse CSV synchronously (for testing)
 * @param {string} filePath - Path to CSV file
 * @returns {Array} Array of warehouse items
 */
export function parseWarehouseCSVSync(filePath) {
  // This is a synchronous wrapper - in production use async version
  throw new Error('Use parseWarehouseCSV (async) instead of sync version');
}

/**
 * Validate warehouse item
 * @param {Object} item - Warehouse item to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateWarehouseItem(item) {
  const errors = [];

  if (!item.location || typeof item.location !== 'string') {
    errors.push('location must be a non-empty string');
  }

  if (!item.sku || typeof item.sku !== 'string') {
    errors.push('sku must be a non-empty string');
  }

  if (typeof item.quantity !== 'number' || item.quantity < 0) {
    errors.push('quantity must be a non-negative number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get CSV template with sample data
 * @returns {string} CSV template
 */
export function getCSVTemplate() {
  return `location,sku,quantity,productName,category,bin,aisle
Warehouse A,SKU001,100,Product One,Electronics,A1,1
Warehouse A,SKU002,50,Product Two,Electronics,A2,1
Warehouse B,SKU001,75,Product One,Electronics,B1,2
Warehouse B,SKU003,200,Product Three,Hardware,B2,2
Warehouse C,SKU004,150,Product Four,Software,C1,3
`;
}

export default {
  parseWarehouseCSV,
  parseWarehouseCSVSync,
  validateWarehouseItem,
  getCSVTemplate
};
