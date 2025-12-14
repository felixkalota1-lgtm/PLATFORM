/**
 * Branch Stock Display Component
 * 
 * Shows current stock levels at each branch
 */

import { useState, useEffect } from 'react'
import { db } from '../../../services/firebase'
import { collection, getDocs, query } from 'firebase/firestore'
import { Building2, Package } from 'lucide-react'

interface BranchStock {
  branchId: string
  branchName: string
  location: string
  items: Array<{
    sku: string
    productName: string
    quantity: number
  }>
  totalItems: number
  totalQuantity: number
}

export default function BranchStockDisplay({ tenantId, refreshKey }: { tenantId: string; refreshKey: number }) {
  const [branchStocks, setBranchStocks] = useState<BranchStock[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)

  useEffect(() => {
    loadBranchStocks()
  }, [tenantId, refreshKey])

  const loadBranchStocks = async () => {
    try {
      setLoading(true)
      
      // Create sample branch data for display (placeholder until branches are set up)
      const sampleBranches: BranchStock[] = [
        {
          branchId: 'arizona',
          branchName: 'Arizona Branch',
          location: 'Phoenix, AZ',
          items: [],
          totalItems: 0,
          totalQuantity: 0,
        },
        {
          branchId: 'california',
          branchName: 'California Branch',
          location: 'Los Angeles, CA',
          items: [],
          totalItems: 0,
          totalQuantity: 0,
        },
        {
          branchId: 'texas',
          branchName: 'Texas Branch',
          location: 'Houston, TX',
          items: [],
          totalItems: 0,
          totalQuantity: 0,
        },
      ]
      
      // Try to load actual branch data if it exists
      try {
        const branchesSnapshot = await getDocs(query(collection(db, 'branches')))
        
        if (branchesSnapshot.docs.length > 0) {
          const branches = await Promise.all(
            branchesSnapshot.docs.map(async branchDoc => {
              const branchData = branchDoc.data()
              
              // Try to get inventory for this branch
              let items: any[] = []
              try {
                const inventorySnapshot = await getDocs(
                  query(collection(db, `branches/${branchDoc.id}/inventory`))
                )
                items = inventorySnapshot.docs.map(doc => {
                  const data = doc.data()
                  return {
                    sku: data.sku || doc.id,
                    productName: data.productName || data.name || 'Unknown',
                    quantity: data.quantity || 0,
                  }
                })
              } catch (e) {
                // No inventory data for this branch yet
              }
              
              return {
                branchId: branchDoc.id,
                branchName: branchData.name || 'Unknown Branch',
                location: branchData.location || '',
                items,
                totalItems: items.length,
                totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
              }
            })
          )
          
          setBranchStocks(branches.sort((a, b) => a.branchName.localeCompare(b.branchName)))
        } else {
          // Use sample branches if none exist
          setBranchStocks(sampleBranches)
        }
      } catch (e) {
        // Use sample branches as fallback
        setBranchStocks(sampleBranches)
      }
      
      if (branchStocks.length > 0) {
        setSelectedBranch(branchStocks[0].branchId)
      }
    } catch (error) {
      console.error('Error loading branch stocks:', error)
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const selectedBranchData = branchStocks.find(b => b.branchId === selectedBranch)

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="inline-block">
          <Package className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
        <p className="text-gray-600 mt-2">Loading branch stock levels...</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Branch List */}
      <div className="bg-white rounded-lg shadow-md p-6 overflow-hidden flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Branches</h3>
        <div className="flex-1 overflow-y-auto space-y-2">
          {branchStocks.map(branch => (
            <button
              key={branch.branchId}
              onClick={() => setSelectedBranch(branch.branchId)}
              className={`w-full text-left p-4 rounded-lg transition-all ${
                selectedBranch === branch.branchId
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4" />
                <span className="font-semibold">{branch.branchName}</span>
              </div>
              <p className={`text-xs ${selectedBranch === branch.branchId ? 'text-indigo-100' : 'text-gray-600'}`}>
                {branch.location}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Package className="w-3 h-3" />
                <span className="text-sm font-semibold">{branch.totalQuantity} units</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Branch Details */}
      {selectedBranchData && (
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md p-6">
            <h2 className="text-3xl font-bold mb-2">{selectedBranchData.branchName}</h2>
            <p className="text-indigo-100 mb-4">{selectedBranchData.location}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-indigo-200 text-sm">Total Items</p>
                <p className="text-3xl font-bold">{selectedBranchData.totalItems}</p>
              </div>
              <div>
                <p className="text-indigo-200 text-sm">Total Quantity</p>
                <p className="text-3xl font-bold">{selectedBranchData.totalQuantity}</p>
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          {selectedBranchData.items.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Current Inventory</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">SKU</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedBranchData.items.map(item => (
                      <tr key={item.sku} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.productName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.sku}</td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                          <span className="bg-indigo-100 text-indigo-900 px-3 py-1 rounded-full">
                            {item.quantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No inventory</h3>
              <p className="text-gray-600">This branch has not received any stock yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
