import { useEffect, useState, useCallback } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';

// ============================================================================
// Vendor Management Integration Layer
// Links vendor performance, procurement selection, and order tracking
// ============================================================================

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  rating: number; // 0-5 stars
  deliveryAccuracy: number; // % on-time deliveries
  qualityScore: number; // % acceptable goods
  responseTime: number; // hours
  totalOrders: number;
  successfulOrders: number;
  failedOrders: number;
  lastOrderDate?: Date;
  paymentTerms: string;
}

interface VendorPerformance {
  vendorId: string;
  orderId: string;
  orderDate: Date;
  deliveryDate?: Date;
  expectedDeliveryDate: Date;
  qualityIssues: number;
  rejectedItems: number;
  totalItems: number;
  onTime: boolean;
  qualityPassed: boolean;
}

interface VendorPayment {
  vendorId: string;
  paymentId: string;
  amount: number;
  invoiceNumber: string;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue';
}

// Hook 1: Track vendor performance from orders
export function useVendorPerformanceTracking() {
  const [vendors, setVendors] = useState<Map<string, Vendor>>(new Map());
  const [performanceRecords, setPerformanceRecords] = useState<VendorPerformance[]>([]);

  useEffect(() => {
    // Listen for order/procurement events to update vendor performance
    const handleOrderApproved = (data: any) => {
      if (data.vendorId) {
        updateVendorOrderCount(data.vendorId, 'increment');
      }
    };

    const handleShipmentDelivered = (data: any) => {
      if (data.vendorId) {
        recordDeliveryPerformance(data.vendorId, data.orderId, data.deliveryDate, true);
      }
    };

    const handleQualityIssue = (data: any) => {
      if (data.vendorId) {
        recordQualityIssue(data.vendorId, data.orderId, data.rejectedItems);
      }
    };

    eventBus.on(INTEGRATION_EVENTS.PROCUREMENT_ORDER_RECEIVED, handleOrderApproved);
    eventBus.on(INTEGRATION_EVENTS.SHIPMENT_DELIVERED, handleShipmentDelivered);
    eventBus.on(INTEGRATION_EVENTS.QUALITY_INSPECTION_FAILED, handleQualityIssue);

    return () => {
      eventBus.removeAllListeners(INTEGRATION_EVENTS.PROCUREMENT_ORDER_RECEIVED);
      eventBus.removeAllListeners(INTEGRATION_EVENTS.SHIPMENT_DELIVERED);
      eventBus.removeAllListeners(INTEGRATION_EVENTS.QUALITY_INSPECTION_FAILED);
    };
  }, []);

  const updateVendorOrderCount = useCallback((vendorId: string, action: 'increment' | 'failed') => {
    setVendors((prev) => {
      const updated = new Map(prev);
      const vendor = updated.get(vendorId);
      if (vendor) {
        if (action === 'increment') {
          vendor.successfulOrders += 1;
          vendor.totalOrders += 1;
        } else {
          vendor.failedOrders += 1;
          vendor.totalOrders += 1;
        }
        vendor.rating = (vendor.successfulOrders / vendor.totalOrders) * 5;
        updated.set(vendorId, vendor);
      }
      return updated;
    });
  }, []);

  const recordDeliveryPerformance = useCallback(
    (vendorId: string, orderId: string, deliveryDate: Date, onTime: boolean) => {
      const performance: VendorPerformance = {
        vendorId,
        orderId,
        orderDate: new Date(),
        deliveryDate,
        expectedDeliveryDate: new Date(),
        qualityIssues: 0,
        rejectedItems: 0,
        totalItems: 0,
        onTime,
        qualityPassed: true,
      };

      setPerformanceRecords((prev) => [...prev, performance]);

      if (onTime) {
        setVendors((prev) => {
          const updated = new Map(prev);
          const vendor = updated.get(vendorId);
          if (vendor) {
            const totalDeliveries = performanceRecords.filter(
              (p) => p.vendorId === vendorId && p.deliveryDate
            ).length;
            const onTimeDeliveries = performanceRecords.filter(
              (p) => p.vendorId === vendorId && p.onTime
            ).length;
            vendor.deliveryAccuracy = (onTimeDeliveries / totalDeliveries) * 100;
            updated.set(vendorId, vendor);
          }
          return updated;
        });
      }

      eventBus.emit(INTEGRATION_EVENTS.VENDOR_PERFORMANCE_UPDATED, {
        vendorId,
        orderId,
        onTime,
        timestamp: new Date(),
      });
    },
    [performanceRecords]
  );

  const recordQualityIssue = useCallback(
    (vendorId: string, orderId: string, rejectedItems: number) => {
      setPerformanceRecords((prev) =>
        prev.map((p) =>
          p.orderId === orderId
            ? {
                ...p,
                rejectedItems,
                qualityPassed: rejectedItems === 0,
              }
            : p
        )
      );

      setVendors((prev) => {
        const updated = new Map(prev);
        const vendor = updated.get(vendorId);
        if (vendor) {
          const totalDeliveries = performanceRecords.filter(
            (p) => p.vendorId === vendorId && p.deliveryDate
          ).length;
          const qualityPasses = performanceRecords.filter(
            (p) => p.vendorId === vendorId && p.qualityPassed
          ).length;
          vendor.qualityScore = (qualityPasses / totalDeliveries) * 100;
          updated.set(vendorId, vendor);
        }
        return updated;
      });
    },
    [performanceRecords]
  );

  return {
    vendors,
    performanceRecords,
    recordDeliveryPerformance,
    recordQualityIssue,
  };
}

