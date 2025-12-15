import { useEffect, useState, useCallback } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';

// ============================================================================
// Order Tracking Integration Layer
// Links orders to quotations, automates customer communication, tracks status
// ============================================================================

interface OrderCommunication {
  orderId: string;
  customerId: string;
  email: string;
  type: 'quotation_sent' | 'order_confirmed' | 'order_processing' | 'shipment_dispatched' | 'delivery_confirmed';
  subject: string;
  message: string;
  sentAt: Date;
  status: 'sent' | 'failed' | 'bounced';
}

interface OrderWithQuotation {
  orderId: string;
  quotationId: string;
  customerId: string;
  status: 'quotation_sent' | 'quotation_accepted' | 'order_processing' | 'shipped' | 'delivered';
  quotationValidUntilDate: Date;
  orderCreatedDate: Date;
  items: Array<{
    sku: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  communicationHistory: OrderCommunication[];
}

// Hook 1: Auto-link quotations to orders when accepted
export function useQuotationToOrderLinking() {
  const [linkedOrders, setLinkedOrders] = useState<Map<string, OrderWithQuotation>>(new Map());
  const [expiredQuotations, setExpiredQuotations] = useState<string[]>([]);

  useEffect(() => {
    // Listen for quotation acceptance
    const handleQuotationAccepted = (data: any) => {
      linkQuotationToOrder(data.quotationId, data.customerId, data.items, data.totalAmount);
    };

    // Listen for quotation expiration check
    const checkQuotationExpiry = setInterval(() => {
      validateQuotationExpiry();
    }, 3600000); // Every hour

    eventBus.on(INTEGRATION_EVENTS.QUOTATION_ACCEPTED, handleQuotationAccepted);

    return () => {
      eventBus.removeAllListeners(INTEGRATION_EVENTS.QUOTATION_ACCEPTED);
      clearInterval(checkQuotationExpiry);
    };
  }, []);

  const linkQuotationToOrder = useCallback(
    (quotationId: string, customerId: string, items: any[], totalAmount: number) => {
      const orderId = `ORD-${Date.now()}`;

      const order: OrderWithQuotation = {
        orderId,
        quotationId,
        customerId,
        status: 'quotation_accepted',
        quotationValidUntilDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        orderCreatedDate: new Date(),
        items,
        totalAmount,
        communicationHistory: [],
      };

      setLinkedOrders((prev) => new Map(prev).set(orderId, order));

      eventBus.emit(INTEGRATION_EVENTS.ORDER_CREATED_FROM_QUOTATION, {
        orderId,
        quotationId,
        customerId,
        items,
        totalAmount,
        timestamp: new Date(),
      });

      // Auto-send order confirmation email
      sendOrderConfirmationEmail(orderId, customerId);
    },
    []
  );

  const validateQuotationExpiry = useCallback(() => {
    const now = new Date();
    const expired: string[] = [];

    linkedOrders.forEach((order, orderId) => {
      if (
        order.status === 'quotation_sent' &&
        order.quotationValidUntilDate < now
      ) {
        expired.push(orderId);

        eventBus.emit(INTEGRATION_EVENTS.QUOTATION_EXPIRED, {
          quotationId: order.quotationId,
          orderId,
          customerId: order.customerId,
          timestamp: new Date(),
        });
      }
    });

    if (expired.length > 0) {
      setExpiredQuotations(expired);
    }
  }, [linkedOrders]);

  const sendOrderConfirmationEmail = useCallback((orderId: string, customerId: string) => {
    const order = linkedOrders.get(orderId);
    if (order) {
      const communication: OrderCommunication = {
        orderId,
        customerId,
        email: `customer-${customerId}@example.com`,
        type: 'order_confirmed',
        subject: `Order Confirmation: ${orderId}`,
        message: `Your order has been confirmed. Order ID: ${orderId}. Total: $${order.totalAmount}`,
        sentAt: new Date(),
        status: 'sent',
      };

      setLinkedOrders((prev) => {
        const updated = new Map(prev);
        const order = updated.get(orderId);
        if (order) {
          order.communicationHistory.push(communication);
        }
        return updated;
      });

      eventBus.emit(INTEGRATION_EVENTS.CUSTOMER_EMAIL_SENT, {
        orderId,
        customerId,
        emailType: 'order_confirmation',
        timestamp: new Date(),
      });
    }
  }, [linkedOrders]);

  return {
    linkedOrders,
    expiredQuotations,
    linkQuotationToOrder,
    validateQuotationExpiry,
  };
}

// Hook 2: Automated customer communication on order status changes
export function useOrderStatusCommunication() {
  const [communications, setCommunications] = useState<OrderCommunication[]>([]);

  useEffect(() => {
    // Listen for order status changes
    const handleOrderProcessing = (data: any) => {
      sendStatusEmail(data.orderId, data.customerId, 'order_processing');
    };

    const handleShipmentDispatched = (data: any) => {
      sendStatusEmail(data.orderId, data.customerId, 'shipment_dispatched');
    };

    const handleShipmentDelivered = (data: any) => {
      sendStatusEmail(data.orderId, data.customerId, 'delivery_confirmed');
    };

    eventBus.on(INTEGRATION_EVENTS.ORDER_STATUS_CHANGED, handleOrderProcessing);
    eventBus.on(INTEGRATION_EVENTS.SHIPMENT_IN_TRANSIT, handleShipmentDispatched);
    eventBus.on(INTEGRATION_EVENTS.SHIPMENT_DELIVERED, handleShipmentDelivered);

    return () => {
      eventBus.removeAllListeners(INTEGRATION_EVENTS.ORDER_STATUS_CHANGED);
      eventBus.removeAllListeners(INTEGRATION_EVENTS.SHIPMENT_IN_TRANSIT);
      eventBus.removeAllListeners(INTEGRATION_EVENTS.SHIPMENT_DELIVERED);
    };
  }, []);

  const sendStatusEmail = useCallback(
    (orderId: string, customerId: string, type: OrderCommunication['type']) => {
      const statusMessages: Record<OrderCommunication['type'], string> = {
        quotation_sent: 'Your quotation has been prepared',
        order_confirmed: 'Your order has been confirmed',
        order_processing: 'Your order is being processed and will ship soon',
        shipment_dispatched: `Your order is on the way! Track it at: [tracking link]`,
        delivery_confirmed: 'Your order has been delivered. Thank you for your purchase!',
      };

      const communication: OrderCommunication = {
        orderId,
        customerId,
        email: `customer-${customerId}@example.com`,
        type,
        subject: `Order Update: ${orderId}`,
        message: statusMessages[type],
        sentAt: new Date(),
        status: 'sent',
      };

      setCommunications((prev) => [...prev, communication]);

      eventBus.emit(INTEGRATION_EVENTS.CUSTOMER_NOTIFICATION_SENT, {
        orderId,
        customerId,
        communicationType: type,
        timestamp: new Date(),
      });
    },
    []
  );

  return {
    communications,
    sendStatusEmail,
  };
}

// Hook 3: Order tracking status page with real-time updates
export function useOrderTrackingStatus() {
  const [trackingData, setTrackingData] = useState<
    Map<
      string,
      {
        orderId: string;
        currentStatus: string;
        estimatedDelivery: Date | null;
        shipmentStatus: string | null;
        trackingNumber: string | null;
        lastUpdate: Date;
        statusHistory: Array<{
          status: string;
          timestamp: Date;
          description: string;
        }>;
      }
    >
  >(new Map());

  useEffect(() => {
    // Listen for all order and shipment updates
    const handleOrderStatusChanged = (data: any) => {
      updateOrderStatus(data.orderId, data.status, data.description);
    };

    const handleShipmentCreated = (data: any) => {
      updateShipmentInfo(data.orderId, data.shipmentId, data.trackingNumber);
    };

    const handleShipmentUpdated = (data: any) => {
      updateShipmentStatus(data.shipmentId, data.status, data.location);
    };

    const handleShipmentDelivered = (data: any) => {
      updateShipmentStatus(data.shipmentId, 'delivered', 'Delivered');
    };

    eventBus.on(INTEGRATION_EVENTS.ORDER_STATUS_CHANGED, handleOrderStatusChanged);
    eventBus.on(INTEGRATION_EVENTS.SHIPMENT_CREATED, handleShipmentCreated);
    eventBus.on(INTEGRATION_EVENTS.SHIPMENT_IN_TRANSIT, handleShipmentUpdated);
    eventBus.on(INTEGRATION_EVENTS.SHIPMENT_DELIVERED, handleShipmentDelivered);

    return () => {
      eventBus.removeAllListeners(INTEGRATION_EVENTS.ORDER_STATUS_CHANGED);
      eventBus.removeAllListeners(INTEGRATION_EVENTS.SHIPMENT_CREATED);
      eventBus.removeAllListeners(INTEGRATION_EVENTS.SHIPMENT_IN_TRANSIT);
      eventBus.removeAllListeners(INTEGRATION_EVENTS.SHIPMENT_DELIVERED);
    };
  }, []);

  const updateOrderStatus = useCallback(
    (orderId: string, status: string, description: string) => {
      setTrackingData((prev) => {
        const updated = new Map(prev);
        const tracking = updated.get(orderId) || {
          orderId,
          currentStatus: status,
          estimatedDelivery: null,
          shipmentStatus: null,
          trackingNumber: null,
          lastUpdate: new Date(),
          statusHistory: [],
        };

        tracking.currentStatus = status;
        tracking.lastUpdate = new Date();
        tracking.statusHistory.push({
          status,
          timestamp: new Date(),
          description,
        });

        updated.set(orderId, tracking);
        return updated;
      });

      eventBus.emit(INTEGRATION_EVENTS.ORDER_TRACKING_UPDATED, {
        orderId,
        status,
        timestamp: new Date(),
      });
    },
    []
  );

  const updateShipmentInfo = useCallback(
    (orderId: string, _shipmentId: string, trackingNumber: string) => {
      setTrackingData((prev) => {
        const updated = new Map(prev);
        const tracking = updated.get(orderId);
        if (tracking) {
          tracking.shipmentStatus = 'in_transit';
          tracking.trackingNumber = trackingNumber;
          tracking.lastUpdate = new Date();
        }
        return updated;
      });
    },
    []
  );

  const updateShipmentStatus = useCallback(
    (shipmentId: string, status: string, location: string) => {
      // Find order by shipment and update
      setTrackingData((prev) => {
        const updated = new Map(prev);
        updated.forEach((tracking) => {
          if (tracking.trackingNumber === shipmentId) {
            tracking.shipmentStatus = status;
            tracking.lastUpdate = new Date();
            tracking.statusHistory.push({
              status: `Shipment ${status}`,
              timestamp: new Date(),
              description: `Location: ${location}`,
            });
          }
        });
        return updated;
      });
    },
    []
  );

  return {
    trackingData,
    updateOrderStatus,
    updateShipmentInfo,
    updateShipmentStatus,
  };
}
