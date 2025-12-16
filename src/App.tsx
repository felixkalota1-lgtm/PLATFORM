import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import WarehouseManagementPage from './pages/WarehouseManagementPage'
import SendGoodsPage from './pages/SendGoodsPage'
import BranchStockViewPage from './pages/BranchStockViewPage'
import Settings from './pages/Settings'
import AIEmailAssistant from './pages/AIEmailAssistant'
import B2BOrdersPage from './pages/B2BOrdersPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import VendorManagementPage from './pages/VendorManagementPage'
import SalesQuotationsPage from './pages/SalesQuotationsPage'
import ProcurementRequestsPage from './pages/ProcurementRequestsPage'
import Layout from './components/Layout'
import { WorkloadThemeProvider } from './contexts/WorkloadThemeContext'
import { SettingsProvider } from './contexts/SettingsContext'
import './styles/weatherTheme.css'

// Lazy imports for module pages
import MarketplaceModule from './modules/marketplace'
import SalesAndProcurementPage from './modules/sales'
import InventoryModule from './modules/inventory'
import WarehouseModule from './modules/warehouse'
import ProcurementModule from './modules/procurement'
import HRModule from './modules/hr'
import AccountingModule from './modules/accounting'
import CommunicationModule from './modules/communication'
import LogisticsModule from './modules/logistics'
import AnalyticsModule from './modules/analytics'
import DocumentManagementModule from './modules/document-management'
import FleetTrackingModule from './modules/fleet-tracking'
import InquiryModule from './modules/inquiry'
import AdvancedAccountingModule from './modules/advanced-accounting'
import CompanyFilesModule from './modules/company-files'
import QualityControlModule from './modules/quality-control'
import CustomerManagementModule from './modules/customer-management'
import ReturnsComplaintsModule from './modules/returns-complaints'
import BudgetFinanceModule from './modules/budget-finance'
import InventoryAdjustmentsModule from './modules/inventory-adjustments'
import BranchManagementModule from './modules/branch-management'
import SupplierOrdersModule from './modules/supplier-orders'
import AssetManagementModule from './modules/asset-management'
import ReportingDashboardsModule from './modules/reporting-dashboards'

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

    // Listen for storage changes (when login happens in another tab or window)
    const handleStorageChange = () => {
      const user = localStorage.getItem('pspm_user')
      setIsAuthenticated(!!user)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
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
    <SettingsProvider>
      <WorkloadThemeProvider>
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
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/ai-email" element={<AIEmailAssistant />} />
                      <Route path="/warehouse-management" element={<WarehouseManagementPage />} />
                      <Route path="/send-goods" element={<SendGoodsPage />} />
                      {/* Dedicated Procurement & Sales Pages */}
                      <Route path="/b2b-orders" element={<B2BOrdersPage />} />
                      <Route path="/order-tracking" element={<OrderTrackingPage />} />
                      <Route path="/vendor-management" element={<VendorManagementPage />} />
                      <Route path="/sales-quotations" element={<SalesQuotationsPage />} />
                      <Route path="/procurement-requests" element={<ProcurementRequestsPage />} />
                      {/* Module Routes */}
                      <Route path="/marketplace/*" element={<MarketplaceModule />} />
                      <Route path="/procurement/*" element={<ProcurementModule />} />
                      <Route path="/sales-procurement/*" element={<SalesAndProcurementPage />} />
                      <Route path="/inventory/*" element={<InventoryModule />} />
                      <Route path="/warehouse/*" element={<WarehouseModule />} />
                      <Route path="/logistics/*" element={<LogisticsModule />} />
                      <Route path="/hr/*" element={<HRModule />} />
                      <Route path="/accounting/*" element={<AccountingModule />} />
                      <Route path="/advanced-accounting/*" element={<AdvancedAccountingModule />} />
                      <Route path="/analytics/*" element={<AnalyticsModule />} />
                      <Route path="/company-files/*" element={<CompanyFilesModule />} />
                      <Route path="/communication/*" element={<CommunicationModule />} />
                      <Route path="/fleet-tracking/*" element={<FleetTrackingModule />} />
                      <Route path="/inquiry/*" element={<InquiryModule />} />
                      <Route path="/documents/*" element={<DocumentManagementModule />} />
                      {/* New Integrated Modules Routes */}
                      <Route path="/quality-control/*" element={<QualityControlModule />} />
                      <Route path="/customer-management/*" element={<CustomerManagementModule />} />
                      <Route path="/returns-complaints/*" element={<ReturnsComplaintsModule />} />
                      <Route path="/budget-finance/*" element={<BudgetFinanceModule />} />
                      <Route path="/inventory-adjustments/*" element={<InventoryAdjustmentsModule />} />
                      <Route path="/branch-management/*" element={<BranchManagementModule />} />
                      <Route path="/supplier-orders/*" element={<SupplierOrdersModule />} />
                      <Route path="/asset-management/*" element={<AssetManagementModule />} />
                      <Route path="/reporting-dashboards/*" element={<ReportingDashboardsModule />} />
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
      </WorkloadThemeProvider>
    </SettingsProvider>
  )
}

export default App
