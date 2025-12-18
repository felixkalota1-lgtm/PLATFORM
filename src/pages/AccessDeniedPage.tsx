/**
 * Access Denied Page
 * Shown when user doesn't have permission to access a resource
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ArrowLeft, Home } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function AccessDeniedPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 dark:bg-red-900 rounded-full p-4">
            <Lock size={48} className="text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          You don't have permission to access this resource.
        </p>

        {/* User Info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Your Role:</strong>
            <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-semibold">
              {user?.role?.toUpperCase()}
            </span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            <strong>Company:</strong> {user?.companyName}
          </p>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Need Access?</strong> Contact your administrator to request access to this feature. Only <strong>Admin</strong> and <strong>Director</strong> roles have access to all modules.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Home size={18} />
            Dashboard
          </button>
        </div>

        {/* Support */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            If you believe this is an error, please contact support or your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
