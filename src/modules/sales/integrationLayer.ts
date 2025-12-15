/**
 * SALES & MARKETPLACE INTEGRATION MODULE
 * Links quotations, orders, and marketplace transactions across the platform
 */

import { useState } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';

interface SalesQuotation {
  id: string;
  quotationNumber: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  items: Array<{
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  tax: number;
  totalAmount: number;
  validUntil: Date;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted_to_order';
  createdAt: Date;
  sentAt?: Date;
  respondedAt?: Date;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  quotationId?: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  items: Array<{
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  tax: number;
  totalAmount: number;
  shippingAddress: string;
  paymentStatus: 'pending' | 'partially_paid' | 'paid';
  fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: Date;
  expectedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

/**
 * Hook for managing sales quotations
 */
export function useSalesQuotations() {
  const [quotations, setQuotations] = useState<SalesQuotation[]>([]);

  // Create quotation
  const createQuotation = (
    buyerName: string,
    buyerEmail: string,
    sellerName: string,
    items: SalesQuotation['items'],
    taxRate: number = 0.1 // 10% tax
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * taxRate;
    const totalAmount = subtotal + tax;

    const quotation: SalesQuotation = {
      id: `QUOTE-${Date.now()}`,
      quotationNumber: `QT-${Date.now()}`,
      buyerName,
      buyerEmail,
      sellerName,
      items,
      subtotal,
      tax,
      totalAmount,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'draft',
      createdAt: new Date(),
    };

    setQuotations((prev) => [...prev, quotation]);
    console.log(`✅ Quotation created: ${quotation.quotationNumber}`);
    return quotation;
  };

  // Send quotation to buyer
  const sendQuotation = (quotationId: string) => {
    setQuotations((prev) =>
      prev.map((q) =>
        q.id === quotationId
          ? {
              ...q,
              status: 'sent',
              sentAt: new Date(),
            }
          : q
      )
    );

    const quotation = quotations.find((q) => q.id === quotationId);
    if (quotation) {
      eventBus.emit(INTEGRATION_EVENTS.QUOTATION_SENT, {
        quotationId,
        quotationNumber: quotation.quotationNumber,
        vendorName: quotation.sellerName,
        buyerName: quotation.buyerName,
        amount: quotation.totalAmount,
        timestamp: new Date(),
      });

      console.log(`✅ Quotation sent to ${quotation.buyerName}`);
    }
  };

  // Accept quotation (convert to order)
  const acceptQuotation = (quotationId: string): SalesOrder | null => {
    const quotation = quotations.find((q) => q.id === quotationId);
    if (!quotation) return null;

    setQuotations((prev) =>
      prev.map((q) =>
        q.id === quotationId
          ? {
              ...q,
              status: 'accepted',
              respondedAt: new Date(),
            }
          : q
      )
    );

    const order: SalesOrder = {
      id: `ORDER-${Date.now()}`,
      orderNumber: `ORD-${Date.now()}`,
      quotationId,
      buyerName: quotation.buyerName,
      buyerEmail: quotation.buyerEmail,
      sellerName: quotation.sellerName,
      items: quotation.items,
      subtotal: quotation.subtotal,
      tax: quotation.tax,
      totalAmount: quotation.totalAmount,
      shippingAddress: quotation.buyerEmail,
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      orderDate: new Date(),
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    // Emit order created event
    eventBus.emit(INTEGRATION_EVENTS.ORDER_CREATED_FROM_QUOTATION, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      quotationId,
      buyerName: quotation.buyerName,
      itemCount: quotation.items.length,
      totalAmount: quotation.totalAmount,
      timestamp: new Date(),
    });

    console.log(`✅ Order created from quotation: ${order.orderNumber}`);
    return order;
  };

  // Reject quotation
  const rejectQuotation = (quotationId: string) => {
    setQuotations((prev) =>
      prev.map((q) =>
        q.id === quotationId
          ? {
              ...q,
              status: 'rejected',
              respondedAt: new Date(),
            }
          : q
      )
    );
  };

  return {
    quotations,
    createQuotation,
    sendQuotation,
    acceptQuotation,
    rejectQuotation,
    draftQuotations: quotations.filter((q) => q.status === 'draft'),
    sentQuotations: quotations.filter((q) => q.status === 'sent'),
    acceptedQuotations: quotations.filter((q) => q.status === 'accepted'),
  };
}

/**
 * Hook for managing sales orders and fulfillment
 */
export function useSalesOrders(_companyRole: 'buyer' | 'seller') {
  const [orders, setOrders] = useState<SalesOrder[]>([]);

  // Create order (usually from quotation acceptance)
  const createOrder = (
    buyerName: string,
    buyerEmail: string,
    sellerName: string,
    items: SalesOrder['items'],
    shippingAddress: string,
    quotationId?: string
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.1;
    const totalAmount = subtotal + tax;

    const order: SalesOrder = {
      id: `ORDER-${Date.now()}`,
      orderNumber: `ORD-${Date.now()}`,
      quotationId,
      buyerName,
      buyerEmail,
      sellerName,
      items,
      subtotal,
      tax,
      totalAmount,
      shippingAddress,
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      orderDate: new Date(),
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    setOrders((prev) => [...prev, order]);

    // Emit order created event
    eventBus.emit(INTEGRATION_EVENTS.MARKETPLACE_ORDER_PLACED, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerName,
      sellerName,
      itemCount: items.length,
      totalAmount,
      timestamp: new Date(),
    });

    console.log(`✅ Order created: ${order.orderNumber}`);
    return order;
  };

  // Update order fulfillment status
  const updateFulfillmentStatus = (
    orderId: string,
    status: SalesOrder['fulfillmentStatus']
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              fulfillmentStatus: status,
              shippedAt: status === 'shipped' ? new Date() : o.shippedAt,
              deliveredAt: status === 'delivered' ? new Date() : o.deliveredAt,
            }
          : o
      )
    );

    const order = orders.find((o) => o.id === orderId);
    if (order && status === 'shipped') {
      eventBus.emit(INTEGRATION_EVENTS.SHIPMENT_IN_TRANSIT, {
        orderId,
        orderNumber: order.orderNumber,
        destination: order.shippingAddress,
        timestamp: new Date(),
      });
    }

    if (order && status === 'delivered') {
      eventBus.emit(INTEGRATION_EVENTS.SHIPMENT_DELIVERED, {
        orderId,
        orderNumber: order.orderNumber,
        deliveredAt: new Date(),
        timestamp: new Date(),
      });
    }
  };

