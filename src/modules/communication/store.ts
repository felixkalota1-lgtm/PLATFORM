import { create } from 'zustand';
import { TeamMessage, DirectorOrder, InterDepartmentRequest } from './types';

interface CommunicationStore {
  messages: TeamMessage[];
  directorOrders: DirectorOrder[];
  departmentRequests: InterDepartmentRequest[];
  selectedConversation: string | null;
  
  // Message actions
  addMessage: (message: TeamMessage) => void;
  updateMessage: (id: string, message: Partial<TeamMessage>) => void;
  deleteMessage: (id: string) => void;
  markAsRead: (messageIds: string[], userId: string) => void;
  
  // Director order actions
  createDirectorOrder: (order: DirectorOrder) => void;
  updateDirectorOrder: (id: string, order: Partial<DirectorOrder>) => void;
  completeDirectorOrder: (id: string) => void;
  
  // Department request actions
  createDepartmentRequest: (request: InterDepartmentRequest) => void;
  updateDepartmentRequest: (id: string, request: Partial<InterDepartmentRequest>) => void;
  approveDepartmentRequest: (id: string, userId: string) => void;
  rejectDepartmentRequest: (id: string, userId: string) => void;
  
  setSelectedConversation: (id: string | null) => void;
}

export const useCommunicationStore = create<CommunicationStore>((set) => ({
  messages: [],
  directorOrders: [],
  departmentRequests: [],
  selectedConversation: null,
  
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, message) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...message } : m)),
    })),
  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    })),
  markAsRead: (messageIds, userId) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        messageIds.includes(m.id) ? { ...m, readBy: [...m.readBy, userId] } : m
      ),
    })),
  
  createDirectorOrder: (order) =>
    set((state) => ({ directorOrders: [...state.directorOrders, order] })),
  updateDirectorOrder: (id, order) =>
    set((state) => ({
      directorOrders: state.directorOrders.map((o) => (o.id === id ? { ...o, ...order } : o)),
    })),
  completeDirectorOrder: (id) =>
    set((state) => ({
      directorOrders: state.directorOrders.map((o) =>
        o.id === id ? { ...o, status: 'completed' } : o
      ),
    })),
  
  createDepartmentRequest: (request) =>
    set((state) => ({ departmentRequests: [...state.departmentRequests, request] })),
  updateDepartmentRequest: (id, request) =>
    set((state) => ({
      departmentRequests: state.departmentRequests.map((r) =>
        r.id === id ? { ...r, ...request } : r
      ),
    })),
  approveDepartmentRequest: (id, userId) =>
    set((state) => ({
      departmentRequests: state.departmentRequests.map((r) =>
        r.id === id
          ? {
              ...r,
              approvals: [...r.approvals, { userId, status: 'approved', timestamp: new Date() }],
            }
          : r
      ),
    })),
  rejectDepartmentRequest: (id, userId) =>
    set((state) => ({
      departmentRequests: state.departmentRequests.map((r) =>
        r.id === id
          ? {
              ...r,
              approvals: [...r.approvals, { userId, status: 'rejected', timestamp: new Date() }],
            }
          : r
      ),
    })),
  
  setSelectedConversation: (id) => set({ selectedConversation: id }),
}));
