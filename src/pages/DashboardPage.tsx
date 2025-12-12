import { TrendingUp, AlertCircle, Package, ShoppingCart } from 'lucide-react'

export default function DashboardPage() {
  const stats = [
    { label: 'Total Orders', value: '1,234', icon: ShoppingCart, change: '+12%' },
    { label: 'Total Revenue', value: '$45,231', icon: TrendingUp, change: '+8%' },
    { label: 'Active Products', value: '892', icon: Package, change: '+5%' },
    { label: 'Pending Actions', value: '23', icon: AlertCircle, change: '0%' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-xs text-green-600 mt-2">{stat.change}</p>
                </div>
                <Icon className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Platform Sales & Procurement</h2>
        <p className="text-gray-600 mb-6">
          This is your central hub for managing all business operations including marketplace, inventory, 
          procurement, warehouse management, HR, accounting, and more.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Set up your inventory</li>
              <li>✓ Configure warehouse locations</li>
              <li>✓ Add team members</li>
              <li>✓ Set up accounting</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-2">Quick Links</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>→ Browse marketplace</li>
              <li>→ View your inventory</li>
              <li>→ Check pending orders</li>
              <li>→ View analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
