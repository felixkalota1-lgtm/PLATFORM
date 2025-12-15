import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, Home, Package, Heart } from 'lucide-react'
import BrowseProducts from './BrowseProducts'
import ShoppingCartComponent from './components/ShoppingCart'
import OrderHistory from './components/OrderHistory'
import SavedVendorsComponent from './saved-vendors'
import { useMarketplaceStore } from './store'

export default function MarketplaceModule() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cart } = useMarketplaceStore()

  // Get active tab from URL path
  const getActiveTab = () => {
    const path = location.pathname.split('/').pop()
    return path || 'browse'
  }

  const mockProducts: Array<any> = [
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
      vendor: { id: 'vendor-1', name: 'Office Pro', rating: 4.8 },
      tags: ['office', 'lighting', 'led'],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active' as const,
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
      vendor: { id: 'vendor-2', name: 'Furniture Elite', rating: 4.6 },
      tags: ['furniture', 'office', 'ergonomic'],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active' as const,
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
      vendor: { id: 'vendor-1', name: 'Office Pro', rating: 4.8 },
      tags: ['electronics', 'keyboard', 'wireless'],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active' as const,
    },
  ]

  const activeTab = getActiveTab()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Marketplace
            </h1>
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

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'browse', label: 'Browse Products', icon: Home },
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
          <Route path="/browse" element={<BrowseProducts mockProducts={mockProducts} />} />
          <Route path="/cart" element={<ShoppingCartComponent />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/saved-vendors" element={<SavedVendorsComponent />} />
        </Routes>
      </div>
    </div>
  )
}
