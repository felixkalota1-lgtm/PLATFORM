/**
 * Stock Transfer Manager (Phase 2)
 * 
 * Allows managers/directors to transfer stock from warehouse to branches
 * Features:
 * - Real-time warehouse inventory view
 * - Branch selection and current stock levels
 * - Drag-drop or form-based allocation
 * - AI recommendations for optimal distribution
 * - Transfer confirmation workflow
 * - Transfer history and tracking
 */

import { useState, useEffect } from 'react'
import { Send, AlertCircle, TrendingUp, History, Zap } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import TransferForm from './components/TransferForm'
import TransferHistory from './components/TransferHistory'
import AIRecommendations from './components/AIRecommendations'
import BranchStockDisplay from './components/BranchStockDisplay'
import WarehouseStockView from './components/WarehouseStockView'

type Tab = 'transfer' | 'history' | 'branches' | 'recommendations'

interface StockTransfer {
  id?: string
  fromWarehouse: string
  toLocation: string
  toLocationName: string
  items: Array<{
    sku: string
    productName: string
    quantity: number
    unitPrice?: number
  }>
  status: 'pending' | 'approved' | 'shipped' | 'delivered'
  totalValue: number
  createdAt?: any
  approvedAt?: any
  deliveredAt?: any
  notes?: string
  requestedBy?: string
  approvedBy?: string
}

export default function StockTransferManager() {
  const { user } = useAuth()
  const tenantId = user?.tenantId || 'default'
  const [activeTab, setActiveTab] = useState<Tab>('transfer')
  const [refreshKey, setRefreshKey] = useState(0)
  const [stats, setStats] = useState({
    totalTransfers: 0,
    pendingCount: 0,
    totalValueTransferred: 0,
    averageTransferValue: 0,
  })

  // Load transfers on mount
  useEffect(() => {
    // This will load from Firestore in the TransferHistory component
    // For now, we'll calculate stats from whatever is loaded
  }, [tenantId, refreshKey])

  const handleTransferSuccess = (transfer: StockTransfer) => {
    setRefreshKey(prev => prev + 1)
    
    // Update stats
    setStats(prev => ({
      ...prev,
      totalTransfers: prev.totalTransfers + 1,
      pendingCount: prev.pendingCount + 1,
      totalValueTransferred: prev.totalValueTransferred + transfer.totalValue,
    }))
  }

  const handleTransferApproved = () => {
    setRefreshKey(prev => prev + 1)
  }

  // Check if user is authorized
  const isAuthorized = user?.role === 'director' || user?.role === 'manager' || user?.role === 'admin'

  if (!isAuthorized) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Only administrators, managers and directors can access the Stock Transfer Manager.
          </p>
          <p className="text-sm text-gray-500">
            Your role: <span className="font-semibold">{user?.role || 'Unknown'}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Send className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Stock Transfer Manager</h1>
          </div>
          <p className="text-indigo-100 text-lg">Distribute warehouse stock to branch locations</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            <p className="text-gray-600 text-sm mb-2">Total Transfers</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalTransfers}</p>
            <p className="text-xs text-gray-500 mt-2">All-time</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm mb-2">Pending Approval</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingCount}</p>
            <p className="text-xs text-gray-500 mt-2">Awaiting approval</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm mb-2">Value Transferred</p>
            <p className="text-3xl font-bold text-green-600">${(stats.totalValueTransferred / 1000).toFixed(1)}k</p>
            <p className="text-xs text-gray-500 mt-2">Total value</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm mb-2">Avg Transfer</p>
            <p className="text-3xl font-bold text-blue-600">${(stats.averageTransferValue / 1000).toFixed(1)}k</p>
            <p className="text-xs text-gray-500 mt-2">Per transfer</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { id: 'transfer', label: '📤 Create Transfer', icon: Send },
            { id: 'branches', label: '🏢 Branch Stock Levels', icon: TrendingUp },
            { id: 'recommendations', label: '🤖 AI Recommendations', icon: Zap },
            { id: 'history', label: '📜 Transfer History', icon: History },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Transfer Tab */}
          {activeTab === 'transfer' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Transfer Form */}
              <div className="lg:col-span-2">
                <TransferForm
                  tenantId={tenantId}
                  onSuccess={handleTransferSuccess}
                  onApproved={handleTransferApproved}
                  userId={user?.uid || ''}
                />
              </div>

              {/* Right: Warehouse Overview */}
              <div>
                <WarehouseStockView tenantId={tenantId} refreshKey={refreshKey} />
              </div>
            </div>
          )}

          {/* Branches Tab */}
          {activeTab === 'branches' && (
            <BranchStockDisplay tenantId={tenantId} refreshKey={refreshKey} />
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <AIRecommendations tenantId={tenantId} />
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <TransferHistory
              tenantId={tenantId}
              refreshKey={refreshKey}
              onApproved={handleTransferApproved}
            />
          )}
        </div>
      </div>
    </div>
  )
}
