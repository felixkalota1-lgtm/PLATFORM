import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { useMarketplaceProducts } from '../../../hooks/useMarketplaceProducts'
import { MarketplaceProduct } from '../../../services/marketplaceService'
import { Package, Trash2, Edit2, Eye, DollarSign, Package2 } from 'lucide-react'

interface MyListingsProps {
  onProductClick?: (product: MarketplaceProduct) => void
}

export default function MyListings({ onProductClick }: MyListingsProps) {
  const { user } = useAuth()
  const [myProducts, setMyProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { products } = useMarketplaceProducts()

  useEffect(() => {
    if (products && user?.tenantId) {
      // Filter products that belong to current user's company
      const filtered = products.filter(
        (p) => p.companyId === user.tenantId
      )
      setMyProducts(filtered)
      setLoading(false)
    }
  }, [products, user?.tenantId])

  const categories = Array.from(new Set(myProducts.map((p) => p.category)))

  const filteredProducts = myProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const totalValue = filteredProducts.reduce((sum, p) => sum + p.price * p.quantity, 0)
  const totalItems = filteredProducts.reduce((sum, p) => sum + p.quantity, 0)

  if (loading) {
    return <div className="text-center py-8">Loading your listings...</div>
  }

  if (myProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <Package2 size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Listings Yet</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You haven't posted any products to the marketplace yet.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Go to your Inventory → Products to publish items to the marketplace.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{myProducts.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Listings</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalItems}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Stock</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            ₹{totalValue.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Search Listings</label>
          <input
            type="text"
            placeholder="Search by name or SKU..."
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
      </div>

      {/* Listings Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="border p-3 text-left">Image</th>
              <th className="border p-3 text-left">Product Name</th>
              <th className="border p-3 text-left">SKU</th>
              <th className="border p-3 text-left">Category</th>
              <th className="border p-3 text-right">Price</th>
              <th className="border p-3 text-right">Stock</th>
              <th className="border p-3 text-right">Total Value</th>
              <th className="border p-3 text-center">Posted Date</th>
              <th className="border p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="border p-3">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
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
                <td className="border p-3 font-mono text-sm">{product.sku}</td>
                <td className="border p-3">
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                    {product.category}
                  </span>
                </td>
                <td className="border p-3 text-right font-medium">₹{product.price}</td>
                <td className="border p-3 text-right">
                  <span className={product.quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {product.quantity}
                  </span>
                </td>
                <td className="border p-3 text-right font-bold">
                  ₹{(product.price * product.quantity).toFixed(2)}
                </td>
                <td className="border p-3 text-center text-sm text-gray-600 dark:text-gray-400">
                  {product.createdAt
                    ? new Date(product.createdAt).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td className="border p-3">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => onProductClick?.(product)}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900 rounded opacity-50 cursor-not-allowed"
                      title="Edit (coming soon)"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded opacity-50 cursor-not-allowed"
                      title="Remove from marketplace (coming soon)"
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

      {filteredProducts.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No listings match your search criteria.
        </div>
      )}
    </div>
  )
}
