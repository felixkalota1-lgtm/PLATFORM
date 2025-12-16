import { Users } from 'lucide-react'

export default function CustomerManagementModule() {
  return (
    <div className="p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <Users className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Management</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
          <h2 className="text-xl font-semibold text-purple-900 dark:text-purple-300 mb-2">Customers</h2>
          <p className="text-purple-700 dark:text-purple-400">Manage customer database</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-2">Order History</h2>
          <p className="text-blue-700 dark:text-blue-400">View customer order records</p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
          <h2 className="text-xl font-semibold text-green-900 dark:text-green-300 mb-2">Communications</h2>
          <p className="text-green-700 dark:text-green-400">Track communication history</p>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg border border-amber-200 dark:border-amber-800">
          <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-300 mb-2">Follow-up Alerts</h2>
          <p className="text-amber-700 dark:text-amber-400">Manage customer follow-ups</p>
        </div>
      </div>
    </div>
  )
}
