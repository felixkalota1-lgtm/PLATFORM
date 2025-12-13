/**
 * Duplicate Detection Service
 * 
 * Provides comprehensive duplicate detection for product uploads:
 * - Detects duplicates within the uploaded Excel file
 * - Detects duplicates against existing inventory (per-user)
 * - Calculates similarity scores
 * - Provides recommendations for handling duplicates
 */

import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ExcelProduct } from './excelUploadService';

export interface DuplicateMatch {
  sourceProduct: string; // Name of product being uploaded
  matchedProduct: string; // Name of matching product
  similarity: number; // 0-100
  reason: string; // Why it's considered a duplicate
  location: 'within-file' | 'in-inventory'; // Where the duplicate was found
  sourceIndex?: number; // Index in upload file
  details?: {
    nameSimilarity: number;
    descriptionSimilarity: number;
    skuMatch: boolean;
  };
}

export interface DuplicateDetectionResult {
  hasDuplicates: boolean;
  duplicatesFound: DuplicateMatch[];
  fileInternalDuplicates: DuplicateMatch[];
  inventoryDuplicates: DuplicateMatch[];
  newProducts: string[]; // Products with no duplicates
  summary: {
    total: number;
    new: number;
    potential: number;
    confirmed: number;
  };
}

/**
 * Detect all duplicates in uploaded products
 * Checks both within the file and against existing inventory
 */
export const detectAllDuplicates = async (
  products: ExcelProduct[],
  tenantId: string
): Promise<DuplicateDetectionResult> => {
  // Detect duplicates within the file first
  const fileInternalDuplicates = detectDuplicatesWithinFile(products);

  // Detect duplicates against inventory
  const inventoryDuplicates = await detectDuplicatesInInventory(products, tenantId);

  // Combine all duplicates
  const allDuplicates = [...fileInternalDuplicates, ...inventoryDuplicates];

  // Get list of new products (no duplicates)
  const duplicateProductNames = new Set(allDuplicates.map(d => d.sourceProduct));
  const newProducts = products
    .map(p => p.name)
    .filter(name => !duplicateProductNames.has(name));

  return {
    hasDuplicates: allDuplicates.length > 0,
    duplicatesFound: allDuplicates,
    fileInternalDuplicates,
    inventoryDuplicates,
    newProducts,
    summary: {
      total: products.length,
      new: newProducts.length,
      potential: allDuplicates.length,
      confirmed: 0, // Will be set by user
    },
  };
};

/**
 * Detect duplicates within the uploaded file
 * Compares all products against each other
 */
export const detectDuplicatesWithinFile = (
  products: ExcelProduct[]
): DuplicateMatch[] => {
  const duplicates: DuplicateMatch[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < products.length; i++) {
    const product1 = products[i];

    for (let j = i + 1; j < products.length; j++) {
      const product2 = products[j];

      const similarity = calculateProductSimilarity(product1, product2);

      // Flag as duplicate if >75% similar
      if (similarity > 0.75) {
        const key = `${product1.name}|${product2.name}`;
        if (!seen.has(key)) {
          duplicates.push({
            sourceProduct: product1.name,
            matchedProduct: product2.name,
            similarity: Math.round(similarity * 100),
            reason: `Appears ${Math.round(similarity * 100)}% similar to another product in your upload`,
            location: 'within-file',
            sourceIndex: i,
            details: {
              nameSimilarity: Math.round(calculateStringSimilarity(product1.name, product2.name) * 100),
              descriptionSimilarity: Math.round(
                calculateStringSimilarity(product1.description, product2.description) * 100
              ),
              skuMatch: !!product1.sku && product1.sku === product2.sku,
            },
          });
          seen.add(key);
        }
      }
    }
  }

  return duplicates;
};

/**
 * Detect duplicates against existing inventory
 * Compares uploaded products with user's existing products
 */
