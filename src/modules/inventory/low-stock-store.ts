import { create } from 'zustand';

export interface LowStockAlert {
  id: string;
  productId: string;
  productName: string;
  currentQuantity: number;
  minimumThreshold: number;
  unit: string;
  severity: 'critical' | 'warning' | 'info';
  alertStatus: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  notifiedUsers: string[];
}

interface LowStockStore {
  alerts: LowStockAlert[];
  thresholds: Map<string, number>; // productId -> minimum threshold

  // Alert management
  createAlert: (alert: LowStockAlert) => void;
  acknowledgeAlert: (alertId: string, userId: string) => void;
  resolveAlert: (alertId: string) => void;
  deleteAlert: (alertId: string) => void;

  // Threshold management
  setProductThreshold: (productId: string, threshold: number) => void;
  getProductThreshold: (productId: string) => number;

  // Queries
  getActiveAlerts: () => LowStockAlert[];
  getAlertsBySeverity: (severity: 'critical' | 'warning' | 'info') => LowStockAlert[];
}

export const useLowStockStore = create<LowStockStore>((set, get) => ({
  alerts: [],
  thresholds: new Map(),

  createAlert: (alert) =>
    set((state) => ({ alerts: [...state.alerts, alert] })),

  acknowledgeAlert: (alertId, userId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId
          ? {
              ...a,
              alertStatus: 'acknowledged',
              acknowledgedAt: new Date(),
              notifiedUsers: [...a.notifiedUsers, userId],
            }
          : a
      ),
    })),

  resolveAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId
          ? {
              ...a,
              alertStatus: 'resolved',
              resolvedAt: new Date(),
            }
          : a
      ),
    })),

  deleteAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
    })),

  setProductThreshold: (productId, threshold) => {
    const newThresholds = new Map(get().thresholds);
    newThresholds.set(productId, threshold);
    set({ thresholds: newThresholds });
  },

  getProductThreshold: (productId) =>
    get().thresholds.get(productId) || 10,

  getActiveAlerts: () =>
    get().alerts.filter((a) => a.alertStatus === 'active'),

  getAlertsBySeverity: (severity) =>
    get().alerts.filter((a) => a.severity === severity),
}));
