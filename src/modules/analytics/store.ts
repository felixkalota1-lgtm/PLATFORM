import { create } from 'zustand';
import {
  SalesAnalytics,
  InventoryAnalytics,
  ProcurementAnalytics,
  OperationalMetrics,
  FinancialMetrics,
  ComplianceMetrics,
  ReportRequest,
} from './types';

interface AnalyticsStore {
  salesData: SalesAnalytics | null;
  inventoryData: InventoryAnalytics | null;
  procurementData: ProcurementAnalytics | null;
  operationalData: OperationalMetrics | null;
  financialData: FinancialMetrics | null;
  complianceData: ComplianceMetrics | null;
  reports: ReportRequest[];
  selectedReport: string | null;
  dateRange: { start: Date; end: Date };

  // Data actions
  setSalesData: (data: SalesAnalytics) => void;
  setInventoryData: (data: InventoryAnalytics) => void;
  setProcurementData: (data: ProcurementAnalytics) => void;
  setOperationalData: (data: OperationalMetrics) => void;
  setFinancialData: (data: FinancialMetrics) => void;
  setComplianceData: (data: ComplianceMetrics) => void;

  // Report actions
  addReport: (report: ReportRequest) => void;
  deleteReport: (id: string) => void;
  setSelectedReport: (id: string | null) => void;

  // Date range actions
  setDateRange: (range: { start: Date; end: Date }) => void;

  // Data refresh
  refreshData: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  salesData: null,
  inventoryData: null,
  procurementData: null,
  operationalData: null,
  financialData: null,
  complianceData: null,
  reports: [],
  selectedReport: null,
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  },

  setSalesData: (data) => set({ salesData: data }),
  setInventoryData: (data) => set({ inventoryData: data }),
  setProcurementData: (data) => set({ procurementData: data }),
  setOperationalData: (data) => set({ operationalData: data }),
  setFinancialData: (data) => set({ financialData: data }),
  setComplianceData: (data) => set({ complianceData: data }),

  addReport: (report) => set((state) => ({ reports: [...state.reports, report] })),
  deleteReport: (id) =>
    set((state) => ({
      reports: state.reports.filter((r) => r.id !== id),
    })),
  setSelectedReport: (id) => set({ selectedReport: id }),

  setDateRange: (range) => set({ dateRange: range }),

  refreshData: async () => {
    // Placeholder for API call to refresh analytics data
    console.log('Refreshing analytics data...');
  },
}));
