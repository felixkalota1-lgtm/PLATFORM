import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AccessDeniedPage from './pages/AccessDeniedPage'
import UserProfilePage from './pages/UserProfilePage'
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
import InventoryManagementPage from './pages/InventoryManagementPage'
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

/**
 * Module-level access control wrapper
 */
const ModuleRoute: React.FC<{ children: React.ReactNode; module: string }> = ({ children, module }) => {
  const { user, loading, canAccess } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - use Route's own redirect
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check module access
  if (!canAccess(module)) {
    // Use navigate to ensure clean transition
    navigate('/access-denied', { replace: true })
    return null
  }

  return <>{children}</>
}

// Route persistence wrapper component
function RouteWrapper() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading } = useAuth()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Only run after auth finishes loading
    if (loading) return

    // On first load, check if there's a saved route for authenticated users
    if (!initialized && user) {
      const savedRoute = localStorage.getItem('pspm_last_route')
      if (savedRoute && location.pathname === '/') {
        // Redirect to saved route if we're at root
        navigate(savedRoute, { replace: true })
      }
      setInitialized(true)
    } else if (!initialized && !user) {
      setInitialized(true)
    }
  }, [loading, user, initialized, location.pathname, navigate])

  // Save current route whenever location changes (only for authenticated users)
  useEffect(() => {
    if (user && location.pathname !== '/login' && location.pathname !== '/access-denied') {
      localStorage.setItem('pspm_last_route', location.pathname)
    }
  }, [location, user])

  return null
}

/**
 * Auth Guard Component - Ensures user is authenticated before showing content
 */
function AuthGuard() {
  const { loading } = useAuth()
  const location = useLocation()

  // Show loading screen while auth state is being determined
  if (loading && location.pathname !== '/login' && location.pathname !== '/access-denied') {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="text-white text-center">
          <h1 className="text-5xl font-bold mb-4">Platform Sales & Procurement</h1>
          <p className="text-xl mb-8">Loading...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    )
  }

  return null
}

function App() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
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

  return (
    <SettingsProvider>
      <WorkloadThemeProvider>
        <Router>
          <RouteWrapper />
          <AuthGuard />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/access-denied" element={<AccessDeniedPage />} />

            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    {/* Dashboard & Profile */}
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/profile" element={<UserProfilePage />} />
                    <Route path="/settings" element={<Settings />} />

                    {/* Communication & AI */}
                    <Route path="/ai-email" element={<AIEmailAssistant />} />

                    {/* Legacy Pages */}
                    <Route path="/warehouse-management" element={<WarehouseManagementPage />} />
                    <Route path="/inventory-management" element={<InventoryManagementPage />} />
                    <Route path="/send-goods" element={<SendGoodsPage />} />
                    <Route path="/branch-stock-view" element={<BranchStockViewPage />} />

                    {/* Dedicated Pages */}
                    <Route path="/b2b-orders" element={<B2BOrdersPage />} />
                    <Route path="/order-tracking" element={<OrderTrackingPage />} />
                    <Route path="/vendor-management" element={<VendorManagementPage />} />
                    <Route path="/sales-quotations" element={<SalesQuotationsPage />} />
                    <Route path="/procurement-requests" element={<ProcurementRequestsPage />} />

                    {/* Module Routes with RBAC */}
                    <Route
                      path="/marketplace/*"
                      element={
                        <ModuleRoute module="marketplace">
                          <MarketplaceModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/procurement/*"
                      element={
                        <ModuleRoute module="procurement">
                          <ProcurementModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/sales-procurement/*"
                      element={
                        <ModuleRoute module="sales">
                          <SalesAndProcurementPage />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/inventory/*"
                      element={
                        <ModuleRoute module="inventory">
                          <InventoryModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/warehouse/*"
                      element={
                        <ModuleRoute module="warehouse">
                          <WarehouseModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/logistics/*"
                      element={
                        <ModuleRoute module="logistics">
                          <LogisticsModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/hr/*"
                      element={
                        <ModuleRoute module="hr">
                          <HRModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/accounting/*"
                      element={
                        <ModuleRoute module="accounting">
                          <AccountingModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/advanced-accounting/*"
                      element={
                        <ModuleRoute module="accounting">
                          <AdvancedAccountingModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/analytics/*"
                      element={
                        <ModuleRoute module="analytics">
                          <AnalyticsModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/company-files/*"
                      element={
                        <ModuleRoute module="dashboard">
                          <CompanyFilesModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/communication/*"
                      element={
                        <ModuleRoute module="communication">
                          <CommunicationModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/fleet-tracking/*"
                      element={
                        <ModuleRoute module="fleet">
                          <FleetTrackingModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/inquiry/*"
                      element={
                        <ModuleRoute module="dashboard">
                          <InquiryModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/documents/*"
                      element={
                        <ModuleRoute module="dashboard">
                          <DocumentManagementModule />
                        </ModuleRoute>
                      }
                    />

                    {/* Integrated Modules with RBAC */}
                    <Route
                      path="/quality-control/*"
                      element={
                        <ModuleRoute module="warehouse">
                          <QualityControlModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/customer-management/*"
                      element={
                        <ModuleRoute module="marketplace">
                          <CustomerManagementModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/returns-complaints/*"
                      element={
                        <ModuleRoute module="orders">
                          <ReturnsComplaintsModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/budget-finance/*"
                      element={
                        <ModuleRoute module="accounting">
                          <BudgetFinanceModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/inventory-adjustments/*"
                      element={
                        <ModuleRoute module="inventory">
                          <InventoryAdjustmentsModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/branch-management/*"
                      element={
                        <ModuleRoute module="warehouse">
                          <BranchManagementModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/supplier-orders/*"
                      element={
                        <ModuleRoute module="procurement">
                          <SupplierOrdersModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/asset-management/*"
                      element={
                        <ModuleRoute module="warehouse">
                          <AssetManagementModule />
                        </ModuleRoute>
                      }
                    />
                    <Route
                      path="/reporting-dashboards/*"
                      element={
                        <ModuleRoute module="analytics">
                          <ReportingDashboardsModule />
                        </ModuleRoute>
                      }
                    />

                    {/* 404 Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </Router>
      </WorkloadThemeProvider>
    </SettingsProvider>
  )
}

export default App
