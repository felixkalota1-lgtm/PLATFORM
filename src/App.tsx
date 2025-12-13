import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Lazy imports for module pages
import MarketplaceModule from './modules/marketplace'
import SalesAndProcurementPage from './modules/sales'
import InventoryModule from './modules/inventory'
import WarehouseModule from './modules/warehouse'

// Route persistence wrapper component
function RouteWrapper() {
  const navigate = useNavigate()
  const location = useLocation()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // On first load, check if there's a saved route
    if (!initialized) {
      const savedRoute = localStorage.getItem('pspm_last_route')
      if (savedRoute && location.pathname === '/') {
        // Redirect to saved route if we're at root
        navigate(savedRoute, { replace: true })
      }
      setInitialized(true)
    }
  }, [])

  // Save current route whenever location changes
  useEffect(() => {
    if (location.pathname !== '/login') {
      localStorage.setItem('pspm_last_route', location.pathname)
    }
  }, [location])

  return null
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('pspm_user')
    if (savedUser) {
      try {
        JSON.parse(savedUser)
        setIsAuthenticated(true)
      } catch (e) {
        localStorage.removeItem('pspm_user')
      }
    }
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="text-white text-center">
          <h1 className="text-5xl font-bold mb-4">Platform Sales & Procurement</h1>
          <p className="text-xl mb-8">Initializing...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    )
  }

  // Debug: Log auth state
  console.log('isAuthenticated:', isAuthenticated, 'user:', localStorage.getItem('pspm_user'))

  return (
    <Router>
      <RouteWrapper />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/marketplace/*" element={<MarketplaceModule />} />
                  <Route path="/sales-procurement/*" element={<SalesAndProcurementPage />} />
                  <Route path="/inventory/*" element={<InventoryModule />} />
                  <Route path="/warehouse/*" element={<WarehouseModule />} />
                  <Route path="/logistics/*" element={<div className="p-6"><h1>Logistics Module</h1></div>} />
                  <Route path="/hr/*" element={<div className="p-6"><h1>HR Module</h1></div>} />
                  <Route path="/accounting/*" element={<div className="p-6"><h1>Accounting Module</h1></div>} />
                  <Route path="/analytics/*" element={<div className="p-6"><h1>Analytics Module</h1></div>} />
                  <Route path="/communication/*" element={<div className="p-6"><h1>Communication Module</h1></div>} />
                  <Route path="/settings/*" element={<div className="p-6"><h1>Settings Module</h1></div>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            ) : (
              <LoginPage />
            )
          }
        />
      </Routes>
    </Router>
  )
}

export default App