  // Update payment status
  const updatePaymentStatus = (
    orderId: string,
    status: SalesOrder['paymentStatus']
  ) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: status } : o))
    );
  };

  return {
    orders,
    createOrder,
    updateFulfillmentStatus,
    updatePaymentStatus,
    pendingOrders: orders.filter((o) => o.fulfillmentStatus === 'pending'),
    shippedOrders: orders.filter((o) => o.fulfillmentStatus === 'shipped'),
    deliveredOrders: orders.filter((o) => o.fulfillmentStatus === 'delivered'),
    unpaidOrders: orders.filter((o) => o.paymentStatus !== 'paid'),
  };
}

/**
 * Hook for marketplace shopping cart and checkout
 */
export function useMarketplaceCart() {
  const [cartItems, setCartItems] = useState<
    Array<{
      productId: string;
      vendorId: string;
      vendorName: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      sku: string;
    }>
  >([]);

  // Add item to cart
  const addToCart = (
    productId: string,
    vendorId: string,
    vendorName: string,
    productName: string,
    quantity: number,
    unitPrice: number,
    sku: string
  ) => {
    const existingItem = cartItems.find(
      (item) => item.productId === productId && item.vendorId === vendorId
    );

    if (existingItem) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.productId === productId && item.vendorId === vendorId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          productId,
          vendorId,
          vendorName,
          productName,
          quantity,
          unitPrice,
          sku,
        },
      ]);
    }

    // Emit event
    eventBus.emit(INTEGRATION_EVENTS.CART_ITEM_ADDED, {
      productId,
      productName,
      vendorName,
      quantity,
      timestamp: new Date(),
    });

    console.log(`✅ Added to cart: ${productName}`);
  };

  // Checkout
  const checkout = (): SalesOrder[] => {
    const orders: SalesOrder[] = cartItems.map((item) => ({
      id: `ORDER-${Date.now()}`,
      orderNumber: `ORD-${Date.now()}`,
      buyerName: 'Current User', // Would be actual user
      buyerEmail: 'buyer@company.com',
      sellerName: item.vendorName,
      items: [
        {
          sku: item.sku,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        },
      ],
      subtotal: item.quantity * item.unitPrice,
      tax: (item.quantity * item.unitPrice) * 0.1,
      totalAmount: (item.quantity * item.unitPrice) * 1.1,
      shippingAddress: 'Company Address',
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      orderDate: new Date(),
    }));

    // Clear cart
    setCartItems([]);

    // Emit checkout event
    eventBus.emit(INTEGRATION_EVENTS.CART_CHECKOUT_COMPLETED, {
      orderCount: orders.length,
      totalAmount: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      timestamp: new Date(),
    });

    console.log(`✅ Checkout completed: ${orders.length} orders created`);
    return orders;
  };

  return {
    cartItems,
    addToCart,
    checkout,
    cartTotal: cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  };
}

export default {
  useSalesQuotations,
  useSalesOrders,
  useMarketplaceCart,
};
