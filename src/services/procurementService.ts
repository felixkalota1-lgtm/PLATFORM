import { db } from '../firebase.config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';

// Types
export interface Order {
  id: string;
  // Company info
  fromCompanyId: string;
  fromCompanyName: string;
  toCompanyId: string;
  toCompanyName: string;
  
  // Order details
  orderNumber: string;
  orderType: 'internal' | 'external'; // internal = same company, external = different company
  status: 'draft' | 'sent' | 'received' | 'accepted' | 'rejected' | 'in-progress' | 'completed' | 'cancelled';
  
  // Items
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  
  // Dates
  createdAt: Timestamp;
  sentAt?: Timestamp;
  requiredByDate?: Timestamp;
  completedAt?: Timestamp;
  
  // User info
  createdBy: string;
  createdByName: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: Timestamp;
  
  // Notes
  description?: string;
  specialInstructions?: string;
  
  // Tracking
  shipmentAddress?: string;
  referenceNumber?: string;
  attachments?: string[]; // File URLs
  messageCount: number;
  hasUnreadMessages: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  specifications?: Record<string, string>;
}

export interface Vendor {
  id: string;
  companyId: string; // The vendor's company ID
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  
  // Ratings
  rating: number; // 1-5
  totalOrders: number;
  completedOrders: number;
  averageDeliveryTime: number; // days
  
  // Status
  isActive: boolean;
  isFavorite: boolean;
  
  // Categories
  categories: string[];
  
  createdAt: Timestamp;
  lastOrdered?: Timestamp;
}

export interface OrderMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderCompanyId: string;
  recipientCompanyId: string;
  
  messageType: 'message' | 'status-change' | 'file-upload' | 'note';
  content: string;
  attachments?: Array<{
    url: string;
    name: string;
    size: number;
  }>;
  
  isRead: boolean;
  createdAt: Timestamp;
  editedAt?: Timestamp;
}

export interface RFQ {
  id: string;
  fromCompanyId: string;
  fromCompanyName: string;
  
  rfqNumber: string;
  status: 'draft' | 'sent' | 'quotes-received' | 'closed';
  
  items: RFQItem[];
  
  targetVendors?: string[]; // Company IDs of vendors to send RFQ to
  
  description?: string;
  requiredByDate?: Timestamp;
  
  createdAt: Timestamp;
  sentAt?: Timestamp;
  responseDeadline?: Timestamp;
  
  createdBy: string;
  createdByName: string;
  
  totalQuotesReceived: number;
}

export interface RFQItem {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  unit: string;
  specifications?: Record<string, string>;
  budgetAmount?: number;
}

// ============= ORDER MANAGEMENT =============

