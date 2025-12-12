import { useState } from 'react'
import { ShoppingCart, Plus, Grid, List } from 'lucide-react'
import ProductGrid from './components/ProductGrid'
import ProductDetail from './components/ProductDetail'
import ShoppingCartComponent from './components/ShoppingCart'
import { useMarketplaceStore } from './store'
import { Product } from './types'

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'cart'>('browse')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { products, cart } = useMarketplaceStore()

  // Mock data for demonstration
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Professional Desk Lamp',
      description: 'High-quality LED desk lamp with adjustable brightness',
      sku: 'LAMP-001',
      price: 89.99,
      comparePrice: 129.99,
      quantity: 45,
      category: 'office-supplies',
      images: ['https://via.placeholder.com/400x300?text=Desk+Lamp'],
      vendor: {
        id: 'vendor-1',
        name: 'Office Pro',
        rating: 4.8,
      },
      tags: ['office', 'lighting', 'led'],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      specifications: {
        Brightness: '1000 Lumens',
        'Color Temperature': '3000K-6500K',
        Power: '12W',
      },
    },
    {
      id: '2',
      name: 'Ergonomic Office Chair',
      description: 'Premium ergonomic chair with lumbar support and armrests',
      sku: 'CHAIR-001',
      price: 299.99,
      comparePrice: 399.99,
      quantity: 12,
      category: 'furniture',
      images: ['https://via.placeholder.com/400x300?text=Office+Chair'],
      vendor: {
        id: 'vendor-2',
        name: 'Furniture Elite',
        rating: 4.6,
      },
      tags: ['furniture', 'office', 'ergonomic'],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      specifications: {
        Height: '100-110 cm',
        Material: 'Mesh',
        'Max Weight': '120 kg',
      },
    },
    {
      id: '3',
      name: 'Wireless Keyboard',
      description: 'Compact wireless keyboard with long battery life',
      sku: 'KB-001',
      price: 49.99,
      quantity: 78,
      category: 'electronics',
      images: ['https://via.placeholder.com/400x300?text=Wireless+Keyboard'],
      vendor: {
        id: 'vendor-1',
        name: 'Office Pro',
        rating: 4.8,
      },
      tags: ['electronics', 'keyboard', 'wireless'],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Marketplace
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {cart.length} items in cart
              </span>
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                activeTab === 'browse'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Browse Products
            </button>
            <button
              onClick={() => setActiveTab('cart')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                activeTab === 'cart'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Shopping Cart
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* View Mode Toggle */}
            {!selectedProduct && (
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Product Grid or Detail */}
            {selectedProduct ? (
              <div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="mb-6 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  ← Back to Products
                </button>
                <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} />
              </div>
            ) : (
              <ProductGrid
                products={mockProducts}
                onProductClick={setSelectedProduct}
              />
            )}
          </div>
        )}

        {activeTab === 'cart' && <ShoppingCartComponent />}
      </div>
    </div>
  )
}