export const detectDuplicatesInInventory = async (
  products: ExcelProduct[],
  tenantId: string
): Promise<DuplicateMatch[]> => {
  const duplicates: DuplicateMatch[] = [];

  if (!tenantId) return duplicates;

  try {
    // Fetch all existing products for this tenant
    const productsRef = collection(db, 'tenants', tenantId, 'products');
    const q = query(productsRef, where('active', '==', true));
    const snapshot = await getDocs(q);

    const existingProducts = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      description: doc.data().description || '',
      sku: doc.data().sku || '',
    }));

    // Check each uploaded product against existing ones
    for (let i = 0; i < products.length; i++) {
      const uploadedProduct = products[i];

      for (const existingProduct of existingProducts) {
        const similarity = calculateProductSimilarity(uploadedProduct, {
          name: existingProduct.name,
          description: existingProduct.description,
          sku: existingProduct.sku,
        });

        // Flag as potential duplicate if >70% similar
        // Threshold is slightly lower for inventory matches as they're more critical
        if (similarity > 0.7) {
          duplicates.push({
            sourceProduct: uploadedProduct.name,
            matchedProduct: existingProduct.name,
            similarity: Math.round(similarity * 100),
            reason: `Matches existing product in your inventory`,
            location: 'in-inventory',
            sourceIndex: i,
            details: {
              nameSimilarity: Math.round(calculateStringSimilarity(uploadedProduct.name, existingProduct.name) * 100),
              descriptionSimilarity: Math.round(
                calculateStringSimilarity(uploadedProduct.description, existingProduct.description) * 100
              ),
              skuMatch: !!uploadedProduct.sku && uploadedProduct.sku === existingProduct.sku,
            },
          });
          break; // Found a match, move to next product
        }
      }
    }
  } catch (error) {
    console.error('Error detecting duplicates in inventory:', error);
  }

  return duplicates;
};

/**
 * Calculate overall similarity between two products
 * Considers name, description, and SKU
 */
export const calculateProductSimilarity = (
  product1: any,
  product2: any
): number => {
  // If SKUs match exactly, it's definitely a duplicate
  if (
    product1.sku &&
    product2.sku &&
    product1.sku.toLowerCase() === product2.sku.toLowerCase()
  ) {
    return 0.95; // Very high confidence
  }

  // Calculate component similarities
  const nameSim = calculateStringSimilarity(product1.name, product2.name);
  const descSim = calculateStringSimilarity(
    product1.description || '',
    product2.description || ''
  );

  // Weight: 60% name, 40% description (name is more reliable)
  return nameSim * 0.6 + descSim * 0.4;
};

/**
 * Calculate string similarity using Levenshtein-based approach
 * Returns a value between 0 and 1
 */
export const calculateStringSimilarity = (s1: string, s2: string): number => {
  if (!s1 || !s2) return 0;

  const s1Lower = s1.toLowerCase().trim();
  const s2Lower = s2.toLowerCase().trim();

  // Exact match
  if (s1Lower === s2Lower) return 1;

  // Check if one string contains the other
  if (s1Lower.includes(s2Lower) || s2Lower.includes(s1Lower)) {
    const shorter = Math.min(s1Lower.length, s2Lower.length);
    const longer = Math.max(s1Lower.length, s2Lower.length);
    return shorter / longer;
  }

  const longer = s1Lower.length > s2Lower.length ? s1Lower : s2Lower;
  const shorter = s1Lower.length > s2Lower.length ? s2Lower : s1Lower;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

/**
 * Get edit distance (Levenshtein distance) between two strings
 */
const getEditDistance = (s1: string, s2: string): number => {
  const costs: number[] = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
};

/**
 * Filter products based on duplicate handling option
 */
export const filterProductsByDuplicateOption = (
  products: ExcelProduct[],
  duplicates: DuplicateMatch[],
  option: 'skip' | 'confirm-all'
): ExcelProduct[] => {
  if (option === 'confirm-all') {
    return products; // Upload all products
  }

  if (option === 'skip') {
    // Skip products that are duplicates
    const duplicateProductNames = new Set(
      duplicates.map(d => d.sourceProduct)
    );
    return products.filter(p => !duplicateProductNames.has(p.name));
  }

  return products;
};

/**
 * Get detailed duplicate report for display
 */
export const generateDuplicateReport = (
  detection: DuplicateDetectionResult
): string[] => {
  const lines: string[] = [];

  if (detection.fileInternalDuplicates.length > 0) {
    lines.push(`📋 File Internal Duplicates (${detection.fileInternalDuplicates.length}):`);
    detection.fileInternalDuplicates.forEach(dup => {
      lines.push(
        `  • "${dup.sourceProduct}" ↔ "${dup.matchedProduct}" (${dup.similarity}% match)`
      );
    });
  }

  if (detection.inventoryDuplicates.length > 0) {
    lines.push(`📦 Inventory Duplicates (${detection.inventoryDuplicates.length}):`);
    detection.inventoryDuplicates.forEach(dup => {
      lines.push(
        `  • "${dup.sourceProduct}" matches "${dup.matchedProduct}" in your inventory (${dup.similarity}% match)`
      );
    });
  }

  return lines;
};

export default {
  detectAllDuplicates,
  detectDuplicatesWithinFile,
  detectDuplicatesInInventory,
  calculateProductSimilarity,
  calculateStringSimilarity,
  filterProductsByDuplicateOption,
  generateDuplicateReport,
};
