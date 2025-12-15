/**
 * DOCUMENT MANAGEMENT INTEGRATION MODULE
 * Links company documents, HR files, contracts, and certificates across the platform
 */

import { useEffect, useState } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';
import { useIntegrationStore } from '../../services/integrationStore';

interface CompanyDocument {
  id: string;
  fileName: string;
  documentType: 'invoice' | 'contract' | 'insurance' | 'license' | 'certificate' | 'legal' | 'financial' | 'other';
  category: string; // More specific categorization
  uploadedAt: Date;
  uploadedBy: string;
  expiryDate?: Date;
  status: 'valid' | 'expiring_soon' | 'expired' | 'archived';
  fileSize: number;
  fileFormat: 'pdf' | 'doc' | 'xlsx' | 'image' | 'other';
  relatedEntities?: Array<{
    type: 'company' | 'employee' | 'department' | 'project';
    id: string;
    name: string;
  }>;
  accessLevel: 'public' | 'private' | 'restricted'; // Visibility
  storageLocation: string; // S3 or Firebase path
}

/**
 * Hook for managing company documents
 */
export function useCompanyDocuments(companyId: string) {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const integrationStore = useIntegrationStore();

  // Add new document
  const addDocument = (
    fileName: string,
    documentType: CompanyDocument['documentType'],
    category: string,
    uploadedBy: string,
    fileSize: number,
    fileFormat: CompanyDocument['fileFormat'],
    expiryDate?: Date,
    accessLevel: CompanyDocument['accessLevel'] = 'private',
    relatedEntities?: CompanyDocument['relatedEntities']
  ) => {
    const docId = `DOC-${Date.now()}`;
    const doc: CompanyDocument = {
      id: docId,
      fileName,
      documentType,
      category,
      uploadedAt: new Date(),
      uploadedBy,
      expiryDate,
      status: expiryDate ? 'valid' : 'valid',
      fileSize,
      fileFormat,
      relatedEntities,
      accessLevel,
      storageLocation: `${companyId}/documents/${docId}`,
    };

    setDocuments((prev) => [...prev, doc]);

    // Emit document uploaded event
    eventBus.emit(INTEGRATION_EVENTS.DOCUMENT_UPLOADED, {
      fileName,
      documentType,
      uploadedAt: new Date(),
      uploadedBy,
      relatedTo: relatedEntities?.[0],
      expiryDate,
    });

    // Add to integration store
    integrationStore.addUploadedFile({
      id: doc.id,
      fileName,
      uploadedBy,
      uploadedAt: new Date(),
      category: 'company_file',
      relatedTo: relatedEntities?.[0] ? { type: (relatedEntities[0].type as any) === 'company' || (relatedEntities[0].type as any) === 'employee' ? relatedEntities[0].type as 'company' | 'employee' : 'company', id: relatedEntities[0].id } : undefined,
      expiryDate,
    });

    console.log(`✅ Document uploaded: ${fileName}`);
    return doc;
  };

  // Monitor for expiring documents
  useEffect(() => {
    documents.forEach((doc) => {
      if (!doc.expiryDate) return;

      const now = new Date();
      const daysUntilExpiry = Math.ceil(
        (doc.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0 && doc.status === 'valid') {
        // Emit warning
        eventBus.emit(INTEGRATION_EVENTS.DOCUMENT_EXPIRING, {
          documentName: doc.fileName,
          expiryDate: doc.expiryDate,
          daysUntilExpiry,
          documentType: doc.documentType,
          timestamp: new Date(),
        });

        // Update status
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, status: 'expiring_soon' } : d))
        );
      } else if (daysUntilExpiry <= 0 && doc.status !== 'expired') {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, status: 'expired' } : d))
        );
      }
    });
  }, [documents]);

  // Archive document
  const archiveDocument = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: 'archived' } : d))
    );
  };

  // Get documents by type
  const getDocumentsByType = (type: string) => {
    return documents.filter((d) => d.documentType === type);
  };

  // Get documents by related entity
  const getDocumentsForEntity = (entityType: string, entityId: string) => {
    return documents.filter((d) =>
      d.relatedEntities?.some((re) => re.type === entityType && re.id === entityId)
    );
  };

  return {
    documents,
    addDocument,
    archiveDocument,
    getDocumentsByType,
    getDocumentsForEntity,
    expiringDocuments: documents.filter((d) => d.status === 'expiring_soon'),
    expiredDocuments: documents.filter((d) => d.status === 'expired'),
  };
}

