import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, addDoc, setDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../../services/firebase'
import { useAuth } from '../../../hooks/useAuth'
import { Eye, Edit2, Trash2, Package, FileText, Grid3x3, List, X, ShoppingCart, Download } from 'lucide-react'
import CreateSaleQuoteModal from '../../sales/components/CreateSaleQuoteModal'
import ProductEditorModal from '../../../components/ProductEditorModal'
import { downloadProductsExcel } from '../../../services/excelExportService'

interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  stock: number
  sku: string
  imageUrl?: string
}

export const ProductsList = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [quotationItems, setQuotationItems] = useState<Record<string, number>>({})
  const [quotationCustomer, setQuotationCustomer] = useState('')
  const [quotationNotes, setQuotationNotes] = useState('')
  const [showQuotationBuilder, setShowQuotationBuilder] = useState(false)
  const [showSaleQuoteModal, setShowSaleQuoteModal] = useState(false)
  const [selectedProductForQuote, setSelectedProductForQuote] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !user.tenantId) {
      setLoading(false)
      return
    }

    console.log('🔄 Setting up real-time listener for products:', user.tenantId);
    const q = query(collection(db, 'tenants', user.tenantId, 'products'), where('active', '==', true))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📦 Products snapshot received:', snapshot.docs.length, 'products');
      const productList: Product[] = []
      snapshot.forEach((doc) => {
        console.log('📄 Product:', doc.data());
        productList.push({ id: doc.id, ...doc.data() } as Product)
      })
      console.log('✅ Updated products list:', productList.length, 'products');
      setProducts(productList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const categories = Array.from(new Set(products.map((p) => p.category)))

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToQuotation = (product: Product, quantity: number = 1) => {
    setQuotationItems((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + quantity,
    }))
    setShowQuotationBuilder(true)
    setSelectedProduct(null)
  }

  const removeFromQuotation = (productId: string) => {
    setQuotationItems((prev) => {
      const updated = { ...prev }
      delete updated[productId]
      return updated
    })
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowEditor(true)
    setSelectedProduct(null)
  }

  const handleSaveProduct = async (updatedProduct: any) => {
    if (!user?.tenantId || !editingProduct) return
    
    setSavingProduct(true)
    try {
      const productRef = doc(db, 'tenants', user.tenantId, 'products', editingProduct.id)
      await setDoc(productRef, {
        ...updatedProduct,
        updatedAt: new Date(),
        active: true,
      }, { merge: true })
      
      console.log('✅ Product updated:', editingProduct.id)
      console.log('📝 Syncing to Excel: This change will be reflected in Excel if file-watcher is running')
      
      setShowEditor(false)
      setEditingProduct(null)
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    } finally {
      setSavingProduct(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!user?.tenantId) return
    
    try {
      const product = products.find(p => p.id === productId)
      const productRef = doc(db, 'tenants', user.tenantId, 'products', productId)
      await deleteDoc(productRef)
      console.log('✅ Product deleted:', productId)
      console.log('🗑️ Syncing to Excel: This deletion will be reflected in Excel if file-watcher is running')
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    }
  }

  const quotationTotal = Object.entries(quotationItems).reduce((sum, [productId, qty]) => {
    const product = products.find((p) => p.id === productId)
    return sum + (product?.price || 0) * qty
  }, 0)

  const sampleProducts = [
    {
      name: 'LED Desk Lamp',
      description: 'Bright LED lamp with color control',
      price: 89.99,
      sku: 'LAMP-001',
      category: 'Office',
      stock: 45,
    },
    {
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse 2.4GHz',
      price: 29.99,
      sku: 'MOUSE-001',
      category: 'Electronics',
      stock: 120,
    },
    {
      name: 'Mechanical Keyboard',
      description: 'RGB mechanical keyboard Cherry MX',
      price: 149.99,
      sku: 'KEY-001',
      category: 'Electronics',
      stock: 60,
    },
    {
      name: 'USB-C Hub',
      description: '7-in-1 USB hub with HDMI output',
      price: 49.99,
      sku: 'HUB-001',
      category: 'Accessories',
      stock: 85,
    },
    {
      name: 'Monitor Stand',
      description: 'Adjustable stand with storage drawer',
      price: 39.99,
      sku: 'STAND-001',
      category: 'Office',
      stock: 40,
    },
  ]

  const seedSampleProducts = async () => {
    if (!user?.tenantId) return
    try {
      const productsRef = collection(db, 'tenants', user.tenantId, 'products')
      for (const product of sampleProducts) {
        await addDoc(productsRef, {
          ...product,
          tenantId: user.tenantId,
          createdAt: new Date(),
          active: true,
        })
      }
      alert('Sample products added successfully!')
    } catch (error) {
      console.error('Error adding sample products:', error)
      alert('Error adding sample products')
    }
  }



  if (loading) {
    return <div className="text-center py-8">Loading inventory...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <div className="text-2xl font-bold">{products.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Products</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
          <div className="text-2xl font-bold">{products.reduce((sum, p) => sum + p.stock, 0)}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Stock</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
          <div className="text-2xl font-bold">{categories.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Products Section */}
        <div className="flex-1 space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Search Products</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            {products.length === 0 && (
              <button
                onClick={seedSampleProducts}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
              >
                Load Sample Data
              </button>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg ${
                  viewMode === 'table'
                    ? 'bg-blue-500 text-white'
                    : 'border dark:bg-gray-700 dark:border-gray-600'
                }`}
                title="Table View"
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-blue-500 text-white'
                    : 'border dark:bg-gray-700 dark:border-gray-600'
                }`}
                title="Grid View"
              >
                <Grid3x3 size={20} />
              </button>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="border p-3 text-left">Image</th>
                    <th className="border p-3 text-left">Name</th>
                    <th className="border p-3 text-left">SKU</th>
                    <th className="border p-3 text-left">Category</th>
                    <th className="border p-3 text-right">Price</th>
                    <th className="border p-3 text-right">Stock</th>
                    <th className="border p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="border p-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded flex items-center justify-center">
                            <Package size={16} />
                          </div>
                        )}
                      </td>
                      <td className="border p-3">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500 truncate">{product.description}</div>
                      </td>
                      <td className="border p-3">{product.sku}</td>
                      <td className="border p-3">
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                          {product.category}
                        </span>
                      </td>
                      <td className="border p-3 text-right font-medium">₹{product.price}</td>
                      <td className="border p-3 text-right">
                        <span
                          className={
                            product.stock > 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="border p-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProductForQuote(product)
                              setShowSaleQuoteModal(true)
                            }}
                            className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded"
                            title="Create Sale Quote"
                          >
                            <ShoppingCart size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product)
                              setSelectedQuantity(1)
                            }}
                            className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                            title="Add to Quotation"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900 rounded"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition"
                >
                  <div className="relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gray-300 flex items-center justify-center">
                        <Package size={48} className="text-gray-600" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-lg font-medium">
                      ₹{product.price}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-medium text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{product.description}</p>
                    <div className="flex gap-2 text-sm">
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                        {product.category}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">SKU: {product.sku}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t dark:border-gray-700">
                      <span className="text-sm font-medium">Stock: {product.stock}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(product)
                            setSelectedQuantity(1)
                          }}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          Quote
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quotation Builder Side Panel */}
        {showQuotationBuilder && (
          <div className="w-96 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 space-y-4 h-fit sticky top-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Build Quotation</h3>
              <button
                onClick={() => setShowQuotationBuilder(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer Info */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Customer Name</label>
              <input
                type="text"
                placeholder="Enter customer name"
                value={quotationCustomer}
                onChange={(e) => setQuotationCustomer(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <h4 className="font-medium">Items ({Object.keys(quotationItems).length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(quotationItems).map(([productId, qty]) => {
                  const product = products.find((p) => p.id === productId)
                  if (!product) return null
                  return (
                    <div key={productId} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{product.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {qty} × ₹{product.price}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromQuotation(productId)}
                        className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Terms & Notes</label>
              <textarea
                placeholder="Add payment terms, delivery notes, etc."
                value={quotationNotes}
                onChange={(e) => setQuotationNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                rows={3}
              />
            </div>

            {/* Total */}
            <div className="border-t dark:border-gray-700 pt-2">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>₹{quotationTotal}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={generateQuotePDF}
                disabled={Object.keys(quotationItems).length === 0}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Generate Quote
              </button>
              <button
                onClick={() => {
                  setQuotationItems({})
                  setQuotationCustomer('')
                  setQuotationNotes('')
                }}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Image */}
              <div className="flex justify-center">
                {selectedProduct.imageUrl ? (
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="max-h-64 rounded-lg" />
                ) : (
                  <div className="w-64 h-64 bg-gray-300 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Package size={80} className="text-gray-600" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">SKU</label>
                  <div className="text-lg">{selectedProduct.sku}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
                  <div className="text-lg">{selectedProduct.category}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Price</label>
                  <div className="text-2xl font-bold">₹{selectedProduct.price}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Stock</label>
                  <div className={`text-lg font-medium ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedProduct.stock} units
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                <p className="text-gray-700 dark:text-gray-300">{selectedProduct.description}</p>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Quantity</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                    className="flex-1 px-4 py-2 border rounded-lg text-center dark:bg-gray-700 dark:border-gray-600"
                  />
                  <button
                    onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    addToQuotation(selectedProduct, selectedQuantity)
                  }}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                >
                  Add to Quotation
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Editor Modal */}
      <ProductEditorModal
        isOpen={showEditor}
        product={editingProduct}
        onClose={() => {
          setShowEditor(false)
          setEditingProduct(null)
        }}
        onSave={handleSaveProduct}
        isLoading={savingProduct}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 max-w-sm">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Delete Product?</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Sale Quote Modal */}
      {selectedProductForQuote && (
        <CreateSaleQuoteModal
          isOpen={showSaleQuoteModal}
          onClose={() => {
            setShowSaleQuoteModal(false)
            setSelectedProductForQuote(null)
          }}
          tenantId={user?.tenantId || 'default'}
          productName={selectedProductForQuote.name}
          productId={selectedProductForQuote.id}
          initialPrice={selectedProductForQuote.price}
        />
      )}
    </div>
  )
}

export default ProductsList
