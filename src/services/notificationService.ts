// Notification Service - Handle persistent notifications

import { Notification } from '../types'

class NotificationService {
  private notifications: Notification[] = []
  private maxNotifications = 500

  /**
   * Load notifications from localStorage
   */
  loadFromStorage(companyId: string): void {
    try {
      const stored = localStorage.getItem(`pspm_notifications_${companyId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        this.notifications = parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }))
        console.log(`Loaded ${this.notifications.length} notifications for company ${companyId}`)
      }
    } catch (error) {
      console.error('Failed to load notifications from storage:', error)
    }
  }

  /**
   * Save notifications to localStorage
   */
  saveToStorage(companyId: string): void {
    try {
      localStorage.setItem(
        `pspm_notifications_${companyId}`,
        JSON.stringify(this.notifications)
      )
    } catch (error) {
      console.error('Failed to save notifications to storage:', error)
    }
  }

  /**
   * Add a new notification
   */
  addNotification(notification: Notification, companyId: string): Notification {
    this.notifications.unshift(notification)

    // Keep only last N notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications)
    }

    this.saveToStorage(companyId)
    return notification
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string, companyId: string): Notification | null {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      this.saveToStorage(companyId)
    }
    return notification || null
  }

  /**
   * Mark all as read
   */
  markAllAsRead(companyId: string): void {
    this.notifications.forEach(n => (n.read = true))
    this.saveToStorage(companyId)
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string, companyId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId)
    this.saveToStorage(companyId)
  }

  /**
   * Clear all notifications
   */
  clearAll(companyId: string): void {
    this.notifications = []
    localStorage.removeItem(`pspm_notifications_${companyId}`)
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return [...this.notifications]
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  /**
   * Get notifications by type
   */
  getByType(type: string): Notification[] {
    return this.notifications.filter(n => n.type === type)
  }

  /**
   * Get recent notifications
   */
  getRecent(count: number = 10): Notification[] {
    return this.notifications.slice(0, count)
  }
}

// Singleton instance
export const notificationService = new NotificationService()
