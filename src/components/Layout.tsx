import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import DashboardPage from '../pages/DashboardPage'
import MarketplacePage from '../modules/marketplace'
import ProcurementPage from '../modules/procurement'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/procurement" element={<ProcurementPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
