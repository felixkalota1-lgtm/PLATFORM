import { Navigate } from 'react-router-dom'
import { User } from '../types'
import { hasPermission } from '../utils/rbac'

interface ProtectedRouteProps {
  children: React.ReactNode
  currentUser: User | null
  requiredPermission?: string
  requiredRole?: string
}

/**
 * ProtectedRoute component that checks user authentication and authorization
 * Can require specific permissions or roles
 */
export default function ProtectedRoute({
  children,
  currentUser,
  requiredPermission,
  requiredRole,
}: ProtectedRouteProps) {
  // Check if user is authenticated
  if (!currentUser) {
    console.warn('User not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // Check if user has required role
  if (requiredRole && currentUser.role !== requiredRole) {
    console.warn(`User role '${currentUser.role}' does not match required role '${requiredRole}'`)
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You do not have permission to access this page.</p>
          <p className="text-sm text-gray-500">Required role: {requiredRole}</p>
        </div>
      </div>
    )
  }

  // Check if user has required permission
  if (requiredPermission && !hasPermission(currentUser.role, requiredPermission)) {
    console.warn(
      `User with role '${currentUser.role}' does not have permission '${requiredPermission}'`
    )
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You do not have permission to access this feature.</p>
          <p className="text-sm text-gray-500">Required permission: {requiredPermission}</p>
        </div>
      </div>
    )
  }

  // User is authenticated and authorized
  return <>{children}</>
}
