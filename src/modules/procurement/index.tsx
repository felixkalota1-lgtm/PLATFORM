import { useState } from 'react'
import { Plus, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useProcurementStore } from './store'

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState<
    'requests' | 'rfqs' | 'purchase-orders'
  >('requests')
  const { requests } = useProcurementStore()

  const stats = [
    {
      label: 'Total Requests',
      value: requests.length,
      icon: FileText,
      color: 'blue',
    },
    {
      label: 'Pending Approval',
      value: requests.filter((r) => r.status === 'submitted').length,
      icon: Clock,
      color: 'yellow',
    },
    {
      label: 'Approved',
      value: requests.filter((r) => r.status === 'approved').length,
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Urgent',
      value: requests.filter((r) => r.priority === 'urgent').length,
      icon: AlertCircle,
      color: 'red',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Procurement Management
            </h1>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
              <Plus className="w-5 h-5" />
              New Request
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              const colorClasses = {
                blue: 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 text-blue-600 dark:text-blue-400',
                yellow:
                  'bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 text-yellow-600 dark:text-yellow-400',
                green:
                  'bg-green-50 dark:bg-green-900 dark:bg-opacity-20 text-green-600 dark:text-green-400',
                red: 'bg-red-50 dark:bg-red-900 dark:bg-opacity-20 text-red-600 dark:text-red-400',
              }

              return (
                <div key={stat.label} className={`p-4 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <Icon className="w-8 h-8 opacity-50" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-1 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'requests'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Requests
            </button>
            <button
              onClick={() => setActiveTab('rfqs')}
              className={`px-1 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'rfqs'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              RFQs
            </button>
            <button
              onClick={() => setActiveTab('purchase-orders')}
              className={`px-1 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'purchase-orders'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Purchase Orders
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'requests' && (
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Procurement Requests
                </h2>
                {requests.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">
                    No procurement requests yet. Click "New Request" to create one.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {request.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {request.requestNumber} • {request.requester.name} •
                              {request.lineItems.length} items
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              ${request.estimatedCost.toFixed(2)}
                            </p>
                            <span
                              className={`inline-block px-3 py-1 rounded text-xs font-semibold mt-2 ${
                                request.status === 'approved'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                  : request.status === 'rejected'
                                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                              }`}
                            >
                              {request.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rfqs' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Requests for Quotation
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              RFQ management interface coming soon.
            </p>
          </div>
        )}

        {activeTab === 'purchase-orders' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Purchase Orders
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Purchase order management interface coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
