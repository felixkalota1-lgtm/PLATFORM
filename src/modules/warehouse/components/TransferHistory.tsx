/**
 * Transfer History Component
 * 
 * Displays all stock transfers with status and details
 */

import { useState, useEffect } from 'react'
import { db } from '../../../services/firebase'
import { collection, query, orderBy, limit, getDocs, Timestamp, updateDoc, doc } from 'firebase/firestore'
import { Loader, CheckCircle2, Clock, Truck, AlertCircle } from 'lucide-react'

interface StockTransfer {
  id: string
  fromWarehouse: string
  toLocation: string
  toLocationName: string
  items: Array<{
    sku: string
    productName: string
    quantity: number
    unitPrice?: number
  }>
  status: 'pending' | 'approved' | 'shipped' | 'delivered'
  totalValue: number
  createdAt: Timestamp
  approvedAt?: Timestamp
  deliveredAt?: Timestamp
  notes?: string
  requestedBy?: string
  approvedBy?: string
}

interface TransferHistoryProps {
  tenantId: string
  refreshKey: number
  onApproved?: (transferId: string) => void
}

export default function TransferHistory({ tenantId, refreshKey, onApproved }: TransferHistoryProps) {
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [approving, setApproving] = useState<string | null>(null)

  useEffect(() => {
    fetchTransfers()
  }, [tenantId, refreshKey])

  const fetchTransfers = async () => {
    try {
      setLoading(true)
      const q = query(
        collection(db, 'stock_transfers'),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const snapshot = await getDocs(q)
      const transfers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockTransfer[]
      setTransfers(transfers)
    } catch (error) {
      console.error('Error fetching transfers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveTransfer = async (transferId: string) => {
    try {
      setApproving(transferId)
      const transferRef = doc(db, 'stock_transfers', transferId)
      await updateDoc(transferRef, {
        status: 'approved',
        approvedAt: new Date(),
      })
      setTransfers(prev =>
        prev.map(t =>
          t.id === transferId
            ? { ...t, status: 'approved', approvedAt: new Timestamp(Date.now() / 1000, 0) }
            : t
        )
      )
      onApproved?.(transferId)
    } catch (error) {
      console.error('Error approving transfer:', error)
    } finally {
      setApproving(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />
      case 'shipped':
        return <Truck className="w-5 h-5 text-indigo-600" />
      case 'delivered':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading transfers...</span>
      </div>
    )
  }

  if (transfers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No transfers yet</h3>
        <p className="text-gray-500">Create your first stock transfer to get started</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Transfer History</h2>
        <p className="text-gray-600 text-sm mt-1">All warehouse transfers ({transfers.length})</p>
      </div>

      <div className="divide-y divide-gray-200">
        {transfers.map(transfer => (
          <div key={transfer.id} className="hover:bg-gray-50 transition-colors">
            <button
              onClick={() => setExpandedId(expandedId === transfer.id ? null : transfer.id)}
              className="w-full text-left p-6 flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(transfer.status)}
                  <span className="font-semibold text-gray-900">{transfer.toLocationName}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadge(transfer.status)}`}>
                    {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {transfer.items.length} items • {transfer.createdAt instanceof Timestamp
                    ? transfer.createdAt.toDate().toLocaleString()
                    : 'N/A'}
                </p>
              </div>
              <div className="text-right min-w-fit">
                <p className="font-bold text-lg text-gray-900">${transfer.totalValue.toFixed(2)}</p>
                <p className="text-xs text-gray-600">total value</p>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedId === transfer.id && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 space-y-4">
                {/* Transfer Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase mb-1">From</p>
                    <p className="text-sm font-semibold text-gray-900">{transfer.fromWarehouse}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase mb-1">To</p>
                    <p className="text-sm font-semibold text-gray-900">{transfer.toLocationName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Items</p>
                    <p className="text-sm font-semibold text-gray-900">{transfer.items.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Total Qty</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {transfer.items.reduce((sum, i) => sum + i.quantity, 0)}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Items Transferred</h4>
                  <table className="w-full text-sm">
                    <thead className="bg-white">
                      <tr className="border-b border-gray-300">
                        <th className="text-left px-3 py-2 font-semibold text-gray-900">Product</th>
                        <th className="text-center px-3 py-2 font-semibold text-gray-900">Qty</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-900">Price</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-900">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transfer.items.map(item => (
                        <tr key={item.sku} className="hover:bg-white">
                          <td className="px-3 py-2 text-gray-900">{item.productName}</td>
                          <td className="px-3 py-2 text-center font-semibold text-gray-900">{item.quantity}</td>
                          <td className="px-3 py-2 text-right text-gray-600">${(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-gray-900">
                            ${(item.quantity * (item.unitPrice || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Notes and Dates */}
                {transfer.notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-900"><strong>Notes:</strong> {transfer.notes}</p>
                  </div>
                )}

                {/* Timeline */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      <strong>Created:</strong> {transfer.createdAt instanceof Timestamp
                        ? transfer.createdAt.toDate().toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                  {transfer.approvedAt && (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">
                        <strong>Approved:</strong> {transfer.approvedAt instanceof Timestamp
                          ? transfer.approvedAt.toDate().toLocaleString()
                          : 'N/A'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {transfer.status === 'pending' && (
                  <button
                    onClick={() => handleApproveTransfer(transfer.id)}
                    disabled={approving === transfer.id}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    {approving === transfer.id ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Approve Transfer
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
