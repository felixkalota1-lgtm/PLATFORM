/**
 * Warehouse Upload Portal
 * 
 * Primary entry point for all company stock uploads
 * Features:
 * - Bulk Excel upload with AI processing
 * - Single product manual entry
 * - Duplicate detection with smart resolution
 * - AI image generation (Hugging Face)
 * - Auto-categorization via Ollama
 * - Stock level validation
 * - Real-time status updates
 * - Upload history tracking
 */

import { useState, useEffect } from 'react'
import { Upload, AlertCircle, TrendingUp, Plus, History, Zap, BarChart3 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { db } from '../../services/firebase'
import { collection, query, getDocs } from 'firebase/firestore'
import ProductUploadModal from '../../components/ProductUploadModal'
import ManualProductModal from '../../components/ManualProductModal'
import WarehouseUploadStats from './components/WarehouseUploadStats'
import UploadHistory from './components/UploadHistory'

type Tab = 'overview' | 'upload' | 'history' | 'analytics'

export default function WarehouseUploadPortal() {
  const { user } = useAuth()
  const tenantId = user?.tenantId || 'default'
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isManualOpen, setIsManualOpen] = useState(false)
  const [uploadStats, setUploadStats] = useState({
    totalProducts: 0,
    lastUpload: null as Date | null,
    successRate: 0,
    duplicatesHandled: 0,
    imagesGenerated: 0,
  })
  const [refreshKey, setRefreshKey] = useState(0)

  // Load actual product count from Firestore
  useEffect(() => {
    const loadProductCount = async () => {
      try {
        const productsRef = collection(db, 'tenants', tenantId, 'products')
        const snapshot = await getDocs(query(productsRef))
        setUploadStats(prev => ({
          ...prev,
          totalProducts: snapshot.docs.length,
        }))
        console.log(`📦 Loaded warehouse products count: ${snapshot.docs.length}`)
      } catch (error) {
        console.error('Error loading product count:', error)
      }
    }

    loadProductCount()
  }, [tenantId, refreshKey])

  const handleUploadSuccess = (result: any) => {
    setUploadStats({
      totalProducts: uploadStats.totalProducts + (result.upload.uploaded || 0),
      lastUpload: new Date(),
      successRate: result.upload.uploaded 
        ? Math.round((result.upload.uploaded / (result.upload.uploaded + result.upload.failed)) * 100)
        : 0,
      duplicatesHandled: (uploadStats.duplicatesHandled || 0) + (result.upload.duplicates?.length || 0),
      imagesGenerated: (uploadStats.imagesGenerated || 0) + (result.upload.uploaded || 0),
    })
    setIsUploadOpen(false)
    setRefreshKey(prev => prev + 1)
  }

  const handleManualSuccess = () => {
    setUploadStats({
      ...uploadStats,
      totalProducts: uploadStats.totalProducts + 1,
      lastUpload: new Date(),
    })
    setIsManualOpen(false)
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Warehouse Upload Portal</h1>
          </div>
          <p className="text-blue-100 text-lg">Central hub for all company stock uploads to the warehouse</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Stats Overview */}
        {activeTab === 'overview' && (
          <div className="mb-8">
            <WarehouseUploadStats stats={uploadStats} />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-4">
          {[
            { id: 'overview', label: '📊 Overview', icon: BarChart3 },
            { id: 'upload', label: '📤 Upload Products', icon: Upload },
            { id: 'history', label: '📜 Upload History', icon: History },
            { id: 'analytics', label: '📈 Analytics', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-600">
              <h2 className="text-2xl font-bold mb-4">Welcome to Warehouse Inventory Management</h2>
              <p className="text-gray-700 mb-6 leading-relaxed">
                This is your primary portal for uploading company stock to the warehouse. All products uploaded here 
                will be processed with AI-powered features including duplicate detection, auto-categorization, and 
                image generation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-2">🤖 AI Processing</h3>
                  <p className="text-sm text-gray-700">Automatic duplicate detection, categorization, and image generation</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-2">📦 Bulk Upload</h3>
                  <p className="text-sm text-gray-700">Upload hundreds of products at once via Excel files</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-2">📊 Smart Analytics</h3>
                  <p className="text-sm text-gray-700">Track uploads, duplicates, and warehouse metrics</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bulk Upload */}
              <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-400"
                   onClick={() => setIsUploadOpen(true)}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-blue-100 p-4 rounded-lg">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Bulk Upload</h3>
                    <p className="text-gray-600 text-sm mb-4">Upload multiple products via Excel file</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsUploadOpen(true)
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-semibold"
                    >
                      Upload Excel File
                    </button>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded text-xs text-gray-700">
                  <strong>Supported formats:</strong> .xlsx, .xls, .csv (comma-separated values)
                </div>
              </div>

              {/* Manual Entry */}
              <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-green-400"
                   onClick={() => setIsManualOpen(true)}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-green-100 p-4 rounded-lg">
                    <Plus className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Single Product</h3>
                    <p className="text-gray-600 text-sm mb-4">Add one product manually with detailed info</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsManualOpen(true)
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all font-semibold"
                    >
                      Add Product
                    </button>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded text-xs text-gray-700">
                  <strong>Best for:</strong> Adding individual products with complete information
                </div>
              </div>
            </div>

            {/* Info Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-amber-900 mb-2">Duplicate Detection</h4>
                    <p className="text-sm text-gray-700">
                      Our AI system automatically detects duplicate products during upload. 
                      You'll be prompted to review and merge similar items.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-lg p-6">
                <div className="flex gap-3">
                  <Zap className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-indigo-900 mb-2">AI Features</h4>
                    <p className="text-sm text-gray-700">
                      Every product gets an AI-generated image and automatic category assignment. 
                      Products are validated for data quality.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-6">Upload Products to Warehouse</h2>
              <div className="space-y-4">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all font-bold text-lg flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload Excel File (Bulk Products)
                </button>
                <button
                  onClick={() => setIsManualOpen(true)}
                  className="w-full bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-all font-bold text-lg flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Single Product Manually
                </button>
              </div>
            </div>

            {/* Upload Tips */}
            <div className="bg-blue-50 rounded-lg shadow-md p-8">
              <h3 className="text-xl font-bold mb-4">📋 Excel File Format Guide</h3>
              <p className="text-gray-700 mb-4">Your Excel file should have these columns:</p>
              <div className="space-y-2 font-mono text-sm">
                <div className="bg-white p-3 rounded border-l-2 border-blue-500">
                  <strong className="text-blue-700">Column A:</strong> Product Name (required)
                </div>
                <div className="bg-white p-3 rounded border-l-2 border-blue-500">
                  <strong className="text-blue-700">Column B:</strong> Description (required)
                </div>
                <div className="bg-white p-3 rounded border-l-2 border-blue-500">
                  <strong className="text-blue-700">Column C:</strong> Price (optional)
                </div>
                <div className="bg-white p-3 rounded border-l-2 border-blue-500">
                  <strong className="text-blue-700">Column D:</strong> SKU/Part Number (optional)
                </div>
                <div className="bg-white p-3 rounded border-l-2 border-blue-500">
                  <strong className="text-blue-700">Column E:</strong> Alternate SKUs (optional, comma-separated)
                </div>
                <div className="bg-white p-3 rounded border-l-2 border-blue-500">
                  <strong className="text-blue-700">Column F:</strong> Category (optional)
                </div>
                <div className="bg-white p-3 rounded border-l-2 border-blue-500">
                  <strong className="text-blue-700">Column G:</strong> Initial Stock Quantity (optional)
                </div>
                <div className="bg-white p-3 rounded border-l-2 border-blue-500">
                  <strong className="text-blue-700">Column H:</strong> Supplier (optional)
                </div>
                <div className="bg-white p-3 rounded border-l-2 border-blue-500">
                  <strong className="text-blue-700">Column I:</strong> Tags (optional)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <UploadHistory key={refreshKey} tenantId={tenantId} />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6">Warehouse Upload Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <p className="text-gray-600 text-sm mb-2">Total Products Uploaded</p>
                <p className="text-4xl font-bold text-blue-600">{uploadStats.totalProducts || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                <p className="text-gray-600 text-sm mb-2">Success Rate</p>
                <p className="text-4xl font-bold text-green-600">{uploadStats.successRate || 0}%</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                <p className="text-gray-600 text-sm mb-2">Duplicates Handled</p>
                <p className="text-4xl font-bold text-purple-600">{uploadStats.duplicatesHandled || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
                <p className="text-gray-600 text-sm mb-2">Images Generated</p>
                <p className="text-4xl font-bold text-orange-600">{uploadStats.imagesGenerated || 0}</p>
              </div>
            </div>
            {uploadStats.lastUpload && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Last upload:</strong> {new Date(uploadStats.lastUpload).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ProductUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        tenantId={tenantId}
        onSuccess={handleUploadSuccess}
        targetCollection="warehouse_inventory"
      />
      <ManualProductModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        tenantId={tenantId}
        onSuccess={handleManualSuccess}
        targetCollection="warehouse_inventory"
      />
    </div>
  )
}
