import { create } from 'zustand';
import { User, Company, CartItem, Notification } from '../types';

interface AppStore {
  // Auth
  currentUser: User | null;
  currentCompany: Company | null;
  setCurrentUser: (user: User | null) => void;
  setCurrentCompany: (company: Company | null) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearNotifications: () => void;

  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeModule: string | null;
  setActiveModule: (module: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => {
  // Log when store is created
  console.log('AppStore initialized')
  
  return {
    // Auth
    currentUser: null,
    currentCompany: null,
    setCurrentUser: (user) => {
      console.log('setCurrentUser called:', user)
      set({ currentUser: user })
    },
    setCurrentCompany: (company) => {
      console.log('setCurrentCompany called:', company)
      set({ currentCompany: company })
    },

    // Cart
    cart: [],
    addToCart: (item) => set((state) => ({ 
      cart: [...state.cart, item] 
    })),
    removeFromCart: (itemId) => set((state) => ({
      cart: state.cart.filter(item => item.id !== itemId)
    })),
    clearCart: () => set({ cart: [] }),

    // Notifications
    notifications: [],
    addNotification: (notification) => set((state) => ({
      notifications: [notification, ...state.notifications]
    })),
    markNotificationAsRead: (notificationId) => set((state) => ({
      notifications: state.notifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    })),
    clearNotifications: () => set({ notifications: [] }),

    // UI State
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    activeModule: null,
    setActiveModule: (module) => set({ activeModule: module }),
  }
});

