/**
 * AI Recommendations Component
 * 
 * Provides smart recommendations for stock distribution
 */

import { useState, useEffect } from 'react'
import { Zap, TrendingUp, AlertTriangle, Lightbulb, BarChart3 } from 'lucide-react'
import { db } from '../../../services/firebase'
import { collection, getDocs } from 'firebase/firestore'

interface Recommendation {
  id: string
  type: 'low_stock' | 'reorder' | 'demand' | 'optimize' | 'opportunity'
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  action: string
  impact?: string
}

export default function AIRecommendations({ tenantId }: { tenantId: string }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all')

  useEffect(() => {
    generateRecommendations()
  }, [tenantId])

  const generateRecommendations = async () => {
    try {
      // Get warehouse inventory
      const warehouseSnapshot = await getDocs(collection(db, 'warehouse_inventory'))
      const warehouseItems = warehouseSnapshot.docs.map(doc => ({
        sku: doc.data().sku || doc.id,
        productName: doc.data().productName,
        quantity: doc.data().quantity,
        unitPrice: doc.data().unitCost,
      }))

      // Get branch inventories (for future use)
      await getDocs(collection(db, 'branch_inventory'))

      const recs: Recommendation[] = []

      // Analyze warehouse stock levels
      warehouseItems.forEach((item, idx) => {
        if (item.quantity === 0) {
          recs.push({
            id: `low_${idx}`,
            type: 'low_stock',
            title: `⚠️ CRITICAL: ${item.productName} Out of Stock`,
            description: `${item.productName} (${item.sku}) has reached zero units. Customers cannot be served.`,
            priority: 'critical',
            action: `Contact supplier immediately to reorder ${item.productName}`,
            impact: 'Revenue at risk',
          })
        } else if (item.quantity < 25) {
          recs.push({
            id: `low_${idx}`,
            type: 'low_stock',
            title: `⚠️ Low Stock Warning: ${item.productName}`,
            description: `${item.productName} has only ${item.quantity} units. Critical stock level approaching.`,
            priority: 'high',
            action: `Plan reorder or redistribute from other locations`,
          })
        }
      })

      // Find high-value items in low quantity
      warehouseItems
        .filter(item => item.quantity < 100 && (item.unitPrice || 0) > 100)
        .slice(0, 3)
        .forEach((item, idx) => {
          recs.push({
            id: `value_${idx}`,
            type: 'reorder',
            title: `💎 High-Value Product: ${item.productName}`,
            description: `${item.productName} is high-value ($${item.unitPrice}) with low stock (${item.quantity} units).`,
            priority: 'high',
            action: `Consider prioritizing reorder of this premium item`,
            impact: `Potential revenue impact: $${((item.unitPrice || 0) * (100 - item.quantity)).toFixed(0)}`,
          })
        })

      // Optimization opportunities
      const totalWarehouseQty = warehouseItems.reduce((sum, i) => sum + i.quantity, 0)
      if (totalWarehouseQty > 1000) {
        recs.push({
          id: 'optimize_1',
          type: 'optimize',
          title: '🎯 Optimize Distribution to Branches',
          description: `Warehouse has ${totalWarehouseQty} units total. Consider distributing to branches with low stock.`,
          priority: 'medium',
          action: 'Use Stock Transfer Manager to allocate goods strategically',
          impact: 'Improve branch fulfillment rates',
        })
      }

      // Demand-based recommendations
      recs.push({
        id: 'demand_1',
        type: 'demand',
        title: '📈 Seasonal Demand Planning',
        description: 'Q4 typically sees 40% increase in office supplies demand.',
        priority: 'medium',
        action: 'Increase warehouse stock by 30-40% for peak season',
        impact: 'Prevent stockouts during high-demand periods',
      })

      // Opportunity to consolidate slow movers
      if (warehouseItems.length > 5) {
        recs.push({
          id: 'opportunity_1',
          type: 'opportunity',
          title: '💡 Consolidation Opportunity',
          description: 'Some low-demand items are spread across branches.',
          priority: 'low',
          action: 'Consolidate slow-moving items to main warehouse',
          impact: 'Reduce storage costs across branches',
        })
      }

      setRecommendations(recs)
    } catch (error) {
      console.error('Error generating recommendations:', error)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'high':
        return <TrendingUp className="w-5 h-5 text-orange-600" />
      case 'medium':
        return <Lightbulb className="w-5 h-5 text-yellow-600" />
      default:
        return <BarChart3 className="w-5 h-5 text-blue-600" />
    }
  }

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-red-200'
      case 'high':
        return 'bg-orange-50 border-orange-200'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }
  const filteredRecs = filter === 'all'
    ? recommendations
    : recommendations.filter(r => r.priority === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">AI-Powered Recommendations</h2>
        </div>
        <p className="text-gray-600">Smart insights to optimize warehouse and branch operations</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'critical', 'high', 'medium'].map(priority => (
          <button
            key={priority}
            onClick={() => setFilter(priority as any)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === priority
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-400'
            }`}
          >
            {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
          </button>
        ))}
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        {filteredRecs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No recommendations</h3>
            <p className="text-gray-600">Your warehouse is operating optimally!</p>
          </div>
        ) : (
          filteredRecs.map(rec => (
            <div
              key={rec.id}
              className={`rounded-lg shadow-md p-6 border-l-4 ${getPriorityBg(rec.priority)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getPriorityIcon(rec.priority)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{rec.title}</h3>
                  <p className="text-gray-700 mb-3">{rec.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-900 min-w-fit">Action:</span>
                      <span className="text-gray-700">{rec.action}</span>
                    </div>
                    {rec.impact && (
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-gray-900 min-w-fit">Impact:</span>
                        <span className="text-gray-700">{rec.impact}</span>
                      </div>
                    )}
                  </div>

                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-sm">
                    Implement Recommendation
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Summary */}
      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t-2 border-gray-200">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-gray-600 text-sm mb-1">Total Recommendations</p>
            <p className="text-3xl font-bold text-gray-900">{recommendations.length}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow-md p-4 text-center border border-red-200">
            <p className="text-red-900 text-sm mb-1">Critical</p>
            <p className="text-3xl font-bold text-red-600">
              {recommendations.filter(r => r.priority === 'critical').length}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg shadow-md p-4 text-center border border-orange-200">
            <p className="text-orange-900 text-sm mb-1">High Priority</p>
            <p className="text-3xl font-bold text-orange-600">
              {recommendations.filter(r => r.priority === 'high').length}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-md p-4 text-center border border-yellow-200">
            <p className="text-yellow-900 text-sm mb-1">Medium Priority</p>
            <p className="text-3xl font-bold text-yellow-600">
              {recommendations.filter(r => r.priority === 'medium').length}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
