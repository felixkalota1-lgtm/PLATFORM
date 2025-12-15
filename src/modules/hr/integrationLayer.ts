/**
 * HR INTEGRATION MODULE
 * Links HR functions (employees, contracts, documents) with company-wide systems
 */

import { useEffect, useState } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';
import { useIntegrationStore } from '../../services/integrationStore';

interface EmployeeDocument {
  id: string;
  employeeId: string;
  employeeName: string;
  documentType: 'contract' | 'id_document' | 'certificate' | 'medical' | 'background_check' | 'other';
  documentName: string;
  uploadedAt: Date;
  expiryDate?: Date;
  status: 'valid' | 'expiring_soon' | 'expired';
}

interface EmployeeContract {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expiring_soon' | 'expired';
  daysUntilExpiry: number;
}

/**
 * Hook for managing employee documents and linking to company files
 */
export function useEmployeeDocuments(employeeId: string, employeeName: string) {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const integrationStore = useIntegrationStore();

  // Upload/add employee document
  const addDocument = (
    documentType: EmployeeDocument['documentType'],
    documentName: string,
    expiryDate?: Date,
    uploadedBy?: string
  ) => {
    const doc: EmployeeDocument = {
      id: `empDoc_${Date.now()}`,
      employeeId,
      employeeName,
      documentType,
      documentName,
      uploadedAt: new Date(),
      expiryDate,
      status: expiryDate ? 'valid' : 'valid',
    };

    setDocuments((prev) => [...prev, doc]);

    // === INTEGRATION EVENT ===
    // This document also goes to company files system
    eventBus.emit(INTEGRATION_EVENTS.EMPLOYEE_DOCUMENT_UPLOADED, {
      employeeId,
      employeeName,
      documentType,
      documentName,
      uploadedAt: new Date(),
      expiryDate,
    });

    // Add to unified integration store for visibility across modules
    integrationStore.addUploadedFile({
      id: doc.id,
      fileName: documentName,
      uploadedBy: uploadedBy || employeeId,
      uploadedAt: new Date(),
      category: 'employee_document',
      relatedTo: {
        type: 'employee',
        id: employeeId,
      },
      expiryDate,
    });

    console.log(`✅ Document uploaded for employee: ${employeeName}`);
    return doc;
  };

  // Check for expiring documents
  useEffect(() => {
    documents.forEach((doc) => {
      if (!doc.expiryDate) return;

      const now = new Date();
      const daysUntilExpiry = Math.ceil(
        (doc.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        // Emit warning event
        eventBus.emit(INTEGRATION_EVENTS.DOCUMENT_EXPIRING, {
          employeeId,
          employeeName,
          documentName: doc.documentName,
          expiryDate: doc.expiryDate,
          daysUntilExpiry,
          timestamp: new Date(),
        });

        // Update status
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, status: 'expiring_soon' } : d))
        );
      } else if (daysUntilExpiry <= 0) {
        // Document is expired
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, status: 'expired' } : d))
        );
      }
    });
  }, [documents, employeeId, employeeName]);

  return {
    documents,
    addDocument,
    expiringDocuments: documents.filter((d) => d.status === 'expiring_soon'),
    expiredDocuments: documents.filter((d) => d.status === 'expired'),
  };
}

/**
 * Hook for managing employee contracts and expiry alerts
 */
export function useEmployeeContracts() {
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);

  // Add/create contract
  const addContract = (
    employeeId: string,
    employeeName: string,
    startDate: Date,
    endDate: Date
  ) => {
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const contract: EmployeeContract = {
      id: `contract_${Date.now()}`,
      employeeId,
      employeeName,
      startDate,
      endDate,
      status: daysUntilExpiry <= 30 ? 'expiring_soon' : 'active',
      daysUntilExpiry,
    };

    setContracts((prev) => [...prev, contract]);

    // Emit event if expiring
    if (daysUntilExpiry <= 30) {
      eventBus.emit(INTEGRATION_EVENTS.CONTRACT_EXPIRING, {
        employeeId,
        employeeName,
        endDate,
        daysUntilExpiry,
        timestamp: new Date(),
      });

      console.log(
        `⚠️ Contract expiring for ${employeeName}: ${daysUntilExpiry} days remaining`
      );
    }

    return contract;
  };

  // Monitor contracts for expiry
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setContracts((prev) =>
        prev.map((contract) => {
          const daysUntilExpiry = Math.ceil(
            (contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          const newStatus =
            daysUntilExpiry <= 0
              ? 'expired'
              : daysUntilExpiry <= 30
              ? 'expiring_soon'
              : 'active';

          // Emit warning if just became expiring soon
          if (newStatus === 'expiring_soon' && contract.status !== 'expiring_soon') {
            eventBus.emit(INTEGRATION_EVENTS.CONTRACT_EXPIRING, {
              employeeId: contract.employeeId,
              employeeName: contract.employeeName,
              endDate: contract.endDate,
              daysUntilExpiry,
              timestamp: new Date(),
            });
          }

          return {
            ...contract,
            status: newStatus,
            daysUntilExpiry,
          };
        })
      );
    }, 24 * 60 * 60 * 1000); // Check daily

    return () => clearInterval(interval);
  }, []);

  return {
    contracts,
    addContract,
    activeContracts: contracts.filter((c) => c.status === 'active'),
    expiringContracts: contracts.filter((c) => c.status === 'expiring_soon'),
    expiredContracts: contracts.filter((c) => c.status === 'expired'),
  };
}

/**
 * Hook for attendance tracking and payroll integration
 */
export function useAttendanceTracking(employeeId: string) {
  // Record attendance
  const recordAttendance = (
    date: Date,
    checkInTime: Date,
    checkOutTime?: Date,
    status: 'present' | 'absent' | 'late' | 'half_day' = 'present'
  ) => {
    // Emit attendance event
    eventBus.emit(INTEGRATION_EVENTS.ATTENDANCE_RECORDED, {
      employeeId,
      date,
      checkInTime,
      checkOutTime,
      status,
      timestamp: new Date(),
    });

    console.log(`✅ Attendance recorded for employee ${employeeId}: ${status}`);
  };

  return { recordAttendance };
}

/**
 * Hook for payroll processing and salary tracking
 */
export function usePayrollTracking(employeeId: string, salary: number, payFrequency: 'weekly' | 'biweekly' | 'monthly') {
  // Process payroll
  const processPayroll = (periodStart: Date, periodEnd: Date, daysWorked: number) => {
    const amount =
      payFrequency === 'monthly'
        ? salary
        : payFrequency === 'biweekly'
        ? salary / 2
        : salary / 4;

    // Emit payroll event
    eventBus.emit(INTEGRATION_EVENTS.PAYROLL_PROCESSED, {
      employeeId,
      amount,
      periodStart,
      periodEnd,
      daysWorked,
      timestamp: new Date(),
    });

    console.log(`✅ Payroll processed for employee ${employeeId}: $${amount}`);
  };

  return { processPayroll };
}

export default {
  useEmployeeDocuments,
  useEmployeeContracts,
  useAttendanceTracking,
  usePayrollTracking,
};
