/**
 * 3D Warehouse Visualization Component
 * Wrapper for the Warehouse3D component with real-time inventory data
 */

import { useState, useEffect } from 'react'
import { Warehouse3D } from './Warehouse3D'
import { getAllWarehouseInventory } from '../services/warehouseService'

export const Warehouse3DViewer = () => {
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true)
        // Try to load from Firestore
        try {
          const data = await getAllWarehouseInventory()
          setInventory(data || [])
        } catch (firestoreError) {
          console.warn('Firestore not available, using sample data:', firestoreError)
          // Use sample data if Firestore is not configured
          setInventory(getSampleWarehouseData())
        }
        setError(null)
      } catch (err) {
        console.error('Error loading warehouse inventory:', err)
        setError('Failed to load warehouse data')
        // Fallback to sample data
        setInventory(getSampleWarehouseData())
      } finally {
        setLoading(false)
      }
    }

    loadInventory()

    // Subscribe to real-time updates (optional)
    // const unsubscribe = subscribeToWarehouse((items) => {
    //   setInventory(items)
    // })
    // return () => unsubscribe?.()
  }, [])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
          <p>Loading warehouse data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800">{error} - Showing sample data</p>
        </div>
      )}
      <Warehouse3D
        inventory={inventory}
        onSelectLocation={(location) => {
          console.log('Selected location:', location)
        }}
      />
    </div>
  )
}

/**
 * Sample warehouse data for testing/demo
 */
function getSampleWarehouseData() {
  return [
    { id: 'SKU001', sku: 'SKU001', productName: 'Monitor 27-inch', quantity: 150, location: 'A1', category: 'Electronics' },
    { id: 'SKU002', sku: 'SKU002', productName: 'Keyboard Mechanical', quantity: 85, location: 'A2', category: 'Electronics' },
    { id: 'SKU003', sku: 'SKU003', productName: 'Mouse Wireless', quantity: 200, location: 'B1', category: 'Electronics' },
    { id: 'SKU004', sku: 'SKU004', productName: 'USB Cable Pack', quantity: 300, location: 'B2', category: 'Accessories' },
    { id: 'SKU005', sku: 'SKU005', productName: 'Monitor Stand', quantity: 45, location: 'C1', category: 'Accessories' },
    { id: 'SKU006', sku: 'SKU006', productName: 'Laptop Cooling Pad', quantity: 120, location: 'C2', category: 'Accessories' },
    { id: 'SKU007', sku: 'SKU007', productName: 'Webcam HD', quantity: 60, location: 'D1', category: 'Electronics' },
    { id: 'SKU008', sku: 'SKU008', productName: 'Microphone USB', quantity: 30, location: 'D2', category: 'Electronics' },
  ]
}

export default Warehouse3DViewer;
