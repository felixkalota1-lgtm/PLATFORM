import { useState } from 'react'
import { ChevronRight, BarChart3, ShoppingCart, Package, Truck, Users, FileText, MessageSquare, Settings, X, CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWorkloadTheme } from '../contexts/WorkloadThemeContext'

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

interface MenuItem {
  label: string
  icon?: React.ReactNode
  href?: string
  submenu?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: <BarChart3 size={20} />,
    href: '/',
  },
  {
    label: 'Marketplace',
    icon: <ShoppingCart size={20} />,
    submenu: [
      { label: 'Browse Products', href: '/marketplace' },
      { label: 'My Cart', href: '/marketplace/cart' },
      { label: 'Saved Vendors', href: '/marketplace/saved-vendors' },
    ],
  },
  {
    label: 'Inventory',
    icon: <Package size={20} />,
    submenu: [
      { label: 'Products and Services', href: '/inventory/products' },
      { label: 'Bulk Upload', href: '/inventory/bulk-upload' },
      { label: 'Stock Levels', href: '/inventory/stock' },
      { label: 'Branch Inventory', href: '/warehouse/products' },
    ],
  },
  {
    label: 'Sales & Procurement',
    icon: <ShoppingCart size={20} />,
    submenu: [
      { label: 'Dashboard', href: '/procurement' },
      { label: 'B2B Orders', href: '/b2b-orders' },
      { label: 'Order Tracking', href: '/order-tracking' },
      { label: 'Vendor Management', href: '/vendor-management' },
      { label: 'Sales Quotations', href: '/sales-quotations' },
      { label: 'Procurement Requests', href: '/procurement-requests' },
      { label: 'Search & Inquire', href: '/sales-procurement/inquiries' },
    ],
  },
  {
    label: 'Warehouse',
    icon: <Package size={20} />,
    submenu: [
      { label: 'Warehouse Upload Portal', href: '/warehouse/upload-portal' },
      { label: 'Stock Transfer Manager', href: '/warehouse/transfer' },
      { label: 'Warehouse Analytics', href: '/warehouse/analytics' },
      { label: 'Warehouse Map', href: '/warehouse/map' },
      { label: 'Locations', href: '/warehouse/locations' },
      { label: 'Manage Warehouses', href: '/warehouse/manage' },
      { label: 'Send Goods', href: '/warehouse/send' },
    ],
  },
  {
    label: 'Logistics & Fleet',
    icon: <Truck size={20} />,
    submenu: [
      { label: 'Fleet Vehicles', href: '/logistics/fleet' },
      { label: 'Company Equipment', href: '/logistics/company-vehicles' },
      { label: 'Shipments', href: '/logistics/shipments' },
      { label: 'Vehicle Tracking', href: '/logistics/tracking' },
    ],
  },
  {
    label: 'Accounting',
    icon: <CreditCard size={20} />,
    submenu: [
      { label: 'Chart of Accounts', href: '/accounting/accounts' },
      { label: 'Invoices', href: '/accounting/invoices' },
      { label: 'Receivables', href: '/accounting/receivables' },
      { label: 'Bills', href: '/accounting/bills' },
      { label: 'Payables', href: '/accounting/payables' },
      { label: 'Expenses', href: '/accounting/expenses' },
      { label: 'Bank Transactions', href: '/accounting/bank' },
      { label: 'Tax Management', href: '/accounting/tax' },
      { label: 'Budget Planning', href: '/accounting/budget' },
      { label: 'Reports', href: '/accounting/reports' },
    ],
  },
  {
    label: 'HR & Payroll',
    icon: <Users size={20} />,
    submenu: [
      { label: 'Employees', href: '/hr/employees' },
      { label: 'Attendance', href: '/hr/attendance' },
      { label: 'Payroll', href: '/hr/payroll' },
      { label: 'Contracts', href: '/hr/contracts' },
      { label: 'Job Postings', href: '/hr/jobs' },
      { label: 'Departments', href: '/hr/departments' },
    ],
  },
  {
    label: 'Analytics',
    icon: <BarChart3 size={20} />,
    submenu: [
      { label: 'Sales Report', href: '/analytics/sales' },
      { label: 'Inventory Report', href: '/analytics/inventory' },
      { label: 'Financial Report', href: '/analytics/financial' },
      { label: 'Performance', href: '/analytics/performance' },
    ],
  },
  {
    label: 'Company Files',
    icon: <FileText size={20} />,
    submenu: [
      { label: 'Company Files', href: '/company-files/letters' },
      { label: 'Equipment', href: '/company-files/equipment' },
    ],
  },
  {
    label: 'Communication',
    icon: <MessageSquare size={20} />,
    submenu: [
      { label: 'Messages', href: '/communication/messages' },
      { label: 'Teams', href: '/communication/teams' },
      { label: 'Notifications', href: '/communication/notifications' },
    ],
  },
  {
    label: 'Settings',
    icon: <Settings size={20} />,
    submenu: [
      { label: 'Settings', href: '/settings' },
    ],
  },
]

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const { theme } = useWorkloadTheme()

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative w-64 h-screen text-white overflow-y-auto transition-all duration-300 z-50 lg:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          background: theme.gradients.bg,
          color: theme.colors.text,
          transition: 'all 0.5s ease-in-out'
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">PSPM</h2>
            <button onClick={onToggle} className="lg:hidden">
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <div key={item.label}>
                {item.href ? (
                  <Link
                    to={item.href}
                    style={{
                      color: theme.colors.text,
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      borderRadius: '0.5rem',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    className="rounded-lg"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      style={{
                        color: theme.colors.text,
                        padding: '0.75rem 1rem',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {item.icon}
                      <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                      <ChevronRight
                        size={16}
                        className={`transition-transform ${
                          expandedItems.includes(item.label) ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {expandedItems.includes(item.label) && item.submenu && (
                      <div className="ml-4 space-y-1 animate-slide-in">
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.label}
                            to={subitem.href || '#'}
                            style={{
                              color: theme.colors.text,
                              padding: '0.5rem 1rem',
                              fontSize: '0.75rem',
                              display: 'block',
                              borderRadius: '0.375rem',
                              transition: 'all 0.2s ease',
                            }}
                            className="hover:bg-white hover:bg-opacity-20 rounded"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            {subitem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}
