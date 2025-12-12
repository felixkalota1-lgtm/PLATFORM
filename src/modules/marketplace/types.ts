// Marketplace Types

export interface Product {
  id: string
  name: string
  description: string
  sku: string
  price: number
  comparePrice?: number
  cost?: number
  quantity: number
  category: string
  images: string[]
  vendor: {
    id: string
    name: string
    rating: number
  }
  tags: string[]
  createdAt: Date
  updatedAt: Date
  status: 'active' | 'draft' | 'archived'
  specifications?: Record<string, string>
}

export interface Category {
  id: string
  name: string
  description: string
  icon?: string
  image?: string
  productCount: number
}

export interface Vendor {
  id: string
  name: string
  description: string
  logo: string
  rating: number
  reviewCount: number
  isVerified: boolean
  categories: string[]
  email: string
  phone: string
  address: string
  website?: string
  createdAt: Date
}

export interface Review {
  id: string
  productId: string
  vendorId: string
  userId: string
  rating: number
  title: string
  comment: string
  images?: string[]
  helpful: number
  createdAt: Date
}

export interface CartItem {
  productId: string
  vendorId: string
  quantity: number
  price: number
  addedAt: Date
}

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  shippingAddress: Address
  paymentMethod: string
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault?: boolean
}

export interface SearchFilter {
  query?: string
  category?: string
  vendor?: string
  priceMin?: number
  priceMax?: number
  rating?: number
  inStock?: boolean
  sortBy?: 'relevance' | 'price-low' | 'price-high' | 'newest' | 'rating'
}
