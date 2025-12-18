/**
 * User Profile & Settings Page
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { logoutUser } from '../services/firebaseAuthService'
import { User, LogOut, Settings, Building2, Shield, Calendar, Mail } from 'lucide-react'

export default function UserProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <User size={40} />
            My Profile
          </h1>
          <p className="text-blue-100 mt-2">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>

              {/* User Info */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{user.displayName}</h2>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                  <Mail size={16} />
                  {user.email}
                </p>
                <p className="text-blue-600 dark:text-blue-400 font-semibold mt-2 flex items-center gap-2">
                  <Shield size={16} />
                  Role: <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-bold">{user.role?.toUpperCase()}</span>
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut size={18} />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>

          {/* Quick Info Grid */}
          <div className="grid md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            {/* Company */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Building2 size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Company</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">{user.companyName || 'N/A'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tenant ID: {user.tenantId}</p>
            </div>

            {/* User ID */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <User size={20} className="text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">User ID</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm font-mono break-all">{user.uid}</p>
            </div>

            {/* Role Info */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield size={20} className="text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Access Level</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-lg font-medium capitalize">
                {user.role === 'admin' || user.role === 'director' ? '🔓 Full Access' : '🔐 Limited Access'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {user.role === 'admin' ? 'Administrator' : user.role === 'director' ? 'Director' : 'Other Role'}
              </p>
            </div>

            {/* Last Login */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar size={20} className="text-orange-600 dark:text-orange-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Last Login</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleTimeString() : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Role Permissions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <Settings size={24} />
            Your Permissions
          </h3>

          <div className="space-y-4">
            {user.role === 'admin' || user.role === 'director' ? (
              <div className="p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✅ Full Access</h4>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  You have unrestricted access to all modules and features in the application.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">🔐 Limited Access</h4>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
                  Your role has restricted access to certain modules. Contact an administrator to request additional permissions.
                </p>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                  <p><strong>Accessible:</strong> Marketplace, Orders, Profile</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Account Actions</h3>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Back to Dashboard
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
            More profile settings coming soon...
          </p>
        </div>
      </div>
    </div>
  )
}
