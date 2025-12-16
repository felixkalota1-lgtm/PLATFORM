import { Package } from 'lucide-react'

export default function InventoryAdjustmentsModule() {
  return (
    <div className="p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <Package className="w-8 h-8 text-orange-600 dark:text-orange-400 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Adjustments</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
          <h2 className="text-xl font-semibold text-orange-900 dark:text-orange-300 mb-2">Physical Count</h2>
          <p className="text-orange-700 dark:text-orange-400">Record physical inventory counts</p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-300 mb-2">Damage/Shrinkage</h2>
          <p className="text-red-700 dark:text-red-400">Track inventory loss</p>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h2 className="text-xl font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Variance Analysis</h2>
          <p className="text-yellow-700 dark:text-yellow-400">Analyze inventory variance</p>
        </div>
      </div>
    </div>
  )
}
