import { useState, useEffect } from 'react'
import { Plus, Users, MapPin, AlertCircle } from 'lucide-react'
import type { Warehouse } from '../types/warehouse'
import {
  getAllWarehouses,
  createWarehouse,
  assignUserToWarehouse,
} from '../services/multiWarehouseService'

export default function WarehouseManagementPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const userObj = JSON.parse(localStorage.getItem('pspm_user') || '{}')
  const [userRole] = useState(userObj.role || 'staff')
  const [userId] = useState(userObj.id || '')

  const [formData, setFormData] = useState({
    name: '',
    type: 'warehouse' as 'warehouse' | 'branch',
    city: '',
    state: '',
    address: '',
    zipCode: '',
    capacity: 0,
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

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newWarehouseId = await createWarehouse(
        {
          name: formData.name,
          type: formData.type,
          location: {
            city: formData.city,
            state: formData.state,
            address: formData.address,
            zipCode: formData.zipCode,
          },
          capacity: formData.capacity,
          manager: userId,
          staff: [userId],
          isMainWarehouse: formData.type === 'warehouse',
        },
        userRole
      )

      if (newWarehouseId) {
        // Assign self to warehouse
        await assignUserToWarehouse(userId, newWarehouseId, userRole, true)
        
        setFormData({
          name: '',
          type: 'warehouse',
          city: '',
          state: '',
          address: '',
          zipCode: '',
          capacity: 0,
        })
        setShowCreateModal(false)
        await loadWarehouses()
        alert('✅ Warehouse created successfully!')
      }
    } catch (error) {
      alert('❌ Error creating warehouse: ' + (error as Error).message)
    }
  }

  if (userRole !== 'director' && userRole !== 'admin' && userRole !== 'ceo') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">❌ You do not have permission to manage warehouses.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Warehouse Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage your warehouse locations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Warehouse Location
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New Warehouse Location</h2>

            <form onSubmit={handleCreateWarehouse} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Warehouse Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Nebraska Main Warehouse"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as 'warehouse' | 'branch' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="warehouse">Main Warehouse</option>
                    <option value="branch">Branch Location</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g., Omaha"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g., Nebraska"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="ZIP"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Storage Capacity (units)
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    placeholder="e.g., 10000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warehouses List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <p className="text-yellow-800 dark:text-yellow-200">
            No warehouses created yet. Click "Add Warehouse Location" to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {warehouses.map((warehouse) => (
            <div
              key={warehouse.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{warehouse.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {warehouse.type === 'warehouse' ? '🏭 Main Warehouse' : '🏪 Branch Location'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin size={16} />
                  <span>{warehouse.location.city}, {warehouse.location.state}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <AlertCircle size={16} />
                  <span>Capacity: {warehouse.capacity} units</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Users size={16} />
                  <span>{warehouse.staff?.length || 0} staff assigned</span>
                </div>
              </div>

              <button className="mt-4 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Manage Location
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
