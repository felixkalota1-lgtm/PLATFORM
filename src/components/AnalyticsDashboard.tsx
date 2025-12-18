import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Package, ShoppingCart, Users } from 'lucide-react'
import { useState, useEffect } from 'react'
import { db } from '../services/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'

// Sample trend data (for visualization)
const inventoryTrendData = [
  { month: 'Jan', value: 450 },
  { month: 'Feb', value: 520 },
  { month: 'Mar', value: 480 },
  { month: 'Apr', value: 610 },
  { month: 'May', value: 580 },
  { month: 'Jun', value: 700 },
]

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: React.ReactNode
  changeType: 'increase' | 'decrease'
}

function StatCard({ title, value, change, icon, changeType }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          <p className={`text-sm font-medium mt-2 ${
            changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {changeType === 'increase' ? '+' : '-'}{change}
          </p>
        </div>
        <div className="text-blue-600 dark:text-blue-400 opacity-20">
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsDashboard() {
  const { user } = useAuth()
  const [inventoryData, setInventoryData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.tenantId) {
      setLoading(false)
      return
    }

    try {
      // TENANT SCOPED - Load only this tenant's data
      const q = query(
        collection(db, 'tenants', user.tenantId, 'products'),
        where('active', '==', true)
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          stock: doc.data().stock || 0,
          price: doc.data().price || 0,
          category: doc.data().category || 'Uncategorized',
        }))

        setInventoryData(data)
        setLoading(false)
      })

      return () => unsubscribe()
    } catch (error) {
      console.error('Error loading analytics:', error)
      setLoading(false)
      setInventoryData([])
    }
  }, [user?.tenantId])

  // Calculate metrics from real inventory data
  const totalStockValue = inventoryData.reduce((sum, item) => sum + (item.stock * item.price), 0)
  const totalStock = inventoryData.reduce((sum, item) => sum + item.stock, 0)
  const totalValue = inventoryData.reduce((sum, item) => sum + item.price, 0)
  const skuCount = inventoryData.length

  // Group by category for pie chart
  const categoryColors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']
  const categoryGrouped = inventoryData.reduce((acc: any[], item) => {
    const existing = acc.find((c: any) => c.name === item.category)
    if (existing) {
      existing.value += item.stock
    } else {
      acc.push({ 
        name: item.category, 
        value: item.stock, 
        fill: categoryColors[acc.length % categoryColors.length]
      })
    }
    return acc
  }, [])

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Loading inventory analytics...</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Inventory Analytics</h2>
        <p className="text-gray-600 dark:text-gray-400">Track your inventory performance and metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Stock Value"
          value={`$${totalStockValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          change={`${skuCount} SKUs`}
          icon={<TrendingUp size={32} />}
          changeType="increase"
        />
        <StatCard
          title="Total Units"
          value={totalStock.toLocaleString()}
          change="In stock"
          icon={<Package size={32} />}
          changeType="increase"
        />
        <StatCard
          title="Active Products"
          value={skuCount.toString()}
          change="SKUs"
          icon={<ShoppingCart size={32} />}
          changeType="increase"
        />
        <StatCard
          title="Avg Item Value"
          value={`$${(totalValue / skuCount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          change="Per SKU"
          icon={<Users size={32} />}
          changeType="increase"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inventory Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={inventoryTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                name="Total Units"
                dot={{ fill: '#0ea5e9', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stock by Category</h3>
          {categoryGrouped.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryGrouped}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryGrouped.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Stock Levels Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top 10 Products by Stock</h3>
        {inventoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inventoryData.slice(0, 10).sort((a, b) => b.stock - a.stock)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="stock" fill="#0ea5e9" name="Units in Stock" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No inventory data available
          </div>
        )}
      </div>

      {/* Summary Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inventory Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-900 dark:text-white font-semibold">Metric</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white font-semibold">Value</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <td className="py-3 px-4 text-gray-900 dark:text-gray-300">Total Inventory Value</td>
                <td className="text-right py-3 px-4 text-gray-900 dark:text-white font-semibold">${totalStockValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">{totalStock} units</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <td className="py-3 px-4 text-gray-900 dark:text-gray-300">Number of SKUs</td>
                <td className="text-right py-3 px-4 text-gray-900 dark:text-white font-semibold">{skuCount}</td>
                <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">Active products</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <td className="py-3 px-4 text-gray-900 dark:text-gray-300">Average Unit Price</td>
                <td className="text-right py-3 px-4 text-gray-900 dark:text-white font-semibold">${(totalValue / skuCount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">Per SKU</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <td className="py-3 px-4 text-gray-900 dark:text-gray-300">Average Stock Level</td>
                <td className="text-right py-3 px-4 text-gray-900 dark:text-white font-semibold">{(totalStock / skuCount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">Units per SKU</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
