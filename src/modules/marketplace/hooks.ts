import { useState, useCallback } from 'react'
import { Product, CartItem, SearchFilter } from './types'

export function useMarketplaceSearch() {
  const [filters, setFilters] = useState<SearchFilter>({})
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (newFilters: SearchFilter) => {
    setLoading(true)
    setFilters(newFilters)
    try {
      // TODO: Call API service
      // const data = await apiService.post('/marketplace/search', newFilters)
      // setResults(data)
    } finally {
      setLoading(false)
    }
  }, [])

  return { filters, results, loading, search, setFilters }
}

export function useMarketplaceCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  const addToCart = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === item.productId && i.vendorId === item.vendorId
      )
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId && i.vendorId === item.vendorId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prev, item]
    })
  }, [])

  const removeFromCart = useCallback((productId: string, vendorId: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.vendorId === vendorId))
    )
  }, [])

  const updateQuantity = useCallback(
    (productId: string, vendorId: string, quantity: number) => {
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.vendorId === vendorId
            ? { ...i, quantity }
            : i
        )
      )
    },
    []
  )

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [items])

  return {
    items,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
  }
}
