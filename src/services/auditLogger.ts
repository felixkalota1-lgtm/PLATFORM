// Audit Logging Service - Track all user actions for compliance

export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'CREATE_PRODUCT' 
  | 'UPDATE_PRODUCT' 
  | 'DELETE_PRODUCT'
  | 'CREATE_ORDER'
  | 'UPDATE_ORDER'
  | 'CREATE_INQUIRY'
  | 'RESPOND_INQUIRY'
  | 'CREATE_QUOTE'
  | 'VIEW_REPORT'
  | 'EXPORT_DATA'
  | 'MANAGE_USER'
  | 'CHANGE_SETTINGS'
  | 'ACCESS_MODULE'
  | 'PERMISSION_DENIED'
  | 'ACCESS_DENIED'
  | 'ERROR'
  | 'OTHER'

export interface AuditLog {
  id: string
  timestamp: Date
  userId: string
  userEmail: string
  companyId: string
  action: AuditAction
  module: string
  resourceType?: string
  resourceId?: string
  description: string
  status: 'success' | 'failed' | 'denied'
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

class AuditLogger {
  private logs: AuditLog[] = []
  private maxLogs = 1000 // Keep last 1000 logs in memory

  /**
   * Log an action
   */
  log(
    userId: string,
    userEmail: string,
    companyId: string,
    action: AuditAction,
    module: string,
    description: string,
    status: 'success' | 'failed' | 'denied' = 'success',
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ): AuditLog {
    const auditLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      userEmail,
      companyId,
      action,
      module,
      resourceType,
      resourceId,
      description,
      status,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      metadata,
    }

    this.logs.push(auditLog)

    // Keep only last N logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    console.log(`[AUDIT] ${action} - ${description}`, auditLog)

    // Persist to localStorage
    this.persistToStorage()

    // In production, send to server
    this.sendToServer(auditLog)

    return auditLog
  }

  /**
   * Get all audit logs
   */
  getLogs(): AuditLog[] {
    return [...this.logs]
  }

  /**
   * Get logs by user
   */
  getLogsByUser(userId: string): AuditLog[] {
    return this.logs.filter(log => log.userId === userId)
  }

  /**
   * Get logs by company
   */
  getLogsByCompany(companyId: string): AuditLog[] {
    return this.logs.filter(log => log.companyId === companyId)
  }

  /**
   * Get logs by action
   */
  getLogsByAction(action: AuditAction): AuditLog[] {
    return this.logs.filter(log => log.action === action)
  }

  /**
   * Get logs by date range
   */
  getLogsByDateRange(startDate: Date, endDate: Date): AuditLog[] {
    return this.logs.filter(
      log => log.timestamp >= startDate && log.timestamp <= endDate
    )
  }

  /**
   * Persist logs to localStorage
   */
  private persistToStorage(): void {
    try {
      localStorage.setItem('pspm_audit_logs', JSON.stringify(this.logs))
    } catch (error) {
      console.error('Failed to persist audit logs to storage:', error)
    }
  }

  /**
   * Load logs from localStorage
   */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('pspm_audit_logs')
      if (stored) {
        const parsed = JSON.parse(stored)
        this.logs = parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }))
        console.log(`Loaded ${this.logs.length} audit logs from storage`)
      }
    } catch (error) {
      console.error('Failed to load audit logs from storage:', error)
    }
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = []
    localStorage.removeItem('pspm_audit_logs')
  }

  /**
   * Send logs to server (for production)
   */
  private async sendToServer(log: AuditLog): Promise<void> {
    // This would be implemented when you have a backend
    // Example:
    // try {
    //   await fetch('/api/audit-logs', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(log),
    //   })
    // } catch (error) {
    //   console.error('Failed to send audit log to server:', error)
    // }
  }

  /**
   * Export logs as CSV
   */
  exportAsCSV(logs: AuditLog[] = this.logs): string {
    const headers = [
      'Timestamp',
      'User Email',
      'User ID',
      'Company ID',
      'Action',
      'Module',
      'Resource Type',
      'Resource ID',
      'Status',
      'Description',
    ]

    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.userEmail,
      log.userId,
      log.companyId,
      log.action,
      log.module,
      log.resourceType || '',
      log.resourceId || '',
      log.status,
      log.description,
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    return csv
  }

  /**
   * Export logs as JSON
   */
  exportAsJSON(logs: AuditLog[] = this.logs): string {
    return JSON.stringify(logs, null, 2)
  }
}

// Singleton instance
export const auditLogger = new AuditLogger()

// Load persisted logs on initialization
auditLogger.loadFromStorage()

// Wrapper functions for convenient exports
export const auditLog = (
  action: AuditAction,
  userId: string,
  tenantId: string,
  details?: Record<string, any>
): void => {
  auditLogger.log(userId, 'audit-user@company.com', tenantId, action, 'general', action, 'success', undefined, undefined, details)
}

export const logAccessDenied = (
  userId: string,
  tenantId: string,
  module: string,
  userRole: string
): void => {
  auditLogger.log(userId, 'audit-user@company.com', tenantId, 'ACCESS_DENIED', module, 'Access denied', 'denied', undefined, undefined, {
    module,
    userRole,
    timestamp: new Date().toISOString()
  })
}
