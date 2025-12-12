import { create } from 'zustand';
import { User, Company, CartItem, Notification } from '../types';
import { notificationService } from '../services/notificationService';

interface AppStore {
  // Auth
  currentUser: User | null;
  currentCompany: Company | null;
  setCurrentUser: (user: User | null) => void;
  setCurrentCompany: (company: Company | null) => void;
  loadAuthFromStorage: () => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  loadNotificationsFromStorage: (companyId: string) => void;
  clearNotifications: () => void;

  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeModule: string | null;
  setActiveModule: (module: string | null) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  loadDarkModePreference: () => void;
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
      // Persist to localStorage
      if (user) {
        localStorage.setItem('pspm_user', JSON.stringify(user))
      } else {
        localStorage.removeItem('pspm_user')
      }
    },
    setCurrentCompany: (company) => {
      console.log('setCurrentCompany called:', company)
      set({ currentCompany: company })
      // Persist to localStorage
      if (company) {
        localStorage.setItem('pspm_company', JSON.stringify(company))
      } else {
        localStorage.removeItem('pspm_company')
      }
    },
    loadAuthFromStorage: () => {
      console.log('Loading auth from localStorage...')
      try {
        const savedUser = localStorage.getItem('pspm_user')
        const savedCompany = localStorage.getItem('pspm_company')
        
        if (savedUser) {
          set({ currentUser: JSON.parse(savedUser) })
          console.log('Restored user from storage:', JSON.parse(savedUser))
        }
        if (savedCompany) {
          set({ currentCompany: JSON.parse(savedCompany) })
          console.log('Restored company from storage:', JSON.parse(savedCompany))
        }
      } catch (error) {
        console.error('Failed to load auth from storage:', error)
        localStorage.removeItem('pspm_user')
        localStorage.removeItem('pspm_company')
      }
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
    addNotification: (notification) => set((state) => {
      const updated = [notification, ...state.notifications]
      if (state.currentCompany) {
        notificationService.addNotification(notification, state.currentCompany.id)
      }
      return { notifications: updated }
    }),
    markNotificationAsRead: (notificationId) => set((state) => {
      if (state.currentCompany) {
        notificationService.markAsRead(notificationId, state.currentCompany.id)
      }
      return {
        notifications: state.notifications.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      }
    }),
    markAllNotificationsAsRead: () => set((state) => {
      if (state.currentCompany) {
        notificationService.markAllAsRead(state.currentCompany.id)
      }
      return {
        notifications: state.notifications.map(notif => ({ ...notif, read: true }))
      }
    }),
    deleteNotification: (notificationId) => set((state) => {
      if (state.currentCompany) {
        notificationService.deleteNotification(notificationId, state.currentCompany.id)
      }
      return {
        notifications: state.notifications.filter(n => n.id !== notificationId)
      }
    }),
    loadNotificationsFromStorage: (companyId) => {
      notificationService.loadFromStorage(companyId)
      set({ notifications: notificationService.getAll() })
    },
    clearNotifications: () => set((state) => {
      if (state.currentCompany) {
        notificationService.clearAll(state.currentCompany.id)
      }
      return { notifications: [] }
    }),

    // UI State
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    activeModule: null,
    setActiveModule: (module) => set({ activeModule: module }),
    
    // Dark Mode
    darkMode: false,
    toggleDarkMode: () => set((state) => {
      const newDarkMode = !state.darkMode;
      localStorage.setItem('pspm_darkMode', JSON.stringify(newDarkMode));
      // Update HTML element class for Tailwind dark mode
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { darkMode: newDarkMode };
    }),
    loadDarkModePreference: () => {
      try {
        const savedPreference = localStorage.getItem('pspm_darkMode');
        const isDarkMode = savedPreference ? JSON.parse(savedPreference) : false;
        set({ darkMode: isDarkMode });
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        }
      } catch (error) {
        console.error('Failed to load dark mode preference:', error);
      }
    },
  }
});

