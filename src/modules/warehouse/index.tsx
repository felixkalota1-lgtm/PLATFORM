import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Upload, MapPin, Package, AlertCircle, Send, Eye, BarChart3 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import ProductUploadModal from '../../components/ProductUploadModal'
import Warehouse3DViewer from '../../components/Warehouse3DViewer'
import WarehouseUploadPortal from './WarehouseUploadPortal'
import StockTransferManager from './StockTransferManager'
import AOProductPage from './AOProductPage'
import WarehouseAnalyticsDashboard from './WarehouseAnalyticsDashboard'

export default function WarehouseModule() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const tenantId = user?.tenantId || 'default'
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  
  // Determine active tab based on current route
  const activeTab = useMemo(() => {
    const path = location.pathname
    console.log('🔍 Current path:', path) // Debug logging
    
    if (path.includes('/products')) return 'products'
    if (path.includes('/upload-portal')) return 'upload'
    if (path.includes('/transfer')) return 'transfer'
    if (path.includes('/analytics')) return 'analytics'
    if (path.includes('/map')) return 'map'
    if (path.includes('/locations')) return 'inventory'
    if (path.includes('/shipments')) return 'orders'
    return 'products'
  }, [location.pathname])

  console.log('📑 Active tab:', activeTab) // Debug logging

  const handleUploadSuccess = (result: any) => {
    console.log('✅ Warehouse import successful:', result)
  }
  
  const handleTabChange = (tab: 'products' | 'upload' | 'transfer' | 'analytics' | 'map' | 'inventory' | 'orders') => {
    const routeMap = {
      products: '/warehouse/products',
      upload: '/warehouse/upload-portal',
      transfer: '/warehouse/transfer',
      analytics: '/warehouse/analytics',
      map: '/warehouse/map',
      inventory: '/warehouse/locations',
      orders: '/warehouse/shipments'
    }
    console.log('🔀 Navigating to:', routeMap[tab]) // Debug logging
    navigate(routeMap[tab])
  }

  return (
    <div className="w-full">
      {/* Show tabs at top for easy navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-full overflow-x-auto">
          <div className="flex">
            <button
              onClick={() => handleTabChange('products')}
              className={`px-6 py-3 font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'products'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <Eye size={18} />
              All Products
            </button>
            <button
              onClick={() => handleTabChange('upload')}
              className={`px-6 py-3 font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'upload'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <Upload size={18} />
              Upload Portal
            </button>
            <button
              onClick={() => handleTabChange('transfer')}
              className={`px-6 py-3 font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'transfer'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <Send size={18} />
              Transfer Stock
            </button>
            <button
              onClick={() => handleTabChange('analytics')}
              className={`px-6 py-3 font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <BarChart3 size={18} />
              Analytics
            </button>
            <button
              onClick={() => handleTabChange('map')}
              className={`px-6 py-3 font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'map'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <MapPin size={18} />
              Warehouse Map
            </button>
            <button
              onClick={() => handleTabChange('inventory')}
              className={`px-6 py-3 font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <Package size={18} />
              Inventory Locations
            </button>
            <button
              onClick={() => handleTabChange('orders')}
              className={`px-6 py-3 font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <AlertCircle size={18} />
              Pending Orders
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'products' && <AOProductPage />}
      {activeTab === 'upload' && <WarehouseUploadPortal />}
      {activeTab === 'transfer' && <StockTransferManager />}
      {activeTab === 'analytics' && <WarehouseAnalyticsDashboard />}
      
      {/* Tabbed views for non-full-page components */}
      {activeTab === 'map' && (
        <div className="space-y-6 p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3D Warehouse Visualization</h2>
            <div className="h-[500px] bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700">
              <Warehouse3DViewer />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Interactive 3D map showing warehouse layout, zones, and inventory placement
            </p>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-6 p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Inventory Locations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { zone: 'Zone A', items: 245, capacity: 500, temp: '20°C' },
                { zone: 'Zone B', items: 389, capacity: 600, temp: '18°C' },
                { zone: 'Zone C', items: 156, capacity: 400, temp: '15°C' },
              ].map((zone) => (
                <div key={zone.zone} className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{zone.zone}</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">Items: <span className="font-bold">{zone.items}</span></p>
                    <p className="text-gray-700 dark:text-gray-300">Capacity: <span className="font-bold">{zone.capacity}</span></p>
                    <p className="text-gray-700 dark:text-gray-300">Temperature: <span className="font-bold">{zone.temp}</span></p>
                    <div className="mt-3 w-full bg-gray-300 dark:bg-gray-500 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(zone.items / zone.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6 p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pending Orders</h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200">
                No pending orders at this time. Orders will appear here when shipments need to be processed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
