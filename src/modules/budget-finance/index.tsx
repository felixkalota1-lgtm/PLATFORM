import { DollarSign } from 'lucide-react'

export default function BudgetFinanceModule() {
  return (
    <div className="p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Budget & Finance</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
          <h2 className="text-xl font-semibold text-green-900 dark:text-green-300 mb-2">Budget Tracking</h2>
          <p className="text-green-700 dark:text-green-400">Monitor budget allocations</p>
        </div>
        
        <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-lg border border-teal-200 dark:border-teal-800">
          <h2 className="text-xl font-semibold text-teal-900 dark:text-teal-300 mb-2">Department Budgets</h2>
          <p className="text-teal-700 dark:text-teal-400">Track department spending</p>
        </div>
        
        <div className="bg-cyan-50 dark:bg-cyan-900/20 p-6 rounded-lg border border-cyan-200 dark:border-cyan-800">
          <h2 className="text-xl font-semibold text-cyan-900 dark:text-cyan-300 mb-2">Spending Alerts</h2>
          <p className="text-cyan-700 dark:text-cyan-400">Budget threshold alerts</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-2">Budget Approval</h2>
          <p className="text-blue-700 dark:text-blue-400">Approve budget requests</p>
        </div>
      </div>
    </div>
  )
}
