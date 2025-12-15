import { useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Upload, Package, AlertCircle, CheckCircle2, TrendingUp, Plus, Download, BarChart3, Zap } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import ProductUploadModal from '../../components/ProductUploadModal'
import ManualProductModal from '../../components/ManualProductModal'
import { downloadProductsExcel } from '../../services/excelExportService'
import ProductsList from './components/ProductsList.tsx'
import StockManagement from './components/StockManagement.tsx'
import InventoryAnalytics from './components/InventoryAnalytics.tsx'
import BulkUploadWithAI from './bulk-upload-ai'
import { useLowStockStore } from './low-stock-store'

export default function InventoryModule() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const tenantId = user?.tenantId || 'default'
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isManualOpen, setIsManualOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { getActiveAlerts } = useLowStockStore()
  const activeAlerts = getActiveAlerts()
  const [uploadStats, setUploadStats] = useState({
    totalProducts: 0,
    lastUpload: null as Date | null,
    successRate: 0,
  })

  // Get active tab from URL path
  const getActiveTab = () => {
    const path = location.pathname.split('/').pop()
    return path || 'overview'
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await downloadProductsExcel({ tenantId })
      console.log('✅ Inventory exported to Excel successfully')
    } catch (error) {
      console.error('❌ Export failed:', error)
      alert('Failed to export inventory')
    } finally {
      setIsExporting(false)
    }
  }

  const handleUploadSuccess = (result: any) => {
    setUploadStats({
      totalProducts: result.upload.uploaded || 0,
      lastUpload: new Date(),
      successRate: result.upload.uploaded 
        ? Math.round((result.upload.uploaded / (result.upload.uploaded + result.upload.failed)) * 100)
        : 0,
    })
    setIsUploadOpen(false)
  }

  const activeTab = getActiveTab()

  const stats = [
    { 
      label: 'Total Products', 
      value: uploadStats.totalProducts || '0', 
      icon: Package, 
      color: 'blue',
      change: uploadStats.lastUpload ? `Last updated: ${uploadStats.lastUpload.toLocaleDateString()}` : 'No data yet'
    },
    { 
      label: 'Upload Success Rate', 
      value: `${uploadStats.successRate}%`, 
      icon: CheckCircle2, 
      color: 'green',
      change: 'From last batch'
    },
    { 
      label: 'In Stock', 
      value: '0', 
      icon: TrendingUp, 
      color: 'emerald',
      change: '+12% this week'
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage products, services, stock levels, and bulk imports</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsManualOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} />
            ➕ Add Product
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Upload or re-sync Excel file"
          >
            <Upload size={20} />
            📊 Bulk Import
          </button>
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            title="Download current inventory as Excel"
          >
            <Download size={20} />
            📥 {isExporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Product Upload Modal */}
      <ProductUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        tenantId={tenantId}
        onSuccess={handleUploadSuccess}
      />

      {/* Manual Product Modal */}
      <ManualProductModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        tenantId={tenantId}
        onSuccess={() => {
          // Refresh product list
          setIsManualOpen(false)
        }}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          const colorClasses = {
            blue: 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 text-blue-600 dark:text-blue-400',
            green: 'bg-green-50 dark:bg-green-900 dark:bg-opacity-20 text-green-600 dark:text-green-400',
            emerald: 'bg-emerald-50 dark:bg-emerald-900 dark:bg-opacity-20 text-emerald-600 dark:text-emerald-400',
          }
          return (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.label}</h3>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{stat.change}</p>
            </div>
          )
        })}
      </div>

      {/* Tabs with Routing */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow sticky top-16 z-10">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-0 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '📋' },
              { id: 'products', label: 'Products and Services', icon: '📦' },
              { id: 'stock', label: 'Stock Management', icon: '📊' },
              { id: 'bulk-upload', label: 'AI Bulk Upload', icon: '🤖' },
              { id: 'low-stock', label: `Low Stock Alerts (${activeAlerts.length})`, icon: '⚠️' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => navigate(`/inventory/${tab.id}`)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/inventory/overview" replace />} />
            <Route path="/overview" element={
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="text-blue-600 dark:text-blue-400 mt-1" size={24} />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Getting Started with Inventory</h3>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                        <li>✓ Click "Bulk Import" to upload products and services from Excel file</li>
                        <li>✓ The system will validate data, detect duplicates, and optionally generate AI images</li>
                        <li>✓ View imported items in the "Products and Services" tab</li>
                        <li>✓ Manage stock levels and track inventory in "Stock Management" tab</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Excel Template Format</h3>
                  <div className="bg-white dark:bg-gray-800 rounded p-4 font-mono text-sm overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-3 font-semibold">name</th>
                          <th className="text-left py-2 px-3 font-semibold">description</th>
                          <th className="text-left py-2 px-3 font-semibold">price</th>
                          <th className="text-left py-2 px-3 font-semibold">sku</th>
                          <th className="text-left py-2 px-3 font-semibold">category</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-600 dark:text-gray-400">
                        <tr className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-2 px-3">LED Desk Lamp</td>
                          <td className="py-2 px-3">Bright LED with adjustable brightness</td>
                          <td className="py-2 px-3">89.99</td>
                          <td className="py-2 px-3">LAMP-001</td>
                          <td className="py-2 px-3">Office</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                  <h3 className="font-semibold mb-2">AI Features Enabled</h3>
                  <ul className="space-y-1 text-sm">
                    <li>✨ Auto-generate product images from descriptions</li>
                    <li>✨ Detect duplicate products (70%+ text similarity)</li>
                    <li>✨ Auto-categorize products using AI</li>
                    <li>✨ Extract product metadata (materials, colors, sizes)</li>
                  </ul>
                </div>
              </div>
            } />
            <Route path="/products" element={<ProductsList />} />
            <Route path="/stock" element={<StockManagement />} />
            <Route path="/bulk-upload" element={<BulkUploadWithAI />} />
            <Route path="/low-stock" element={
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Low Stock Alerts</h2>
                  <p className="text-gray-600 dark:text-gray-400">Automatic alerts when product quantities drop below minimum thresholds</p>
                </div>

                {activeAlerts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">✓ All products are sufficiently stocked</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeAlerts.map((alert) => (
                      <div key={alert.id} className={`border-l-4 rounded-lg p-4 ${
                        alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                        alert.severity === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                        'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{alert.productName}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Current: {alert.currentQuantity} {alert.unit} | Minimum: {alert.minimumThreshold} {alert.unit}</p>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            alert.severity === 'critical' ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200' :
                            alert.severity === 'warning' ? 'bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                            'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          }`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            } />
            <Route path="/analytics" element={<InventoryAnalytics />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

