import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, Home, Package, Heart, AlertCircle, Store } from 'lucide-react'
import BrowseProducts from './BrowseProducts'
import ShoppingCartComponent from './components/ShoppingCart'
import OrderHistory from './components/OrderHistory'
import SavedVendorsComponent from './saved-vendors'
import MyListings from './components/MyListings'
import { useMarketplaceStore } from './store'
import { useMarketplaceProducts } from '../../hooks/useMarketplaceProducts'
import { MarketplaceProduct } from '../../services/marketplaceService'

export default function MarketplaceModule() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cart } = useMarketplaceStore()
  const { products: realProducts, loading, error } = useMarketplaceProducts()
  const [products, setProducts] = useState<MarketplaceProduct[]>([])

  // Get active tab from URL path
  const getActiveTab = () => {
    const path = location.pathname.split('/').pop()
    return path || 'browse'
  }

  // NO MOCK DATA - Use only real products from Firebase
  useEffect(() => {
    if (realProducts) {
      setProducts(realProducts)
    }
  }, [realProducts])

  const activeTab = getActiveTab()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Loading and Error States */}
          {loading && !products.length && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700 dark:text-blue-200">
                Loading marketplace products...
              </span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-700 dark:text-yellow-200">
                {error} - Showing mock data
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Marketplace
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {products.length > 0
                  ? `${products.length} products available from our vendors`
                  : 'No products available yet'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {cart.length} items
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

          {/* Navigation Tabs - Clean and simple, no dropdown menu */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'browse', label: 'Browse Products', icon: Home },
              { id: 'my-listings', label: 'My Listings', icon: Store },
              { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart },
              { id: 'orders', label: 'Order History', icon: Package },
              { id: 'saved-vendors', label: 'Saved Vendors', icon: Heart },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigate(`/marketplace/${id}`)}
                className={`px-4 py-2 font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/marketplace/browse" replace />} />
          <Route path="/browse" element={<BrowseProducts mockProducts={products as any} />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/cart" element={<ShoppingCartComponent />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/saved-vendors" element={<SavedVendorsComponent />} />
        </Routes>
      </div>
    </div>
  )
}
