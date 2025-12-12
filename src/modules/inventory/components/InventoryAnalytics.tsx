import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useState, useEffect } from 'react'
import { db } from '../../../services/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../../../hooks/useAuth'

export default function InventoryAnalytics() {
  const { user } = useAuth()
  const [stockData, setStockData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.tenantId) {
      setLoading(false)
      return
    }

    try {
      const q = query(
        collection(db, 'tenants', user.tenantId, 'products'),
        where('source', '==', 'inventory'), // Only inventory products
        where('active', '==', true)
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          name: doc.data().name,
          stock: doc.data().stock || 0,
          sold: Math.floor((doc.data().stock || 0) * 0.5), // Mock: assume 50% sold
          price: doc.data().price || 0,
        }))

        setStockData(data)
        setLoading(false)
      })

      return () => unsubscribe()
    } catch (error) {
      console.error('Error loading analytics:', error)
      setLoading(false)
      setStockData([])
    }
  }, [user?.tenantId])

  const inventoryTrend = [
    { month: 'Jan', value: 450 },
    { month: 'Feb', value: 520 },
    { month: 'Mar', value: 480 },
    { month: 'Apr', value: 610 },
    { month: 'May', value: 580 },
    { month: 'Jun', value: 700 },
  ]

  // Calculate metrics from actual data
  const totalStockValue = stockData.reduce((sum, item) => sum + (item.stock * item.price), 0)
  const totalStock = stockData.reduce((sum, item) => sum + item.stock, 0)
  const skuCount = stockData.length
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Stock Value</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">$24,580</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">↑ 12% from last month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Inventory Turnover</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">4.8x</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Per year</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">SKU Count</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">145</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Active products</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Avg Lead Time</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">14</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Days</p>
        </div>
      </div>

      {/* Stock vs Sales */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Current Stock vs Sales Volume</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="stock" fill="#3b82f6" name="Current Stock" />
            <Bar dataKey="sold" fill="#8b5cf6" name="Sold This Month" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Inventory Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Inventory Value Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={inventoryTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ABC Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">A Items (High Value)</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">35 SKUs · $18,500 value</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-red-600 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Requires careful monitoring</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">B Items (Medium Value)</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">52 SKUs · $4,200 value</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Standard management</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">C Items (Low Value)</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">58 SKUs · $1,880 value</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Basic monitoring</p>
          </div>
        </div>
      </div>
    </div>
  )
}
