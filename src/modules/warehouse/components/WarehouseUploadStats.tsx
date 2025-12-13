/**
 * Warehouse Upload Statistics Component
 * 
 * Displays key metrics about warehouse uploads
 */

import { TrendingUp, Package, Zap, AlertCircle } from 'lucide-react'

interface WarehouseUploadStatsProps {
  stats: {
    totalProducts: number
    lastUpload: Date | null
    successRate: number
    duplicatesHandled: number
    imagesGenerated: number
  }
}

export default function WarehouseUploadStats({ stats }: WarehouseUploadStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Products */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-blue-100 text-sm font-semibold">Total Products</p>
            <p className="text-4xl font-bold">{stats.totalProducts}</p>
          </div>
          <Package className="w-8 h-8 opacity-50" />
        </div>
        <div className="bg-blue-400 bg-opacity-30 px-3 py-1 rounded-full inline-block">
          <p className="text-xs text-blue-50">In warehouse inventory</p>
        </div>
      </div>

      {/* Success Rate */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-green-100 text-sm font-semibold">Success Rate</p>
            <p className="text-4xl font-bold">{stats.successRate}%</p>
          </div>
          <TrendingUp className="w-8 h-8 opacity-50" />
        </div>
        <div className="bg-green-400 bg-opacity-30 px-3 py-1 rounded-full inline-block">
          <p className="text-xs text-green-50">Upload accuracy</p>
        </div>
      </div>

      {/* Duplicates Handled */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-purple-100 text-sm font-semibold">Duplicates Handled</p>
            <p className="text-4xl font-bold">{stats.duplicatesHandled}</p>
          </div>
          <AlertCircle className="w-8 h-8 opacity-50" />
        </div>
        <div className="bg-purple-400 bg-opacity-30 px-3 py-1 rounded-full inline-block">
          <p className="text-xs text-purple-50">AI-detected duplicates</p>
        </div>
      </div>

      {/* Images Generated */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-orange-100 text-sm font-semibold">Images Generated</p>
            <p className="text-4xl font-bold">{stats.imagesGenerated}</p>
          </div>
          <Zap className="w-8 h-8 opacity-50" />
        </div>
        <div className="bg-orange-400 bg-opacity-30 px-3 py-1 rounded-full inline-block">
          <p className="text-xs text-orange-50">Via Hugging Face</p>
        </div>
      </div>
    </div>
  )
}
