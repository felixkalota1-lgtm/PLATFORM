import { Menu, LogOut, Bell } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useState } from 'react'

interface NavbarProps {
  onMenuClick: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { 
    currentUser, 
    currentCompany, 
    notifications, 
    setCurrentUser, 
    setCurrentCompany,
    clearCart,
    clearNotifications,
  } = useAppStore()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length

  const handleLogout = () => {
    console.log('User logging out...')
    // Clear all user data
    setCurrentUser(null)
    setCurrentCompany(null)
    clearCart()
    clearNotifications()
    
    toast.success('Logged out successfully')
    console.log('User logged out, auth cleared from storage')
    navigate('/login')
    setShowLogoutConfirm(false)
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            {currentCompany?.name || 'Platform'}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer hover:text-blue-600">
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{currentUser?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
            </div>
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={20} className="text-gray-600 hover:text-red-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Confirm Logout</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

