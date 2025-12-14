import { TrendingUp, AlertCircle, Package, ShoppingCart, BarChart3, Globe, Users, Zap, ArrowUpRight, Calendar, Warehouse, Target } from 'lucide-react'
import { useState } from 'react'
import AnalyticsDashboard from '../components/AnalyticsDashboard'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview')
  
  const stats = [
    { label: 'Total Revenue', value: '$2.4M', icon: TrendingUp, change: '+24%', color: 'from-blue-600 to-blue-400' },
    { label: 'Active Products', value: '892', icon: Package, change: '+45%', color: 'from-purple-600 to-purple-400' },
    { label: 'Total Orders', value: '12.5K', icon: ShoppingCart, change: '+38%', color: 'from-green-600 to-green-400' },
    { label: 'Warehouses', value: '8', icon: Warehouse, change: '+2', color: 'from-orange-600 to-orange-400' },
  ]

  const metrics = [
    { label: 'Inventory Turnover', value: '3.8x', target: '4.2x', status: 'on-track' },
    { label: 'Order Fulfillment Rate', value: '98.5%', target: '98%', status: 'exceeds' },
    { label: 'Avg. Delivery Time', value: '2.1 days', target: '2.5 days', status: 'exceeds' },
    { label: 'Customer Satisfaction', value: '4.8/5', target: '4.5/5', status: 'exceeds' },
  ]

  const revenueData = [
    { month: 'Jan', value: 1.2 },
    { month: 'Feb', value: 1.5 },
    { month: 'Mar', value: 1.8 },
    { month: 'Apr', value: 2.0 },
    { month: 'May', value: 2.2 },
    { month: 'Jun', value: 2.4 },
  ]

  const maxRevenue = Math.max(...revenueData.map(d => d.value))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Platform Sales & Procurement
              </h1>
              <p className="text-slate-400 mt-1">Enterprise Business Management System</p>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Calendar className="w-5 h-5" />
              <span className="text-sm">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-900 bg-opacity-50 border-t border-slate-700">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-semibold rounded-t-lg transition-all border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-400 bg-slate-800'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 font-semibold rounded-t-lg transition-all border-b-2 ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-400 bg-slate-800'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="p-6 max-w-7xl mx-auto">
          {/* Premium Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 hover:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/20"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundImage: `linear-gradient(135deg, ${stat.color})` }} />
                  
                  <div className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                        <div className="mt-3">
                          <p className="text-3xl font-bold text-white">{stat.value}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <ArrowUpRight className="w-4 h-4 text-green-400" />
                            <p className="text-xs font-semibold text-green-400">{stat.change}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="p-3 rounded-lg bg-slate-600 bg-opacity-50 group-hover:bg-opacity-100 transition-all">
                          <Icon className="w-6 h-6 text-blue-400 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Revenue Chart & Key Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Trend */}
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded-xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Revenue Trend</h2>
                  <p className="text-slate-400 text-sm mt-1">Last 6 months performance</p>
                </div>
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>

              <div className="space-y-4">
                {revenueData.map((data, idx) => (
                  <div key={data.month} className="flex items-center gap-4">
                    <span className="text-slate-400 w-10 font-semibold">{data.month}</span>
                    <div className="flex-1 bg-slate-600 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${(data.value / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-semibold w-16 text-right">${data.value}M</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-600">
                <p className="text-slate-400 text-sm">📈 Average Monthly Growth: <span className="text-green-400 font-semibold">+20%</span></p>
              </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded-xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">KPI Status</h3>
                <Target className="w-5 h-5 text-green-400" />
              </div>

              <div className="space-y-4">
                {metrics.map((metric) => (
                  <div key={metric.label} className="pb-4 border-b border-slate-600 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-300 text-sm font-medium">{metric.label}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        metric.status === 'exceeds' ? 'bg-green-500 bg-opacity-20 text-green-300' : 'bg-blue-500 bg-opacity-20 text-blue-300'
                      }`}>
                        {metric.status === 'exceeds' ? '✓ Exceeds' : '→ On Track'}
                      </span>
                    </div>
                    <div className="text-white font-bold text-lg">{metric.value}</div>
                    <div className="text-slate-400 text-xs mt-1">Target: {metric.target}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features Highlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded-xl p-6 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-yellow-400" />
                <h3 className="font-bold text-white">Smart Inventory Management</h3>
              </div>
              <p className="text-slate-400 text-sm">Real-time tracking across 8 warehouse locations with predictive analytics for optimal stock levels.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded-xl p-6 hover:border-green-500 transition-all hover:shadow-lg hover:shadow-green-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-green-400" />
                <h3 className="font-bold text-white">Multi-Branch Operations</h3>
              </div>
              <p className="text-slate-400 text-sm">Seamless coordination between branches with real-time syncing, bulk operations, and role-based access control.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded-xl p-6 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-purple-400" />
                <h3 className="font-bold text-white">Advanced Analytics</h3>
              </div>
              <p className="text-slate-400 text-sm">Comprehensive dashboards with deep insights into sales trends, inventory movements, and business metrics.</p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="p-6">
          <AnalyticsDashboard />
        </div>
      )}
    </div>
  )
}
