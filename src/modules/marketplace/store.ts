import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, CartItem, Vendor, Category } from './types'

interface MarketplaceStore {
  // Products
  products: Product[]
  setProducts: (products: Product[]) => void
  addProduct: (product: Product) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void

  // Categories
  categories: Category[]
  setCategories: (categories: Category[]) => void

  // Vendors
  vendors: Vendor[]
  setVendors: (vendors: Vendor[]) => void

  // Cart
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string, vendorId: string) => void
  updateCartQuantity: (productId: string, vendorId: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number

  // Favorites
  favorites: string[]
  toggleFavorite: (productId: string) => void
  isFavorited: (productId: string) => boolean
}

export const useMarketplaceStore = create<MarketplaceStore>()(
  persist(
    (set, get) => ({
      // Products
      products: [],
      setProducts: (products) => set({ products }),
      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, product],
        })),
      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      // Categories
      categories: [],
      setCategories: (categories) => set({ categories }),

      // Vendors
      vendors: [],
      setVendors: (vendors) => set({ vendors }),

      // Cart
      cart: [],
      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find(
            (i) => i.productId === item.productId && i.vendorId === item.vendorId
          )
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.productId === item.productId && i.vendorId === item.vendorId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { cart: [...state.cart, item] }
        }),
      removeFromCart: (productId, vendorId) =>
        set((state) => ({
          cart: state.cart.filter(
            (i) => !(i.productId === productId && i.vendorId === vendorId)
          ),
        })),
      updateCartQuantity: (productId, vendorId, quantity) =>
        set((state) => ({
          cart: state.cart.map((i) =>
            i.productId === productId && i.vendorId === vendorId
              ? { ...i, quantity }
              : i
          ),
        })),
      clearCart: () => set({ cart: [] }),
      getCartTotal: () => {
        return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      },

      // Favorites
      favorites: [],
      toggleFavorite: (productId) =>
        set((state) => ({
          favorites: state.favorites.includes(productId)
            ? state.favorites.filter((id) => id !== productId)
            : [...state.favorites, productId],
        })),
      isFavorited: (productId) => {
        return get().favorites.includes(productId)
      },
    }),
    {
      name: 'marketplace-store',
    }
  )
)
