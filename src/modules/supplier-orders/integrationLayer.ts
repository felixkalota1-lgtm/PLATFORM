import { useState, useCallback } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';

// ============================================================================
// Supplier Orders Integration Layer
// PO to receipt matching, vendor delivery performance, reorder suggestions
// ============================================================================

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  items: Array<{ sku: string; quantity: number; unitPrice: number }>;
  totalAmount: number;
  createdDate: Date;
  expectedDeliveryDate: Date;
  status: 'draft' | 'confirmed' | 'received' | 'completed';
  notes: string;
}

interface ReceiptMatching {
  id: string;
  poId: string;
  receivedDate: Date;
  receivedItems: Array<{ sku: string; quantity: number }>;
  variance: Array<{ sku: string; expectedQty: number; receivedQty: number }>;
  status: 'matched' | 'variance' | 'pending';
}

// Hook 1: Purchase order management with receipt matching
export function usePurchaseOrderManagement() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [receipts, setReceipts] = useState<ReceiptMatching[]>([]);

  const createPO = useCallback(
    (vendorId: string, items: any[], expectedDeliveryDate: Date, notes?: string) => {
      const poId = `PO-${Date.now()}`;
      const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

      const po: PurchaseOrder = {
        id: poId,
        poNumber: `PO-${Date.now()}`,
        vendorId,
        items,
        totalAmount,
        createdDate: new Date(),
        expectedDeliveryDate,
        status: 'draft',
        notes: notes || '',
      };

      setPurchaseOrders((prev) => [...prev, po]);

      eventBus.emit(INTEGRATION_EVENTS.PURCHASE_ORDER_CREATED, {
        poId,
        vendorId,
        totalAmount,
        itemCount: items.length,
        timestamp: new Date(),
      });

      return poId;
    },
    []
  );

  const confirmPO = useCallback((poId: string) => {
    setPurchaseOrders((prev) => prev.map((po) => (po.id === poId ? { ...po, status: 'confirmed' } : po)));

    eventBus.emit(INTEGRATION_EVENTS.PURCHASE_ORDER_CONFIRMED, {
      poId,
      timestamp: new Date(),
    });
  }, []);

  const recordReceipt = useCallback(
    (poId: string, receivedItems: any[]) => {
      const po = purchaseOrders.find((p) => p.id === poId);
      if (!po) return;

      const variance: any[] = [];
      po.items.forEach((item) => {
        const received = receivedItems.find((r) => r.sku === item.sku);
        if (!received || received.quantity !== item.quantity) {
          variance.push({
            sku: item.sku,
            expectedQty: item.quantity,
            receivedQty: received?.quantity || 0,
          });
        }
      });

      const receipt: ReceiptMatching = {
        id: `REC-${Date.now()}`,
        poId,
        receivedDate: new Date(),
        receivedItems,
        variance,
        status: variance.length === 0 ? 'matched' : 'variance',
      };

      setReceipts((prev) => [...prev, receipt]);

      setPurchaseOrders((prev) =>
        prev.map((p) => (p.id === poId ? { ...p, status: 'received' } : p))
      );

      eventBus.emit(INTEGRATION_EVENTS.PURCHASE_ORDER_RECEIPT_RECORDED, {
        poId,
        receiptId: receipt.id,
        status: receipt.status,
        timestamp: new Date(),
      });

      if (variance.length > 0) {
        eventBus.emit(INTEGRATION_EVENTS.PURCHASE_ORDER_VARIANCE_DETECTED, {
          poId,
          variance,
          timestamp: new Date(),
        });
      }
    },
    [purchaseOrders]
  );

  return {
    purchaseOrders,
    receipts,
    createPO,
    confirmPO,
    recordReceipt,
  };
}

// Hook 2: Vendor delivery performance tracking
export function useVendorDeliveryPerformance() {
  const [performanceMetrics, setPerformanceMetrics] = useState<Map<string, any>>(new Map());

  const calculateDeliveryPerformance = useCallback((vendorId: string, orders: any[]) => {
    const vendorOrders = orders.filter((o) => o.vendorId === vendorId);
    if (vendorOrders.length === 0) return null;

    const onTimeDeliveries = vendorOrders.filter((o) => {
      const deliveryDate = new Date(o.createdDate);
      const expectedDate = new Date(o.expectedDeliveryDate);
      return deliveryDate <= expectedDate;
    }).length;

    const onTimePercentage = (onTimeDeliveries / vendorOrders.length) * 100;
    const averageDeliveryDays =
      vendorOrders.reduce((sum, o) => {
        const days = Math.ceil(
          (new Date(o.createdDate).getTime() - new Date(o.expectedDeliveryDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0) / vendorOrders.length;

    const metrics = {
      vendorId,
      onTimePercentage,
      averageDeliveryDays,
      totalOrders: vendorOrders.length,
      calculatedDate: new Date(),
    };

    setPerformanceMetrics((prev) => new Map(prev).set(vendorId, metrics));

    eventBus.emit(INTEGRATION_EVENTS.VENDOR_DELIVERY_PERFORMANCE_CALCULATED, {
      vendorId,
      onTimePercentage,
      timestamp: new Date(),
    });

    return metrics;
  }, []);

  return {
    performanceMetrics,
    calculateDeliveryPerformance,
  };
}

// Hook 3: Automatic reorder suggestions
export function useAutomaticReorderSuggestions() {
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const generateReorderSuggestion = useCallback((sku: string, currentStock: number, reorderLevel: number, vendorId: string) => {
    if (currentStock <= reorderLevel) {
      const suggestionId = `SG-${Date.now()}`;

      const suggestion = {
        id: suggestionId,
        sku,
        currentStock,
        recommendedQuantity: reorderLevel * 2,
        vendorId,
        createdDate: new Date(),
        status: 'pending',
      };

      setSuggestions((prev) => [...prev, suggestion]);

      eventBus.emit(INTEGRATION_EVENTS.REORDER_SUGGESTION_GENERATED, {
        suggestionId,
        sku,
        recommendedQuantity: reorderLevel * 2,
        vendorId,
        timestamp: new Date(),
      });

      return suggestionId;
    }
    return null;
  }, []);

  const approveSuggestion = useCallback((suggestionId: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === suggestionId ? { ...s, status: 'approved' } : s))
    );

    eventBus.emit(INTEGRATION_EVENTS.REORDER_SUGGESTION_APPROVED, {
      suggestionId,
      timestamp: new Date(),
    });
  }, []);

  return {
    suggestions,
    generateReorderSuggestion,
    approveSuggestion,
  };
}
