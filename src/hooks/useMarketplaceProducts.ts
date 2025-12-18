import { useState, useEffect } from 'react';
import {
  getMarketplaceProducts,
  searchMarketplaceProducts,
  getProductsByCategory,
  getVendorProducts,
  MarketplaceProduct,
} from '../services/marketplaceService';

interface UseMarketplaceProductsOptions {
  category?: string;
  vendorId?: string;
  searchQuery?: string;
}

interface UseMarketplaceProductsResult {
  products: MarketplaceProduct[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch marketplace products with filtering and search
 */
export function useMarketplaceProducts(
  options?: UseMarketplaceProductsOptions
): UseMarketplaceProductsResult {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      let fetchedProducts: MarketplaceProduct[] = [];

      if (options?.searchQuery && options.searchQuery.trim()) {
        // Search products
        fetchedProducts = await searchMarketplaceProducts(options.searchQuery);
      } else if (options?.category) {
        // Get products by category
        fetchedProducts = await getProductsByCategory(options.category);
      } else if (options?.vendorId) {
        // Get vendor products
        fetchedProducts = await getVendorProducts(options.vendorId);
      } else {
        // Get all marketplace products
        fetchedProducts = await getMarketplaceProducts();
      }

      setProducts(fetchedProducts);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(message);
      console.error('Error fetching marketplace products:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, [options?.searchQuery, options?.category, options?.vendorId]);

  return {
    products,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for marketplace cart operations
 */
interface CartItem extends MarketplaceProduct {
  cartQuantity: number;
}

interface UseMarketplaceCartResult {
  cartItems: CartItem[];
  addToCart: (product: MarketplaceProduct, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

export function useMarketplaceCart(): UseMarketplaceCartResult {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (product: MarketplaceProduct, quantity: number) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + quantity } : item
        );
      }

      return [...prevItems, { ...product, cartQuantity: quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => (item.id === productId ? { ...item, cartQuantity: quantity } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.cartQuantity, 0);
  const cartCount = cartItems.reduce((count, item) => count + item.cartQuantity, 0);

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
  };
}

/**
 * Hook for product recommendations based on category
 */
export function useMarketplaceRecommendations(category?: string, limit: number = 5) {
  const { products, loading, error } = useMarketplaceProducts({ category });

  const recommendations = products.slice(0, limit);

  return {
    recommendations,
    loading,
    error,
  };
}
