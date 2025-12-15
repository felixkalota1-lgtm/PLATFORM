/**
 * UNIFIED INTEGRATION STORE
 * Centralized state management for cross-module data
 * Syncs data across warehouse, inventory, procurement, and other modules
 */

import { create } from 'zustand';
import { eventBus, INTEGRATION_EVENTS } from './integrationEventBus';

interface StockLevel {
  sku: string;
  productName: string;
  warehouseQuantity: number;
  branchQuantities: Record<string, number>; // branchId -> quantity
  reorderLevel: number;
  lastUpdated: Date;
}

interface StockTransfer {
  id: string;
  source: string; // warehouse/branch id
  destination: string;
  items: Array<{
    sku: string;
    productName: string;
    quantity: number;
  }>;
  status: 'pending' | 'approved' | 'in_transit' | 'delivered';
  createdAt: Date;
  deliveredAt?: Date;
}

interface OutstandingRequest {
  id: string;
  type: 'inventory_reorder' | 'procurement' | 'internal_order';
  department: string;
  items: Array<{
    sku?: string;
    name: string;
    quantity: number;
    priority: 'urgent' | 'high' | 'medium' | 'low';
  }>;
  status: 'pending' | 'approved' | 'fulfilled';
  createdAt: Date;
  createdBy: string;
}

interface UploadedFile {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: Date;
  category: 'employee_document' | 'company_file' | 'invoice' | 'contract';
  relatedTo?: {
    type: 'employee' | 'company';
    id: string;
  };
  expiryDate?: Date;
}

interface UnifiedIntegrationStore {
  // === Stock Management ===
  stockLevels: Map<string, StockLevel>;
  updateStockLevel: (sku: string, level: StockLevel) => void;
  getStockLevel: (sku: string) => StockLevel | undefined;
  getAllStockLevels: () => StockLevel[];

  // === Stock Transfers ===
  pendingTransfers: StockTransfer[];
  completedTransfers: StockTransfer[];
  createTransfer: (transfer: StockTransfer) => void;
  updateTransferStatus: (transferId: string, status: StockTransfer['status']) => void;
  getTransfersForBranch: (branchId: string) => StockTransfer[];

  // === Outstanding Requests ===
  outstandingRequests: OutstandingRequest[];
  createRequest: (request: OutstandingRequest) => void;
  updateRequestStatus: (requestId: string, status: OutstandingRequest['status']) => void;
  getRequestsByDepartment: (department: string) => OutstandingRequest[];
  getPendingRequests: () => OutstandingRequest[];

  // === Uploaded Files ===
  uploadedFiles: UploadedFile[];
  addUploadedFile: (file: UploadedFile) => void;
  getFilesByCategory: (category: string) => UploadedFile[];
  getExpiringDocuments: (daysUntilExpiry: number) => UploadedFile[];

  // === Cross-Module Visibility ===
  lastWarehouseSync: Date | null;
  lastInventorySync: Date | null;
  syncTimestamp: Date;
}

