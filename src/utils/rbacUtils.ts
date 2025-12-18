/**
 * Role-Based Access Control (RBAC) Utility
 * Provides permission checking and module access control
 */

import { UserRole, MODULE_ACCESS, ROLE_PERMISSIONS } from '../services/firebaseAuthService'

/**
 * Check if a role has permission for a resource
 */
export const checkPermission = (role: UserRole | undefined, resource: string): boolean => {
  if (!role) return false

  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false

  // Admin and Director have all permissions
  if (permissions.includes('*')) return true

  // Check specific permission
  return permissions.includes(resource)
}

/**
 * Check if a role can access a module
 */
export const checkModuleAccess = (role: UserRole | undefined, module: string): boolean => {
  if (!role) return false

  const modules = MODULE_ACCESS[role]
  if (!modules) return false

  return modules.includes(module)
}

/**
 * Get all accessible modules for a role
 */
export const getAccessibleModules = (role: UserRole | undefined): string[] => {
  if (!role) return []
  return MODULE_ACCESS[role] || []
}

/**
 * Get all accessible resources for a role
 */
export const getAccessibleResources = (role: UserRole | undefined): string[] => {
  if (!role) return []
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Check if role can manage other users
 */
export const canManageUsers = (role: UserRole | undefined): boolean => {
  return role === 'admin' || role === 'director'
}

/**
 * Check if role can view analytics
 */
export const canViewAnalytics = (role: UserRole | undefined): boolean => {
  return ['admin', 'director', 'manager', 'accountant'].includes(role || '')
}

/**
 * Check if role can manage inventory
 */
export const canManageInventory = (role: UserRole | undefined): boolean => {
  return ['admin', 'director', 'manager', 'vendor'].includes(role || '')
}

/**
 * Check if role can manage orders
 */
export const canManageOrders = (role: UserRole | undefined): boolean => {
  return ['admin', 'director', 'manager', 'vendor', 'buyer'].includes(role || '')
}

/**
 * Check if role can access accounting
 */
export const canAccessAccounting = (role: UserRole | undefined): boolean => {
  return ['admin', 'director', 'accountant'].includes(role || '')
}

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: UserRole | undefined): string => {
  const names: Record<UserRole, string> = {
    admin: 'Administrator',
    director: 'Director',
    manager: 'Manager',
    vendor: 'Vendor',
    buyer: 'Buyer',
    accountant: 'Accountant',
  }
  return names[role as UserRole] || 'Unknown'
}

/**
 * Get all available roles
 */
export const getAllRoles = (): UserRole[] => {
  return ['admin', 'director', 'manager', 'vendor', 'buyer', 'accountant']
}

export default {
  checkPermission,
  checkModuleAccess,
  getAccessibleModules,
  getAccessibleResources,
  canManageUsers,
  canViewAnalytics,
  canManageInventory,
  canManageOrders,
  canAccessAccounting,
  getRoleDisplayName,
  getAllRoles,
}
