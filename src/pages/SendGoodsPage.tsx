import { useState, useEffect } from 'react'
import { Send, AlertCircle } from 'lucide-react'
import type { Warehouse, InventoryItem } from '../types/warehouse'
import {
  getAllWarehouses,
  getWarehouseInventory,
  sendGoodsToWarehouse,
} from '../services/multiWarehouseService'

export default function SendGoodsPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const userObj = JSON.parse(localStorage.getItem('pspm_user') || '{}')
  const [userRole] = useState(userObj.role || 'staff')
  const [userId] = useState(userObj.id || '')

  const [formData, setFormData] = useState({
    sourceWarehouse: '',
    destinationWarehouse: '',
    sku: '',
    quantity: 0,
    notes: '',
  })

  useEffect(() => {
    if (userRole === 'director' || userRole === 'admin' || userRole === 'ceo') {
      loadWarehouses()
    }
  }, [userRole])

  const loadWarehouses = async () => {
    try {
      setLoading(true)
      const data = await getAllWarehouses(userRole)
      setWarehouses(data)
    } catch (error) {
      console.error('Error loading warehouses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSourceWarehouseChange = async (warehouseId: string) => {
    setFormData(prev => ({ ...prev, sourceWarehouse: warehouseId, sku: '' }))

    if (warehouseId) {
      try {
        const items = await getWarehouseInventory(warehouseId, userId, userRole)
        setInventory(items)
      } catch (error) {
        console.error('Error loading inventory:', error)
      }
    } else {
      setInventory([])
    }
  }

  const handleSendGoods = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.sourceWarehouse || !formData.destinationWarehouse || !formData.sku || formData.quantity <= 0) {
      alert('❌ Please fill in all required fields')
      return
    }

    if (formData.sourceWarehouse === formData.destinationWarehouse) {
      alert('❌ Source and destination warehouses must be different')
      return
    }

    try {
      setLoading(true)
      const movementId = await sendGoodsToWarehouse(
        formData.sourceWarehouse,
        formData.destinationWarehouse,
        formData.sku,
        formData.quantity,
        userId,
        userRole,
        formData.notes
      )

      if (movementId) {
        alert('✅ Goods sent successfully!')
        setFormData({
          sourceWarehouse: '',
          destinationWarehouse: '',
          sku: '',
          quantity: 0,
          notes: '',
        })
        setInventory([])
      }
    } catch (error) {
      alert('❌ Error sending goods: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const selectedItem = inventory.find(item => item.sku === formData.sku)
  const availableQuantity = selectedItem?.availableQuantity || selectedItem?.quantity || 0

  if (userRole !== 'director' && userRole !== 'admin' && userRole !== 'ceo') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">❌ You do not have permission to send goods.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Send Goods Between Locations</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Transfer inventory from one warehouse to another</p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <form onSubmit={handleSendGoods} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Warehouse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Send From (Source Warehouse) *
              </label>
              <select
                value={formData.sourceWarehouse}
                onChange={e => handleSourceWarehouseChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select source warehouse...</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.location.city}, {warehouse.location.state})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Warehouse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Send To (Destination Warehouse) *
              </label>
              <select
                value={formData.destinationWarehouse}
                onChange={e => setFormData({ ...formData, destinationWarehouse: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select destination warehouse...</option>
                {warehouses
                  .filter(w => w.id !== formData.sourceWarehouse)
                  .map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.location.city}, {warehouse.location.state})
                    </option>
                  ))}
              </select>
            </div>

            {/* SKU Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product (SKU) *
              </label>
              <select
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value, quantity: 0 })}
                disabled={!formData.sourceWarehouse || inventory.length === 0}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                required
              >
                <option value="">
                  {!formData.sourceWarehouse
                    ? 'Select source warehouse first'
                    : inventory.length === 0
                      ? 'No items available'
                      : 'Select product...'}
                </option>
                {inventory.map(item => (
                  <option key={item.id} value={item.sku}>
                    {item.productName} ({item.sku}) - Available: {item.availableQuantity || item.quantity}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity to Send *
              </label>
              <div>
                <input
                  type="number"
                  min="1"
                  max={availableQuantity}
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  disabled={!formData.sku}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="Enter quantity"
                  required
                />
                {selectedItem && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Available: {availableQuantity} units
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes about this shipment..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Info Box */}
          {formData.sourceWarehouse && formData.destinationWarehouse && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
              <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold">Shipment will be created and marked as "pending"</p>
                <p>The destination warehouse staff will receive a notification and can confirm receipt.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setFormData({
                sourceWarehouse: '',
                destinationWarehouse: '',
                sku: '',
                quantity: 0,
                notes: '',
              })}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send size={20} />
              {loading ? 'Sending...' : 'Send Goods'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