// Hook 2: Auto-select best vendors for procurement
export function useBestVendorSelection() {
  const [selectedVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    const handleProcurementRequest = () => {
      // Select best vendor based on rating, delivery accuracy, quality score
      selectBestVendor();
    };

    eventBus.on(INTEGRATION_EVENTS.PROCUREMENT_REQUEST_CREATED, handleProcurementRequest);

    return () => {
      eventBus.removeAllListeners(INTEGRATION_EVENTS.PROCUREMENT_REQUEST_CREATED);
    };
  }, []);

  const selectBestVendor = useCallback(() => {
    // In real implementation, would filter vendors by item type and quantity capacity
    // Score = (rating * 0.5 + deliveryAccuracy * 0.3 + qualityScore * 0.2)
    // Select vendor with highest score

    eventBus.emit(INTEGRATION_EVENTS.VENDOR_SELECTED_FOR_ORDER, {
      selectedVendor,
      alternativeVendors: [],
      timestamp: new Date(),
    });
  }, [selectedVendor]);

  return {
    selectedVendor,
    selectBestVendor,
  };
}

// Hook 3: Track vendor payments and due dates
export function useVendorPaymentTracking() {
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [overduePayments, setOverduePayments] = useState<VendorPayment[]>([]);

  useEffect(() => {
    // Listen for invoice creation events
    const handleInvoiceCreated = (data: any) => {
      if (data.vendorId) {
        createPaymentRecord(data.vendorId, data.invoiceNumber, data.amount, data.dueDate);
      }
    };

    const handlePaymentMade = (data: any) => {
      if (data.vendorId) {
        recordPayment(data.vendorId, data.paymentId, data.paidDate);
      }
    };

    eventBus.on(INTEGRATION_EVENTS.INVOICE_CREATED, handleInvoiceCreated);
    eventBus.on(INTEGRATION_EVENTS.VENDOR_PAYMENT_MADE, handlePaymentMade);

    // Check for overdue payments daily
    const overdueCheck = setInterval(() => {
      checkOverduePayments();
    }, 86400000); // 24 hours

    return () => {
      eventBus.removeAllListeners(INTEGRATION_EVENTS.INVOICE_CREATED);
      eventBus.removeAllListeners(INTEGRATION_EVENTS.VENDOR_PAYMENT_MADE);
      clearInterval(overdueCheck);
    };
  }, []);

  const createPaymentRecord = useCallback(
    (vendorId: string, invoiceNumber: string, amount: number, dueDate: Date) => {
      const payment: VendorPayment = {
        vendorId,
        paymentId: `PAY-${Date.now()}`,
        amount,
        invoiceNumber,
        dueDate,
        status: 'pending',
      };

      setPayments((prev) => [...prev, payment]);

      eventBus.emit(INTEGRATION_EVENTS.VENDOR_INVOICE_RECORDED, {
        vendorId,
        invoiceNumber,
        amount,
        dueDate,
        timestamp: new Date(),
      });
    },
    []
  );

  const recordPayment = useCallback((vendorId: string, paymentId: string, paidDate: Date) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.paymentId === paymentId
          ? {
              ...p,
              paidDate,
              status: 'paid',
            }
          : p
      )
    );

    eventBus.emit(INTEGRATION_EVENTS.VENDOR_PAYMENT_RECORDED, {
      vendorId,
      paymentId,
      paidDate,
      timestamp: new Date(),
    });
  }, []);

  const checkOverduePayments = useCallback(() => {
    const now = new Date();
    const overdue = payments.filter(
      (p) => p.status === 'pending' && p.dueDate < now
    );

    setOverduePayments(overdue);

    if (overdue.length > 0) {
      eventBus.emit(INTEGRATION_EVENTS.VENDOR_PAYMENT_OVERDUE, {
        overdueCount: overdue.length,
        totalAmount: overdue.reduce((sum, p) => sum + p.amount, 0),
        timestamp: new Date(),
      });
    }
  }, [payments]);

  return {
    payments,
    overduePayments,
    createPaymentRecord,
    recordPayment,
    checkOverduePayments,
  };
}
