import { useState, useEffect } from 'react'
import { Package, Edit2, Trash2, Eye } from 'lucide-react'
import { db } from '../../../services/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../../../hooks/useAuth'

interface Product {
  id: string
  name: string
  description: string
  price: number
  sku: string
  category: string
  stock: number
  image?: string
}

export default function ProductsList() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  // Fetch products from Firebase
  useEffect(() => {
    if (!user?.tenantId) {
      setLoading(false)
      return
    }

    try {
      const q = query(
        collection(db, 'tenants', user.tenantId, 'products'),
        where('active', '==', true),
        where('source', '==', 'inventory') // Only show inventory products, not marketplace
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedProducts: Product[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || '',
          description: doc.data().description || '',
          price: doc.data().price || 0,
          sku: doc.data().sku || '',
          category: doc.data().category || 'Uncategorized',
          stock: doc.data().stock || 0,
          image: doc.data().imageUrl,
        }))

        // Only show YOUR company's products (no mock data fallback)
        setProducts(fetchedProducts)
        setLoading(false)
      })

      return () => unsubscribe()
    } catch (error) {
      console.error('Error loading inventory:', error)
      setLoading(false)
      setProducts([]) // Show empty, not mock data
    }
  }, [user?.tenantId])

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(products.map((p) => p.category)))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {loading ? '⏳ Loading your inventory...' : `📦 ${products.length} products in your inventory`}
        </p>
      </div>

      {/* Show loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin">
            <Package size={32} className="text-blue-500" />
          </div>
        </div>
      )}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      {filteredProducts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {product.description.substring(0, 40)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{product.sku}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">${product.price}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Package size={16} className={product.stock > 0 ? 'text-green-600' : 'text-red-600'} />
                      <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                        {product.stock}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition">
                        <Eye size={16} className="text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition">
                        <Edit2 size={16} className="text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition">
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No products found. Start by importing from Excel!</p>
        </div>
      )}
    </div>
  )
}
