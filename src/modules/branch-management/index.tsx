import { MapPin } from 'lucide-react'

export default function BranchManagementModule() {
  return (
    <div className="p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <MapPin className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Branch Management</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <h2 className="text-xl font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Branch Coordination</h2>
          <p className="text-indigo-700 dark:text-indigo-400">Coordinate branch operations</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-2">Inter-branch Transfer</h2>
          <p className="text-blue-700 dark:text-blue-400">Manage branch transfers</p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
          <h2 className="text-xl font-semibold text-purple-900 dark:text-purple-300 mb-2">Branch Reporting</h2>
          <p className="text-purple-700 dark:text-purple-400">Generate branch reports</p>
        </div>
      </div>
    </div>
  )
}
