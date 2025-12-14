import { create } from 'zustand';
import {
  CompanyDocument,
  DocumentTemplate,
  RenewalNotification,
  DocumentAuditLog,
  DocumentCategory,
  BulkRenewalRequest,
} from './types';

interface DocumentStore {
  documents: CompanyDocument[];
  templates: DocumentTemplate[];
  notifications: RenewalNotification[];
  auditLogs: DocumentAuditLog[];
  categories: DocumentCategory[];
  bulkRequests: BulkRenewalRequest[];
  selectedDocument: string | null;

  // Document actions
  addDocument: (doc: CompanyDocument) => void;
  updateDocument: (id: string, doc: Partial<CompanyDocument>) => void;
  deleteDocument: (id: string) => void;
  renewDocument: (id: string, newExpiryDate: Date) => void;

  // Template actions
  addTemplate: (template: DocumentTemplate) => void;
  deleteTemplate: (id: string) => void;

  // Notification actions
  createNotification: (notification: RenewalNotification) => void;
  acknowledgeNotification: (id: string) => void;

  // Audit log actions
  addAuditLog: (log: DocumentAuditLog) => void;

  // Category actions
  addCategory: (category: DocumentCategory) => void;
  updateCategory: (id: string, category: Partial<DocumentCategory>) => void;

  // Bulk renewal
  createBulkRequest: (request: BulkRenewalRequest) => void;
  updateBulkRequest: (id: string, request: Partial<BulkRenewalRequest>) => void;

  // Selection
  setSelectedDocument: (id: string | null) => void;
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  documents: [],
  templates: [],
  notifications: [],
  auditLogs: [],
  categories: [],
  bulkRequests: [],
  selectedDocument: null,

  addDocument: (doc) => set((state) => ({ documents: [...state.documents, doc] })),
  updateDocument: (id, doc) =>
    set((state) => ({
      documents: state.documents.map((d) => (d.id === id ? { ...d, ...doc } : d)),
    })),
  deleteDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    })),
  renewDocument: (id, newExpiryDate) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id
          ? {
              ...d,
              expiryDate: newExpiryDate,
              status: 'valid',
              daysUntilExpiry: Math.ceil(
                (newExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              ),
            }
          : d
      ),
    })),

  addTemplate: (template) => set((state) => ({ templates: [...state.templates, template] })),
  deleteTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    })),

  createNotification: (notification) =>
    set((state) => ({ notifications: [...state.notifications, notification] })),
  acknowledgeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, acknowledged: true } : n
      ),
    })),

  addAuditLog: (log) => set((state) => ({ auditLogs: [...state.auditLogs, log] })),

  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),
  updateCategory: (id, category) =>
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? { ...c, ...category } : c)),
    })),

  createBulkRequest: (request) =>
    set((state) => ({ bulkRequests: [...state.bulkRequests, request] })),
  updateBulkRequest: (id, request) =>
    set((state) => ({
      bulkRequests: state.bulkRequests.map((r) =>
        r.id === id ? { ...r, ...request } : r
      ),
    })),

  setSelectedDocument: (id) => set({ selectedDocument: id }),
}));
