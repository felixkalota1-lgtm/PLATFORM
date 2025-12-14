/**
 * Transfer Form Component
 * 
 * Form for creating stock transfers from warehouse to branches
 */

import { useState, useEffect } from 'react'
import { Plus, X, Loader, CheckCircle2, AlertCircle } from 'lucide-react'
import { db } from '../../../services/firebase'
import { collection, addDoc, serverTimestamp, getDocs, query, where, writeBatch, doc } from 'firebase/firestore'

interface TransferItem {
  id?: string
  sku: string
  productName: string
  quantity: number
  maxQuantity: number
  unitPrice?: number
}

interface Branch {
  id: string
  name: string
  location: string
}

interface TransferFormProps {
  tenantId: string
  onSuccess: (transfer: any) => void
  onApproved?: (transferId: string) => void
  userId: string
}

export default function TransferForm({ tenantId, onSuccess, userId }: TransferFormProps) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [warehouseItems, setWarehouseItems] = useState<TransferItem[]>([])
  const [selectedItems, setSelectedItems] = useState<TransferItem[]>([])
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [step, setStep] = useState<'select' | 'review' | 'confirm'>('select')

  // Load branches and warehouse items
  useEffect(() => {
    loadBranches()
    loadWarehouseItems()
  }, [tenantId])

  const loadBranches = async () => {
    try {
      const q = query(collection(db, 'warehouses'), where('type', '==', 'branch'))
      const snapshot = await getDocs(q)
      const branchList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Unknown Branch',
        location: doc.data().location || '',
      }))
      setBranches(branchList)
    } catch (error) {
      console.error('Error loading branches:', error)
    }
  }

  const loadWarehouseItems = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'tenants', tenantId, 'products'))
      const items = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          sku: data.sku || doc.id,
          productName: data.productName || 'Unknown Product',
          quantity: data.quantity || 0,
          maxQuantity: data.quantity || 0,
          unitPrice: data.unitCost || 0,
        }
      })
      setWarehouseItems(items.filter(item => item.quantity > 0))
    } catch (error) {
      console.error('Error loading warehouse items:', error)
    }
  }

  const handleAddItem = (item: TransferItem) => {
    if (selectedItems.find(i => i.sku === item.sku)) {
      setErrorMessage('Item already selected')
      return
    }
    setSelectedItems([...selectedItems, { ...item, quantity: 0 }])
    setErrorMessage('')
  }

  const handleRemoveItem = (sku: string) => {
    setSelectedItems(selectedItems.filter(i => i.sku !== sku))
  }

  const handleQuantityChange = (sku: string, quantity: number) => {
    const max = warehouseItems.find(i => i.sku === sku)?.quantity || 0
    if (quantity > max) {
      setErrorMessage(`Insufficient stock. Max available: ${max}`)
      return
    }
    setSelectedItems(
      selectedItems.map(i =>
        i.sku === sku ? { ...i, quantity } : i
      )
    )
    setErrorMessage('')
  }

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0)
  }

  const handleSubmitTransfer = async () => {
    if (!selectedBranch) {
      setErrorMessage('Please select a destination branch')
      return
    }

    if (selectedItems.length === 0 || selectedItems.some(i => i.quantity === 0)) {
      setErrorMessage('Please select items with quantities greater than 0')
      return
    }

    setIsLoading(true)
    try {
      const selectedBranchName = branches.find(b => b.id === selectedBranch)?.name || 'Unknown'
      
      // Create transfer record
      const transferRef = await addDoc(collection(db, 'stock_transfers'), {
        fromWarehouse: 'warehouse_main_nebraska',
        toLocation: selectedBranch,
        toLocationName: selectedBranchName,
        items: selectedItems.map(({ sku, productName, quantity }) => ({
          sku,
          productName,
          quantity,
          unitPrice: warehouseItems.find(i => i.sku === sku)?.unitPrice,
        })),
        status: 'pending',
        totalValue: calculateTotal(),
        createdAt: serverTimestamp(),
        requestedBy: userId,
        notes,
        tenantId,
      })

      // Update warehouse inventory
      const batch = writeBatch(db)
      selectedItems.forEach(item => {
        const itemId = item.id || item.sku
        const warehouseDocRef = doc(db, 'tenants', tenantId, 'products', itemId)
        batch.update(warehouseDocRef, {
          quantity: item.maxQuantity - item.quantity,
          lastUpdated: serverTimestamp(),
        })
      })
      await batch.commit()

      setSuccessMessage(`✅ Transfer created successfully! ID: ${transferRef.id}`)
      setStep('confirm')

      onSuccess({
        id: transferRef.id,
        fromWarehouse: 'warehouse_main_nebraska',
        toLocation: selectedBranch,
        toLocationName: selectedBranchName,
        items: selectedItems,
        status: 'pending',
        totalValue: calculateTotal(),
        notes,
      })

      // Reset form
      setTimeout(() => {
        setSelectedBranch('')
        setSelectedItems([])
        setNotes('')
        setStep('select')
        setSuccessMessage('')
        loadWarehouseItems()
      }, 3000)
    } catch (error) {
      console.error('Error creating transfer:', error)
      setErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step === 'select' ? 'bg-indigo-600 text-white' : 'bg-green-600 text-white'}`}>
          1
        </div>
        <div className="flex-1 h-1 bg-gray-200"></div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step === 'review' ? 'bg-indigo-600 text-white' : step === 'confirm' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
          2
        </div>
        <div className="flex-1 h-1 bg-gray-200"></div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step === 'confirm' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
          3
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-900 font-semibold">{successMessage}</p>
            <p className="text-sm text-green-700">Stock will be reserved for the branch</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-900 font-semibold">Error</p>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Step 1: Select Items */}
      {(step === 'select' || step === 'review') && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Step 1: Select Destination & Items</h2>

          {/* Branch Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Destination Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={selectedItems.length > 0}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">-- Select a branch --</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} {branch.location && `(${branch.location})`}
                </option>
              ))}
            </select>
          </div>

          {/* Items Selection */}
          {selectedBranch && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Add Items</label>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {warehouseItems.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No items available in warehouse
                  </div>
                ) : (
                  <div className="space-y-0">
                    {warehouseItems.map(item => (
                      <button
                        key={item.sku}
                        onClick={() => handleAddItem(item)}
                        disabled={selectedItems.some(i => i.sku === item.sku)}
                        className="w-full text-left p-4 border-b border-gray-100 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-600">SKU: {item.sku} | Available: {item.quantity} units</p>
                        </div>
                        <Plus className="w-5 h-5 text-indigo-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Selected Items</h3>
              <div className="space-y-3">
                {selectedItems.map(item => (
                  <div key={item.sku} className="bg-indigo-50 p-4 rounded-lg flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={item.maxQuantity}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.sku, parseInt(e.target.value) || 0)}
                      placeholder="Qty"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center"
                    />
                    <button
                      onClick={() => handleRemoveItem(item.sku)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transfer Notes */}
          {selectedItems.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Transfer Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special instructions or notes..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
              />
            </div>
          )}

          {/* Action Button */}
          {selectedItems.length > 0 && (
            <button
              onClick={() => setStep('review')}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-all font-semibold flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : '→'}
              Review Transfer
            </button>
          )}
        </div>
      )}

      {/* Step 2: Review & Confirm */}
      {step === 'review' && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Step 2: Review Transfer</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Destination</p>
              <p className="text-xl font-bold text-gray-900">
                {branches.find(b => b.id === selectedBranch)?.name}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Value</p>
              <p className="text-xl font-bold text-green-600">${calculateTotal().toFixed(2)}</p>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Qty</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedItems.map(item => (
                  <tr key={item.sku} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">${(item.unitPrice || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      ${(item.quantity * (item.unitPrice || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {notes && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-900"><strong>Notes:</strong> {notes}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('select')}
              className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all font-semibold"
            >
              Back
            </button>
            <button
              onClick={handleSubmitTransfer}
              disabled={isLoading}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all font-semibold flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Confirm Transfer
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Transfer Submitted!</h2>
          <p className="text-gray-600 text-lg">
            Your stock transfer has been submitted for approval. The branch manager will review and confirm receipt.
          </p>
          <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-left space-y-2">
            <p className="text-sm text-gray-600"><strong>To:</strong> {branches.find(b => b.id === selectedBranch)?.name}</p>
            <p className="text-sm text-gray-600"><strong>Items:</strong> {selectedItems.length} products</p>
            <p className="text-sm text-gray-600"><strong>Total Value:</strong> ${calculateTotal().toFixed(2)}</p>
          </div>
          <button
            onClick={() => {
              setStep('select')
              setSelectedBranch('')
              setSelectedItems([])
              setNotes('')
              setSuccessMessage('')
            }}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-all font-semibold"
          >
            Create Another Transfer
          </button>
        </div>
      )}
    </div>
  )
}
