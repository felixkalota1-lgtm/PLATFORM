/**
 * Excel Upload Service
 * 
 * Handles Excel file parsing, validation, and bulk product import
 * Features:
 * - Parse XLSX files with react-dropzone
 * - Validate data structure and content
 * - AI-powered image generation for products
 * - Duplicate detection
 * - Batch Firestore upload with error handling
 */

import * as XLSX from 'xlsx';
import {
  validateExcelDataWithOllama,
  categorizeProductsWithAI,
  detectDuplicateProductsWithAI,
  generateProductImage,
  extractProductMetadata,
} from './aiService';
import { db } from './firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

export interface ExcelProduct {
  name: string;
  description: string;
  price?: number;
  sku?: string;
  category?: string;
  stock?: number;
  supplier?: string;
  tags?: string;
}

export interface ValidationResult {
  isValid: boolean;
  products: ExcelProduct[];
  errors: string[];
  warnings: string[];
  suggestions: string[];
  duplicates: Array<{ name1: string; name2: string; similarity: number }>;
}

export interface UploadResult {
  success: boolean;
  uploaded: number;
  failed: number;
  errors: string[];
  duplicates: Array<{ name1: string; name2: string; similarity: number }>;
  totalTime: number;
}

/**
 * Parse Excel file and extract product data
 * 
 * Expected Excel columns:
 * - A: Product Name (required)
 * - B: Description (required)
 * - C: Price (optional)
 * - D: SKU (optional)
 * - E: Category (optional)
 * - F: Stock Quantity (optional)
 * - G: Supplier (optional)
 * - H: Tags (optional)
 */
export const parseExcelFile = async (file: File): Promise<ExcelProduct[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to JSON with headers from first row
        const jsonData = XLSX.utils.sheet_to_json<ExcelProduct>(worksheet, {
          header: ['name', 'description', 'price', 'sku', 'category', 'stock', 'supplier', 'tags'],
          defval: '',
        });

        // Remove header row if it exists and filter empty rows
        const products = jsonData
          .filter((row: any) => row.name && row.description) // Only rows with name and description
          .map((row: any) => ({
            name: String(row.name).trim(),
            description: String(row.description).trim(),
            price: row.price ? parseFloat(row.price) : undefined,
            sku: row.sku ? String(row.sku).trim() : undefined,
            category: row.category ? String(row.category).trim() : undefined,
            stock: row.stock ? parseInt(row.stock) : undefined,
            supplier: row.supplier ? String(row.supplier).trim() : undefined,
            tags: row.tags ? String(row.tags).trim() : undefined,
          }));

        resolve(products);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Validate Excel products before upload
 * Checks for:
 * - Required fields
 * - Data type correctness
 * - Price range validity
 * - Duplicate products
 * - Ollama LLM validation (if available)
 */
export const validateExcelProducts = async (
  products: ExcelProduct[]
): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const validProducts: ExcelProduct[] = [];

  // Validate each product
  products.forEach((product, index) => {
    const rowNum = index + 2; // +2 for header and 0-indexing

    // Check required fields
    if (!product.name || product.name.length < 3) {
      errors.push(`Row ${rowNum}: Product name is required and must be at least 3 characters`);
      return;
    }

    if (!product.description || product.description.length < 5) {
      errors.push(`Row ${rowNum}: Description is required and must be at least 5 characters`);
      return;
    }

    // Validate price if provided
    if (product.price !== undefined && product.price < 0) {
      errors.push(`Row ${rowNum}: Price cannot be negative`);
      return;
    }

    // Validate stock if provided
    if (product.stock !== undefined && (product.stock < 0 || !Number.isInteger(product.stock))) {
      errors.push(`Row ${rowNum}: Stock must be a non-negative integer`);
      return;
    }

    // Warnings for common issues
    if (product.price && product.price > 100000) {
      warnings.push(`Row ${rowNum}: Product "${product.name}" has unusually high price (${product.price})`);
    }

    if (product.name.length > 100) {
      warnings.push(`Row ${rowNum}: Product name is very long (${product.name.length} chars)`);
    }

    if (!product.category) {
      suggestions.push(`Row ${rowNum}: Consider adding a category for "${product.name}"`);
    }

    if (!product.sku) {
      suggestions.push(`Row ${rowNum}: Consider adding a SKU for "${product.name}"`);
    }

    validProducts.push(product);
  });

  // Detect duplicates
  const duplicateData = await detectDuplicateProductsWithAI(
    validProducts.map(p => ({ name: p.name, description: p.description }))
  );

  const duplicates = duplicateData.map(d => ({
    name1: d.product1,
    name2: d.product2,
    similarity: d.similarity,
  }));

  if (duplicates.length > 0) {
    warnings.push(`Found ${duplicates.length} potentially duplicate products`);
  }

  // Run Ollama validation if products are valid
  if (validProducts.length > 0) {
    const ollamaResult = await validateExcelDataWithOllama(
      validProducts as any[]
    );
    errors.push(...ollamaResult.errors);
    warnings.push(...ollamaResult.warnings);
    suggestions.push(...ollamaResult.suggestions);
  }

  return {
    isValid: errors.length === 0,
    products: validProducts,
    errors,
    warnings,
    suggestions,
    duplicates,
  };
};

