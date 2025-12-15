/**
 * INTEGRATION EVENT BUS
 * Central hub for all cross-module events and notifications
 * Enables loose coupling between modules while maintaining data synchronization
 */

type EventCallback = (data: any) => void;

interface EventListener {
  callback: EventCallback;
  once?: boolean;
}

class IntegrationEventBus {
  private listeners: Map<string, EventListener[]> = new Map();

  /**
   * Subscribe to an event
   */
  on(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const listener: EventListener = { callback };
    this.listeners.get(eventType)!.push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to an event once
   */
  once(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const listener: EventListener = { callback, once: true };
    this.listeners.get(eventType)!.push(listener);

    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event to all listeners
   */
  emit(eventType: string, data?: any): void {
    const listeners = this.listeners.get(eventType) || [];

    listeners.forEach((listener) => {
      try {
        listener.callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    });

    // Remove one-time listeners
    this.listeners.set(
      eventType,
      listeners.filter((l) => !l.once)
    );
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get listener count
   */
  listenerCount(eventType: string): number {
    return this.listeners.get(eventType)?.length || 0;
  }
}

// Export singleton instance
export const eventBus = new IntegrationEventBus();

/**
 * EVENT TYPES - Define all cross-module events here
 */
export const INTEGRATION_EVENTS = {
  // === WAREHOUSE EVENTS ===
  WAREHOUSE_STOCK_ADDED: 'warehouse:stock_added',
  WAREHOUSE_STOCK_UPDATED: 'warehouse:stock_updated',
  WAREHOUSE_STOCK_REMOVED: 'warehouse:stock_removed',
  WAREHOUSE_TRANSFER_INITIATED: 'warehouse:transfer_initiated',
  WAREHOUSE_TRANSFER_COMPLETED: 'warehouse:transfer_completed',
  WAREHOUSE_LOCATION_ASSIGNED: 'warehouse:location_assigned',

  // === INVENTORY EVENTS ===
  INVENTORY_PRODUCT_CREATED: 'inventory:product_created',
  INVENTORY_PRODUCT_UPDATED: 'inventory:product_updated',
  INVENTORY_STOCK_LOW: 'inventory:stock_low',
  INVENTORY_REORDER_REQUEST: 'inventory:reorder_request',
  INVENTORY_TRANSFER_REQUEST: 'inventory:transfer_request',

  // === PROCUREMENT EVENTS ===
  PROCUREMENT_REQUEST_CREATED: 'procurement:request_created',
  PROCUREMENT_REQUEST_APPROVED: 'procurement:request_approved',
  PROCUREMENT_REQUEST_REJECTED: 'procurement:request_rejected',
  PROCUREMENT_ORDER_CREATED: 'procurement:order_created',
  PROCUREMENT_ORDER_RECEIVED: 'procurement:order_received',

  // === SALES/QUOTATION EVENTS ===
  QUOTATION_CREATED: 'sales:quotation_created',
  QUOTATION_SENT: 'sales:quotation_sent',
  QUOTATION_ACCEPTED: 'sales:quotation_accepted',
  ORDER_CREATED_FROM_QUOTATION: 'sales:order_created_from_quotation',

  // === MARKETPLACE EVENTS ===
  MARKETPLACE_ORDER_PLACED: 'marketplace:order_placed',
  MARKETPLACE_PRODUCT_VIEWED: 'marketplace:product_viewed',
  CART_ITEM_ADDED: 'marketplace:cart_item_added',
  CART_CHECKOUT_COMPLETED: 'marketplace:checkout_completed',

  // === HR EVENTS ===
  EMPLOYEE_HIRED: 'hr:employee_hired',
  EMPLOYEE_DOCUMENT_UPLOADED: 'hr:document_uploaded',
  CONTRACT_EXPIRING: 'hr:contract_expiring',
  ATTENDANCE_RECORDED: 'hr:attendance_recorded',
  PAYROLL_PROCESSED: 'hr:payroll_processed',

  // === DOCUMENT EVENTS ===
  DOCUMENT_UPLOADED: 'documents:document_uploaded',
  DOCUMENT_EXPIRING: 'documents:document_expiring',
  DOCUMENT_REQUIRES_RENEWAL: 'documents:requires_renewal',

  // === LOGISTICS EVENTS ===
  SHIPMENT_CREATED: 'logistics:shipment_created',
  SHIPMENT_IN_TRANSIT: 'logistics:in_transit',
  SHIPMENT_DELIVERED: 'logistics:delivered',
  VEHICLE_MAINTENANCE_DUE: 'logistics:maintenance_due',

  // === COMMUNICATION EVENTS ===
  INTERNAL_REQUEST_CREATED: 'communication:internal_request_created',
  ORDER_REQUEST_FROM_DEPARTMENT: 'communication:order_request_from_department',

  // === NOTIFICATION EVENTS ===
  NOTIFICATION_CREATED: 'notifications:created',
  NOTIFICATION_READ: 'notifications:read',

  // === VENDOR MANAGEMENT EVENTS ===
  VENDOR_PERFORMANCE_UPDATED: 'vendor:performance_updated',
  VENDOR_SELECTED_FOR_ORDER: 'vendor:selected_for_order',
  VENDOR_PAYMENT_MADE: 'vendor:payment_made',
  VENDOR_PAYMENT_RECORDED: 'vendor:payment_recorded',
  VENDOR_PAYMENT_OVERDUE: 'vendor:payment_overdue',
  VENDOR_INVOICE_RECORDED: 'vendor:invoice_recorded',
  QUALITY_INSPECTION_FAILED: 'vendor:quality_inspection_failed',

  // === MARKETPLACE EXTENDED EVENTS ===
  MARKETPLACE_ITEM_OUT_OF_STOCK: 'marketplace:item_out_of_stock',
  MARKETPLACE_ITEM_LOW_STOCK: 'marketplace:item_low_stock',
  MARKETPLACE_INSUFFICIENT_INVENTORY: 'marketplace:insufficient_inventory',
  MARKETPLACE_PRICE_UPDATED: 'marketplace:price_updated',
  MARKETPLACE_CHECKOUT_COMPLETED: 'marketplace:checkout_completed',

  // === ORDER TRACKING EVENTS ===
  ORDER_TRACKING_UPDATED: 'order_tracking:updated',
  ORDER_STATUS_CHANGED: 'order_tracking:status_changed',
  QUOTATION_EXPIRED: 'order_tracking:quotation_expired',
  CUSTOMER_EMAIL_SENT: 'order_tracking:customer_email_sent',
  CUSTOMER_NOTIFICATION_SENT: 'order_tracking:customer_notification_sent',

  // === FINANCIAL EVENTS ===
  INVOICE_CREATED: 'finance:invoice_created',
};

/**
 * EVENT PAYLOAD TYPES
 */
export interface WarehouseStockEvent {
  warehouseId: string;
  sku: string;
  productName: string;
  quantity: number;
  previousQuantity?: number;
  location?: string;
  timestamp: Date;
  userId: string;
}

export interface StockTransferEvent {
  transferId: string;
  sourceBranch: string;
  destinationBranch: string;
  items: Array<{
    sku: string;
    productName: string;
    quantity: number;
  }>;
  status: 'initiated' | 'in_transit' | 'completed';
  timestamp: Date;
}

export interface ProcurementRequestEvent {
  requestId: string;
  department: string;
  requestedBy: string;
  items: Array<{
    name: string;
    quantity: number;
    priority: string;
  }>;
  timestamp: Date;
}

export interface InventoryRequestEvent {
  requestId: string;
  branch: string;
  requestedItems: Array<{
    sku: string;
    productName: string;
    quantity: number;
  }>;
  timestamp: Date;
}

export interface EmployeeDocumentEvent {
  employeeId: string;
  employeeName: string;
  documentType: string;
  documentName: string;
  uploadedAt: Date;
  expiryDate?: Date;
}

export interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedTo: string; // warehouse, inventory, procurement, hr, etc.
  relatedId: string; // ID of the related item
  userId: string;
  timestamp: Date;
  read: boolean;
}

export default eventBus;
