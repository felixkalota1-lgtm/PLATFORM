import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Package, ShoppingCart, Users } from 'lucide-react'

// Sample data for charts
const salesData = [
  { month: 'Jan', sales: 45000, orders: 24 },
  { month: 'Feb', sales: 52000, orders: 28 },
  { month: 'Mar', sales: 48000, orders: 26 },
  { month: 'Apr', sales: 61000, orders: 32 },
  { month: 'May', sales: 55000, orders: 29 },
  { month: 'Jun', sales: 67000, orders: 35 },
]

const categoryData = [
  { name: 'Electronics', value: 35, fill: '#0ea5e9' },
  { name: 'Machinery', value: 25, fill: '#10b981' },
  { name: 'Chemicals', value: 20, fill: '#f59e0b' },
  { name: 'Textiles', value: 20, fill: '#ef4444' },
]

const vendorData = [
  { vendor: 'Vendor A', orders: 45, revenue: 125000 },
  { vendor: 'Vendor B', orders: 38, revenue: 98000 },
  { vendor: 'Vendor C', orders: 52, revenue: 142000 },
  { vendor: 'Vendor D', orders: 31, revenue: 87000 },
  { vendor: 'Vendor E', orders: 28, revenue: 76000 },
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
  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400">Track your business metrics and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value="$328,000"
          change="12.5%"
          changeType="increase"
          icon={<TrendingUp size={32} />}
        />
        <StatCard
          title="Total Orders"
          value="174"
          change="8.2%"
          changeType="increase"
          icon={<ShoppingCart size={32} />}
        />
        <StatCard
          title="Total Products"
          value="842"
          change="5.1%"
          changeType="increase"
          icon={<Package size={32} />}
        />
        <StatCard
          title="Active Vendors"
          value="23"
          change="2.3%"
          changeType="increase"
          icon={<Users size={32} />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Mix</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vendor Performance Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Vendors by Orders</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={vendorData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="vendor" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
            />
            <Legend />
            <Bar dataKey="orders" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-900 dark:text-white font-semibold">Metric</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white font-semibold">Value</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white font-semibold">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <td className="py-3 px-4 text-gray-900 dark:text-gray-300">Average Order Value</td>
                <td className="text-right py-3 px-4 text-gray-900 dark:text-white font-semibold">$1,885</td>
                <td className="text-right py-3 px-4 text-green-600 dark:text-green-400 font-semibold">+3.2%</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <td className="py-3 px-4 text-gray-900 dark:text-gray-300">Order Fulfillment Rate</td>
                <td className="text-right py-3 px-4 text-gray-900 dark:text-white font-semibold">96.8%</td>
                <td className="text-right py-3 px-4 text-green-600 dark:text-green-400 font-semibold">+1.5%</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <td className="py-3 px-4 text-gray-900 dark:text-gray-300">Customer Satisfaction</td>
                <td className="text-right py-3 px-4 text-gray-900 dark:text-white font-semibold">4.7/5.0</td>
                <td className="text-right py-3 px-4 text-green-600 dark:text-green-400 font-semibold">+0.3</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <td className="py-3 px-4 text-gray-900 dark:text-gray-300">Return Rate</td>
                <td className="text-right py-3 px-4 text-gray-900 dark:text-white font-semibold">2.1%</td>
                <td className="text-right py-3 px-4 text-green-600 dark:text-green-400 font-semibold">-0.5%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
