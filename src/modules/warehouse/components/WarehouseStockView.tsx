/**
 * Warehouse Stock View Component
 * 
 * Shows current warehouse inventory levels
 */

import { useState, useEffect } from 'react'
import { db } from '../../../services/firebase'
import { collection, getDocs } from 'firebase/firestore'

interface WarehouseItem {
  sku: string
  productName: string
  quantity: number
  category?: string
  status: 'in_stock' | 'low_stock' | 'critical'
}

export default function WarehouseStockView({ tenantId, refreshKey }: { tenantId: string; refreshKey: number }) {
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'qty' | 'status'>('qty')

  useEffect(() => {
    loadWarehouseStock()
  }, [tenantId, refreshKey])

  const loadWarehouseStock = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'warehouse_inventory'))
      const itemList = snapshot.docs
        .map(doc => {
          const data = doc.data()
          const quantity = data.quantity || 0
          let status: 'in_stock' | 'low_stock' | 'critical'
          if (quantity === 0) status = 'critical'
          else if (quantity < 50) status = 'low_stock'
          else status = 'in_stock'

          return {
            sku: data.sku || doc.id,
            productName: data.productName || 'Unknown',
            quantity,
            category: data.category,
            status,
          }
        })
        .filter(item => item.quantity > 0)

      const sorted = itemList.sort((a, b) => {
        if (sortBy === 'name') return a.productName.localeCompare(b.productName)
        if (sortBy === 'qty') return b.quantity - a.quantity
        if (sortBy === 'status') {
          const statusOrder = { critical: 0, low_stock: 1, in_stock: 2 }
          return statusOrder[a.status] - statusOrder[b.status]
        }
        return 0
      })

      setItems(sorted)
    } catch (error) {
      console.error('Error loading warehouse stock:', error)
    }
  }

  const lowStockCount = items.filter(i => i.status !== 'in_stock').length

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h3 className="text-xl font-bold text-gray-900">Warehouse Stock Levels</h3>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Total Items</p>
          <p className="text-2xl font-bold text-blue-600">{items.length}</p>
        </div>
        <div className={`p-3 rounded-lg ${lowStockCount > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className="text-xs text-gray-600">Low Stock Alert</p>
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {lowStockCount}
          </p>
        </div>
      </div>

      {/* Sort */}
      <div className="flex gap-2 mb-4">
        {(['name', 'qty', 'status'] as const).map(option => (
          <button
            key={option}
            onClick={() => setSortBy(option)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              sortBy === option
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option === 'name' ? 'Name' : option === 'qty' ? 'Qty' : 'Status'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {items.slice(0, 10).map(item => (
          <div
            key={item.sku}
            className={`p-3 rounded-lg flex items-center justify-between text-sm ${
              item.status === 'critical'
                ? 'bg-red-50 border border-red-200'
                : item.status === 'low_stock'
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-green-50 border border-green-200'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{item.productName}</p>
              <p className="text-xs text-gray-600">{item.sku}</p>
            </div>
            <div className="ml-2 text-right">
              <p className="font-bold text-gray-900">{item.quantity}</p>
              <p className="text-xs text-gray-600">units</p>
            </div>
          </div>
        ))}
      </div>

      {items.length > 10 && (
        <p className="text-xs text-gray-500 text-center">
          +{items.length - 10} more items
        </p>
      )}
    </div>
  )
}
