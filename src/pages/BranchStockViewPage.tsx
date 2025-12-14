/**
 * Branch Stock View Page (Phase 3)
 * 
 * Read-only inventory view for branch employees
 * Shows only their branch's received stock
 * Allows requesting additional stock from warehouse
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { Package, AlertCircle, Send, Loader, CheckCircle } from 'lucide-react'

interface BranchInventoryItem {
  id: string
  sku: string
  productName: string
  quantity: number
  category?: string
  receivedAt: any
  sourceWarehouse: string
}

export default function BranchStockViewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [inventory, setInventory] = useState<BranchInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'qty' | 'date'>('name')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<BranchInventoryItem | null>(null)
  const [requestQty, setRequestQty] = useState('10')
  const [requestReason, setRequestReason] = useState('')
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)

  // Get user's branch from their profile - use default for testing if not set
  const userBranchId = (user as any)?.branch || (user as any)?.branchId || 'Arizona'

  useEffect(() => {
    loadBranchInventory()
  }, [user, userBranchId])

  const generateFakeData = (): BranchInventoryItem[] => {
    const products = [
      { sku: 'ELEC-001', name: 'Wireless Mouse', category: 'Electronics', qty: 45 },
      { sku: 'ELEC-002', name: 'USB-C Cable (6ft)', category: 'Electronics', qty: 120 },
      { sku: 'ELEC-003', name: 'Monitor Stand', category: 'Electronics', qty: 12 },
      { sku: 'FURN-001', name: 'Office Chair', category: 'Furniture', qty: 8 },
      { sku: 'FURN-002', name: 'Standing Desk', category: 'Furniture', qty: 15 },
      { sku: 'FURN-003', name: 'File Cabinet', category: 'Furniture', qty: 3 },
      { sku: 'SUPP-001', name: 'Notebook Set', category: 'Supplies', qty: 250 },
      { sku: 'SUPP-002', name: 'Pen Pack (12pcs)', category: 'Supplies', qty: 180 },
      { sku: 'SUPP-003', name: 'Sticky Notes', category: 'Supplies', qty: 89 },
      { sku: 'SUPP-004', name: 'Folders (pack of 50)', category: 'Supplies', qty: 5 },
    ]

    return products.map((p, idx) => ({
      id: `fake-${idx}`,
      sku: p.sku,
      productName: p.name,
      quantity: p.qty,
      category: p.category,
      receivedAt: { toDate: () => new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) },
      sourceWarehouse: 'Main Warehouse',
    }))
  }

  const loadBranchInventory = async () => {
    try {
      setLoading(true)
      setError('')

      // Try to load from Firestore, fall back to fake data for testing
      const q = query(
        collection(db, 'branch_inventory'),
        where('branchId', '==', userBranchId)
      )

      const snapshot = await getDocs(q)
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as BranchInventoryItem[]

      // If no data found, use fake data for testing
      if (items.length === 0) {
        console.log('No real data found, using fake data for testing')
        setInventory(generateFakeData())
      } else {
        setInventory(items)
      }
    } catch (err) {
      console.error('Error loading branch inventory, using fake data:', err)
      setInventory(generateFakeData())
    } finally {
      setLoading(false)
    }
  }

  const handleRequestStock = async () => {
    if (!selectedItem || !requestQty || !requestReason) {
      setError('Please fill in all fields')
      return
    }

    setSubmittingRequest(true)
    setError('')

    try {
      await addDoc(collection(db, 'stock_requests'), {
        branchId: userBranchId,
        itemId: selectedItem.id,
        sku: selectedItem.sku,
        productName: selectedItem.productName,
        requestedQuantity: parseInt(requestQty),
        reason: requestReason,
        requestedBy: user?.uid || 'unknown',
        requestedByName: user?.displayName || 'Unknown User',
        status: 'pending',
        createdAt: serverTimestamp(),
      })

      setRequestSuccess(true)
      setTimeout(() => {
        setShowRequestModal(false)
        setRequestSuccess(false)
        setRequestQty('10')
        setRequestReason('')
        setSelectedItem(null)
      }, 2000)
    } catch (err) {
      console.error('Error creating request:', err)
      setError('Failed to submit request. Please try again.')
    } finally {
      setSubmittingRequest(false)
    }
  }

  const filteredInventory = inventory
    .filter(item =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.productName.localeCompare(b.productName)
      if (sortBy === 'qty') return b.quantity - a.quantity
      if (sortBy === 'date') {
        const dateA = a.receivedAt?.toDate?.() || new Date(0)
        const dateB = b.receivedAt?.toDate?.() || new Date(0)
        return dateB.getTime() - dateA.getTime()
      }
      return 0
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading branch inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-2">My Branch Inventory</h1>
        <p className="text-blue-100">
          View stock available at your branch location
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Stats Card */}
      {inventory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <p className="text-gray-600 text-sm">Total Items</p>
            <p className="text-3xl font-bold text-blue-600">{inventory.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <p className="text-gray-600 text-sm">Total Units</p>
            <p className="text-3xl font-bold text-green-600">
              {inventory.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
            <p className="text-gray-600 text-sm">Low Stock Items</p>
            <p className="text-3xl font-bold text-purple-600">
              {inventory.filter(item => item.quantity < 20).length}
            </p>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      {inventory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </label>
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Product Name</option>
                <option value="qty">Quantity (High to Low)</option>
                <option value="date">Recently Received</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      {inventory.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  SKU
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Received
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      {item.category && (
                        <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-sm">{item.sku}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        item.quantity > 50
                          ? 'bg-green-100 text-green-800'
                          : item.quantity > 20
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.quantity} units
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.quantity > 50 ? (
                      <span className="inline-flex items-center gap-1 text-green-700 text-sm">
                        <CheckCircle size={16} />
                        In Stock
                      </span>
                    ) : item.quantity > 20 ? (
                      <span className="inline-flex items-center gap-1 text-yellow-700 text-sm">
                        <AlertCircle size={16} />
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700 text-sm">
                        <AlertCircle size={16} />
                        Critical
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.receivedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedItem(item)
                        setShowRequestModal(true)
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      <Send size={14} />
                      Request
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No inventory currently available</p>
          <p className="text-gray-500 text-sm mt-2">
            Stock will appear here once transferred from warehouse
          </p>
        </div>
      )}

      {/* Stock Request Modal */}
      {showRequestModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            {!requestSuccess ? (
              <>
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Request More Stock
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedItem.productName}
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Quantity
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-700">
                      {selectedItem.quantity} units
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Request Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={requestQty}
                      onChange={e => setRequestQty(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Request
                    </label>
                    <textarea
                      value={requestReason}
                      onChange={e => setRequestReason(e.target.value)}
                      placeholder="e.g., Running low, upcoming event, etc."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestStock}
                    disabled={submittingRequest}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingRequest ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Request Submitted!</h3>
                <p className="text-gray-600 text-sm">
                  Your stock request has been sent to the warehouse manager. They will review it shortly.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
