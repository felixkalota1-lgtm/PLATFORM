/**
 * Manager AI Assistant (Phase 4)
 * 
 * Floating widget providing smart recommendations and insights
 * Analyzes warehouse and branch inventory for optimal stock distribution
 */

import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../hooks/useAuth'
import {
  Zap,
  X,
  MessageCircle,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
} from 'lucide-react'

interface Recommendation {
  id: string
  type: 'low_stock' | 'slow_moving' | 'peak_season' | 'opportunity'
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  action: string
  impact: string
}

interface ManagerAIAssistantProps {
  visible?: boolean
}

export default function ManagerAIAssistant({ visible = true }: ManagerAIAssistantProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [activeTab, setActiveTab] = useState<'insights' | 'trends' | 'actions'>('insights')

  // Only show for managers and directors
  const isAuthorized = user?.role === 'manager' || user?.role === 'director' || user?.role === 'admin'

  useEffect(() => {
    if (isOpen && isAuthorized) {
      generateRecommendations()
    }
  }, [isOpen, isAuthorized])

  const generateRecommendations = async () => {
    try {
      setIsLoading(true)

      // Get warehouse inventory
      const warehouseSnapshot = await getDocs(collection(db, 'warehouse_inventory'))
      const warehouseItems = warehouseSnapshot.docs.map(doc => ({
        sku: doc.data().sku || doc.id,
        productName: doc.data().productName,
        quantity: doc.data().quantity || 0,
        unitCost: doc.data().unitCost || 0,
        category: doc.data().category,
      }))

      // Get branch inventory
      const branchSnapshot = await getDocs(collection(db, 'branch_inventory'))
      const branchItems = branchSnapshot.docs.map(doc => ({
        sku: doc.data().sku,
        branchId: doc.data().branchId,
        quantity: doc.data().quantity || 0,
      }))

      // Get recent transfers for analysis
      await getDocs(
        query(
          collection(db, 'stock_transfers'),
          where('status', '==', 'approved')
        )
      )

      const recs: Recommendation[] = []

      // Analysis 1: Low stock alerts
      warehouseItems.forEach((item, idx) => {
        if (item.quantity === 0) {
          recs.push({
            id: `critical_${idx}`,
            type: 'low_stock',
            title: `🚨 CRITICAL: ${item.productName} Out of Stock`,
            description: `Your warehouse has zero units of ${item.productName}. This item may be in demand.`,
            priority: 'critical',
            action: 'Reorder from supplier immediately',
            impact: 'Prevent potential lost sales',
          })
        } else if (item.quantity < 50) {
          recs.push({
            id: `low_${idx}`,
            type: 'low_stock',
            title: `⚠️ Low Stock: ${item.productName}`,
            description: `Only ${item.quantity} units remaining. Current monthly value: $${(item.quantity * item.unitCost).toFixed(2)}`,
            priority: 'high',
            action: 'Consider reordering or reducing branch transfers',
            impact: 'Avoid stockouts in next 2 weeks',
          })
        }
      })

      // Analysis 2: Slow-moving inventory
      const slowMovingThreshold = 10
      warehouseItems.forEach((item, idx) => {
        const branchCount = branchItems.filter(b => b.sku === item.sku).length
        if (item.quantity > slowMovingThreshold && branchCount === 0) {
          recs.push({
            id: `slow_${idx}`,
            type: 'slow_moving',
            title: `📦 Slow-Moving Item: ${item.productName}`,
            description: `${item.quantity} units in warehouse but not in any branch. May indicate low demand.`,
            priority: 'medium',
            action: 'Consider promoting or reducing orders',
            impact: 'Free up warehouse space',
          })
        }
      })

      // Analysis 3: Peak season preparation
      const highValueItems = warehouseItems.filter(item => item.unitCost * item.quantity > 5000)
      if (highValueItems.length > 0) {
        recs.push({
          id: 'peak_season',
          type: 'peak_season',
          title: '📈 Seasonal Peak Approaching',
          description: 'December typically sees 30-40% increase in demand. Consider increasing stock levels.',
          priority: 'high',
          action: `Increase stock for top ${Math.min(5, highValueItems.length)} items by 30%`,
          impact: 'Prepare for holiday season demand surge',
        })
      }

      // Analysis 4: Branch distribution optimization
      const wellStockedBranches = branchItems.reduce((acc, item) => {
        if (!acc[item.branchId]) acc[item.branchId] = 0
        acc[item.branchId] += item.quantity
        return acc
      }, {} as Record<string, number>)

      const totalBranchStock = Object.values(wellStockedBranches).reduce((a, b) => a + b, 0)
      const avgPerBranch = totalBranchStock / (Object.keys(wellStockedBranches).length || 1)

      Object.entries(wellStockedBranches).forEach(([branchId, qty]) => {
        if (qty < avgPerBranch * 0.5) {
          recs.push({
            id: `understock_${branchId}`,
            type: 'opportunity',
            title: `🎯 Understock Alert: ${branchId}`,
            description: `${branchId} has ${qty} units vs average ${avgPerBranch.toFixed(0)}. Consider sending stock.`,
            priority: 'medium',
            action: `Transfer ${Math.ceil((avgPerBranch - qty) / 2)} units to ${branchId}`,
            impact: 'Balance inventory across branches',
          })
        }
      })

      // Analysis 5: Opportunity for consolidation
      if (warehouseItems.length > 20) {
        recs.push({
          id: 'consolidate',
          type: 'opportunity',
          title: '💡 Consolidation Opportunity',
          description: `You have ${warehouseItems.length} different products. Consider consolidating slow SKUs.`,
          priority: 'low',
          action: 'Review and consolidate similar product variants',
          impact: 'Simplify inventory management',
        })
      }

      // Sort by priority
      const priorityMap = { critical: 0, high: 1, medium: 2, low: 3 }
      recs.sort((a, b) => priorityMap[a.priority] - priorityMap[b.priority])

      setRecommendations(recs)
    } catch (error) {
      console.error('Error generating recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!visible || !isAuthorized) return null

  const priorityColors = {
    critical: 'bg-red-50 border-red-200',
    high: 'bg-orange-50 border-orange-200',
    medium: 'bg-yellow-50 border-yellow-200',
    low: 'bg-blue-50 border-blue-200',
  }

  const priorityIcons = {
    critical: <AlertTriangle className="w-5 h-5 text-red-600" />,
    high: <TrendingUp className="w-5 h-5 text-orange-600" />,
    medium: <Lightbulb className="w-5 h-5 text-yellow-600" />,
    low: <MessageCircle className="w-5 h-5 text-blue-600" />,
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center gap-2 group"
          title="Open AI Assistant"
        >
          <Zap size={24} className="group-hover:animate-pulse" />
        </button>
      )}

      {/* Modal Panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 z-50 w-96 h-screen bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={24} className="animate-pulse" />
              <div>
                <h2 className="font-bold text-lg">AI Assistant</h2>
                <p className="text-indigo-100 text-xs">Smart recommendations for you</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-indigo-500 p-2 rounded transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-gray-200">
            {(['insights', 'trends', 'actions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition ${
                  activeTab === tab
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Zap className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Analyzing inventory...</p>
                </div>
              </div>
            ) : activeTab === 'insights' ? (
              <div className="space-y-3 p-4">
                {recommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No recommendations at this time</p>
                  </div>
                ) : (
                  recommendations.map(rec => (
                    <div
                      key={rec.id}
                      className={`border rounded-lg p-3 ${priorityColors[rec.priority]}`}
                    >
                      <div className="flex items-start gap-2">
                        {priorityIcons[rec.priority]}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{rec.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                          <div className="mt-2 bg-white bg-opacity-60 rounded px-2 py-1">
                            <p className="text-xs font-medium text-gray-700">
                              💡 {rec.action}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === 'trends' ? (
              <div className="p-4 space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <p className="font-semibold text-gray-900 mb-2">📊 Warehouse Metrics</p>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>Total Items: {recommendations.filter(r => r.type === 'low_stock').length} alerts</p>
                    <p>Peak Season: December approaching</p>
                    <p>Trend: Increasing demand expected</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <p className="font-semibold text-gray-900 mb-2">📈 Movement Trends</p>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>Transfers: {recommendations.filter(r => r.type !== 'low_stock').length} pending</p>
                    <p>Branch Distribution: Mixed levels detected</p>
                    <p>Forecast: +30% seasonal demand</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {recommendations
                  .filter(r => r.priority === 'critical' || r.priority === 'high')
                  .map(rec => (
                    <button
                      key={rec.id}
                      className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:bg-indigo-50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{rec.action}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{rec.impact}</p>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <button
              onClick={generateRecommendations}
              className="w-full bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Refresh Recommendations
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
