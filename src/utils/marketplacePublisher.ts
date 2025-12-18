import { addMarketplaceProduct, MarketplaceProduct } from '../services/marketplaceService';
import { removeUndefinedValues } from './cleanData';

export interface ProductToPublish {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  quantity: number;
  category: string;
  images?: string[];
  specifications?: Record<string, string>;
  tags?: string[];
}

/**
 * Publish a single product to marketplace
 */
export async function publishProductToMarketplace(
  product: ProductToPublish,
  vendorId: string,
  companyId: string,
  vendorName: string = 'My Company'
): Promise<string | null> {
  try {
    // Validate required fields
    if (!product.name || !product.sku || !product.category) {
      console.error('Missing required product fields:', { name: product.name, sku: product.sku, category: product.category });
      throw new Error('Product must have name, SKU, and category');
    }

    if (!vendorId) {
      console.error('Missing vendor ID information');
      throw new Error('Vendor ID is required for marketplace publication');
    }

    if (!companyId || companyId === 'default') {
      console.error('Missing or invalid company ID - cannot publish to marketplace without proper tenant context');
      throw new Error('Company ID (tenant context) is required for marketplace publication');
    }

    const marketplaceProduct: Omit<MarketplaceProduct, 'id' | 'createdAt' | 'updatedAt'> = {
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: product.price,
      quantity: product.quantity,
      category: product.category,
      images: product.images || [],
      vendor: {
        id: vendorId,
        name: vendorName,
        rating: 4.5,
      },
      tags: product.tags || [product.category.toLowerCase()], // Only use provided tags, no auto-generation
      specifications: product.specifications,
      status: 'active',
      vendorId,
      companyId,
      isPublished: true,
    };

    // Remove any undefined values before storing in Firebase
    const cleanedProduct = removeUndefinedValues(marketplaceProduct);

    const productId = await addMarketplaceProduct(cleanedProduct as any);
    if (!productId) {
      throw new Error('Failed to publish product - no ID returned');
    }
    return productId;
  } catch (error) {
    console.error('Error publishing product to marketplace:', error);
    return null;
  }
}

/**
 * Publish multiple products to marketplace
 */
export async function publishProductsToMarketplace(
  products: ProductToPublish[],
  vendorId: string,
  companyId: string,
  vendorName: string = 'My Company'
): Promise<{ successful: number; failed: number; productIds: string[] }> {
  const results = {
    successful: 0,
    failed: 0,
    productIds: [] as string[],
  };

  for (const product of products) {
    try {
      const productId = await publishProductToMarketplace(
        product,
        vendorId,
        companyId,
        vendorName
      );

      if (productId) {
        results.successful++;
        results.productIds.push(productId);
      } else {
        results.failed++;
      }
    } catch (error) {
      console.error(`Failed to publish ${product.name}:`, error);
      results.failed++;
    }
  }

  return results;
}
