import { CheckCircle } from 'lucide-react'

export default function QualityControlModule() {
  return (
    <div className="p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quality Control</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-2">QC Inspections</h2>
          <p className="text-blue-700 dark:text-blue-400">Monitor quality inspection status</p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-300 mb-2">Reject Handling</h2>
          <p className="text-red-700 dark:text-red-400">Manage returned items and RMA</p>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg border border-amber-200 dark:border-amber-800">
          <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-300 mb-2">Vendor QC Scores</h2>
          <p className="text-amber-700 dark:text-amber-400">Track vendor quality ratings</p>
        </div>
      </div>
    </div>
  )
}