/**
 * Hook for compliance tracking and document renewals
 */
export function useComplianceTracking(_companyId: string) {
  const [complianceItems, setComplianceItems] = useState<
    Array<{
      id: string;
      name: string;
      type: 'license' | 'insurance' | 'certification' | 'inspection' | 'audit' | 'legal';
      renewalDate: Date;
      lastRenewedDate: Date;
      renewalCost?: number;
      status: 'compliant' | 'warning' | 'non_compliant';
      responsiblePerson: string;
    }>
  >([]);

  // Add compliance item
  const addComplianceItem = (
    name: string,
    type: string,
    renewalDate: Date,
    lastRenewedDate: Date,
    renewalCost?: number,
    responsiblePerson?: string
  ) => {
    const item = {
      id: `COMP-${Date.now()}`,
      name,
      type: type as 'license' | 'insurance' | 'certification' | 'inspection' | 'audit' | 'legal',
      renewalDate,
      lastRenewedDate,
      renewalCost,
      status: 'compliant' as const,
      responsiblePerson: responsiblePerson || 'unknown',
    };

    setComplianceItems((prev) => [...prev, item] as any);
    console.log(`✅ Compliance item added: ${name}`);
    return item;
  };

  // Check compliance status
  useEffect(() => {
    const checkCompliance = () => {
      const now = new Date();
      setComplianceItems((prev) =>
        prev.map((item) => {
          const daysUntilRenewal = Math.ceil(
            (item.renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          let status: 'compliant' | 'warning' | 'non_compliant' = 'compliant';
          if (daysUntilRenewal <= 0) {
            status = 'non_compliant';
          } else if (daysUntilRenewal <= 30) {
            status = 'warning';
          }

          // Emit event if status changed
          if (status !== item.status && (status === 'warning' || status === 'non_compliant')) {
            eventBus.emit(INTEGRATION_EVENTS.DOCUMENT_EXPIRING, {
              documentName: item.name,
              expiryDate: item.renewalDate,
              daysUntilExpiry: daysUntilRenewal,
              timestamp: new Date(),
            });
          }

          return { ...item, status };
        })
      );
    };

    checkCompliance();
    const interval = setInterval(checkCompliance, 24 * 60 * 60 * 1000); // Check daily

    return () => clearInterval(interval);
  }, []);

  return {
    complianceItems,
    addComplianceItem,
    nonCompliantItems: complianceItems.filter((i) => i.status === 'non_compliant'),
    warningItems: complianceItems.filter((i) => i.status === 'warning'),
  };
}

/**
 * Hook for audit logging of document access
 */
export function useDocumentAuditLog(_companyId: string) {
  const [auditLogs, setAuditLogs] = useState<
    Array<{
      id: string;
      documentId: string;
      documentName: string;
      action: 'uploaded' | 'viewed' | 'downloaded' | 'shared' | 'modified' | 'deleted';
      userId: string;
      userName: string;
      timestamp: Date;
      ipAddress?: string;
      details?: string;
    }>
  >([]);

  // Log document action
  const logAction = (
    documentId: string,
    documentName: string,
    action: string,
    userId: string,
    userName: string,
    ipAddress?: string,
    details?: string
  ) => {
    const log = {
      id: `AUDIT-${Date.now()}`,
      documentId,
      documentName,
      action: action as 'uploaded' | 'viewed' | 'downloaded' | 'shared' | 'modified' | 'deleted',
      userId,
      userName,
      timestamp: new Date(),
      ipAddress,
      details,
    };

    setAuditLogs((prev) => [...prev, log] as any);
    console.log(`📋 Document audit logged: ${action} on ${documentName} by ${userName}`);
  };

  // Get audit history for document
  const getDocumentHistory = (documentId: string) => {
    return auditLogs.filter((log) => log.documentId === documentId);
  };

  // Get user's access history
  const getUserHistory = (userId: string) => {
    return auditLogs.filter((log) => log.userId === userId);
  };

  return {
    auditLogs,
    logAction,
    getDocumentHistory,
    getUserHistory,
  };
}

export default {
  useCompanyDocuments,
  useComplianceTracking,
  useDocumentAuditLog,
};
