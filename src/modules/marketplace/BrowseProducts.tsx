import { useState } from 'react'
import { Grid, List } from 'lucide-react'
import ProductGrid from './components/ProductGrid'
import ProductDetail from './components/ProductDetail'
import { Product } from './types'

interface BrowseProductsProps {
  mockProducts: Product[]
}

export default function BrowseProducts({ mockProducts }: BrowseProductsProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const getFilteredProducts = () => {
    return mockProducts
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      {!selectedProduct && (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Product Grid or Detail */}
      {selectedProduct ? (
        <div>
          <button
            onClick={() => setSelectedProduct(null)}
            className="mb-6 text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Products
          </button>
          <ProductDetail product={selectedProduct} />
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Showing {getFilteredProducts().length} products
          </div>
          <ProductGrid
            products={getFilteredProducts()}
            onProductClick={setSelectedProduct}
          />
        </>
      )}
    </div>
  )
}
