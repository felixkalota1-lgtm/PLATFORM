import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, MapPin, Users, Package, AlertCircle } from 'lucide-react'
import type { Warehouse } from '../types/warehouse'
import {
  getAllWarehouses,
  createInventory,
  getInventoryByWarehouse,
  updateInventory,
  deleteInventory,
} from '../services/multiWarehouseService'
import { useAuth } from '../hooks/useAuth'

export default function InventoryManagementPage() {
  const { user } = useAuth()
  const [inventories, setInventories] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [userRole] = useState(user?.role || 'staff')
  const [userId] = useState(user?.uid || '')
  const [warehouseId, setWarehouseId] = useState<string>('')
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  const [formData, setFormData] = useState({
    name: '',
    type: 'branch' as 'warehouse' | 'branch',
    city: '',
    state: '',
    address: '',
    zipCode: '',
    capacity: 0,
  })

  useEffect(() => {
    if (userRole === 'director' || userRole === 'admin' || userRole === 'warehouse_manager') {
      loadWarehouses()
      loadInventories()
    }
  }, [userRole])

  const loadWarehouses = async () => {
    try {
      const data = await getAllWarehouses(userRole)
      const mainWarehouses = data.filter(w => w.type === 'warehouse')
      setWarehouses(mainWarehouses)
      if (mainWarehouses.length > 0) {
        setWarehouseId(mainWarehouses[0].id)
      }
    } catch (error) {
      console.error('Error loading warehouses:', error)
    }
  }

  const loadInventories = async () => {
    try {
      setLoading(true)
      const data = await getAllWarehouses(userRole)
      // Filter to show only inventory locations (branches) that are children of warehouses
      const inventoryLocations = data.filter(w => w.type === 'branch' || (w.parentWarehouse && w.parentWarehouse.length > 0))
      setInventories(inventoryLocations)
    } catch (error) {
      console.error('Error loading inventories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInventory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!warehouseId) {
      alert('Please select a warehouse')
      return
    }

    try {
      await createInventory(
        {
          ...formData,
          isMainWarehouse: false,
          parentWarehouse: warehouseId,
          manager: userId,
          staff: [userId],
        },
        userRole
      )

      alert('Inventory location created successfully!')
      setFormData({
        name: '',
        type: 'branch',
        city: '',
        state: '',
        address: '',
        zipCode: '',
        capacity: 0,
      })
      setShowCreateModal(false)
      loadInventories()
    } catch (error) {
      console.error('Error creating inventory:', error)
      alert('Error creating inventory location')
    }
  }

  const handleDeleteInventory = async (inventoryId: string) => {
    if (!confirm('Are you sure you want to delete this inventory location?')) return

    try {
      await deleteInventory(inventoryId, userRole)
      alert('Inventory location deleted successfully!')
      loadInventories()
    } catch (error) {
      console.error('Error deleting inventory:', error)
      alert('Error deleting inventory location')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading inventory locations...</div>
  }

  // Show message if no warehouses available
  if (warehouses.length === 0 && userRole !== 'staff') {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <p className="text-yellow-800 dark:text-yellow-200">
            No warehouses found. Please contact your administrator to set up a main warehouse first.
          </p>
        </div>
      </div>
    )
  }

  // Show message if user is staff
  if (userRole === 'staff') {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Inventory Access</h3>
              <p className="text-blue-800 dark:text-blue-200">
                Your inventory details are displayed on the Inventory dashboard. Only warehouse managers can create or modify inventory locations.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Locations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage warehouse branches and distribution centers</p>
        </div>
        {(userRole === 'director' || userRole === 'admin' || userRole === 'warehouse_manager') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            Add Inventory Location
          </button>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl">
            <div className="bg-blue-50 dark:bg-blue-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Inventory Location</h2>
            </div>

            <form onSubmit={handleCreateInventory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Parent Warehouse *
                </label>
                <select
                  value={warehouseId}
                  onChange={e => setWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select warehouse...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Phoenix Distribution Center"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., Phoenix"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g., AZ"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="ZIP code"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Storage Capacity (units) *
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 1000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory List */}
      {inventories.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Package className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600 dark:text-gray-400">No inventory locations created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {inventories.map(inventory => (
            <div
              key={inventory.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{inventory.name}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin size={16} />
                    {inventory.location.city}, {inventory.location.state}
                  </div>
                </div>
                {(userRole === 'director' || userRole === 'admin' || userRole === 'warehouse_manager') && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Edit functionality can be added later
                        alert('Edit functionality coming soon')
                      }}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteInventory(inventory.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Capacity</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{inventory.capacity} units</span>
                </div>
                {inventory.location?.address && (
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Address</span>
                    <span className="text-sm text-gray-900 dark:text-white text-right">{inventory.location.address}</span>
                  </div>
                )}
                {inventory.location?.zipCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">ZIP</span>
                    <span className="font-mono text-sm text-gray-900 dark:text-white">{inventory.location.zipCode}</span>
                  </div>
                )}
              </div>

              {inventory.staff && inventory.staff.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users size={16} />
                  {inventory.staff.length} staff member{inventory.staff.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
