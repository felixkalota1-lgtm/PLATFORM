import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, query, where, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore'
import * as XLSX from 'xlsx'

interface Product {
  id: string
  name: string
  partNumber: string
  price: number
  qty: number
  stock: string
  image?: string
  currency?: string
}

const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'ZWK', symbol: 'ZK', name: 'Zambian Kwacha' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
]

// IndexedDB utilities for large product storage
const DB_NAME = 'PSPMDatabase'
const STORE_NAME = 'products'

const initIndexedDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('username', 'username', { unique: false })
        store.createIndex('name', 'name', { unique: false })
        store.createIndex('partNumber', 'partNumber', { unique: false })
      }
    }
  })
}

const saveProductToIndexedDB = async (username: string, product: Product): Promise<void> => {
  try {
    const database = await initIndexedDB()
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const productWithUser = { ...product, username }
    
    return new Promise((resolve, reject) => {
      const request = store.put(productWithUser)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error('Error saving to IndexedDB:', error)
  }
}

const loadProductsFromIndexedDB = async (username: string): Promise<Product[]> => {
  try {
    const database = await initIndexedDB()
    const transaction = database.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('username')
    const range = IDBKeyRange.only(username)
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(range)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const products = request.result.map(({ username, ...product }) => product)
        resolve(products)
      }
    })
  } catch (error) {
    console.error('Error loading from IndexedDB:', error)
    return []
  }
}

