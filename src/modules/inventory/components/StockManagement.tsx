import { AlertCircle } from 'lucide-react'

export default function StockManagement() {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="text-yellow-600 dark:text-yellow-400 mt-1" size={24} />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Stock Management Coming Soon</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Real-time stock tracking, warehouse allocation, and inventory optimization features will be available here.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Low Stock Items</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Wireless Mouse (MOUSE-001)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Current: 5 units</p>
              </div>
              <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">CRITICAL</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Warehouse Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Main Warehouse</span>
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Regional Hub</span>
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Stock Movement History</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Desk Lamp Stock Updated</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">50 units received from supplier</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
          </div>
        </div>
      </div>
    </div>
  )
}
