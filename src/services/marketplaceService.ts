import { db } from '../firebase.config';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  DocumentData,
  Query,
  QueryConstraint,
} from 'firebase/firestore';

export interface MarketplaceProduct extends DocumentData {
  id?: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  comparePrice?: number;
  quantity: number;
  category: string;
  images: string[];
  vendor: {
    id: string;
    name: string;
    rating: number;
  };
  tags: string[];
  specifications?: Record<string, string>;
  status: 'active' | 'draft' | 'archived';
  vendorId: string;
  companyId: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all marketplace products
 */
export async function getMarketplaceProducts(
  filters?: {
    category?: string;
    vendorId?: string;
    status?: string;
    isPublished?: boolean;
  }
): Promise<MarketplaceProduct[]> {
  try {
    const constraints: QueryConstraint[] = [];

    // Only get published products
    constraints.push(where('isPublished', '==', true));
    constraints.push(where('status', '==', 'active'));

    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }

    if (filters?.vendorId) {
      constraints.push(where('vendorId', '==', filters.vendorId));
    }

    const q = query(collection(db, 'marketplaceProducts'), ...constraints);
    const querySnapshot = await getDocs(q);

    const products: MarketplaceProduct[] = [];
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as MarketplaceProduct);
    });

    return products;
  } catch (error) {
    console.error('Error fetching marketplace products:', error);
    return [];
  }
}

/**
 * Get products by vendor
 */
export async function getVendorProducts(vendorId: string): Promise<MarketplaceProduct[]> {
  return getMarketplaceProducts({ vendorId, isPublished: true });
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string): Promise<MarketplaceProduct[]> {
  return getMarketplaceProducts({ category, isPublished: true });
}

/**
 * Search products
 */
export async function searchMarketplaceProducts(searchTerm: string): Promise<MarketplaceProduct[]> {
  try {
    // Get all published active products and filter client-side
    const q = query(
      collection(db, 'marketplaceProducts'),
      where('isPublished', '==', true),
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(q);
    const searchLower = searchTerm.toLowerCase();

    const products: MarketplaceProduct[] = [];
    querySnapshot.forEach((doc) => {
      const product = doc.data() as MarketplaceProduct;

      if (
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.vendor?.name.toLowerCase().includes(searchLower)
      ) {
        const createdDate = product.createdAt instanceof Date ? product.createdAt : (typeof product.createdAt === 'object' && 'toDate' in product.createdAt ? (product.createdAt as any).toDate() : new Date());
        const updatedDate = product.updatedAt instanceof Date ? product.updatedAt : (typeof product.updatedAt === 'object' && 'toDate' in product.updatedAt ? (product.updatedAt as any).toDate() : new Date());
        
        products.push({
          id: doc.id,
          ...product,
          createdAt: createdDate,
          updatedAt: updatedDate,
        });
      }
    });

    return products;
  } catch (error) {
    console.error('Error searching marketplace products:', error);
    return [];
  }
}

/**
 * Get single product by ID
 */
export async function getMarketplaceProductById(
  productId: string
): Promise<MarketplaceProduct | null> {
  try {
    const q = query(
      collection(db, 'marketplaceProducts'),
      where('id', '==', productId),
      where('isPublished', '==', true)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as MarketplaceProduct;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Add product to marketplace (for vendors)
 */
export async function addMarketplaceProduct(
  product: Omit<MarketplaceProduct, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'marketplaceProducts'), {
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding marketplace product:', error);
    return null;
  }
}

/**
 * Update marketplace product
 */
export async function updateMarketplaceProduct(
  productId: string,
  updates: Partial<MarketplaceProduct>
): Promise<boolean> {
  try {
    const productRef = doc(db, 'marketplaceProducts', productId);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error updating marketplace product:', error);
    return false;
  }
}

/**
 * Delete marketplace product
 */
export async function deleteMarketplaceProduct(productId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'marketplaceProducts', productId));
    return true;
  } catch (error) {
    console.error('Error deleting marketplace product:', error);
    return false;
  }
}

/**
 * Get featured products
 */
export async function getFeaturedMarketplaceProducts(limit: number = 10): Promise<MarketplaceProduct[]> {
  try {
    const q = query(
      collection(db, 'marketplaceProducts'),
      where('isPublished', '==', true),
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(q);
    const products: MarketplaceProduct[] = [];

    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as MarketplaceProduct);
    });

    // Return limited results
    return products.slice(0, limit);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}