const deleteProductFromIndexedDB = async (productId: string): Promise<void> => {
  try {
    const database = await initIndexedDB()
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    return new Promise((resolve, reject) => {
      const request = store.delete(productId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error('Error deleting from IndexedDB:', error)
  }
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [currentUser, setCurrentUser] = useState<string>('')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [loginForm, setLoginForm] = useState({ emailOrUsername: '', password: '' })
  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [authError, setAuthError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  
  const [activeSubmenu, setActiveSubmenu] = useState<string>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadType, setUploadType] = useState<'single' | 'bulk'>('single')
  const [singleProduct, setSingleProduct] = useState({
    name: '',
    partNumber: '',
    price: '',
    qty: '',
    stock: 'In Stock'
  })
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD')
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Partial<Product>>({})
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; count: number }>({ show: false, count: 0 })
  const [singleProductImage, setSingleProductImage] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; status: string } | null>(null)
  const itemsPerPage = 50

  // Generate smart pagination numbers: 1, 2, 3, ..., current-1, current, current+1, ..., last
  const generatePageNumbers = (currentPage: number, totalPages: number) => {
    const pages: (number | string)[] = []
    const sideSize = 2 // Show 2 pages on each side of current page
    
    // Always show first 3 pages
    for (let i = 1; i <= Math.min(3, totalPages); i++) {
      if (!pages.includes(i)) pages.push(i)
    }
    
    // Add ellipsis if gap exists
    if (currentPage - sideSize > 3) {
      if (!pages.includes('...')) pages.push('...')
    }
    
    // Add pages around current page
    for (let i = currentPage - sideSize; i <= currentPage + sideSize; i++) {
      if (i > 0 && i <= totalPages && !pages.includes(i)) {
        pages.push(i)
      }
    }
    
    // Add ellipsis before last pages if gap exists
    if (currentPage + sideSize < totalPages - 2) {
      if (!pages.includes('...')) pages.push('...')
    }
    
    // Always show last 3 pages
    for (let i = Math.max(totalPages - 2, 1); i <= totalPages; i++) {
      if (!pages.includes(i)) pages.push(i)
    }
    
    return pages
  }

  // Load user products from IndexedDB (supports 100k+ items)
  const loadUserDataOnLogin = async (username: string) => {
    try {
      // Load products from IndexedDB
      const products = await loadProductsFromIndexedDB(username)
      const cachedTab = localStorage.getItem(`cache_tab_${username}`)
      return {
        products: products || [],
        activeTab: cachedTab || 'products'
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      return {
        products: [],
        activeTab: 'products'
      }
    }
  }

  // Save product to IndexedDB (replaces localStorage for large datasets)
  const saveUserProduct = async (username: string, product: Product) => {
    try {
      await saveProductToIndexedDB(username, product)
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  // Save active tab to Firestore or localStorage (write operation - necessary)
  const saveUserActiveTab = async (username: string, tab: string) => {
    try {
      if (!db) {
        // Fallback to localStorage
        localStorage.setItem(`cache_tab_${username}`, tab)
        return
      }

      const docRef = doc(db, 'userSettings', username)
      await setDoc(docRef, {
        username: username,
        activeTab: tab,
        lastUpdated: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error saving active tab:', error)
      // Fallback to localStorage
      localStorage.setItem(`cache_tab_${username}`, tab)
    }
  }

  // Delete product from Firestore (write operation - necessary)
  const deleteUserProduct = async (username: string, productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', `${username}_${productId}`))
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  // Restore login session on page refresh
  useEffect(() => {
    const savedUser = localStorage.getItem('pspm_current_user')
    if (savedUser) {
      setCurrentUser(savedUser)
      setIsLoggedIn(true)
      // Load user's products
      loadUserDataOnLogin(savedUser).then(data => {
        setProducts(data.products)
        setActiveSubmenu(data.activeTab)
      })
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      saveUserActiveTab(currentUser, activeSubmenu)
    }
  }, [activeSubmenu, isLoggedIn, currentUser])

  // Check if username or email exists (1 optimized read for signup)
  const checkUserExists = async (username: string, email: string): Promise<{ exists: boolean; by: string }> => {
    try {
      if (!db) {
        // Fallback to localStorage
        const users = JSON.parse(localStorage.getItem('pspm_users') || '{}')
        if (users[username]) return { exists: true, by: 'username' }
        for (const user of Object.values(users)) {
          if ((user as any).email === email) return { exists: true, by: 'email' }
        }
        return { exists: false, by: '' }
      }

      const q = query(collection(db, 'userSettings'), where('username', '==', username))
      const usernameSnapshot = await getDocs(q)
      if (!usernameSnapshot.empty) {
        return { exists: true, by: 'username' }
      }

      const emailQ = query(collection(db, 'userSettings'), where('email', '==', email))
      const emailSnapshot = await getDocs(emailQ)
      if (!emailSnapshot.empty) {
        return { exists: true, by: 'email' }
      }

      return { exists: false, by: '' }
    } catch (error) {
      console.error('Error checking user:', error)
      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem('pspm_users') || '{}')
      if (users[username]) return { exists: true, by: 'username' }
      for (const user of Object.values(users)) {
        if ((user as any).email === email) return { exists: true, by: 'email' }
      }
      return { exists: false, by: '' }
    }
  }

  // Find user by email or username (1 optimized read for login)
  const findUserByEmailOrUsername = async (emailOrUsername: string): Promise<{ username: string; email: string } | null> => {
    try {
      if (!db) {
        // Fallback to localStorage
        const users = JSON.parse(localStorage.getItem('pspm_users') || '{}')
        if (users[emailOrUsername]) {
          return { username: emailOrUsername, email: users[emailOrUsername].email }
        }
        for (const [username, user] of Object.entries(users)) {
          if ((user as any).email === emailOrUsername) {
            return { username, email: (user as any).email }
          }
        }
        return null
      }

      // Try email first
      const emailQ = query(collection(db, 'userSettings'), where('email', '==', emailOrUsername))
      const emailSnapshot = await getDocs(emailQ)
      if (!emailSnapshot.empty) {
        const data = emailSnapshot.docs[0].data()
        return { username: data.username, email: data.email }
      }

      // Try username
      const usernameQ = query(collection(db, 'userSettings'), where('username', '==', emailOrUsername))
      const usernameSnapshot = await getDocs(usernameQ)
      if (!usernameSnapshot.empty) {
        const data = usernameSnapshot.docs[0].data()
        return { username: data.username, email: data.email }
      }

      return null
    } catch (error) {
      console.error('Error finding user:', error)
      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem('pspm_users') || '{}')
      if (users[emailOrUsername]) {
        return { username: emailOrUsername, email: users[emailOrUsername].email }
      }
      for (const [username, user] of Object.entries(users)) {
        if ((user as any).email === emailOrUsername) {
          return { username, email: (user as any).email }
        }
      }
      return null
    }
  }

  // Sign up handler
  const handleSignup = async () => {
    if (!signupForm.username || !signupForm.email || !signupForm.password || !signupForm.confirmPassword) {
      setAuthError('Please fill in all fields')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(signupForm.email)) {
      setAuthError('Please enter a valid email address')
      return
    }

    if (signupForm.password.length < 3) {
      setAuthError('Password must be at least 3 characters')
      return
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setAuthError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      // Check if username or email exists
      const { exists, by } = await checkUserExists(signupForm.username, signupForm.email)
      if (exists) {
        setAuthError(`${by === 'username' ? 'Username' : 'Email'} already taken`)
        setIsLoading(false)
        return
      }

      // Create user in Firestore or localStorage
      if (db) {
        await setDoc(doc(db, 'userSettings', signupForm.username), {
          username: signupForm.username,
          email: signupForm.email,
          password: signupForm.password,
          createdAt: new Date().toISOString(),
          activeTab: 'products'
        })
      } else {
        // Fallback to localStorage
        const users = JSON.parse(localStorage.getItem('pspm_users') || '{}')
        users[signupForm.username] = {
          username: signupForm.username,
          email: signupForm.email,
          password: signupForm.password,
          createdAt: new Date().toISOString(),
          activeTab: 'products'
        }
        localStorage.setItem('pspm_users', JSON.stringify(users))
      }

      // Login immediately after signup
      setProducts([])
      setActiveSubmenu('products')
      setCurrentUser(signupForm.username)
      localStorage.setItem('pspm_current_user', signupForm.username)
      setIsLoggedIn(true)
      setSignupForm({ username: '', email: '', password: '', confirmPassword: '' })
      setAuthError('')
    } catch (error) {
      setAuthError('Error creating account. Please try again.')
      console.error('Signup error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Login handler
  const handleLogin = async () => {
    if (!loginForm.emailOrUsername || !loginForm.password) {
      setAuthError('Please enter email/username and password')
      return
    }

    if (loginForm.password.length < 3) {
      setAuthError('Invalid credentials')
      return
    }

    setIsLoading(true)
    try {
      // Find user by email or username (1 read)
      const user = await findUserByEmailOrUsername(loginForm.emailOrUsername)
      if (!user) {
        setAuthError('Invalid email/username or password')
        setIsLoading(false)
        return
      }

      // Single batch load (2 queries total - products + settings = minimal reads)
      const { products: userProducts, activeTab: userActiveTab } = await loadUserDataOnLogin(user.username)
      
      setProducts(userProducts)
      setActiveSubmenu(userActiveTab)
      setCurrentUser(user.username)
      localStorage.setItem('pspm_current_user', user.username)
      setIsLoggedIn(true)
      setLoginForm({ emailOrUsername: '', password: '' })
      setAuthError('')
    } catch (error) {
      setAuthError('Error logging in. Please try again.')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter products by search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.partNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Paginate products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Logout handler
  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser('')
    localStorage.removeItem('pspm_current_user')
    setProducts([])
    setSelectedProducts(new Set())
    setSearchQuery('')
    setCurrentPage(1)
    setActiveSubmenu('products')
  }

  const handleSingleProductUpload = async () => {
    if (!singleProduct.name || !singleProduct.partNumber) {
      setUploadMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    setIsLoading(true)
    try {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: singleProduct.name,
        partNumber: singleProduct.partNumber,
        price: parseFloat(singleProduct.price) || 0,
        qty: parseInt(singleProduct.qty) || 0,
        stock: singleProduct.stock,
        image: singleProductImage || undefined,
        currency: selectedCurrency
      }

      // Save to Firestore
      await saveUserProduct(currentUser, newProduct)
      
      const updatedProducts = [...products, newProduct]
      setProducts(updatedProducts)
      setSingleProduct({ name: '', partNumber: '', price: '', qty: '', stock: 'In Stock' })
      setSingleProductImage('')
      setUploadMessage({ type: 'success', text: 'Product added successfully!' })
      setTimeout(() => setUploadMessage(null), 3000)
    } catch (error) {
      setUploadMessage({ type: 'error', text: 'Error saving product. Please try again.' })
      console.error('Upload error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate by file extension (more reliable than MIME type)
    const fileName = file.name.toLowerCase()
    const isValidExtension = fileName.endsWith('.pdf') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')

    if (!isValidExtension) {
      setUploadMessage({ type: 'error', text: 'Please upload a valid PDF or Excel file (.pdf, .xls, .xlsx)' })
      return
    }

    setUploadFile(file)
    setUploadMessage({ type: 'success', text: `File "${file.name}" selected. Ready to process.` })
  }

  const handleDeleteProducts = async (productIds: string[]) => {
    setConfirmDelete({ show: true, count: productIds.length })
  }

  const confirmDeleteAction = async (productIds: string[]) => {
    try {
      // Delete from IndexedDB
      for (const productId of productIds) {
        await deleteProductFromIndexedDB(productId)
      }

      // Update local state
      setProducts(products.filter(p => !productIds.includes(p.id)))
      setSelectedProducts(new Set())
      setUploadMessage({ type: 'success', text: `Deleted ${productIds.length} product(s)` })
      setConfirmDelete({ show: false, count: 0 })
      setTimeout(() => setUploadMessage(null), 3000)
    } catch (error) {
      console.error('Delete error:', error)
      setUploadMessage({ type: 'error', text: 'Error deleting products' })
      setConfirmDelete({ show: false, count: 0 })
    }
  }

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)))
    }
  }

  const handleEditProduct = async (productId: string, updatedData: Partial<Product>) => {
    try {
      const updatedProduct = { ...products.find(p => p.id === productId)!, ...updatedData }
      await saveUserProduct(currentUser, updatedProduct)
      setProducts(products.map(p => p.id === productId ? updatedProduct : p))
      setEditingProductId(null)
      setEditingData({})
      setUploadMessage({ type: 'success', text: 'Product updated successfully' })
      setTimeout(() => setUploadMessage(null), 3000)
    } catch (error) {
      setUploadMessage({ type: 'error', text: 'Error updating product' })
    }
  }

  const handleProcessBulkUpload = async () => {
    if (!uploadFile) {
      setUploadMessage({ type: 'error', text: 'Please select a file first' })
      return
    }

    if (!currentUser) {
      setUploadMessage({ type: 'error', text: 'You must be logged in to upload' })
      return
    }

    try {
      setUploadMessage({ type: 'success', text: `Processing ${uploadFile.name}...` })
      setUploadProgress({ current: 0, total: 0, status: 'Parsing file...' })

      const fileName = uploadFile.name.toLowerCase()
      let newProducts: Product[] = []

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Parse Excel file
        const arrayBuffer = await uploadFile.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(sheet)

        // Map Excel data to products - stock auto-calculated from qty
        newProducts = data.map((row: any, index: number) => {
          const quantity = parseInt(row.qty || row.Qty || row.Quantity || 0)
          return {
            id: `${Date.now()}_${index}`,
            name: row.name || row.Name || row.Product || 'Unknown',
            partNumber: row.partNumber || row.Part || row.PartNumber || 'N/A',
            price: parseFloat(row.price || row.Price || 0),
            qty: quantity,
            stock: quantity > 0 ? 'In Stock' : 'Out of Stock',
            currency: row.currency || row.Currency || 'USD'
          }
        })

        if (newProducts.length === 0) {
          setUploadMessage({ type: 'error', text: 'No valid products found in Excel file' })
          setUploadFile(null)
          setUploadProgress(null)
          return
        }
      } else if (fileName.endsWith('.pdf')) {
        setUploadMessage({ type: 'error', text: 'PDF parsing not yet implemented. Please use Excel format (.xlsx or .xls)' })
        setUploadFile(null)
        setUploadProgress(null)
        return
      }

      // Batch processing: save in chunks of 2000 items (IndexedDB is much faster than localStorage)
      const batchSize = 2000
      let successCount = 0
      const totalProducts = newProducts.length
      setUploadProgress({ current: 0, total: totalProducts, status: 'Starting import...' })

      for (let i = 0; i < totalProducts; i += batchSize) {
        const batch = newProducts.slice(i, Math.min(i + batchSize, totalProducts))
        const batchStartIndex = i

        // Process batch items
        for (let j = 0; j < batch.length; j++) {
          try {
            await saveUserProduct(currentUser, batch[j])
            successCount++
            const currentIndex = batchStartIndex + j + 1
            setUploadProgress({
              current: currentIndex,
              total: totalProducts,
              status: `Saving item ${currentIndex} of ${totalProducts}...`
            })
          } catch (error) {
            console.error('Error saving product:', error)
          }
        }

        // Small delay between batches to prevent memory overflow
        if (i + batchSize < totalProducts) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      // Update local products array
      setProducts([...products, ...newProducts])

      setUploadMessage({
        type: 'success',
        text: `Successfully imported ${successCount} of ${totalProducts} product(s) from ${uploadFile.name}`
      })
      setUploadFile(null)
      setUploadProgress(null)
      setTimeout(() => setUploadMessage(null), 5000)
    } catch (error) {
      console.error('Bulk upload error:', error)
      setUploadMessage({
        type: 'error',
        text: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      setUploadFile(null)
      setUploadProgress(null)
    }
  }

  // If not logged in, show login/signup screen
  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #e8f2f7 0%, #f0f7fa 100%)' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '40px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#1a365d', textAlign: 'center' }}>PSPM</h1>
          <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>Platform Sales & Procurement</p>

          {/* Auth Mode Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <button
              onClick={() => {
                setAuthMode('login')
                setAuthError('')
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: authMode === 'login' ? 'transparent' : 'transparent',
                border: 'none',
                borderBottom: authMode === 'login' ? '2px solid #5b7c99' : 'transparent',
                color: authMode === 'login' ? '#5b7c99' : '#64748b',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: authMode === 'login' ? '600' : '500',
                transition: 'all 0.2s ease'
              }}
            >
              Login
            </button>
            <button
              onClick={() => {
                setAuthMode('signup')
                setAuthError('')
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: authMode === 'signup' ? 'transparent' : 'transparent',
                border: 'none',
                borderBottom: authMode === 'signup' ? '2px solid #5b7c99' : 'transparent',
                color: authMode === 'signup' ? '#5b7c99' : '#64748b',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: authMode === 'signup' ? '600' : '500',
                transition: 'all 0.2s ease'
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Login Form */}
          {authMode === 'login' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#64748b' }}>Email or Username</label>
                <input
                  type="text"
                  value={loginForm.emailOrUsername}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, emailOrUsername: e.target.value })
                    setAuthError('')
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your email or username"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#64748b' }}>Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, password: e.target.value })
                    setAuthError('')
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your password"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              {authError && (
                <div style={{ marginBottom: '16px', padding: '10px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626', fontSize: '12px' }}>
                  {authError}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: isLoading ? '#cbd5e1' : '#5b7c99',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#4a6fa5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#5b7c99'
                  }
                }}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </>
          )}

          {/* Signup Form */}
          {authMode === 'signup' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#64748b' }}>Email</label>
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => {
                    setSignupForm({ ...signupForm, email: e.target.value })
                    setAuthError('')
                  }}
                  placeholder="Enter your email"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#64748b' }}>Username</label>
                <input
                  type="text"
                  value={signupForm.username}
                  onChange={(e) => {
                    setSignupForm({ ...signupForm, username: e.target.value })
                    setAuthError('')
                  }}
                  placeholder="Choose a username"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#64748b' }}>Password</label>
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={(e) => {
                    setSignupForm({ ...signupForm, password: e.target.value })
                    setAuthError('')
                  }}
                  placeholder="Min 3 characters"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#64748b' }}>Confirm Password</label>
                <input
                  type="password"
                  value={signupForm.confirmPassword}
                  onChange={(e) => {
                    setSignupForm({ ...signupForm, confirmPassword: e.target.value })
                    setAuthError('')
                  }}
                  placeholder="Confirm your password"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              {authError && (
                <div style={{ marginBottom: '16px', padding: '10px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626', fontSize: '12px' }}>
                  {authError}
                </div>
              )}

              <button
                onClick={handleSignup}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: isLoading ? '#cbd5e1' : '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#15803d'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#16a34a'
                  }
                }}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </>
          )}

          <p style={{ margin: '16px 0 0 0', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
            {authMode === 'login' ? "Don't have an account? Click Sign Up tab" : 'Already have an account? Click Login tab'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#ffffff' }}>
      {/* Left Sidebar */}
      <aside style={{
        width: '250px',
        background: 'linear-gradient(180deg, #ffffff 0%, #f5f8fa 40%, #eef3f7 100%)',
        borderRight: '1px solid #d0dce6',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '24px',
        overflow: 'auto',
        boxShadow: 'inset -1px 0 3px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ padding: '0 24px', marginBottom: '48px' }}>
          <h1 style={{ margin: '0', fontSize: '18px', fontWeight: '800', color: '#000000', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>PSPM</h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#64748b', fontWeight: '500', letterSpacing: '0.2px' }}>User: <span style={{ fontWeight: '600', color: '#5b7c99' }}>{currentUser}</span></p>
        </div>

        <nav style={{ flex: 1 }}>
          <div
            style={{
              padding: '14px 18px',
              cursor: 'pointer',
              background: 'rgba(91, 124, 153, 0.12)',
              borderLeft: '4px solid #5b7c99',
              transition: 'all 0.3s ease',
              color: '#5b7c99',
              fontWeight: '700',
              fontSize: '13px',
              marginLeft: '8px',
              marginRight: '8px',
              borderRadius: '0 6px 6px 0',
              letterSpacing: '0.3px',
              boxShadow: 'inset 0 1px 2px rgba(91, 124, 153, 0.08)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(91, 124, 153, 0.18)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(91, 124, 153, 0.12)'
            }}
          >
            Warehouse
          </div>
        </nav>

        <div style={{ padding: '0 16px 28px 16px', borderTop: '1px solid rgba(2, 132, 199, 0.08)', marginTop: 'auto' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '11px 12px',
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '700',
              transition: 'all 0.25s ease',
              letterSpacing: '0.2px',
              textTransform: 'uppercase',
              boxShadow: '0 1px 2px rgba(220, 38, 38, 0.08)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fecaca'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fee2e2'
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(220, 38, 38, 0.08)'
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto', background: '#fafbff', display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar with Title */}
        <div style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#000000',
            margin: 0,
            letterSpacing: '-0.6px',
            textTransform: 'uppercase'
          }}>
            Warehouse Management
          </h1>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', letterSpacing: '0.2px' }}>
            User: <strong style={{ color: '#5b7c99', fontSize: '13px' }}>{currentUser}</strong>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          padding: '0 32px', 
          borderBottom: '1px solid #e2e8f0', 
          background: '#ffffff', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
        }}>
          <button
            onClick={() => setActiveSubmenu('products')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeSubmenu === 'products' ? '3px solid #5b7c99' : '2px solid transparent',
              padding: '18px 22px',
              cursor: 'pointer',
              color: activeSubmenu === 'products' ? '#5b7c99' : '#64748b',
              fontWeight: activeSubmenu === 'products' ? '700' : '600',
              fontSize: '13px',
              transition: 'all 0.25s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.3px'
            }}
            onMouseEnter={(e) => {
              if (activeSubmenu !== 'products') {
                e.currentTarget.style.color = '#5b7c99'
              }
            }}
            onMouseLeave={(e) => {
              if (activeSubmenu !== 'products') {
                e.currentTarget.style.color = '#64748b'
              }
            }}
          >
            All Products
          </button>

          <button
            onClick={() => setActiveSubmenu('upload')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeSubmenu === 'upload' ? '3px solid #5b7c99' : '2px solid transparent',
              padding: '18px 22px',
              cursor: 'pointer',
              color: activeSubmenu === 'upload' ? '#5b7c99' : '#64748b',
              fontWeight: activeSubmenu === 'upload' ? '700' : '600',
              fontSize: '13px',
              transition: 'all 0.25s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.3px'
            }}
            onMouseEnter={(e) => {
              if (activeSubmenu !== 'upload') {
                e.currentTarget.style.color = '#5b7c99'
              }
            }}
            onMouseLeave={(e) => {
              if (activeSubmenu !== 'upload') {
                e.currentTarget.style.color = '#64748b'
              }
            }}
          >
            Upload Portal
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
          {activeSubmenu === 'products' && (
            <div>
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ margin: '0 0 18px 0', fontSize: '22px', fontWeight: '800', color: '#5b7c99', letterSpacing: '-0.3px', textTransform: 'uppercase' }}>All Products ({products.length})</h2>
                <input
                  type="text"
                  placeholder="Search by product name or part number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    width: '100%', 
                    maxWidth: '500px', 
                    padding: '12px 16px', 
                    border: '1px solid #d0dce6', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    color: '#1a365d', 
                    background: '#ffffff', 
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.25s ease',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#5b7c99'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(2, 132, 199, 0.12), inset 0 0 0 3px rgba(2, 132, 199, 0.08)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d0dce6'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)'
                  }}
                />
              </div>
              
              {products.length === 0 ? (
                <div style={{ padding: '48px 32px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)' }}>
                  <p style={{ color: '#64748b', margin: '0', fontSize: '14px', lineHeight: '1.6' }}>No products uploaded yet. Use the Upload Portal to add products.</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#64748b', margin: '0', fontSize: '14px' }}>No products match your search. Try different keywords.</p>
                </div>
              ) : (
                <div>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#475569', borderRight: '1px solid #e2e8f0', width: '40px', letterSpacing: '0.3px' }}>
                            <input
                              type="checkbox"
                              checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProducts.has(p.id))}
                              onChange={() => {
                                const newSelected = new Set(selectedProducts)
                                paginatedProducts.forEach(p => {
                                  if (paginatedProducts.every(pr => selectedProducts.has(pr.id))) {
                                    newSelected.delete(p.id)
                                  } else {
                                    newSelected.add(p.id)
                                  }
                                })
                                setSelectedProducts(newSelected)
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                          </th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderRight: '1px solid #e2e8f0' }}>Image</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderRight: '1px solid #e2e8f0' }}>Product Name</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderRight: '1px solid #e2e8f0' }}>Part Number</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', borderRight: '1px solid #e2e8f0' }}>Price</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', borderRight: '1px solid #e2e8f0' }}>Currency</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', borderRight: '1px solid #e2e8f0' }}>Qty</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderRight: '1px solid #e2e8f0' }}>Stock</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProducts.map((product, index) => (
                          <tr key={product.id} style={{ borderBottom: index < paginatedProducts.length - 1 ? '1px solid #f1f5f9' : 'none', background: index % 2 === 0 ? '#ffffff' : '#f9fafb', opacity: selectedProducts.has(product.id) ? 0.7 : 1 }}>
                            <td style={{ padding: '12px 16px', textAlign: 'center', borderRight: '1px solid #e2e8f0', width: '40px' }}>
                              <input
                                type="checkbox"
                                checked={selectedProducts.has(product.id)}
                                onChange={() => handleSelectProduct(product.id)}
                                style={{ cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                              {editingProductId === product.id ? (
                                <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        const reader = new FileReader()
                                        reader.onload = (event) => {
                                          setEditingData({ ...editingData, image: event.target?.result as string })
                                        }
                                        reader.readAsDataURL(file)
                                      }
                                    }}
                                    style={{ display: 'none' }}
                                  />
                                  <div style={{ width: '40px', height: '40px', background: editingData.image || product.image ? '#f1f5f9' : '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b7c99', fontSize: '20px', border: '2px solid #5b7c99', cursor: 'pointer', overflow: 'hidden' }}>
                                    {editingData.image || product.image ? (
                                      <img src={editingData.image || product.image} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <span></span>
                                    )}
                                  </div>
                                </label>
                              ) : (
                                <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '12px', overflow: 'hidden' }}>
                                  {product.image ? (
                                    <img src={product.image} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    'No image'
                                  )}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1a365d', fontWeight: '500', borderRight: '1px solid #e2e8f0' }}>
                              {editingProductId === product.id ? (
                                <input
                                  type="text"
                                  value={editingData.name || product.name}
                                  onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                                  style={{ width: '100%', padding: '6px', border: '1px solid #5b7c99', borderRadius: '4px', fontSize: '13px' }}
                                />
                              ) : (
                                product.name
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', borderRight: '1px solid #e2e8f0' }}>
                              {editingProductId === product.id ? (
                                <input
                                  type="text"
                                  value={editingData.partNumber || product.partNumber}
                                  onChange={(e) => setEditingData({ ...editingData, partNumber: e.target.value })}
                                  style={{ width: '100%', padding: '6px', border: '1px solid #5b7c99', borderRadius: '4px', fontSize: '13px' }}
                                />
                              ) : (
                                product.partNumber
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#1a365d', fontWeight: '500', borderRight: '1px solid #e2e8f0' }}>
                              {editingProductId === product.id ? (
                                <input
                                  type="number"
                                  value={editingData.price || product.price}
                                  onChange={(e) => setEditingData({ ...editingData, price: parseFloat(e.target.value) })}
                                  style={{ width: '80px', padding: '6px', border: '1px solid #5b7c99', borderRadius: '4px', fontSize: '13px' }}
                                />
                              ) : (
                                (() => {
                                  const currencyData = CURRENCY_OPTIONS.find(c => c.code === (product.currency || 'USD'))
                                  const symbol = currencyData?.symbol || '$'
                                  return `${symbol}${product.price.toFixed(2)}`
                                })()
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#1a365d', fontWeight: '500', borderRight: '1px solid #e2e8f0' }}>
                              {editingProductId === product.id ? (
                                <select
                                  value={editingData.currency || product.currency || 'USD'}
                                  onChange={(e) => setEditingData({ ...editingData, currency: e.target.value })}
                                  style={{ width: '100%', padding: '6px', border: '1px solid #5b7c99', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}
                                >
                                  {CURRENCY_OPTIONS.map((curr) => (
                                    <option key={curr.code} value={curr.code}>
                                      {curr.code}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                product.currency || 'USD'
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#1a365d', fontWeight: '500', borderRight: '1px solid #e2e8f0' }}>
                              {editingProductId === product.id ? (
                                <input
                                  type="number"
                                  value={editingData.qty ?? product.qty}
                                  onChange={(e) => setEditingData({ ...editingData, qty: parseInt(e.target.value) })}
                                  style={{ width: '60px', padding: '6px', border: '1px solid #5b7c99', borderRadius: '4px', fontSize: '13px' }}
                                />
                              ) : (
                                product.qty
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', borderRight: '1px solid #e2e8f0' }}>
                              <span style={{ background: product.stock === 'In Stock' ? '#dcfce7' : product.stock === 'Low Stock' ? '#fef3c7' : '#fee2e2', color: product.stock === 'In Stock' ? '#16a34a' : product.stock === 'Low Stock' ? '#d97706' : '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                                {product.stock}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              {editingProductId === product.id ? (
                                <>
                                  <button
                                    onClick={() => handleEditProduct(product.id, { ...editingData, stock: (editingData.qty || product.qty) > 0 ? 'In Stock' : 'Out of Stock' })}
                                    style={{ padding: '4px 10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => { setEditingProductId(null); setEditingData({}) }}
                                    style={{ padding: '4px 10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => { setEditingProductId(product.id); setEditingData({}) }}
                                  style={{ padding: '4px 10px', background: '#5b7c99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Showing {paginatedProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} results</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        style={{ padding: '6px 12px', background: currentPage === 1 ? '#e2e8f0' : '#5b7c99', color: currentPage === 1 ? '#94a3b8' : 'white', border: 'none', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '500' }}
                      >
                        Previous
                      </button>
                      {generatePageNumbers(currentPage, totalPages).map((page, index) => {
                        if (page === '...') {
                          return (
                            <span key={`ellipsis-${index}`} style={{ padding: '6px 0', color: '#94a3b8', fontSize: '12px' }}>...</span>
                          )
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page as number)}
                            style={{ padding: '6px 12px', background: currentPage === page ? '#5b7c99' : '#ffffff', color: currentPage === page ? 'white' : '#5b7c99', border: `1px solid ${currentPage === page ? '#5b7c99' : '#e2e8f0'}`, borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                          >
                            {page}
                          </button>
                        )
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        style={{ padding: '6px 12px', background: currentPage === totalPages ? '#e2e8f0' : '#5b7c99', color: currentPage === totalPages ? '#94a3b8' : 'white', border: 'none', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '500' }}
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation Modal */}
                  {confirmDelete.show && (
                    <div style={{ padding: '16px', background: '#fee2e2', borderTop: '1px solid #fca5a5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px', marginBottom: '16px' }}>
                      <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500' }}>Are you sure you want to delete {confirmDelete.count} item{confirmDelete.count > 1 ? 's' : ''}? This action cannot be undone.</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            confirmDeleteAction(Array.from(selectedProducts))
                          }}
                          style={{ padding: '6px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ show: false, count: 0 })}
                          style={{ padding: '6px 16px', background: '#ffffff', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bulk Delete Button */}
                  {selectedProducts.size > 0 && !confirmDelete.show && (
                    <div style={{ padding: '16px', background: '#fee2e2', borderTop: '1px solid #fca5a5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
                      <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500' }}>{selectedProducts.size} product(s) selected</span>
                      <button
                        onClick={() => handleDeleteProducts(Array.from(selectedProducts))}
                        style={{ padding: '6px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                      >
                        Delete Selected
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeSubmenu === 'upload' && (
            <div>
              <h2 style={{ margin: '0 0 28px 0', fontSize: '24px', fontWeight: '800', color: '#5b7c99', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>Upload Portal</h2>

              {uploadMessage && (
                <div style={{ marginBottom: '24px', padding: '14px 18px', background: uploadMessage.type === 'success' ? '#dcfce7' : '#fee2e2', border: `2px solid ${uploadMessage.type === 'success' ? '#86efac' : '#fca5a5'}`, borderRadius: '8px', color: uploadMessage.type === 'success' ? '#15803d' : '#dc2626', fontSize: '13px', fontWeight: '600', boxShadow: `0 2px 8px ${uploadMessage.type === 'success' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)'}` }}>
                  {uploadMessage.text}
                </div>
              )}

              {/* Upload Type Selector - Premium Buttons */}
              <div style={{ marginBottom: '28px', display: 'flex', gap: '12px', background: 'linear-gradient(135deg, #f8fafc 0%, #f0f7fa 100%)', padding: '8px', borderRadius: '10px', border: '1px solid #d0dce6', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)' }}>
                <button
                  onClick={() => setUploadType('single')}
                  style={{
                    flex: 1,
                    padding: '13px 18px',
                    background: uploadType === 'single' ? 'linear-gradient(135deg, #5b7c99 0%, #4a6fa5 100%)' : 'transparent',
                    color: uploadType === 'single' ? '#ffffff' : '#64748b',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: uploadType === 'single' ? '700' : '600',
                    transition: 'all 0.25s ease',
                    boxShadow: uploadType === 'single' ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}
                  onMouseEnter={(e) => {
                    if (uploadType !== 'single') {
                      e.currentTarget.style.background = 'rgba(2, 132, 199, 0.08)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (uploadType !== 'single') {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  Single Product
                </button>
                <button
                  onClick={() => setUploadType('bulk')}
                  style={{
                    flex: 1,
                    padding: '13px 18px',
                    background: uploadType === 'bulk' ? 'linear-gradient(135deg, #5b7c99 0%, #4a6fa5 100%)' : 'transparent',
                    color: uploadType === 'bulk' ? '#ffffff' : '#64748b',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: uploadType === 'bulk' ? '700' : '600',
                    transition: 'all 0.25s ease',
                    boxShadow: uploadType === 'bulk' ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}
                  onMouseEnter={(e) => {
                    if (uploadType !== 'bulk') {
                      e.currentTarget.style.background = 'rgba(2, 132, 199, 0.08)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (uploadType !== 'bulk') {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  Bulk Upload
                </button>
              </div>

              {/* Single Product Upload */}
              {uploadType === 'single' && (
                <div style={{ background: '#ffffff', border: '1px solid #d0dce6', borderRadius: '12px', padding: '32px', marginBottom: '28px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)' }}>
                  <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '800', color: '#5b7c99', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Add Single Product</h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Product Name *</label>
                      <input
                        type="text"
                        value={singleProduct.name}
                        onChange={(e) => setSingleProduct({ ...singleProduct, name: e.target.value })}
                        placeholder="e.g., PD/DD Filter Kit"
                        style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0dce6', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff', transition: 'all 0.25s ease', fontWeight: '500' }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#5b7c99'
                          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(2, 132, 199, 0.1), inset 0 0 0 1px rgba(2, 132, 199, 0.1)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d0dce6'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Part Number *</label>
                      <input
                        type="text"
                        value={singleProduct.partNumber}
                        onChange={(e) => setSingleProduct({ ...singleProduct, partNumber: e.target.value })}
                        placeholder="e.g., 0000000338"
                        style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0dce6', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff', transition: 'all 0.25s ease', fontWeight: '500' }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#5b7c99'
                          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(2, 132, 199, 0.1), inset 0 0 0 1px rgba(2, 132, 199, 0.1)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d0dce6'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Price</label>
                      <input
                        type="number"
                        value={singleProduct.price}
                        onChange={(e) => setSingleProduct({ ...singleProduct, price: e.target.value })}
                        placeholder="0.00"
                        step="0.01"
                        style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0dce6', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff', transition: 'all 0.25s ease', fontWeight: '500' }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#5b7c99'
                          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(2, 132, 199, 0.1), inset 0 0 0 1px rgba(2, 132, 199, 0.1)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d0dce6'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Currency</label>
                      <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0dce6', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box', transition: 'all 0.25s ease', fontWeight: '500', color: '#1a365d', background: '#ffffff', cursor: 'pointer' }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#5b7c99'
                          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(2, 132, 199, 0.1), inset 0 0 0 1px rgba(2, 132, 199, 0.1)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d0dce6'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        {CURRENCY_OPTIONS.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.code} - {curr.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Quantity</label>
                      <input
                        type="number"
                        value={singleProduct.qty}
                        onChange={(e) => setSingleProduct({ ...singleProduct, qty: e.target.value })}
                        placeholder="0"
                        style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0dce6', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box', transition: 'all 0.25s ease', fontWeight: '500' }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#5b7c99'
                          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(2, 132, 199, 0.1), inset 0 0 0 1px rgba(2, 132, 199, 0.1)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d0dce6'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Stock Status</label>
                      <select
                        value={singleProduct.stock}
                        onChange={(e) => setSingleProduct({ ...singleProduct, stock: e.target.value })}
                        style={{ width: '100%', padding: '11px 14px', border: '1px solid #d0dce6', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box', transition: 'all 0.25s ease', fontWeight: '500', color: '#1a365d', background: '#ffffff', cursor: 'pointer' }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#5b7c99'
                          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(2, 132, 199, 0.1), inset 0 0 0 1px rgba(2, 132, 199, 0.1)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d0dce6'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <option>In Stock</option>
                        <option>Out of Stock</option>
                        <option>Low Stock</option>
                      </select>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Product Image</label>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                setSingleProductImage(event.target?.result as string)
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                        <div style={{ width: '90px', height: '90px', background: singleProductImage ? '#f1f5f9' : '#f0f7fa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b7c99', fontSize: '28px', border: '2px dashed #d0dce6', cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#5b7c99'
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(2, 132, 199, 0.12)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#d0dce6'
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.03)'
                          }}
                        >
                          {singleProductImage ? (
                            <img src={singleProductImage} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '36px' }}></span>
                          )}
                        </div>
                      </label>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5', fontWeight: '500' }}>Click the image box to upload a product image</p>
                        {singleProductImage && (
                          <button
                            onClick={() => setSingleProductImage('')}
                            style={{ padding: '7px 14px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '0.2px' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#fecaca'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#fee2e2'
                            }}
                          >
                            Remove Image
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSingleProductUpload}
                    style={{
                      background: 'linear-gradient(135deg, #5b7c99 0%, #4a6fa5 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '700',
                      transition: 'all 0.25s ease',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(2, 132, 199, 0.28)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.2)'
                      e.currentTarget.style.transform = 'translateY(0px)'
                    }}
                  >
                    Add Product
                  </button>
                </div>
              )}

              {/* Bulk Upload */}
              {uploadType === 'bulk' && (
                <div style={{ background: '#ffffff', border: '1px solid #d0dce6', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)' }}>
                  <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '800', color: '#5b7c99', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Bulk Upload</h3>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Select File (PDF or Excel)</label>
                    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                      <input
                        type="file"
                        accept=".pdf,.xls,.xlsx"
                        onChange={handleBulkFileUpload}
                        style={{ position: 'absolute', opacity: '0', width: '100%', height: '100%', cursor: 'pointer' }}
                      />
                      <div style={{ padding: '32px', border: '2px dashed #d0dce6', borderRadius: '10px', textAlign: 'center', background: '#f8fafc', cursor: 'pointer', transition: 'all 0.25s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0f7fa'
                          e.currentTarget.style.borderColor = '#5b7c99'
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(2, 132, 199, 0.12)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f8fafc'
                          e.currentTarget.style.borderColor = '#d0dce6'
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.02)'
                        }}
                      >
                        <p style={{ color: '#5b7c99', margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700' }}>
                          {uploadFile ? `${uploadFile.name}` : 'Click to select file'}
                        </p>
                        <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>or drag your file here</p>
                        <p style={{ color: '#94a3b8', margin: '6px 0 0 0', fontSize: '12px', letterSpacing: '0.2px', textTransform: 'uppercase' }}>Supported: PDF, XLS, XLSX</p>
                      </div>
                    </div>
                  </div>

                  {uploadProgress && (
                    <div style={{ marginBottom: '24px', padding: '18px', background: 'linear-gradient(135deg, #f3f6f9 0%, #e0f2fe 100%)', border: '1px solid #bae6fd', borderRadius: '10px', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#5b7c99', textTransform: 'uppercase', letterSpacing: '0.2px' }}>{uploadProgress.status}</span>
                        <span style={{ fontSize: '12px', color: '#5b7c99', fontWeight: '600' }}>{uploadProgress.current} / {uploadProgress.total}</span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: '#bae6fd', borderRadius: '6px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                        <div
                          style={{
                            width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #5b7c99 0%, #4a6fa5 100%)',
                            transition: 'width 0.3s ease',
                            boxShadow: '0 0 8px rgba(2, 132, 199, 0.3)'
                          }}
                        />
                      </div>
                      <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Processing... Do not close this page or refresh browser</p>
                    </div>
                  )}

                  <button
                    onClick={handleProcessBulkUpload}
                    disabled={!uploadFile || uploadProgress !== null}
                    style={{
                      background: uploadFile && !uploadProgress ? 'linear-gradient(135deg, #5b7c99 0%, #4a6fa5 100%)' : '#cbd5e1',
                      color: '#ffffff',
                      border: 'none',
                      padding: '13px 28px',
                      borderRadius: '8px',
                      cursor: uploadFile && !uploadProgress ? 'pointer' : 'not-allowed',
                      fontSize: '13px',
                      fontWeight: '700',
                      transition: 'all 0.25s ease',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      boxShadow: uploadFile && !uploadProgress ? '0 4px 12px rgba(2, 132, 199, 0.2)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (uploadFile && !uploadProgress) {
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(2, 132, 199, 0.28)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (uploadFile && !uploadProgress) {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.2)'
                        e.currentTarget.style.transform = 'translateY(0px)'
                      }
                    }}
                  >
                    {uploadProgress ? 'Processing...' : 'Process Upload'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
