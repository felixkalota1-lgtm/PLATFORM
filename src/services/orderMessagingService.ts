import { db } from '../firebase.config';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';

export interface OrderMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderCompanyId: string;
  
  messageType: 'message' | 'status-change' | 'file-upload' | 'quote-request';
  content: string;
  
  attachments?: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
  
  isRead: boolean;
  readAt?: Timestamp;
  
  createdAt: Timestamp;
  editedAt?: Timestamp;
}

export const orderMessagingService = {
  // ============= SEND MESSAGE =============

  async sendMessage(
    orderId: string,
    senderId: string,
    senderName: string,
    senderCompanyId: string,
    content: string,
    messageType: OrderMessage['messageType'] = 'message',
    attachments?: OrderMessage['attachments']
  ): Promise<string> {
    try {
      const messageRef = await addDoc(collection(db, 'orders', orderId, 'messages'), {
        orderId,
        senderId,
        senderName,
        senderCompanyId,
        messageType,
        content,
        attachments: attachments || [],
        isRead: false,
        createdAt: Timestamp.now(),
      });

      // Update order with message count
      const messagesSnap = await getDocs(collection(db, 'orders', orderId, 'messages'));
      await updateDoc(doc(db, 'orders', orderId), {
        messageCount: messagesSnap.size,
        hasUnreadMessages: true,
        lastUpdatedAt: Timestamp.now(),
      });

      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // ============= GET MESSAGES =============

  async getOrderMessages(orderId: string): Promise<OrderMessage[]> {
    try {
      const q = query(
        collection(db, 'orders', orderId, 'messages'),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderMessage));
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  subscribeToOrderMessages(
    orderId: string,
    callback: (messages: OrderMessage[]) => void
  ) {
    try {
      const q = query(
        collection(db, 'orders', orderId, 'messages'),
        orderBy('createdAt', 'asc')
      );
      return onSnapshot(q, snapshot => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderMessage));
        callback(messages);
      });
    } catch (error) {
      console.error('Error subscribing to messages:', error);
      throw error;
    }
  },

  // ============= MARK AS READ =============

  async markMessageAsRead(orderId: string, messageId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'orders', orderId, 'messages', messageId), {
        isRead: true,
        readAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  async markAllMessagesAsRead(orderId: string): Promise<void> {
    try {
      const messages = await this.getOrderMessages(orderId);
      const unreadMessages = messages.filter(msg => !msg.isRead);

      for (const message of unreadMessages) {
        await this.markMessageAsRead(orderId, message.id);
      }

      // Update order unread status
      await updateDoc(doc(db, 'orders', orderId), {
        hasUnreadMessages: false,
      });
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      throw error;
    }
  },

  // ============= EDIT MESSAGE =============

  async editMessage(
    orderId: string,
    messageId: string,
    newContent: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'orders', orderId, 'messages', messageId), {
        content: newContent,
        editedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  },

  // ============= UNREAD MESSAGE COUNT =============

  async getUnreadMessageCount(orderId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'orders', orderId, 'messages'),
        where('isRead', '==', false)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  async getTotalUnreadMessages(orderIds: string[]): Promise<number> {
    try {
      let total = 0;
      for (const orderId of orderIds) {
        const count = await this.getUnreadMessageCount(orderId);
        total += count;
      }
      return total;
    } catch (error) {
      console.error('Error fetching total unread messages:', error);
      throw error;
    }
  },
};

export default orderMessagingService;
