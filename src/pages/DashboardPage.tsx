import { TrendingUp, AlertCircle, Package, ShoppingCart, Upload } from 'lucide-react'
import { useState } from 'react'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import ProductUploadModal from '../components/ProductUploadModal'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  
  const stats = [
    { label: 'Total Orders', value: '1,234', icon: ShoppingCart, change: '+12%' },
    { label: 'Total Revenue', value: '$45,231', icon: TrendingUp, change: '+8%' },
    { label: 'Active Products', value: '892', icon: Package, change: '+5%' },
    { label: 'Pending Actions', value: '23', icon: AlertCircle, change: '0%' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg"
            >
              <Upload size={20} />
              📊 Import Products
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">{stat.change}</p>
                    </div>
                    <Icon className="w-10 h-10 text-blue-500 opacity-20" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Welcome Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Platform Sales & Procurement</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This is your central hub for managing all business operations including marketplace, inventory, 
              procurement, warehouse management, HR, accounting, and more.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Getting Started</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>✓ Set up your inventory</li>
                  <li>✓ Configure warehouse locations</li>
                  <li>✓ Add team members</li>
                  <li>✓ Set up accounting</li>
                </ul>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Quick Links</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>→ Browse marketplace</li>
                  <li>→ View your inventory</li>
                  <li>→ Check pending orders</li>
                  <li>→ View analytics</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && <AnalyticsDashboard />}

      {/* Product Upload Modal */}
      <ProductUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        tenantId="default"
        onSuccess={(result) => {
          console.log('✅ Products imported successfully:', result);
          // Show success message
          alert(`✅ ${result.upload.uploaded} products uploaded successfully!`);
          // You can refresh the product list here
        }}
      />
    </div>
  )
}
