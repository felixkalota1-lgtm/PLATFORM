export interface CompanyDocument {
  id: string;
  companyId: string;
  title: string;
  type: 'license' | 'permit' | 'insurance' | 'certification' | 'tax' | 'contract' | 'agreement' | 'other';
  category: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  expiryDate: Date;
  status: 'valid' | 'expiring-soon' | 'expired';
  daysUntilExpiry?: number;
  notes?: string;
  assignedTo: string[]; // User IDs who are responsible for renewal
}

export interface DocumentTemplate {
  id: string;
  companyId: string;
  name: string;
  type: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RenewalNotification {
  id: string;
  documentId: string;
  userId: string;
  notificationType: 'email' | 'in-app' | 'both';
  sentAt: Date;
  acknowledged: boolean;
  daysBeforeExpiry: number; // Notify this many days before expiry
}

export interface DocumentAuditLog {
  id: string;
  documentId: string;
  action: 'uploaded' | 'updated' | 'viewed' | 'renewed' | 'deleted';
  performedBy: string;
  timestamp: Date;
  details: string;
}

export interface DocumentCategory {
  id: string;
  companyId: string;
  name: string;
  description: string;
  retentionDays: number; // How long to keep documents
}

export interface BulkRenewalRequest {
  id: string;
  companyId: string;
  createdBy: string;
  documents: {
    documentId: string;
    renewalDate: Date;
    notes?: string;
  }[];
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
}
