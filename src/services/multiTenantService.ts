// Multi-Tenant Data Service - Ensure data isolation between companies

import { User, Company } from '../types'

class MultiTenantService {
  /**
   * Validate that a user has access to a company
   */
  validateCompanyAccess(user: User, companyId: string): boolean {
    if (!user || !companyId) {
      console.warn('Invalid user or company ID for access validation')
      return false
    }

    const hasAccess = user.companyId === companyId
    if (!hasAccess) {
      console.warn(
        `User ${user.id} attempted unauthorized access to company ${companyId}. User belongs to ${user.companyId}`
      )
    }
    return hasAccess
  }

  /**
   * Validate that a user can perform an action on a resource
   */
  validateResourceAccess(
    user: User,
    resourceCompanyId: string,
    requiredPermission?: string
  ): boolean {
    // Check company access
    if (!this.validateCompanyAccess(user, resourceCompanyId)) {
      return false
    }

    // Check permission if specified
    if (requiredPermission && !user.permissions.includes(requiredPermission)) {
      console.warn(
        `User ${user.id} does not have permission '${requiredPermission}'`
      )
      return false
    }

    return true
  }

  /**
   * Filter data to only include items belonging to the user's company
   */
  filterByCompany<T extends { companyId: string }>(
    items: T[],
    companyId: string
  ): T[] {
    return items.filter(item => item.companyId === companyId)
  }

  /**
   * Create scoped localStorage key for company-specific data
   */
  getScopedStorageKey(companyId: string, key: string): string {
    return `pspm_${companyId}_${key}`
  }

  /**
   * Get all storage keys for a company
   */
  getCompanyStorageKeys(companyId: string): string[] {
    const prefix = `pspm_${companyId}_`
    const keys: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keys.push(key)
      }
    }

    return keys
  }

  /**
   * Clear all data for a company from localStorage
   */
  clearCompanyData(companyId: string): void {
    const keys = this.getCompanyStorageKeys(companyId)
    keys.forEach(key => localStorage.removeItem(key))
    console.log(`Cleared ${keys.length} items for company ${companyId}`)
  }

  /**
   * Switch active company (for multi-company users)
   * Clears company-specific caches
   */
  switchCompany(oldCompanyId: string, newCompanyId: string): void {
    console.log(`Switching from company ${oldCompanyId} to ${newCompanyId}`)
    
    // Clear old company data
    this.clearCompanyData(oldCompanyId)

    // Clear shared caches that need updating
    localStorage.removeItem('pspm_audit_logs')
  }

  /**
   * Add company ID to any object for tracking
   */
  addCompanyContext<T>(
    item: T,
    companyId: string
  ): T & { companyId: string } {
    return {
      ...item,
      companyId,
    }
  }

  /**
   * Validate company ownership
   */
  validateCompanyOwnership(
    user: User,
    company: Company
  ): boolean {
    const isOwner = user.companyId === company.id && user.role === 'admin'
    if (!isOwner) {
      console.warn(
        `User ${user.email} is not an owner of company ${company.id}`
      )
    }
    return isOwner
  }
}

// Singleton instance
export const multiTenantService = new MultiTenantService()
