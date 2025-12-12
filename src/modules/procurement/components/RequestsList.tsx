import { CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react'
import { useProcurementStore } from '../store'
import { ProcurementRequest } from '../types'

interface RequestsListProps {
  requests: ProcurementRequest[]
}

export default function RequestsList({ requests }: RequestsListProps) {
  const { removeRequest, updateRequestStatus } = useProcurementStore()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'pending':
      case 'submitted':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
      case 'normal':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
      default:
        return ''
    }
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No requests yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(request.status)}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {request.supplier}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                  {request.priority}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Items</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {request.items?.length ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${(request.total ?? 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(request.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {request.status}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-4 text-sm">
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Line Items:</p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                  {request.items && request.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-gray-600 dark:text-gray-400 py-1">
                      <span>{item.description}</span>
                      <span>
                        {item.quantity} × ${item.unitPrice.toFixed(2)} = $
                        {(item.quantity * item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              {request.status === 'submitted' && (
                <>
                  <button
                    onClick={() => updateRequestStatus(request.id, 'approved')}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateRequestStatus(request.id, 'rejected')}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => removeRequest(request.id)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
