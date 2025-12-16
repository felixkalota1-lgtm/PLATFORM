import { useState, useCallback } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';

// ============================================================================
// Customer Management / CRM Integration Layer
// Links customers to orders, tracks communication history, follow-ups
// ============================================================================

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  createdDate: Date;
  lastContactDate: Date;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive' | 'prospect';
  rating: number;
}

interface CustomerOrder {
  customerId: string;
  orderId: string;
  orderDate: Date;
  amount: number;
  status: string;
}

interface CommunicationLog {
  id: string;
  customerId: string;
  type: 'email' | 'call' | 'meeting' | 'message';
  subject: string;
  notes: string;
  date: Date;
  nextFollowUp?: Date;
}

// Hook 1: Customer order history tracking
export function useCustomerOrderHistory() {
  const [customers, setCustomers] = useState<Map<string, Customer>>(new Map());
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);

  const addOrderToCustomer = useCallback((customerId: string, orderId: string, amount: number) => {
    const order: CustomerOrder = {
      customerId,
      orderId,
      orderDate: new Date(),
      amount,
      status: 'pending',
    };

    setCustomerOrders((prev) => [...prev, order]);

    // Update customer
    setCustomers((prev) => {
      const updated = new Map(prev);
      const customer = updated.get(customerId);
      if (customer) {
        customer.totalOrders += 1;
        customer.totalSpent += amount;
        customer.lastContactDate = new Date();
      }
      return updated;
    });

    eventBus.emit(INTEGRATION_EVENTS.CUSTOMER_ORDER_RECORDED, {
      customerId,
      orderId,
      amount,
      timestamp: new Date(),
    });
  }, []);

  return {
    customers,
    customerOrders,
    addOrderToCustomer,
  };
}

// Hook 2: Customer communication log
export function useCustomerCommunicationLog() {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);

  const recordCommunication = useCallback(
    (customerId: string, type: 'email' | 'call' | 'meeting' | 'message', subject: string, notes: string, nextFollowUp?: Date) => {
      const log: CommunicationLog = {
        id: `COMM-${Date.now()}`,
        customerId,
        type,
        subject,
        notes,
        date: new Date(),
        nextFollowUp,
      };

      setLogs((prev) => [...prev, log]);

      eventBus.emit(INTEGRATION_EVENTS.CUSTOMER_COMMUNICATION_LOGGED, {
        customerId,
        communicationType: type,
        subject,
        timestamp: new Date(),
      });

      if (nextFollowUp) {
        eventBus.emit(INTEGRATION_EVENTS.CUSTOMER_FOLLOWUP_SCHEDULED, {
          customerId,
          followUpDate: nextFollowUp,
          timestamp: new Date(),
        });
      }
    },
    []
  );

  const getCustomerHistory = useCallback((customerId: string) => {
    return logs.filter((l) => l.customerId === customerId).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [logs]);

  return {
    logs,
    recordCommunication,
    getCustomerHistory,
  };
}

// Hook 3: Customer follow-up alerts
export function useCustomerFollowUpAlerts() {
  const scheduleFollowUp = useCallback((customerId: string, dueDate: Date, reason: string) => {
    eventBus.emit(INTEGRATION_EVENTS.CUSTOMER_FOLLOWUP_SCHEDULED, {
      customerId,
      dueDate,
      reason,
      timestamp: new Date(),
    });
  }, []);

  return {
    scheduleFollowUp,
  };
}
