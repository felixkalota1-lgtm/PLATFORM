/**
 * AO Product Details Page
 * 
 * Displays all warehouse products with detailed information:
 * - Product name, SKU, price, quantity
 * - Search and filtering capabilities
 * - Real-time data from Firestore
 */

import { useState, useEffect } from 'react'
import { Search, Package, TrendingDown, DollarSign, Eye } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { db } from '../../services/firebase'
import { collection, query, getDocs } from 'firebase/firestore'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  quantity: number
  category?: string
  description?: string
  image?: string
}

export default function AOProductPage() {
  const { user } = useAuth()
  const tenantId = user?.tenantId || 'default'
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Load products from Firestore
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        const productsRef = collection(db, 'tenants', tenantId, 'products')
        const snapshot = await getDocs(query(productsRef))
        
        const loadedProducts: Product[] = snapshot.docs.map(doc => {
          const data = doc.data() as any
          // Map field names - support both 'price' and 'unitPrice'
          return {
            id: doc.id,
            name: data.name || data.productName || '',
            sku: data.sku || '',
            price: data.price || data.unitPrice || 0,
            quantity: data.quantity || 0,
            category: data.category || '',
            description: data.description || '',
            image: data.image || ''
          } as Product
        })
        
        setProducts(loadedProducts)
        setFilteredProducts(loadedProducts)
        console.log(`📦 Loaded ${loadedProducts.length} products`)
      } catch (error) {
        console.error('Error loading products:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [tenantId])

  // Handle search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term)
      )
      setFilteredProducts(filtered)
    }
  }, [searchTerm, products])

  // Calculate statistics
  const totalValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0)
  const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0)
  const lowStockItems = products.filter(p => (p.quantity || 0) > 0 && (p.quantity || 0) < 10).length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Products</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View all warehouse products with detailed information</p>
        </div>
        <div className="flex gap-2">
          {/* Statistics Cards */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-4 min-w-max">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Products</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{products.length}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg p-4 min-w-max">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Quantity</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-300">{totalQuantity.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg p-4 min-w-max">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">${totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 rounded-lg p-4 min-w-max">
            <div className="text-sm text-gray-600 dark:text-gray-400">Low Stock</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-300">{lowStockItems}</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by product name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Info Message */}
      {totalValue === 0 && products.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Note:</strong> Prices are not available for products imported from Excel files. To add prices, use the Manual Product entry in Upload Portal or update products via Procurement module.
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Loading products...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No products found matching your search' : 'No products available'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Product Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">SKU</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Price</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Quantity</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Total Value</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-blue-600 dark:text-blue-400" />
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white font-semibold">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign size={16} className="text-gray-400" />
                        {((product.price || 0).toFixed(2))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white font-semibold">
                      {(product.quantity || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white font-semibold">
                      ${(((product.price || 0) * (product.quantity || 0)).toLocaleString('en-US', { maximumFractionDigits: 2 }))}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {(product.quantity || 0) < 10 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                          <TrendingDown size={14} />
                          Low Stock
                        </span>
                      ) : (product.quantity || 0) < 50 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                          Medium
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Product Details</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Image */}
              {selectedProduct.image && (
                <div className="aspect-square w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Product Name</label>
                  <p className="text-lg text-gray-900 dark:text-white mt-1">{selectedProduct.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">SKU</label>
                    <p className="text-lg text-gray-900 dark:text-white font-mono mt-1">{selectedProduct.sku}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Category</label>
                    <p className="text-lg text-gray-900 dark:text-white mt-1">{selectedProduct.category || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Unit Price</label>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-300 mt-1">
                      ${(selectedProduct.price || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Quantity</label>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-300 mt-1">
                      {(selectedProduct.quantity || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-4">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Value</label>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-300 mt-1">
                    ${(((selectedProduct.price || 0) * (selectedProduct.quantity || 0)).toLocaleString('en-US', { maximumFractionDigits: 2 }))}
                  </p>
                </div>

                {selectedProduct.description && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Description</label>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">{selectedProduct.description}</p>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Stock Status</span>
                  {(selectedProduct.quantity || 0) < 10 ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                      <TrendingDown size={16} />
                      Low Stock - Reorder Soon
                    </span>
                  ) : (selectedProduct.quantity || 0) < 50 ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                      Medium Stock Level
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                      Healthy Stock Level
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
