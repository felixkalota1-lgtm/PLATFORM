import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  ProcurementRequest,
  RFQ,
  PurchaseOrder,
  ProcurementAnalytics,
} from './types'

interface ProcurementStore {
  // Requests
  requests: ProcurementRequest[]
  setRequests: (requests: ProcurementRequest[]) => void
  addRequest: (request: Omit<ProcurementRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void
  updateRequest: (id: string, updates: Partial<ProcurementRequest>) => void
  deleteRequest: (id: string) => void
  removeRequest: (id: string) => void
  updateRequestStatus: (id: string, status: ProcurementRequest['status']) => void

  // RFQs
  rfqs: RFQ[]
  setRFQs: (rfqs: RFQ[]) => void
  addRFQ: (rfq: RFQ) => void
  updateRFQ: (id: string, updates: Partial<RFQ>) => void

  // Purchase Orders
  purchaseOrders: PurchaseOrder[]
  setPurchaseOrders: (orders: PurchaseOrder[]) => void
  addPurchaseOrder: (order: PurchaseOrder) => void
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void

  // Analytics
  analytics: ProcurementAnalytics | null
  setAnalytics: (analytics: ProcurementAnalytics) => void
}

export const useProcurementStore = create<ProcurementStore>()(
  persist(
    (set) => ({
      // Requests
      requests: [],
      setRequests: (requests) => set({ requests }),
      addRequest: (request) =>
        set((state) => ({
          requests: [
            ...state.requests,
            {
              ...request,
              id: Date.now().toString(),
              status: 'submitted' as const,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),
      updateRequest: (id, updates) =>
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      deleteRequest: (id) =>
        set((state) => ({
          requests: state.requests.filter((r) => r.id !== id),
        })),
      removeRequest: (id) =>
        set((state) => ({
          requests: state.requests.filter((r) => r.id !== id),
        })),
      updateRequestStatus: (id, status) =>
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id ? { ...r, status, updatedAt: new Date() } : r
          ),
        })),

      // RFQs
      rfqs: [],
      setRFQs: (rfqs) => set({ rfqs }),
      addRFQ: (rfq) =>
        set((state) => ({
          rfqs: [...state.rfqs, rfq],
        })),
      updateRFQ: (id, updates) =>
        set((state) => ({
          rfqs: state.rfqs.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      // Purchase Orders
      purchaseOrders: [],
      setPurchaseOrders: (orders) => set({ purchaseOrders: orders }),
      addPurchaseOrder: (order) =>
        set((state) => ({
          purchaseOrders: [...state.purchaseOrders, order],
        })),
      updatePurchaseOrder: (id, updates) =>
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          ),
        })),

      // Analytics
      analytics: null,
      setAnalytics: (analytics) => set({ analytics }),
    }),
    {
      name: 'procurement-store',
    }
  )
)