export const procurementService = {
  // ============= CREATE ORDERS =============
  
  async createOrder(order: Omit<Order, 'id' | 'createdAt'>, userId: string): Promise<string> {
    try {
      const orderRef = await addDoc(collection(db, 'orders'), {
        ...order,
        createdAt: Timestamp.now(),
        lastUpdatedAt: Timestamp.now(),
        lastUpdatedBy: userId,
        messageCount: 0,
        hasUnreadMessages: false,
      });
      return orderRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // ============= GET ORDERS =============

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const docSnap = await getDoc(doc(db, 'orders', orderId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Order;
      }
      return null;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  async getOrdersBySender(companyId: string, userId?: string): Promise<Order[]> {
    try {
      let q;
      if (userId) {
        q = query(
          collection(db, 'orders'),
          where('fromCompanyId', '==', companyId),
          where('createdBy', '==', userId),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'orders'),
          where('fromCompanyId', '==', companyId),
          orderBy('createdAt', 'desc')
        );
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      console.error('Error fetching sent orders:', error);
      throw error;
    }
  },

  async getOrdersAsRecipient(companyId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('toCompanyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      console.error('Error fetching received orders:', error);
      throw error;
    }
  },

  async getAllCompanyOrders(companyId: string): Promise<Order[]> {
    try {
      const sentQ = query(
        collection(db, 'orders'),
        where('fromCompanyId', '==', companyId)
      );
      const receivedQ = query(
        collection(db, 'orders'),
        where('toCompanyId', '==', companyId)
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentQ),
        getDocs(receivedQ),
      ]);

      const sentOrders = sentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      const receivedOrders = receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

      return [...sentOrders, ...receivedOrders].sort(
        (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
      );
    } catch (error) {
      console.error('Error fetching all company orders:', error);
      throw error;
    }
  },

  subscribeToOrdersAsRecipient(companyId: string, callback: (orders: Order[]) => void) {
    try {
      const q = query(
        collection(db, 'orders'),
        where('toCompanyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, snapshot => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        callback(orders);
      });
    } catch (error) {
      console.error('Error subscribing to orders:', error);
      throw error;
    }
  },

  // ============= UPDATE ORDERS =============

  async updateOrderStatus(
    orderId: string,
    status: Order['status'],
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        lastUpdatedAt: Timestamp.now(),
        lastUpdatedBy: userId,
      };

      if (status === 'sent') {
        updateData.sentAt = Timestamp.now();
      } else if (status === 'completed') {
        updateData.completedAt = Timestamp.now();
      }

      await updateDoc(doc(db, 'orders', orderId), updateData);

      // Log status change as a message
      await addDoc(collection(db, 'orders', orderId, 'messages'), {
        senderId: userId,
        senderName: userName,
        messageType: 'status-change',
        content: `Order status changed to ${status}`,
        isRead: false,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  async addItemsToOrder(orderId: string, items: OrderItem[]): Promise<void> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) throw new Error('Order not found');

      const newItems = [...order.items, ...items];
      const totalAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0);

      await updateDoc(doc(db, 'orders', orderId), {
        items: newItems,
        totalAmount,
        lastUpdatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error adding items to order:', error);
      throw error;
    }
  },

  async removeItemFromOrder(orderId: string, itemId: string): Promise<void> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) throw new Error('Order not found');

      const newItems = order.items.filter(item => item.id !== itemId);
      const totalAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0);

      await updateDoc(doc(db, 'orders', orderId), {
        items: newItems,
        totalAmount,
        lastUpdatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error removing item from order:', error);
      throw error;
    }
  },

  async updateOrder(orderId: string, updates: Partial<Order>, userId: string): Promise<void> {
    try {
      const { id, createdAt, ...safeUpdates } = updates;
      await updateDoc(doc(db, 'orders', orderId), {
        ...safeUpdates,
        lastUpdatedAt: Timestamp.now(),
        lastUpdatedBy: userId,
      });
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  async deleteOrder(orderId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  },

  // ============= VENDOR MANAGEMENT =============

  async addVendor(vendor: Omit<Vendor, 'id' | 'createdAt'>): Promise<string> {
    try {
      const vendorRef = await addDoc(collection(db, 'vendors'), {
        ...vendor,
        createdAt: Timestamp.now(),
      });
      return vendorRef.id;
    } catch (error) {
      console.error('Error adding vendor:', error);
      throw error;
    }
  },

  async getVendor(vendorId: string): Promise<Vendor | null> {
    try {
      const docSnap = await getDoc(doc(db, 'vendors', vendorId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Vendor;
      }
      return null;
    } catch (error) {
      console.error('Error fetching vendor:', error);
      throw error;
    }
  },

  async getVendorsByCompany(companyId: string): Promise<Vendor[]> {
    try {
      const q = query(
        collection(db, 'vendors'),
        where('companyId', '==', companyId),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  },

  async getFavoriteVendors(companyId: string): Promise<Vendor[]> {
    try {
      const q = query(
        collection(db, 'vendors'),
        where('companyId', '==', companyId),
        where('isFavorite', '==', true)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
    } catch (error) {
      console.error('Error fetching favorite vendors:', error);
      throw error;
    }
  },

  async updateVendor(vendorId: string, updates: Partial<Vendor>): Promise<void> {
    try {
      const { id, createdAt, ...safeUpdates } = updates;
      await updateDoc(doc(db, 'vendors', vendorId), safeUpdates);
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  },

  async toggleFavoriteVendor(vendorId: string, isFavorite: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'vendors', vendorId), { isFavorite });
    } catch (error) {
      console.error('Error toggling favorite vendor:', error);
      throw error;
    }
  },

  // ============= RFQ (REQUEST FOR QUOTE) =============

  async createRFQ(rfq: Omit<RFQ, 'id' | 'createdAt'>, _userId: string): Promise<string> {
    try {
      const rfqRef = await addDoc(collection(db, 'rfqs'), {
        ...rfq,
        createdAt: Timestamp.now(),
        totalQuotesReceived: 0,
      });
      return rfqRef.id;
    } catch (error) {
      console.error('Error creating RFQ:', error);
      throw error;
    }
  },

  async getRFQ(rfqId: string): Promise<RFQ | null> {
    try {
      const docSnap = await getDoc(doc(db, 'rfqs', rfqId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as RFQ;
      }
      return null;
    } catch (error) {
      console.error('Error fetching RFQ:', error);
      throw error;
    }
  },

  async getRFQsByCompany(companyId: string): Promise<RFQ[]> {
    try {
      const q = query(
        collection(db, 'rfqs'),
        where('fromCompanyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RFQ));
    } catch (error) {
      console.error('Error fetching RFQs:', error);
      throw error;
    }
  },

  async sendRFQToVendors(rfqId: string, vendorCompanyIds: string[]): Promise<void> {
    try {
      await updateDoc(doc(db, 'rfqs', rfqId), {
        targetVendors: vendorCompanyIds,
        sentAt: Timestamp.now(),
        status: 'sent',
      });
    } catch (error) {
      console.error('Error sending RFQ:', error);
      throw error;
    }
  },
};

export default procurementService;
