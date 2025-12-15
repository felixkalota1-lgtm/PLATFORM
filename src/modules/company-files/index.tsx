import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FileText, Wrench, Download, Eye, Trash2, Plus } from 'lucide-react'

export default function CompanyFilesModule() {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine active tab based on current route
  const activeTab = useMemo(() => {
    const path = location.pathname
    console.log('🔍 Current path:', path)

    if (path.includes('/letters')) return 'letters'
    if (path.includes('/equipment')) return 'equipment'
    return 'letters'
  }, [location.pathname])

  const handleTabChange = (tab: 'letters' | 'equipment') => {
    const routeMap = {
      letters: '/company-files/letters',
      equipment: '/company-files/equipment',
    }
    console.log('🔀 Navigating to:', routeMap[tab])
    navigate(routeMap[tab])
  }

  return (
    <div className="w-full">
      {/* Show tabs at top for easy navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-full overflow-x-auto">
          <div className="flex">
            <button
              onClick={() => handleTabChange('letters')}
              className={`px-6 py-3 font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'letters'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <FileText size={18} />
              Company Files
            </button>
            <button
              onClick={() => handleTabChange('equipment')}
              className={`px-6 py-3 font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'equipment'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <Wrench size={18} />
              Company Equipment
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'letters' && <CompanyFilesView />}
      {activeTab === 'equipment' && <CompanyEquipmentView />}
    </div>
  )
}

const CompanyFilesView = () => {
  const files = [
    { id: 'INV-001', name: 'Invoice - ABC Manufacturing Ltd', type: 'Invoice', date: '2025-12-10', amount: '$15,750', status: 'paid', size: '2.4 MB' },
    { id: 'PO-2025-001', name: 'Purchase Order - Raw Materials', type: 'Purchase Order', date: '2025-12-08', amount: '$8,500', status: 'processing', size: '1.8 MB' },
    { id: 'ORD-4521', name: 'Sales Order - XYZ Supplies', type: 'Sales Order', date: '2025-12-07', amount: '$12,300', status: 'pending', size: '1.2 MB' },
    { id: 'INQ-2025-005', name: 'Inquiry Response - Global Trade', type: 'Inquiry', date: '2025-12-06', amount: '$5,600', status: 'responded', size: '956 KB' },
    { id: 'INS-2025-CAR', name: 'Car Insurance Policy - Fleet Coverage', type: 'Insurance', date: '2025-12-01', amount: '$3,200/year', status: 'active', size: '3.1 MB' },
    { id: 'TAX-2025-ROAD', name: 'Road Tax - Vehicle Registration', type: 'Road Tax', date: '2025-12-15', amount: '$450', status: 'paid', size: '892 KB' },
    { id: 'LIC-2025-BUS', name: 'Business License Renewal', type: 'License', date: '2025-10-20', amount: '$1,200', status: 'active', size: '1.5 MB' },
    { id: 'EXP-2025-MAINT', name: 'Equipment Maintenance Certificate', type: 'Maintenance', date: '2025-11-15', amount: '$2,100', status: 'completed', size: '2.2 MB' },
    { id: 'CUST-2025-001', name: 'Customer Contract - ABC Ltd', type: 'Contract', date: '2025-11-01', amount: 'N/A', status: 'active', size: '1.9 MB' },
    { id: 'DLC-2025-001', name: 'Delivery License - Logistics Cert', type: 'License', date: '2025-09-15', amount: '$600', status: 'active', size: '1.3 MB' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'active':
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      case 'processing':
      case 'responded':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Invoice':
        return 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-600'
      case 'Purchase Order':
        return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
      case 'Sales Order':
        return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600'
      case 'Inquiry':
        return 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-600'
      case 'Insurance':
        return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600'
      case 'Road Tax':
        return 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600'
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-l-4 border-gray-600'
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Company Files</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Invoices, purchase orders, insurance, contracts & documentation</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={18} />
          Upload File
        </button>
      </div>

      <div className="space-y-4">
        {files.map((file) => (
          <div key={file.id} className={`rounded-lg p-4 ${getTypeColor(file.type)}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start gap-4 flex-1">
                <FileText size={24} className="text-gray-600 dark:text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{file.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">ID: {file.id} • {file.date} • {file.size}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(file.status)}`}>
                  {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{file.amount}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-300 dark:border-gray-600">
              <button className="flex-1 px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <Eye size={16} />
                View
              </button>
              <button className="flex-1 px-3 py-2 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-800 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <Download size={16} />
                Download
              </button>
              <button className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Files Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Files</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{files.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Active Documents</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{files.filter(f => f.status === 'active' || f.status === 'paid').length}</p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{files.filter(f => f.status === 'pending').length}</p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Storage Used</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">24.7 MB</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const CompanyEquipmentView = () => {
  const equipment = [
    { id: 'EQ-001', name: 'Industrial Hydraulic Press', category: 'Heavy Equipment', location: 'Main Workshop', condition: 'excellent', purchaseDate: '2023-05-10', value: '$8,500', status: 'in-use' },
    { id: 'EQ-002', name: 'Air Compressor 5HP', category: 'Pneumatic Tools', location: 'Workshop A', condition: 'good', purchaseDate: '2022-08-15', value: '$1,200', status: 'in-use' },
    { id: 'EQ-003', name: 'Welding Machine - Miller Electric', category: 'Welding Equipment', location: 'Welding Bay', condition: 'excellent', purchaseDate: '2024-01-20', value: '$3,500', status: 'in-use' },
    { id: 'EQ-004', name: 'Lathe Machine CNC', category: 'Machining Equipment', location: 'Machine Shop', condition: 'excellent', purchaseDate: '2023-11-05', value: '$12,000', status: 'in-use' },
    { id: 'EQ-005', name: 'Drill Press Industrial', category: 'Drilling Equipment', location: 'Machine Shop', condition: 'good', purchaseDate: '2022-06-12', value: '$2,800', status: 'in-use' },
    { id: 'EQ-006', name: 'Pneumatic Impact Wrench Set', category: 'Pneumatic Tools', location: 'Tool Room', condition: 'good', purchaseDate: '2023-03-08', value: '$450', status: 'available' },
    { id: 'EQ-007', name: 'Grinding Machine Surface', category: 'Machining Equipment', location: 'Machine Shop', condition: 'fair', purchaseDate: '2021-09-20', value: '$4,200', status: 'maintenance' },
    { id: 'EQ-008', name: 'Metal Shelving Units (x8)', category: 'Storage Equipment', location: 'Warehouse', condition: 'excellent', purchaseDate: '2023-07-10', value: '$2,400', status: 'in-use' },
    { id: 'EQ-009', name: 'Mobile Tool Cabinet', category: 'Storage Equipment', location: 'Workshop B', condition: 'excellent', purchaseDate: '2024-02-15', value: '$950', status: 'in-use' },
    { id: 'EQ-010', name: 'Safety Equipment Bundle', category: 'Safety Equipment', location: 'All Areas', condition: 'excellent', purchaseDate: '2024-06-01', value: '$1,800', status: 'in-use' },
  ]

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      case 'good':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'fair':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
      case 'poor':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-use':
        return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600'
      case 'available':
        return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
      case 'maintenance':
        return 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-600'
      case 'idle':
        return 'bg-gray-50 dark:bg-gray-900/20 border-l-4 border-gray-600'
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-l-4 border-gray-600'
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Company Equipment</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Workshop, garage & maintenance equipment inventory</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={18} />
          Add Equipment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {equipment.map((item) => (
          <div key={item.id} className={`rounded-lg p-4 ${getStatusColor(item.status)}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start gap-3 flex-1">
                <Wrench size={20} className="text-gray-600 dark:text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.category}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${getConditionColor(item.condition)}`}>
                {item.condition}
              </span>
            </div>

            <div className="space-y-2 mb-3 text-sm">
              <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Location:</span> {item.location}</p>
              <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Value:</span> {item.value}</p>
              <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Purchased:</span> {item.purchaseDate}</p>
              <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                  {item.status === 'in-use' ? '✓ In Use' : item.status === 'available' ? '◆ Available' : '⚠ Maintenance'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-300 dark:border-gray-600">
              <button className="flex-1 px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm font-medium">
                View Details
              </button>
              <button className="flex-1 px-3 py-2 bg-gray-400 dark:bg-gray-600 text-white rounded hover:bg-gray-500 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Equipment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Equipment</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{equipment.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 text-sm">In Use</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{equipment.filter(e => e.status === 'in-use').length}</p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Maintenance</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{equipment.filter(e => e.status === 'maintenance').length}</p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Value</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">$60.8K</p>
          </div>
        </div>
      </div>
    </div>
  )
}
