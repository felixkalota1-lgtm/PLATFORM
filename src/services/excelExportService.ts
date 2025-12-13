import * as XLSX from 'xlsx';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface ExportOptions {
  tenantId: string;
  fileName?: string;
  includeArchived?: boolean;
}

/**
 * Export products to Excel file
 */
export async function exportProductsToExcel(options: ExportOptions): Promise<Blob> {
  const { tenantId, includeArchived = false } = options;

  try {
    console.log(`📤 Exporting products for tenant: ${tenantId}`);

    // Build query
    const constraints = [where('active', '==', true)];
    if (includeArchived) {
      // Include all products if requested
      const queryRef = collection(db, 'tenants', tenantId, 'products');
      const snapshot = await getDocs(queryRef);
      return createExcelFromData(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })));
    }

    // Get active products only
    const q = query(
      collection(db, 'tenants', tenantId, 'products'),
      ...constraints
    );
    const snapshot = await getDocs(q);

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`📦 Exporting ${products.length} products`);

    return createExcelFromData(products);
  } catch (error) {
    console.error('❌ Error exporting to Excel:', error);
    throw new Error(`Failed to export products: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create Excel workbook from product data
 */
function createExcelFromData(products: any[]): Blob {
  try {
    // Prepare data for Excel
    const excelData = products.map(product => ({
      Name: product.name || '',
      Description: product.description || '',
      Category: product.category || '',
      Price: product.price || 0,
      SKU: product.sku || '',
      Stock: product.stock || 0,
      Supplier: product.supplier || '',
      'Image URL': product.imageUrl || '',
      'Created At': product.createdAt 
        ? new Date(product.createdAt.seconds * 1000).toLocaleDateString()
        : '',
      'Updated At': product.updatedAt
        ? new Date(product.updatedAt.seconds * 1000).toLocaleDateString()
        : '',
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Name
      { wch: 40 }, // Description
      { wch: 15 }, // Category
      { wch: 12 }, // Price
      { wch: 12 }, // SKU
      { wch: 10 }, // Stock
      { wch: 15 }, // Supplier
      { wch: 30 }, // Image URL
      { wch: 12 }, // Created At
      { wch: 12 }, // Updated At
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

    // Generate Excel file as blob
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    console.log(`✅ Excel export created: ${(blob.size / 1024).toFixed(2)} KB`);

    return blob;
  } catch (error) {
    console.error('❌ Error creating Excel workbook:', error);
    throw error;
  }
}

/**
 * Download Excel file to user's computer
 */
export async function downloadProductsExcel(options: ExportOptions): Promise<void> {
  try {
    const blob = await exportProductsToExcel(options);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = options.fileName || `inventory-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    console.log('✅ File downloaded successfully');
  } catch (error) {
    console.error('❌ Error downloading file:', error);
    throw error;
  }
}

/**
 * Get export preview (first 10 products)
 */
export async function getExportPreview(options: ExportOptions): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'tenants', options.tenantId, 'products'),
      where('active', '==', true)
    );
    const snapshot = await getDocs(q);

    const products = snapshot.docs
      .map(doc => ({
        id: doc.id,
        name: doc.data().name,
        category: doc.data().category,
        price: doc.data().price,
        stock: doc.data().stock,
        sku: doc.data().sku,
      }))
      .slice(0, 10);

    return products;
  } catch (error) {
    console.error('❌ Error getting preview:', error);
    return [];
  }
}