export const useIntegrationStore = create<UnifiedIntegrationStore>((set, get) => ({
  // === Stock Management ===
  stockLevels: new Map(),
  updateStockLevel: (sku: string, level: StockLevel) => {
    set((state) => {
      const newMap = new Map(state.stockLevels);
      newMap.set(sku, level);
      return { stockLevels: newMap, syncTimestamp: new Date() };
    });

    // Emit event for real-time updates
    eventBus.emit(INTEGRATION_EVENTS.WAREHOUSE_STOCK_UPDATED, {
      sku,
      warehouseQuantity: level.warehouseQuantity,
      branchQuantities: level.branchQuantities,
      timestamp: new Date(),
    });
  },

  getStockLevel: (sku: string) => {
    return get().stockLevels.get(sku);
  },

  getAllStockLevels: () => {
    return Array.from(get().stockLevels.values());
  },

  // === Stock Transfers ===
  pendingTransfers: [],
  completedTransfers: [],
  createTransfer: (transfer: StockTransfer) => {
    set((state) => {
      return {
        pendingTransfers: [...state.pendingTransfers, transfer],
        syncTimestamp: new Date(),
      };
    });

    // Emit event
    eventBus.emit(INTEGRATION_EVENTS.WAREHOUSE_TRANSFER_INITIATED, {
      transferId: transfer.id,
      source: transfer.source,
      destination: transfer.destination,
      items: transfer.items,
      timestamp: new Date(),
    });
  },

  updateTransferStatus: (transferId: string, status: StockTransfer['status']) => {
    set((state) => {
      const transfer = state.pendingTransfers.find((t) => t.id === transferId);
      if (!transfer) return state;

      const updatedTransfer = { ...transfer, status };

      if (status === 'delivered') {
        return {
          pendingTransfers: state.pendingTransfers.filter((t) => t.id !== transferId),
          completedTransfers: [...state.completedTransfers, { ...updatedTransfer, deliveredAt: new Date() }],
          syncTimestamp: new Date(),
        };
      }

      return {
        pendingTransfers: state.pendingTransfers.map((t) => (t.id === transferId ? updatedTransfer : t)),
        syncTimestamp: new Date(),
      };
    });

    // Emit completion event
    if (status === 'delivered') {
      eventBus.emit(INTEGRATION_EVENTS.WAREHOUSE_TRANSFER_COMPLETED, {
        transferId,
        timestamp: new Date(),
      });
    }
  },

  getTransfersForBranch: (branchId: string) => {
    const state = get();
    return [
      ...state.pendingTransfers.filter((t) => t.destination === branchId),
      ...state.completedTransfers.filter((t) => t.destination === branchId),
    ];
  },

  // === Outstanding Requests ===
  outstandingRequests: [],
  createRequest: (request: OutstandingRequest) => {
    set((state) => ({
      outstandingRequests: [...state.outstandingRequests, request],
      syncTimestamp: new Date(),
    }));

    // Emit appropriate event based on type
    if (request.type === 'inventory_reorder') {
      eventBus.emit(INTEGRATION_EVENTS.INVENTORY_REORDER_REQUEST, {
        requestId: request.id,
        items: request.items,
        timestamp: new Date(),
      });
    } else if (request.type === 'procurement') {
      eventBus.emit(INTEGRATION_EVENTS.PROCUREMENT_REQUEST_CREATED, {
        requestId: request.id,
        department: request.department,
        items: request.items,
        timestamp: new Date(),
      });
    }
  },

  updateRequestStatus: (requestId: string, status: OutstandingRequest['status']) => {
    set((state) => {
      const request = state.outstandingRequests.find((r) => r.id === requestId);
      if (!request) return state;

      return {
        outstandingRequests: state.outstandingRequests.map((r) =>
          r.id === requestId ? { ...r, status } : r
        ),
        syncTimestamp: new Date(),
      };
    });

    // Emit approval/rejection events
    const request = get().outstandingRequests.find((r) => r.id === requestId);
    if (request) {
      if (status === 'approved') {
        eventBus.emit(INTEGRATION_EVENTS.PROCUREMENT_REQUEST_APPROVED, {
          requestId,
          timestamp: new Date(),
        });
      } else if (status === 'fulfilled') {
        eventBus.emit(INTEGRATION_EVENTS.PROCUREMENT_ORDER_RECEIVED, {
          requestId,
          timestamp: new Date(),
        });
      }
    }
  },

  getRequestsByDepartment: (department: string) => {
    return get().outstandingRequests.filter((r) => r.department === department);
  },

  getPendingRequests: () => {
    return get().outstandingRequests.filter((r) => r.status === 'pending');
  },

  // === Uploaded Files ===
  uploadedFiles: [],
  addUploadedFile: (file: UploadedFile) => {
    set((state) => ({
      uploadedFiles: [...state.uploadedFiles, file],
      syncTimestamp: new Date(),
    }));

    // Emit document upload event
    eventBus.emit(INTEGRATION_EVENTS.DOCUMENT_UPLOADED, {
      fileName: file.fileName,
      category: file.category,
      uploadedBy: file.uploadedBy,
      uploadedAt: file.uploadedAt,
      relatedTo: file.relatedTo,
    });
  },

  getFilesByCategory: (category: string) => {
    return get().uploadedFiles.filter((f) => f.category === category);
  },

  getExpiringDocuments: (daysUntilExpiry: number) => {
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + daysUntilExpiry * 24 * 60 * 60 * 1000);

    return get().uploadedFiles.filter(
      (f) => f.expiryDate && f.expiryDate <= expiryThreshold && f.expiryDate > now
    );
  },

  // === Sync timestamps ===
  lastWarehouseSync: null,
  lastInventorySync: null,
  syncTimestamp: new Date(),
}));

/**
 * SYNC HOOKS - Automatically sync specific modules
 */
export function syncWarehouseToInventory(stocks: StockLevel[]) {
  stocks.forEach((stock) => {
    useIntegrationStore.setState((state) => {
      const newMap = new Map(state.stockLevels);
      newMap.set(stock.sku, stock);
      return { stockLevels: newMap, lastWarehouseSync: new Date() };
    });
  });
}

export function syncInventoryToWarehouse(branchId: string, stocks: StockLevel[]) {
  stocks.forEach((stock) => {
    const current = useIntegrationStore.getState().getStockLevel(stock.sku);
    if (current) {
      const updated = {
        ...current,
        branchQuantities: {
          ...current.branchQuantities,
          [branchId]: stock.warehouseQuantity,
        },
      };
      useIntegrationStore.getState().updateStockLevel(stock.sku, updated);
    }
  });
}

export default useIntegrationStore;
