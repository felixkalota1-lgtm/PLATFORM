import { useState } from 'react'
import { ShoppingCart, Grid, List, Search, Home, Package, Users } from 'lucide-react'
import ProductGrid from './components/ProductGrid'
import ProductDetail from './components/ProductDetail'
import ShoppingCartComponent from './components/ShoppingCart'
import Checkout from './components/Checkout'
import OrderHistory from './components/OrderHistory'
import VendorProfile from './components/VendorProfile'
import Filters from './components/Filters'
import { useMarketplaceStore } from './store'
import { Product, Vendor } from './types'

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'cart' | 'orders' | 'vendors'>('browse')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showCheckout, setShowCheckout] = useState(false)
  const [showOrderComplete, setShowOrderComplete] = useState(false)
  const { cart } = useMarketplaceStore()

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
      images: ['https://picsum.photos/400/300?random=1'],
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
      images: ['https://picsum.photos/400/300?random=2'],
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
      images: ['https://picsum.photos/400/300?random=3'],
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

  // Mock vendors data
  const mockVendors: Vendor[] = [
    {
      id: 'vendor-1',
      name: 'Office Pro',
      description: 'Premium office supplies and equipment for modern workplaces',
      logo: 'https://picsum.photos/100/100?random=4',
      rating: 4.8,
      reviewCount: 234,
      isVerified: true,
      categories: ['office-supplies', 'furniture', 'electronics'],
      email: 'contact@officepro.com',
      phone: '+1-800-OFFICE1',
      address: '123 Business Ave, New York, NY 10001',
      website: 'www.officepro.com',
      createdAt: new Date(),
    },
    {
      id: 'vendor-2',
      name: 'Furniture Elite',
      description: 'High-quality furniture and workplace solutions',
      logo: 'https://picsum.photos/100/100?random=5',
      rating: 4.6,
      reviewCount: 189,
      isVerified: true,
      categories: ['furniture'],
      email: 'sales@furniturealite.com',
      phone: '+1-800-FURN-ELITE',
      address: '456 Design Street, Los Angeles, CA 90001',
      website: 'www.furnitureelite.com',
      createdAt: new Date(),
    },
  ]

  // Filter products based on search and category
  const getFilteredProducts = () => {
    return mockProducts.filter((product) => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = 
        selectedCategory === 'all' || product.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }

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
              className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'browse'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Home size={18} />
              Browse Products
            </button>
            <button
              onClick={() => setActiveTab('cart')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'cart'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <ShoppingCart size={18} />
              Shopping Cart
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Package size={18} />
              Order History
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'vendors'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Users size={18} />
              Vendors
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            {!selectedProduct && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap">
                  {['all', 'office-supplies', 'furniture', 'electronics', 'documents'].map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedCategory === cat
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {cat === 'all' ? 'All Categories' : cat.replace('-', ' ')}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

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
                <ProductDetail product={selectedProduct} />
              </div>
            ) : (
              <>
                {/* Filter Stats */}
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Showing {getFilteredProducts().length} products
                </div>
                <ProductGrid
                  products={getFilteredProducts()}
                  onProductClick={setSelectedProduct}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'cart' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shopping Cart</h2>
            <div className="space-y-4">
              <ShoppingCartComponent />
              {cart.length > 0 && (
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order History</h2>
            <OrderHistory />
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Our Vendors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-lg flex-shrink-0">
                      {vendor.logo && (
                        <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover rounded-lg" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {vendor.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {vendor.rating}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ({vendor.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {vendor.description}
                  </p>
                  <button
                    onClick={() => setSelectedVendor(vendor)}
                    className="w-full px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium"
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCheckout && (
        <Checkout
          onClose={() => setShowCheckout(false)}
          onOrderComplete={() => {
            setShowOrderComplete(true);
            setShowCheckout(false);
            setTimeout(() => {
              setShowOrderComplete(false);
              setActiveTab('orders');
            }, 3000);
          }}
        />
      )}

      {showOrderComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-md text-center">
            <div className="text-5xl mb-4">✓</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Order Complete!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your order has been placed successfully. Redirecting to order history...
            </p>
          </div>
        </div>
      )}

      {selectedVendor && (
        <VendorProfile
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
        />
      )}    </div>
  )
}