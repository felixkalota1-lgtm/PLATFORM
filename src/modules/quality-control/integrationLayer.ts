import { useEffect, useState, useCallback } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';

// ============================================================================
// Quality Control Integration Layer
// Links QC inspections to goods receipt, rejects, and vendor scoring
// ============================================================================

interface QCInspection {
  id: string;
  shipmentId: string;
  vendorId: string;
  inspectionDate: Date;
  itemsInspected: number;
  itemsAccepted: number;
  itemsRejected: number;
  defectType: string;
  severity: 'critical' | 'major' | 'minor';
  notes: string;
  inspector: string;
  status: 'passed' | 'failed' | 'conditional';
}

interface RejectedItem {
  id: string;
  inspectionId: string;
  itemSku: string;
  quantity: number;
  reason: string;
  action: 'return_to_vendor' | 'scrap' | 'rework';
}

// Hook 1: QC Inspection on goods receipt
export function useQCInspection() {
  const [inspections, setInspections] = useState<QCInspection[]>([]);
  const [rejectedItems, setRejectedItems] = useState<RejectedItem[]>([]);

  useEffect(() => {
    const handleShipmentDelivered = (data: any) => {
      createInspection(data.shipmentId, data.vendorId);
    };

    eventBus.on(INTEGRATION_EVENTS.SHIPMENT_DELIVERED, handleShipmentDelivered);

    return () => {
      eventBus.removeAllListeners(INTEGRATION_EVENTS.SHIPMENT_DELIVERED);
    };
  }, []);

  const createInspection = useCallback((shipmentId: string, vendorId: string) => {
    const inspectionId = `QC-${Date.now()}`;

    eventBus.emit(INTEGRATION_EVENTS.QUALITY_INSPECTION_INITIATED, {
      inspectionId,
      shipmentId,
      vendorId,
      timestamp: new Date(),
    });
  }, []);

  const completeInspection = useCallback(
    (inspectionId: string, itemsInspected: number, itemsAccepted: number, itemsRejected: number, severity: string) => {
      const inspection: QCInspection = {
        id: inspectionId,
        shipmentId: `SHIP-${Date.now()}`,
        vendorId: `VEN-${Date.now()}`,
        inspectionDate: new Date(),
        itemsInspected,
        itemsAccepted,
        itemsRejected,
        defectType: 'Quality',
        severity: (severity as any) || 'minor',
        notes: '',
        inspector: 'QC-Team',
        status: itemsRejected === 0 ? 'passed' : 'failed',
      };

      setInspections((prev) => [...prev, inspection]);

      if (itemsRejected > 0) {
        eventBus.emit(INTEGRATION_EVENTS.QUALITY_INSPECTION_FAILED, {
          inspectionId,
          rejectedItems: itemsRejected,
          severity,
          timestamp: new Date(),
        });
      } else {
        eventBus.emit(INTEGRATION_EVENTS.QUALITY_INSPECTION_PASSED, {
          inspectionId,
          timestamp: new Date(),
        });
      }
    },
    []
  );

  const recordRejection = useCallback(
    (inspectionId: string, itemSku: string, quantity: number, reason: string, action: 'return_to_vendor' | 'scrap' | 'rework') => {
      const rejectedItem: RejectedItem = {
        id: `REJ-${Date.now()}`,
        inspectionId,
        itemSku,
        quantity,
        reason,
        action,
      };

      setRejectedItems((prev) => [...prev, rejectedItem]);

      if (action === 'return_to_vendor') {
        eventBus.emit(INTEGRATION_EVENTS.REJECTED_ITEMS_RETURN_TO_VENDOR, {
          inspectionId,
          itemSku,
          quantity,
          timestamp: new Date(),
        });
      }
    },
    []
  );

  return {
    inspections,
    rejectedItems,
    createInspection,
    completeInspection,
    recordRejection,
  };
}

// Hook 2: Reject handling workflow
export function useRejectHandling() {
  const [rejectWorkflows, setRejectWorkflows] = useState<any[]>([]);

  const initiateReturnToVendor = useCallback((inspectionId: string, vendorId: string, items: any[]) => {
    const workflowId = `RMA-${Date.now()}`;

    eventBus.emit(INTEGRATION_EVENTS.REJECTED_ITEMS_RETURN_TO_VENDOR, {
      workflowId,
      inspectionId,
      vendorId,
      itemCount: items.length,
      timestamp: new Date(),
    });

    setRejectWorkflows((prev) => [...prev, { id: workflowId, status: 'initiated', vendorId }]);
  }, []);

  const completeReturn = useCallback((workflowId: string) => {
    setRejectWorkflows((prev) =>
      prev.map((w) => (w.id === workflowId ? { ...w, status: 'completed' } : w))
    );

    eventBus.emit(INTEGRATION_EVENTS.REJECTED_ITEMS_RETURN_TO_VENDOR, {
      workflowId,
      timestamp: new Date(),
    });
  }, []);

  return {
    rejectWorkflows,
    initiateReturnToVendor,
    completeReturn,
  };
}

// Hook 3: Vendor performance scoring from QC
export function useQCVendorScoring() {
  const [vendorScores, setVendorScores] = useState<Map<string, number>>(new Map());

  const calculateVendorQCScore = useCallback((vendorId: string, inspections: any[]) => {
    const vendorInspections = inspections.filter((i) => i.vendorId === vendorId);
    
    if (vendorInspections.length === 0) return 100;

    const acceptanceRate =
      (vendorInspections.reduce((sum, i) => sum + i.itemsAccepted, 0) /
        vendorInspections.reduce((sum, i) => sum + i.itemsInspected, 0)) *
      100;

    setVendorScores((prev) => new Map(prev).set(vendorId, acceptanceRate));

    eventBus.emit(INTEGRATION_EVENTS.VENDOR_QC_SCORE_UPDATED, {
      vendorId,
      qcScore: acceptanceRate,
      timestamp: new Date(),
    });

    return acceptanceRate;
  }, []);

  return {
    vendorScores,
    calculateVendorQCScore,
  };
}
