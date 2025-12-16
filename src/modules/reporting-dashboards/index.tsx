import { BarChart3 } from 'lucide-react'

export default function ReportingDashboardsModule() {
  return (
    <div className="p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <BarChart3 className="w-8 h-8 text-violet-600 dark:text-violet-400 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reporting & Dashboards</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-violet-50 dark:bg-violet-900/20 p-6 rounded-lg border border-violet-200 dark:border-violet-800">
          <h2 className="text-xl font-semibold text-violet-900 dark:text-violet-300 mb-2">Supply Chain Analytics</h2>
          <p className="text-violet-700 dark:text-violet-400">Supply chain metrics and insights</p>
        </div>
        
        <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 p-6 rounded-lg border border-fuchsia-200 dark:border-fuchsia-800">
          <h2 className="text-xl font-semibold text-fuchsia-900 dark:text-fuchsia-300 mb-2">Sales Metrics</h2>
          <p className="text-fuchsia-700 dark:text-fuchsia-400">Sales performance analytics</p>
        </div>
        
        <div className="bg-pink-50 dark:bg-pink-900/20 p-6 rounded-lg border border-pink-200 dark:border-pink-800">
          <h2 className="text-xl font-semibold text-pink-900 dark:text-pink-300 mb-2">Financial Reports</h2>
          <p className="text-pink-700 dark:text-pink-400">Financial performance reports</p>
        </div>
        
        <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-lg border border-rose-200 dark:border-rose-800">
          <h2 className="text-xl font-semibold text-rose-900 dark:text-rose-300 mb-2">KPI Dashboard</h2>
          <p className="text-rose-700 dark:text-rose-400">Key performance indicators</p>
        </div>
      </div>
    </div>
  )
}
