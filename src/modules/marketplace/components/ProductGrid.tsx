import { useState } from 'react'
import { Search, Filter, ChevronDown } from 'lucide-react'
import { Product, SearchFilter } from '../types'

interface ProductGridProps {
  products: Product[]
  loading?: boolean
  onFiltersChange?: (filters: SearchFilter) => void
  onProductClick?: (product: Product) => void
}

export default function ProductGrid({
  products,
  loading = false,
  onFiltersChange,
  onProductClick,
}: ProductGridProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [priceRange, setPriceRange] = useState([0, 10000])

  const handleFilterChange = () => {
    onFiltersChange?.({
      query: searchQuery,
      category: selectedCategory || undefined,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
    })
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Products
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, SKU, or vendor..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  handleFilterChange()
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  handleFilterChange()
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="furniture">Furniture</option>
                <option value="office-supplies">Office Supplies</option>
                <option value="raw-materials">Raw Materials</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Range: ${priceRange[0]} - ${priceRange[1]}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="10000"
                  value={priceRange[0]}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value)
                    if (newMin <= priceRange[1]) {
                      setPriceRange([newMin, priceRange[1]])
                      handleFilterChange()
                    }
                  }}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="10000"
                  value={priceRange[1]}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value)
                    if (newMax >= priceRange[0]) {
                      setPriceRange([priceRange[0], newMax])
                      handleFilterChange()
                    }
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse h-96"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => onProductClick?.(product)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
            >
              {/* Image */}
              <div className="bg-gray-200 dark:bg-gray-700 h-48 flex items-center justify-center">
                {product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400">No image</span>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  SKU: {product.sku}
                </p>

                {/* Vendor */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                      {product.vendor.name[0]}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {product.vendor.name}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.comparePrice && (
                    <span className="text-sm text-gray-400 line-through">
                      ${product.comparePrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Stock & Rating */}
                <div className="flex justify-between items-center text-sm">
                  <span className={product.quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {product.vendor.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