/**
 * Upload products to Firestore with AI enhancements
 * - Auto-categorizes products if category not provided
 * - Generates product images from descriptions
 * - Extracts product metadata (materials, colors, sizes)
 */
export const uploadProductsToFirestore = async (
  products: ExcelProduct[],
  tenantId: string,
  options: {
    generateImages?: boolean;
    autoCategory?: boolean;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<UploadResult> => {
  const startTime = Date.now();
  const { generateImages = false, autoCategory = true, onProgress } = options;
  const errors: string[] = [];
  const duplicates: Array<{ name1: string; name2: string; similarity: number }> = [];
  let uploadedCount = 0;
  let failedCount = 0;

  try {
    // Auto-categorize if needed
    let categories = new Map<string, string>();
    if (autoCategory) {
      categories = await categorizeProductsWithAI(
        products.map(p => ({
          name: p.name,
          description: p.description,
        }))
      );
    }

    // Batch upload with Firestore
    const batch = writeBatch(db);
    const productsRef = collection(db, 'tenants', tenantId, 'products');

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      onProgress?.(i + 1, products.length);

      try {
        // Extract metadata using AI
        const metadata = await extractProductMetadata(product.description);

        // Generate image if requested
        let imageUrl: string | undefined;
        if (generateImages) {
          try {
            const imageBlob = await generateProductImage(
              product.description,
              product.category || categories.get(product.name)
            );
            // In production, upload blob to Cloud Storage and get URL
            // For now, create a blob URL (temporary)
            imageUrl = URL.createObjectURL(imageBlob);
          } catch (imageError) {
            console.warn(`Failed to generate image for "${product.name}":`, imageError);
          }
        }

        // Prepare product document
        const productDoc: any = {
          name: product.name,
          description: product.description,
          price: product.price || 0,
          sku: product.sku || `SKU-${Date.now()}-${i}`,
          category: product.category || categories.get(product.name) || 'Uncategorized',
          stock: product.stock || 0,
          supplier: product.supplier || 'Unknown',
          tags: product.tags ? product.tags.split(',').map((t: string) => t.trim()) : [],
          metadata,
          createdAt: new Date(),
          updatedAt: new Date(),
          tenantId,
          active: true,
        };

        // Only add imageUrl if it exists
        if (imageUrl) {
          productDoc.imageUrl = imageUrl;
        }

        // Add to batch
        const docRef = doc(productsRef);
        batch.set(docRef, productDoc);

        uploadedCount++;
      } catch (error) {
        failedCount++;
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Commit batch
    await batch.commit();

    const totalTime = Date.now() - startTime;

    return {
      success: errors.length === 0,
      uploaded: uploadedCount,
      failed: failedCount,
      errors,
      duplicates,
      totalTime,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    return {
      success: false,
      uploaded: uploadedCount,
      failed: failedCount + products.length,
      errors: [
        ...errors,
        `Batch upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      duplicates,
      totalTime,
    };
  }
};

/**
 * Complete Excel import workflow
 * 1. Parse file
 * 2. Validate data
 * 3. User confirms uploads (optional)
 * 4. Upload to Firestore
 */
export const importProductsFromExcel = async (
  file: File,
  tenantId: string,
  options: {
    skipValidation?: boolean;
    generateImages?: boolean;
    onProgress?: (step: string, current?: number, total?: number) => void;
  } = {}
): Promise<{
  validation: ValidationResult;
  upload: UploadResult;
}> => {
  const { skipValidation = false, generateImages = false, onProgress } = options;

  // Step 1: Parse
  onProgress?.('Parsing Excel file...');
  const products = await parseExcelFile(file);

  // Step 2: Validate
  onProgress?.('Validating products...');
  let validation: ValidationResult = {
    isValid: true,
    products,
    errors: [],
    warnings: [],
    suggestions: [],
    duplicates: [],
  };

  if (!skipValidation) {
    validation = await validateExcelProducts(products);
  }

  // Step 3: Upload
  onProgress?.('Uploading to database...');
  const upload = await uploadProductsToFirestore(validation.products, tenantId, {
    generateImages,
    onProgress: (current, total) => onProgress?.('Uploading products...', current, total),
  });

  return { validation, upload };
};

export default {
  parseExcelFile,
  validateExcelProducts,
  uploadProductsToFirestore,
  importProductsFromExcel,
};
