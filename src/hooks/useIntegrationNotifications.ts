/**
 * INTEGRATION NOTIFICATION HOOK
 * Real-time notification system that listens to events across all modules
 */

import { useEffect, useState, useCallback } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../services/integrationEventBus';

interface IntegrationNotification {
  id: string;
  type:
    | 'warehouse_transfer'
    | 'inventory_low_stock'
    | 'procurement_request'
    | 'internal_order'
    | 'document_expiring'
    | 'employee_contract_expiring'
    | 'quotation_received'
    | 'order_shipped'
    | 'maintenance_due';
  title: string;
  message: string;
  icon: string;
  relatedModule: string;
  relatedId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  actionUrl?: string;
  timestamp: Date;
  read: boolean;
}

export function useIntegrationNotifications() {
  const [notifications, setNotifications] = useState<IntegrationNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification: Omit<IntegrationNotification, 'id'>) => {
    const newNotification: IntegrationNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random()}`,
    };

    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    return newNotification.id;
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Set up event listeners
  useEffect(() => {
    // Warehouse stock transfer notification
    const unsubWarehouseTransfer = eventBus.on(INTEGRATION_EVENTS.WAREHOUSE_TRANSFER_COMPLETED, (data: any) => {
      addNotification({
        type: 'warehouse_transfer',
        title: 'Stock Transfer Completed',
        message: `Transfer from ${data.source} to ${data.destination} has been delivered`,
        icon: 'TrendingUp',
        relatedModule: 'warehouse',
        relatedId: data.transferId,
        priority: 'medium',
        actionUrl: `/warehouse/transfer`,
        timestamp: new Date(),
        read: false,
      });
    });

    // Inventory low stock alert
    const unsubLowStock = eventBus.on(INTEGRATION_EVENTS.INVENTORY_STOCK_LOW, (data: any) => {
      addNotification({
        type: 'inventory_low_stock',
        title: 'Low Stock Alert',
        message: `${data.productName} (${data.sku}) is running low. Current: ${data.quantity}`,
        icon: 'AlertTriangle',
        relatedModule: 'inventory',
        relatedId: data.sku,
        priority: 'high',
        actionUrl: `/inventory/products`,
        timestamp: new Date(),
        read: false,
      });
    });

    // Procurement request created
    const unsubProcurement = eventBus.on(INTEGRATION_EVENTS.PROCUREMENT_REQUEST_CREATED, (data: any) => {
      addNotification({
        type: 'procurement_request',
        title: 'New Procurement Request',
        message: `${data.department} has submitted a procurement request`,
        icon: 'FileText',
        relatedModule: 'procurement',
        relatedId: data.requestId,
        priority: 'high',
        actionUrl: `/procurement/requests`,
        timestamp: new Date(),
        read: false,
      });
    });

    // Inventory transfer request (for warehouse team)
    const unsubInventoryTransfer = eventBus.on(INTEGRATION_EVENTS.INVENTORY_TRANSFER_REQUEST, (data: any) => {
      addNotification({
        type: 'internal_order',
        title: 'Inventory Transfer Requested',
        message: `${data.branch} is requesting ${data.requestedItems.length} item(s) from warehouse`,
        icon: 'Package',
        relatedModule: 'warehouse',
        relatedId: data.requestId,
        priority: 'high',
        actionUrl: `/warehouse/transfer`,
        timestamp: new Date(),
        read: false,
      });
    });

    // Document expiring soon
    const unsubDocExpiring = eventBus.on(INTEGRATION_EVENTS.DOCUMENT_EXPIRING, (data: any) => {
      addNotification({
        type: 'document_expiring',
        title: 'Document Expiring Soon',
        message: `${data.documentName} expires on ${data.expiryDate?.toLocaleDateString()}`,
        icon: 'AlertCircle',
        relatedModule: 'company-files',
        relatedId: data.documentName,
        priority: 'medium',
        actionUrl: `/company-files/documents`,
        timestamp: new Date(),
        read: false,
      });
    });

    // HR Contract expiring
    const unsubContractExpiring = eventBus.on(INTEGRATION_EVENTS.CONTRACT_EXPIRING, (data: any) => {
      addNotification({
        type: 'employee_contract_expiring',
        title: 'Employee Contract Expiring',
        message: `${data.employeeName}'s contract expires in ${data.daysUntilExpiry} days`,
        icon: 'Users',
        relatedModule: 'hr',
        relatedId: data.employeeId,
        priority: 'high',
        actionUrl: `/hr/contracts`,
        timestamp: new Date(),
        read: false,
      });
    });

    // Quotation received
    const unsubQuotation = eventBus.on(INTEGRATION_EVENTS.QUOTATION_SENT, (data: any) => {
      addNotification({
        type: 'quotation_received',
        title: 'Quotation Received',
        message: `Quotation received from ${data.vendorName} for ${data.amount}`,
        icon: 'FileText',
        relatedModule: 'procurement',
        relatedId: data.quotationId,
        priority: 'medium',
        actionUrl: `/procurement/quotations`,
        timestamp: new Date(),
        read: false,
      });
    });

    // Order shipped
    const unsubShipment = eventBus.on(INTEGRATION_EVENTS.SHIPMENT_DELIVERED, (data: any) => {
      addNotification({
        type: 'order_shipped',
        title: 'Order Delivered',
        message: `Order #${data.orderId} has been delivered`,
        icon: 'CheckCircle',
        relatedModule: 'logistics',
        relatedId: data.orderId,
        priority: 'medium',
        actionUrl: `/logistics/tracking`,
        timestamp: new Date(),
        read: false,
      });
    });

    // Vehicle maintenance due
    const unsubMaintenance = eventBus.on(INTEGRATION_EVENTS.VEHICLE_MAINTENANCE_DUE, (data: any) => {
      addNotification({
        type: 'maintenance_due',
        title: 'Vehicle Maintenance Due',
        message: `${data.vehicleName} is due for maintenance (${data.odometer} km / ${data.hours} hrs)`,
        icon: 'Wrench',
        relatedModule: 'logistics',
        relatedId: data.vehicleId,
        priority: 'high',
        actionUrl: `/logistics/maintenance`,
        timestamp: new Date(),
        read: false,
      });
    });

    // Cleanup function
    return () => {
      unsubWarehouseTransfer();
      unsubLowStock();
      unsubProcurement();
      unsubInventoryTransfer();
      unsubDocExpiring();
      unsubContractExpiring();
      unsubQuotation();
      unsubShipment();
      unsubMaintenance();
    };
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    recentNotifications: notifications.slice(0, 5),
    criticalNotifications: notifications.filter((n) => n.priority === 'critical'),
  };
}

export type { IntegrationNotification };
