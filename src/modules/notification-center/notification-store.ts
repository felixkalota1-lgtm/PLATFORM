import { create } from 'zustand';

export type NotificationType = 'inquiry' | 'quotation' | 'order' | 'alert' | 'message' | 'system';
export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface InAppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedItemId?: string;
  relatedItemType?: string;
  status: NotificationStatus;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
  icon?: string;
  createdAt: Date;
  readAt?: Date;
  actionTaken?: boolean;
}

interface NotificationStore {
  notifications: InAppNotification[];
  unreadCount: number;

  // Notification management
  addNotification: (notification: Omit<InAppNotification, 'id' | 'createdAt' | 'status'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  archiveNotification: (notificationId: string) => void;
  deleteNotification: (notificationId: string) => void;

  // Queries
  getUserNotifications: (userId: string) => InAppNotification[];
  getUnreadNotifications: (userId: string) => InAppNotification[];
  getNotificationsByType: (userId: string, type: NotificationType) => InAppNotification[];
  getUnreadCount: (userId: string) => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    const newNotification: InAppNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date(),
      status: 'unread',
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId
          ? { ...n, status: 'read', readAt: new Date() }
          : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.status === 'unread' ? { ...n, status: 'read', readAt: new Date() } : n
      ),
      unreadCount: 0,
    })),

  archiveNotification: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, status: 'archived' } : n
      ),
    })),

  deleteNotification: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== notificationId),
    })),

  getUserNotifications: (userId) =>
    get().notifications.filter((n) => n.userId === userId && n.status !== 'archived'),

  getUnreadNotifications: (userId) =>
    get()
      .notifications.filter((n) => n.userId === userId && n.status === 'unread')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  getNotificationsByType: (userId, type) =>
    get()
      .notifications.filter((n) => n.userId === userId && n.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  getUnreadCount: (userId) =>
    get().notifications.filter((n) => n.userId === userId && n.status === 'unread').length,
}));
