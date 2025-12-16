import { Wrench } from 'lucide-react'

export default function AssetManagementModule() {
  return (
    <div className="p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <Wrench className="w-8 h-8 text-gray-600 dark:text-gray-400 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Asset Management</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300 mb-2">Fixed Assets</h2>
          <p className="text-gray-700 dark:text-gray-400">Manage fixed asset inventory</p>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-300 mb-2">Depreciation</h2>
          <p className="text-slate-700 dark:text-slate-400">Calculate asset depreciation</p>
        </div>
        
        <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-300 mb-2">Maintenance Schedule</h2>
          <p className="text-zinc-700 dark:text-zinc-400">Track asset maintenance</p>
        </div>
      </div>
    </div>
  )
}
