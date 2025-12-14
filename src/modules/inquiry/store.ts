import { create } from 'zustand';
import { Inquiry, Quote, Order, Message } from '../../types';

interface InquiryFlowState {
  inquiries: (Inquiry & { messages?: Message[] })[];
  quotes: Quote[];
  orders: Order[];
  selectedInquiry: string | null;
  
  // Inquiry actions
  createInquiry: (inquiry: Inquiry) => void;
  updateInquiry: (id: string, inquiry: Partial<Inquiry>) => void;
  cancelInquiry: (id: string) => void;
  getInquiriesByStatus: (status: Inquiry['status']) => (Inquiry & { messages?: Message[] })[];
  
  // Quote actions
  createQuote: (quote: Quote) => void;
  updateQuote: (id: string, quote: Partial<Quote>) => void;
  acceptQuote: (id: string) => void;
  rejectQuote: (id: string) => void;
  
  // Order actions
  createOrder: (order: Order) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  
  // Messaging
  addMessageToInquiry: (inquiryId: string, message: Message) => void;
  
  // Selection
  setSelectedInquiry: (id: string | null) => void;
}

export const useInquiryFlowStore = create<InquiryFlowState>((set, get) => ({
  inquiries: [],
  quotes: [],
  orders: [],
  selectedInquiry: null,
  
  createInquiry: (inquiry) =>
    set((state) => ({ inquiries: [...state.inquiries, { ...inquiry, messages: [] }] })),
  
  updateInquiry: (id, inquiry) =>
    set((state) => ({
      inquiries: state.inquiries.map((i) => (i.id === id ? { ...i, ...inquiry } : i)),
    })),
  
  cancelInquiry: (id) =>
    set((state) => ({
      inquiries: state.inquiries.map((i) =>
        i.id === id ? { ...i, status: 'cancelled' } : i
      ),
    })),
  
  getInquiriesByStatus: (status) => {
    const state = get();
    return state.inquiries.filter((i) => i.status === status);
  },
  
  createQuote: (quote) =>
    set((state) => ({ quotes: [...state.quotes, quote] })),
  
  updateQuote: (id, quote) =>
    set((state) => ({
      quotes: state.quotes.map((q) => (q.id === id ? { ...q, ...quote } : q)),
    })),
  
  acceptQuote: (id) =>
    set((state) => ({
      quotes: state.quotes.map((q) =>
        q.id === id ? { ...q, status: 'accepted' } : q
      ),
    })),
  
  rejectQuote: (id) =>
    set((state) => ({
      quotes: state.quotes.map((q) =>
        q.id === id ? { ...q, status: 'rejected' } : q
      ),
    })),
  
  createOrder: (order) =>
    set((state) => ({ orders: [...state.orders, order] })),
  
  updateOrder: (id, order) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...order } : o)),
    })),
  
  updateOrderStatus: (id, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, status } : o
      ),
    })),
  
  addMessageToInquiry: (inquiryId, message) =>
    set((state) => ({
      inquiries: state.inquiries.map((i) =>
        i.id === inquiryId
          ? { ...i, messages: [...(i.messages || []), message] }
          : i
      ),
    })),
  
  setSelectedInquiry: (id) => set({ selectedInquiry: id }),
}));
