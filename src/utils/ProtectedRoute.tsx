/**
 * Protected Route Component
 * Enforces authentication and role-based access control
 */

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { logAccessDenied } from '../services/auditLogger'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'director' | 'manager' | 'vendor' | 'buyer' | 'accountant'
  requiredModule?: string
}

/**
 * ProtectedRoute Component - Requires authentication
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredModule,
}) => {
  const { user, loading, canAccess } = useAuth()

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

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check required module access
  if (requiredModule && !canAccess(requiredModule)) {
    // Log access denied
    logAccessDenied(
      user.uid,
      user.tenantId,
      requiredModule,
      `User role (${user.role}) cannot access module`
    )
    return <Navigate to="/access-denied" replace />
  }

  // Check required role
  if (requiredRole && user.role !== requiredRole) {
    // Only admin and director can access everything
    const isAdmin = user.role === 'admin' || user.role === 'director'
    if (!isAdmin) {
      logAccessDenied(
        user.uid,
        user.tenantId,
        `role:${requiredRole}`,
        `User role (${user.role}) does not match required role (${requiredRole})`
      )
      return <Navigate to="/access-denied" replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute
