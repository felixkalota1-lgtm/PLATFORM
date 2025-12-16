/**
 * AO Product Details Page
 * 
 * Displays all warehouse products with detailed information:
 * - Product name, SKU, price, quantity
 * - Search and filtering capabilities
 * - Real-time data from Firestore
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Package, TrendingDown, DollarSign, Eye } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { db } from '../../services/firebase'
import { collection, query, getDocs, limit, where, updateDoc, doc, getFirestore } from 'firebase/firestore'

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
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProductCount, setTotalProductCount] = useState(0)
  const [warehouseTotalQty, setWarehouseTotalQty] = useState(0)
  const [warehouseTotalValue, setWarehouseTotalValue] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'quantity'>('name')
  const [jumpToPage, setJumpToPage] = useState('')
  const [infiniteScrollItems, setInfiniteScrollItems] = useState<Product[]>([])
  const [useInfiniteScroll, setUseInfiniteScroll] = useState(false)
  const [autoGenerateImages, setAutoGenerateImages] = useState(false)
  const [generatingImages, setGeneratingImages] = useState<string[]>([])
  const observerTarget = useRef<HTMLDivElement>(null)

  // Refresh totals - Calculate from loaded products for speed
  // For full warehouse totals, use the allProducts array we already have
  const refreshTotals = useCallback(() => {
    try {
      console.log('🔄 Refreshing warehouse totals from loaded data...')
      
      let totalQty = 0
      let totalVal = 0
      let lowStockCount = 0
      
      allProducts.forEach((product) => {
        const qty = product.quantity || 0
        const price = product.price || 0
        totalQty += qty
        totalVal += qty * price
        if (qty < 10) lowStockCount++
      })
      
      setTotalProductCount(allProducts.length)
      setWarehouseTotalQty(totalQty)
      setWarehouseTotalValue(totalVal)
      setLowStockCount(lowStockCount)
      console.log(`✅ Totals updated: ${allProducts.length} items, ${totalQty} qty, $${totalVal}, ${lowStockCount} low stock`)
    } catch (error) {
      console.error('Error refreshing totals:', error)
    }
  }, [allProducts])

  // Generate AI image for product
  const generateProductImage = useCallback(async (product: Product) => {
    try {
      setGeneratingImages(prev => [...prev, product.id])
      
      console.log(`🎨 Generating AI image for ${product.name}...`)
      
      // Placeholder for AI API call - you'll need to implement the actual service
      // For now, we'll use a placeholder image URL
      const imageUrl = `https://picsum.photos/400/400?random=${Math.random()}`
      
      // Update product with new image
      const db = getFirestore()
      const warehouseRef = collection(db, 'warehouse_inventory')
      const q = query(warehouseRef, where('sku', '==', product.sku))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const docRef = doc(db, 'warehouse_inventory', snapshot.docs[0].id)
        await updateDoc(docRef, { image: imageUrl })
        
        // Update local state
        const updatedProduct = { ...product, image: imageUrl }
        setSelectedProduct(updatedProduct)
        if (editingProduct?.id === product.id) {
          setEditingProduct(updatedProduct)
        }
      }
      
      console.log(`✅ Image generated for ${product.name}`)
      setGeneratingImages(prev => prev.filter(id => id !== product.id))
    } catch (error) {
      console.error('Error generating image:', error)
      setGeneratingImages(prev => prev.filter(id => id !== product.id))
    }
  }, [editingProduct?.id])


  // Load products from Firestore
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        
        // Try to get warehouse_inventory collection first (where uploaded items go)
        let productsRef = collection(db, 'warehouse_inventory')
        let snapshot = await getDocs(query(productsRef, limit(1)))
        
        if (snapshot.empty) {
          // Fallback to tenant-specific products
          productsRef = collection(db, 'tenants', tenantId, 'products')
          snapshot = await getDocs(query(productsRef, limit(50)))
          console.log('Using tenant products collection')
        } else {
          // warehouse_inventory has data, fetch 50 items
          snapshot = await getDocs(query(productsRef, limit(50)))
          console.log('Using warehouse_inventory collection')
        }
        
        const loadedProducts: Product[] = snapshot.docs.map((doc, idx) => {
          const data = doc.data()
          if (idx === 0) {
            console.log('First item:', data)
          }
          return {
            id: doc.id,
            name: data.name || data.productName || '',
            sku: data.sku || data.SKU || '',
            price: data.price || 0,
            quantity: data.quantity || data.stock || 0,
            category: data.category || '',
            description: data.description || '',
            image: data.image || '',
          }
        })
        
        setAllProducts(loadedProducts)
        setDisplayedProducts(loadedProducts)
        setLoading(false)
        
      } catch (error) {
        console.error('Error:', error)
        setLoading(false)
      }
    }

    loadProducts()
  }, [tenantId])

  // Recalculate totals whenever products load
  useEffect(() => {
    refreshTotals()
  }, [allProducts, refreshTotals])

  // Handle search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setDisplayedProducts(allProducts)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term)
      )
      setDisplayedProducts(filtered)
    }
    setCurrentPage(1)
  }, [searchTerm, allProducts])

  // Sort products
  const sortedProducts = useCallback(() => {
    const toSort = [...displayedProducts]
    switch (sortBy) {
      case 'price':
        return toSort.sort((a, b) => b.price - a.price)
      case 'quantity':
        return toSort.sort((a, b) => b.quantity - a.quantity)
      case 'name':
      default:
        return toSort.sort((a, b) => a.name.localeCompare(b.name))
    }
  }, [displayedProducts, sortBy])()

  // Infinite scroll effect
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && useInfiniteScroll) {
        const newIndex = infiniteScrollItems.length + itemsPerPage
        setInfiniteScrollItems(prev => [
          ...prev,
          ...sortedProducts.slice(prev.length, newIndex)
        ])
      }
    })

    if (observerTarget.current && useInfiniteScroll) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [infiniteScrollItems, useInfiniteScroll, itemsPerPage, sortedProducts])

  // Initialize infinite scroll
  useEffect(() => {
    if (useInfiniteScroll) {
      setInfiniteScrollItems(sortedProducts.slice(0, itemsPerPage))
    }
  }, [useInfiniteScroll, itemsPerPage, sortedProducts])

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = useInfiniteScroll ? infiniteScrollItems : sortedProducts.slice(startIndex, endIndex)

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
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{totalProductCount.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg p-4 min-w-max">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Quantity</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-300">{warehouseTotalQty.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg p-4 min-w-max">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">${warehouseTotalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 rounded-lg p-4 min-w-max">
            <div className="text-sm text-gray-600 dark:text-gray-400">Low Stock</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-300">{lowStockCount}</div>
          </div>
        </div>
      </div>

      {/* Search and Controls Bar */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as 'name' | 'price' | 'quantity')
              setCurrentPage(1)
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort: Name</option>
            <option value="price">Sort: Price</option>
            <option value="quantity">Sort: Quantity</option>
          </select>

          {/* Items Per Page */}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
              setUseInfiniteScroll(false)
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="25">25/page</option>
            <option value="50">50/page</option>
            <option value="100">100/page</option>
          </select>

          {/* Infinite Scroll Toggle */}
          <button
            onClick={() => {
              setUseInfiniteScroll(!useInfiniteScroll)
              setCurrentPage(1)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              useInfiniteScroll
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {useInfiniteScroll ? '∞ Scroll' : 'Paginate'}
          </button>

          {/* Auto-Generate Images Toggle */}
          <button
            onClick={() => setAutoGenerateImages(!autoGenerateImages)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              autoGenerateImages
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {autoGenerateImages ? '🎨 AI Images On' : '🎨 AI Images Off'}
          </button>
        </div>

        {/* Jump to Page */}
        {!useInfiniteScroll && (
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              placeholder={`Jump to page (1-${totalPages})`}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                const page = parseInt(jumpToPage)
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page)
                  setJumpToPage('')
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go
            </button>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Loading products...</div>
          </div>
        ) : sortedProducts.length === 0 ? (
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
                {paginatedProducts.map((product) => (
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
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                        >
                          <Eye size={16} />
                          View
                        </button>
                        {autoGenerateImages && (
                          <button
                            onClick={() => generateProductImage(product)}
                            disabled={generatingImages.includes(product.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Generate AI image for this product"
                          >
                            {generatingImages.includes(product.id) ? (
                              <>
                                <span className="animate-spin">⏳</span>
                                Generating...
                              </>
                            ) : (
                              <>
                                <span>🎨</span>
                                Generate
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && sortedProducts.length > itemsPerPage && !useInfiniteScroll && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedProducts.length)} of {sortedProducts.length} products
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (page === 1 || page === totalPages) return true
                    if (Math.abs(page - currentPage) <= 1) return true
                    return false
                  })
                  .map((page, index, arr) => (
                    <div key={page}>
                      {index > 0 && arr[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Infinite Scroll Indicator */}
        {useInfiniteScroll && (
          <div ref={observerTarget} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
            {infiniteScrollItems.length < sortedProducts.length ? (
              <div className="text-sm">Scroll for more items...</div>
            ) : (
              <div className="text-sm text-gray-500">All items loaded</div>
            )}
          </div>
        )}
      </div>

      {/* Product Details/Edit Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? 'Edit Product' : 'Product Details'}
              </h2>
              <button
                onClick={() => {
                  setSelectedProduct(null)
                  setIsEditMode(false)
                  setEditingProduct(null)
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {isEditMode && editingProduct ? (
                /* Edit Mode Form */
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    try {
                      const db = getFirestore()
                      const updatedProduct = {
                        ...editingProduct,
                        price: parseFloat(String(editingProduct.price)) || 0,
                        quantity: parseInt(String(editingProduct.quantity)) || 0,
                      }

                      // Try to find and update in warehouse_inventory
                      const warehouseRef = collection(db, 'warehouse_inventory')
                      const q = query(
                        warehouseRef,
                        where('sku', '==', editingProduct.sku)
                      )
                      const snapshot = await getDocs(q)

                      if (!snapshot.empty) {
                        const docRef = doc(db, 'warehouse_inventory', snapshot.docs[0].id)
                        await updateDoc(docRef, updatedProduct)
                      } else {
                        // Fallback to tenant products
                        const tenantId = localStorage.getItem('selectedTenantId') || 'default'
                        const tenantRef = doc(
                          db,
                          'tenants',
                          tenantId,
                          'products',
                          editingProduct.id
                        )
                        await updateDoc(tenantRef, updatedProduct)
                      }

                      // Update local state
                      setSelectedProduct(updatedProduct)
                      setIsEditMode(false)
                      setEditingProduct(null)

                      // Refresh data
                      refreshTotals()
                    } catch (error) {
                      console.error('Error saving product:', error)
                      alert('Error saving product. Please try again.')
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Product Name *</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      required
                      className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">SKU *</label>
                      <input
                        type="text"
                        value={editingProduct.sku}
                        onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                        required
                        disabled
                        className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-lg cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Category</label>
                      <input
                        type="text"
                        value={editingProduct.category || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Unit Price ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingProduct.price || 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                        required
                        className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Quantity *</label>
                      <input
                        type="number"
                        value={editingProduct.quantity || 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, quantity: parseInt(e.target.value) || 0 })}
                        required
                        className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Description</label>
                    <textarea
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      rows={3}
                      className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* AI Image Generation */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-3">AI Image Generation</label>
                    <button
                      type="button"
                      onClick={() => generateProductImage(editingProduct)}
                      disabled={generatingImages.includes(editingProduct.id)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {generatingImages.includes(editingProduct.id) ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Generating AI Image...
                        </>
                      ) : (
                        <>
                          <span>🎨</span>
                          Generate Product Image
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Auto-generate a professional product image based on the product name and category</p>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditMode(false)
                        setEditingProduct(null)
                      }}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                /* View Mode */
                <>
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
                    <div className="flex items-center justify-between mb-4">
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

                    {/* Generate Image Button in View Mode */}
                    {autoGenerateImages && (
                      <button
                        onClick={() => generateProductImage(selectedProduct)}
                        disabled={generatingImages.includes(selectedProduct.id)}
                        className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {generatingImages.includes(selectedProduct.id) ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Generating Image...
                          </>
                        ) : (
                          <>
                            <span>🎨</span>
                            Generate Product Image
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {!isEditMode && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedProduct(null)
                    setIsEditMode(false)
                    setEditingProduct(null)
                  }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsEditMode(true)
                    setEditingProduct({ ...selectedProduct })
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Edit Product
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
