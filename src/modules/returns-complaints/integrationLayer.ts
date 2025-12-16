import { useEffect, useState, useCallback } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';
import { useIntegrationStore } from '../../services/integrationStore';

// ============================================================================
// Returns & Complaints Integration Layer
// Links returns authorization, refund processing, and inventory adjustments
// ============================================================================

interface ReturnAuthorization {
  id: string;
  orderId: string;
  customerId: string;
  itemSku: string;
  quantity: number;
  reason: 'defective' | 'damaged' | 'wrong_item' | 'customer_request' | 'other';
  createdDate: Date;
  status: 'approved' | 'rejected' | 'completed';
  refundAmount: number;
}

interface Complaint {
  id: string;
  customerId: string;
  orderId?: string;
  subject: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdDate: Date;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  resolution?: string;
}

// Hook 1: Return authorization workflow
export function useReturnAuthorization() {
  const [returnAuths, setReturnAuths] = useState<ReturnAuthorization[]>([]);
  const store = useIntegrationStore();

  useEffect(() => {
    const handleReturnRequest = (data: any) => {
      createReturnAuthorization(data.orderId, data.customerId, data.itemSku, data.quantity, data.reason);
    };

    eventBus.on(INTEGRATION_EVENTS.RETURN_AUTHORIZATION_CREATED, handleReturnRequest);

    return () => {
      eventBus.removeAllListeners(INTEGRATION_EVENTS.RETURN_AUTHORIZATION_CREATED);
    };
  }, []);

  const createReturnAuthorization = useCallback(
    (orderId: string, customerId: string, itemSku: string, quantity: number, reason: string) => {
      const raId = `RA-${Date.now()}`;

      const auth: ReturnAuthorization = {
        id: raId,
        orderId,
        customerId,
        itemSku,
        quantity,
        reason: (reason as any) || 'customer_request',
        createdDate: new Date(),
        status: 'approved',
        refundAmount: 0,
      };

      setReturnAuths((prev) => [...prev, auth]);

      eventBus.emit(INTEGRATION_EVENTS.RETURN_AUTHORIZATION_CREATED, {
        raId,
        orderId,
        customerId,
        itemSku,
        quantity,
        timestamp: new Date(),
      });
    },
    []
  );

  const approveReturn = useCallback((raId: string, refundAmount: number) => {
    setReturnAuths((prev) =>
      prev.map((r) =>
        r.id === raId
          ? {
              ...r,
              status: 'approved',
              refundAmount,
            }
          : r
      )
    );

    eventBus.emit(INTEGRATION_EVENTS.RETURN_AUTHORIZATION_APPROVED, {
      raId,
      refundAmount,
      timestamp: new Date(),
    });
  }, []);

  const completeReturn = useCallback((raId: string) => {
    const auth = returnAuths.find((r) => r.id === raId);
    if (!auth) return;

    setReturnAuths((prev) => prev.map((r) => (r.id === raId ? { ...r, status: 'completed' } : r)));

    // Adjust inventory
    const stockLevel = store.stockLevels.get(auth.itemSku);
    if (stockLevel) {
      store.updateStockLevel(auth.itemSku, {
        ...stockLevel,
        warehouseQuantity: stockLevel.warehouseQuantity + auth.quantity,
      });
    }

    eventBus.emit(INTEGRATION_EVENTS.RETURN_RECEIVED, {
      raId,
      itemSku: auth.itemSku,
      quantity: auth.quantity,
      timestamp: new Date(),
    });
  }, [returnAuths, store]);

  return {
    returnAuths,
    createReturnAuthorization,
    approveReturn,
    completeReturn,
  };
}

// Hook 2: Refund processing
export function useRefundProcessing() {
  const [refunds, setRefunds] = useState<any[]>([]);

  const processRefund = useCallback((raId: string, customerId: string, amount: number) => {
    const refundId = `REF-${Date.now()}`;

    setRefunds((prev) => [...prev, { id: refundId, raId, customerId, amount, status: 'processed', date: new Date() }]);

    eventBus.emit(INTEGRATION_EVENTS.REFUND_PROCESSED, {
      refundId,
      raId,
      customerId,
      amount,
      timestamp: new Date(),
    });
  }, []);

  return {
    refunds,
    processRefund,
  };
}

// Hook 3: Complaint management and tracking
export function useComplaintManagement() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const createComplaint = useCallback(
    (customerId: string, subject: string, description: string, severity: string, orderId?: string) => {
      const complaintId = `CMP-${Date.now()}`;

      const complaint: Complaint = {
        id: complaintId,
        customerId,
        orderId,
        subject,
        description,
        severity: (severity as any) || 'medium',
        createdDate: new Date(),
        status: 'open',
      };

      setComplaints((prev) => [...prev, complaint]);

      eventBus.emit(INTEGRATION_EVENTS.CUSTOMER_COMPLAINT_CREATED, {
        complaintId,
        customerId,
        severity,
        timestamp: new Date(),
      });
    },
    []
  );

  const resolveComplaint = useCallback((complaintId: string, resolution: string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId
          ? {
              ...c,
              status: 'resolved',
              resolution,
            }
          : c
      )
    );

    eventBus.emit(INTEGRATION_EVENTS.CUSTOMER_COMPLAINT_RESOLVED, {
      complaintId,
      resolution,
      timestamp: new Date(),
    });
  }, []);

  return {
    complaints,
    createComplaint,
    resolveComplaint,
  };
}
