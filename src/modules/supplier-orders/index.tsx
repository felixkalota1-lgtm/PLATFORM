import { ShoppingCart } from 'lucide-react'

export default function SupplierOrdersModule() {
  return (
    <div className="p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <ShoppingCart className="w-8 h-8 text-teal-600 dark:text-teal-400 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Supplier Orders</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-lg border border-teal-200 dark:border-teal-800">
          <h2 className="text-xl font-semibold text-teal-900 dark:text-teal-300 mb-2">Purchase Orders</h2>
          <p className="text-teal-700 dark:text-teal-400">Manage supplier purchase orders</p>
        </div>
        
        <div className="bg-cyan-50 dark:bg-cyan-900/20 p-6 rounded-lg border border-cyan-200 dark:border-cyan-800">
          <h2 className="text-xl font-semibold text-cyan-900 dark:text-cyan-300 mb-2">Vendor Performance</h2>
          <p className="text-cyan-700 dark:text-cyan-400">Track vendor performance metrics</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-2">Reorder Suggestions</h2>
          <p className="text-blue-700 dark:text-blue-400">Get smart reorder recommendations</p>
        </div>
        
        <div className="bg-sky-50 dark:bg-sky-900/20 p-6 rounded-lg border border-sky-200 dark:border-sky-800">
          <h2 className="text-xl font-semibold text-sky-900 dark:text-sky-300 mb-2">Receipt Matching</h2>
          <p className="text-sky-700 dark:text-sky-400">Match receipts to purchase orders</p>
        </div>
      </div>
    </div>
  )
}
