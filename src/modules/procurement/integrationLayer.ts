/**
 * PROCUREMENT & WAREHOUSE INTEGRATION
 * Links procurement requests to warehouse fulfillment
 */

import { useEffect, useState } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';
import { useIntegrationStore } from '../../services/integrationStore';

interface ProcurementOrder {
  orderId: string;
  requestedBy: string;
  department: string;
  items: Array<{
    sku?: string;
    name: string;
    quantity: number;
    priority: 'urgent' | 'high' | 'medium' | 'low';
  }>;
  status: 'pending_approval' | 'approved' | 'fulfilling' | 'fulfilled' | 'rejected';
  createdAt: Date;
  approvedAt?: Date;
}

/**
 * Hook for managing procurement requests from departments
 */
export function useProcurementRequests() {
  const [requests, setRequests] = useState<ProcurementOrder[]>([]);
  const integrationStore = useIntegrationStore();

  // Create a new procurement request
  const createRequest = (
    department: string,
    items: ProcurementOrder['items'],
    createdBy: string
  ) => {
    const newRequest: ProcurementOrder = {
      orderId: `PO-${Date.now()}`,
      requestedBy: createdBy,
      department,
      items,
      status: 'pending_approval',
      createdAt: new Date(),
    };

    setRequests((prev) => [newRequest, ...prev]);

    // Emit integration event - this triggers warehouse notifications
    eventBus.emit(INTEGRATION_EVENTS.PROCUREMENT_REQUEST_CREATED, {
      requestId: newRequest.orderId,
      department,
      requestedBy: createdBy,
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        priority: i.priority,
      })),
      timestamp: new Date(),
    });

    // Add to integration store for cross-module visibility
    integrationStore.createRequest({
      id: newRequest.orderId,
      type: 'procurement',
      department,
      items,
      status: 'pending',
      createdAt: new Date(),
      createdBy,
    });

    console.log(`✅ Procurement request created: ${newRequest.orderId}`);
    return newRequest;
  };

  // Approve a request
  const approveRequest = (orderId: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.orderId === orderId ? { ...req, status: 'approved', approvedAt: new Date() } : req
      )
    );

    eventBus.emit(INTEGRATION_EVENTS.PROCUREMENT_REQUEST_APPROVED, {
      requestId: orderId,
      timestamp: new Date(),
    });

    integrationStore.updateRequestStatus(orderId, 'approved');
  };

  // Reject a request
  const rejectRequest = (orderId: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.orderId === orderId ? { ...req, status: 'rejected' } : req))
    );

    eventBus.emit(INTEGRATION_EVENTS.PROCUREMENT_REQUEST_REJECTED, {
      requestId: orderId,
      timestamp: new Date(),
    });
  };

  // Mark as fulfilled
  const fulfillRequest = (orderId: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.orderId === orderId ? { ...req, status: 'fulfilled' } : req))
    );

    eventBus.emit(INTEGRATION_EVENTS.PROCUREMENT_ORDER_RECEIVED, {
      requestId: orderId,
      timestamp: new Date(),
    });

    integrationStore.updateRequestStatus(orderId, 'fulfilled');
  };

  return {
    requests,
    createRequest,
    approveRequest,
    rejectRequest,
    fulfillRequest,
    pendingRequests: requests.filter((r) => r.status === 'pending_approval'),
    approvedRequests: requests.filter((r) => r.status === 'approved'),
  };
}

/**
 * Hook for warehouse to receive and process procurement orders
 */
export function useWarehouseOrderQueue(warehouseId: string) {
  const [incomingOrders, setIncomingOrders] = useState<ProcurementOrder[]>([]);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    // Listen for new procurement requests
    const unsubRequest = eventBus.on(INTEGRATION_EVENTS.PROCUREMENT_REQUEST_CREATED, (data) => {
      const order: ProcurementOrder = {
        orderId: data.requestId,
        requestedBy: data.requestedBy,
        department: data.department,
        items: data.items,
        status: 'fulfilling',
        createdAt: new Date(),
      };

      setIncomingOrders((prev) => [order, ...prev]);
      setQueueSize((prev) => prev + data.items.reduce((sum: number, item: any) => sum + item.quantity, 0));

      console.log(
        `📦 Warehouse received order ${data.requestId} from ${data.department}: ${data.items.length} items`
      );
    });

    // Listen for approved requests
    const unsubApproved = eventBus.on(INTEGRATION_EVENTS.PROCUREMENT_REQUEST_APPROVED, (data) => {
      setIncomingOrders((prev) =>
        prev.map((order) => (order.orderId === data.requestId ? { ...order, status: 'fulfilling' } : order))
      );
    });

    return () => {
      unsubRequest();
      unsubApproved();
    };
  }, [warehouseId]);

  // Process order - pick and pack items
  const processOrder = (orderId: string) => {
    const order = incomingOrders.find((o) => o.orderId === orderId);
    if (!order) return;

    setIncomingOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: 'fulfilled' } : o))
    );

    setQueueSize((prev) =>
      Math.max(0, prev - order.items.reduce((sum, item) => sum + item.quantity, 0))
    );

    console.log(`✅ Order ${orderId} processed and ready for dispatch`);
  };

  return {
    incomingOrders,
    queueSize,
    processOrder,
    pendingOrders: incomingOrders.filter((o) => o.status === 'fulfilling'),
  };
}

/**
 * Hook for inter-branch stock transfers within the company
 */
export function useInterBranchTransfers(currentBranchId: string) {
  const [outgoingRequests, setOutgoingRequests] = useState<
    Array<{
      requestId: string;
      fromBranch: string;
      toBranch: string;
      items: Array<{
        sku: string;
        name: string;
        quantity: number;
      }>;
      status: 'pending' | 'approved' | 'fulfilled';
      createdAt: Date;
    }>
  >([]);

  // Request stock from another branch
  const requestFromBranch = (fromBranch: string, items: any[]) => {
    const request = {
      requestId: `IBST-${Date.now()}`, // Inter-Branch Stock Transfer
      fromBranch,
      toBranch: currentBranchId,
      items,
      status: 'pending' as const,
      createdAt: new Date(),
    };

    setOutgoingRequests((prev) => [request, ...prev]);

    // Emit event
    eventBus.emit(INTEGRATION_EVENTS.INVENTORY_TRANSFER_REQUEST, {
      requestId: request.requestId,
      branch: currentBranchId,
      requestedItems: items,
      timestamp: new Date(),
    });
  };

  return {
    outgoingRequests,
    requestFromBranch,
    pendingRequests: outgoingRequests.filter((r) => r.status === 'pending'),
  };
}

export default {
  useProcurementRequests,
  useWarehouseOrderQueue,
  useInterBranchTransfers,
};
