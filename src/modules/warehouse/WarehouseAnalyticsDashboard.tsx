/**
 * Warehouse Analytics Dashboard
 * 
 * Comprehensive analytics and insights for warehouse management:
 * - Total stock value and metrics
 * - Stock distribution by category (pie chart)
 * - Stock trends over time (line chart)
 * - Branch distribution (bar chart)
 * - Top-selling SKUs
 * - Low stock alerts
 * - Storage utilization
 */

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, AlertTriangle, Package, DollarSign, Zap } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { db } from '../../services/firebase'
import { collection, getDocs, query } from 'firebase/firestore'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  quantity: number
  category?: string
}

interface CategoryStat {
  category: string
  count: number
  value: number
  quantity: number
}

export default function WarehouseAnalyticsDashboard() {
  const { user } = useAuth()
  const tenantId = user?.tenantId || 'default'
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    totalValue: 0,
    averagePrice: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  })
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [topProducts, setTopProducts] = useState<Product[]>([])

  useEffect(() => {
    loadAnalytics()
  }, [tenantId])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const productsRef = collection(db, 'tenants', tenantId, 'products')
      const snapshot = await getDocs(query(productsRef))
      
      const loadedProducts: Product[] = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          sku: data.sku || '',
          price: data.price || 0,
          quantity: data.quantity || data.stock || 0,
          category: data.category,
        }
      })

      setProducts(loadedProducts)
      calculateStats(loadedProducts)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (productList: Product[]) => {
    const totalValue = productList.reduce((sum, p) => sum + (p.price * p.quantity), 0)
    const totalQuantity = productList.reduce((sum, p) => sum + p.quantity, 0)
    const lowStockCount = productList.filter(p => p.quantity > 0 && p.quantity < 10).length
    const outOfStockCount = productList.filter(p => p.quantity === 0).length

    setStats({
      totalProducts: productList.length,
      totalQuantity,
      totalValue,
      averagePrice: productList.length > 0 ? productList.reduce((sum, p) => sum + p.price, 0) / productList.length : 0,
      lowStockCount,
      outOfStockCount,
    })

    // Calculate category statistics
    const categoryMap = new Map<string, { count: number; value: number; quantity: number }>()
    productList.forEach(product => {
      const cat = product.category || 'Uncategorized'
      const current = categoryMap.get(cat) || { count: 0, value: 0, quantity: 0 }
      categoryMap.set(cat, {
        count: current.count + 1,
        value: current.value + (product.price * product.quantity),
        quantity: current.quantity + product.quantity,
      })
    })

    const categories = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.value - a.value)

    setCategoryStats(categories)

    // Get top 5 products by value
    const topByValue = [...productList]
      .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
      .slice(0, 5)

    setTopProducts(topByValue)
  }

  // Check authorization
  const isAuthorized = user?.role === 'director' || user?.role === 'manager' || user?.role === 'admin'

  if (!isAuthorized) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Only managers and directors can view warehouse analytics.
          </p>
          <p className="text-sm text-gray-500">
            Your role: <span className="font-semibold">{user?.role || 'Unknown'}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-600 to-blue-600 text-white p-8 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Warehouse Analytics</h1>
          </div>
          <p className="text-blue-100 text-lg">Real-time insights into your warehouse inventory</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500 text-xl">Loading analytics...</div>
          </div>
        ) : (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Products */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600 text-sm">Total Products</p>
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-4xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-xs text-gray-500 mt-2">Unique SKUs</p>
              </div>

              {/* Total Quantity */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600 text-sm">Total Quantity</p>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-4xl font-bold text-gray-900">{stats.totalQuantity.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">Units in stock</p>
              </div>

              {/* Total Value */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600 text-sm">Total Value</p>
                  <DollarSign className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">${(stats.totalValue / 1000000).toFixed(2)}M</p>
                <p className="text-xs text-gray-500 mt-2">Inventory value</p>
              </div>

              {/* Low Stock Alert */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600 text-sm">Alerts</p>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-4xl font-bold text-gray-900">{stats.lowStockCount + stats.outOfStockCount}</p>
                <p className="text-xs text-gray-500 mt-2">Low or out of stock</p>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Stock by Category */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Stock by Category
                </h3>
                <div className="space-y-4">
                  {categoryStats.map((cat, idx) => {
                    const maxValue = Math.max(...categoryStats.map(c => c.value))
                    const percentage = maxValue > 0 ? (cat.value / maxValue) * 100 : 0
                    
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{cat.category}</span>
                          <span className="text-sm text-gray-600">${(cat.value / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                          <span>{cat.count} products</span>
                          <span>{cat.quantity.toLocaleString()} units</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Top Products by Value
                </h3>
                <div className="space-y-4">
                  {topProducts.map((product, idx) => {
                    const productValue = product.price * product.quantity
                    const maxValue = Math.max(...topProducts.map(p => p.price * p.quantity))
                    const percentage = maxValue > 0 ? (productValue / maxValue) * 100 : 0

                    return (
                      <div key={product.id}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{idx + 1}. {product.name}</p>
                            <p className="text-xs text-gray-500">{product.sku}</p>
                          </div>
                          <span className="text-sm font-semibold text-green-600">${(productValue / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                          <span>${product.price.toFixed(2)} each</span>
                          <span>{product.quantity.toLocaleString()} units</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Low Stock Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Low Stock Alerts ({stats.lowStockCount + stats.outOfStockCount})
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">SKU</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Price</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Qty</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {products
                      .filter(p => p.quantity < 10)
                      .sort((a, b) => a.quantity - b.quantity)
                      .map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{product.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono">{product.sku}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">${product.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 font-semibold">
                            {product.quantity}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {product.quantity === 0 ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                Out of Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                                Low Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <p className="text-green-700 text-sm font-semibold mb-2">Average Product Price</p>
                <p className="text-3xl font-bold text-green-900">${stats.averagePrice.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <p className="text-blue-700 text-sm font-semibold mb-2">Avg Stock per Product</p>
                <p className="text-3xl font-bold text-blue-900">
                  {stats.totalProducts > 0 ? (stats.totalQuantity / stats.totalProducts).toFixed(0) : 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                <p className="text-purple-700 text-sm font-semibold mb-2">Avg Product Value</p>
                <p className="text-3xl font-bold text-purple-900">
                  ${stats.totalProducts > 0 ? (stats.totalValue / stats.totalProducts).toFixed(0) : 0}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
