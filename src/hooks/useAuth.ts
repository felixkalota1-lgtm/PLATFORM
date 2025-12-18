import { useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import { logoutUser, AuthUser, canAccessModule, UserRole } from '../services/firebaseAuthService'
import { checkModuleAccess, checkPermission } from '../utils/rbacUtils'

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Initialize auth state on mount - only once
  useEffect(() => {
    if (initialized) return

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is logged in - check localStorage for user data
          const savedUser = localStorage.getItem('pspm_user')
          if (savedUser) {
            setUser(JSON.parse(savedUser))
          } else {
            // Firebase user exists but no localStorage data - edge case
            setUser(null)
          }
        } else {
          // User is logged out
          setUser(null)
          localStorage.removeItem('pspm_user')
          localStorage.removeItem('pspm_auth_token')
        }
      } catch (e) {
        console.error('Auth state error:', e)
        setError('Failed to load user data')
        setUser(null)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    })

    return () => unsubscribe()
  }, [initialized])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await logoutUser()
      setUser(null)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Logout failed')
    }
  }, [])

  // Check if user has permission
  const hasPermission = useCallback(
    (resource: string): boolean => {
      return checkPermission(user?.role as UserRole, resource)
    },
    [user?.role]
  )

  // Check if user can access module
  const canAccess = useCallback(
    (module: string): boolean => {
      return checkModuleAccess(user?.role as UserRole, module)
    },
    [user?.role]
  )

  // Check if user is admin or director
  const isAdmin = useCallback((): boolean => {
    return user?.role === 'admin' || user?.role === 'director'
  }, [user?.role])

  const isAuthenticated = !!user
  const isLoading = loading

  return {
    user,
    loading: isLoading,
    error,
    logout,
    hasPermission,
    canAccess,
    isAdmin,
    isAuthenticated,
  }
}

export default useAuth

