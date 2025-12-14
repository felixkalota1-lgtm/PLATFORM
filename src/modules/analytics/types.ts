export interface AnalyticsDashboard {
  id: string;
  companyId: string;
  title: string;
  description: string;
  widgets: Widget[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'gauge' | 'map';
  title: string;
  dataSource: string;
  config: any;
  position: { x: number; y: number; width: number; height: number };
}

export interface SalesAnalytics {
  totalSales: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: ProductPerformance[];
  salesTrend: DailySalesData[];
  conversionRate: number;
  repeatCustomers: number;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  trend: number; // percentage change
}

export interface DailySalesData {
  date: Date;
  sales: number;
  orders: number;
  revenue: number;
}

export interface InventoryAnalytics {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  overStockItems: number;
  turnoverRate: number;
  stockMovement: StockMovement[];
}

export interface StockMovement {
  productId: string;
  productName: string;
  movement: number;
  date: Date;
}

export interface ProcurementAnalytics {
  totalInquiries: number;
  pendingInquiries: number;
  quotationRate: number; // percentage
  orderConversionRate: number;
  averageProcurementTime: number; // days
  topSuppliers: SupplierPerformance[];
  procurementTrend: DailyProcurementData[];
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  ordersPlaced: number;
  totalSpent: number;
  averageDeliveryTime: number;
  qualityRating: number;
}

export interface DailyProcurementData {
  date: Date;
  inquiries: number;
  quotes: number;
  orders: number;
}

export interface OperationalMetrics {
  warehouseUtilization: number; // percentage
  vehicleUtilization: number; // percentage
  employeeProductivity: EmployeeMetric[];
  documentComplianceRate: number;
  contractRenewalRate: number;
}

export interface EmployeeMetric {
  employeeId: string;
  employeeName: string;
  department: string;
  tasksCompleted: number;
  efficiency: number; // percentage
}

export interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number; // percentage
  invoicesIssued: number;
  invoicesPaid: number;
  outstandingPayment: number;
  expenseBreakdown: ExpenseCategory[];
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface ComplianceMetrics {
  documentsValid: number;
  documentsExpiringSoon: number;
  contractsValid: number;
  contractsExpiringSoon: number;
  complianceScore: number; // 0-100
}

export interface ReportRequest {
  id: string;
  companyId: string;
  reportType: 'sales' | 'inventory' | 'procurement' | 'operational' | 'financial' | 'compliance' | 'custom';
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  generatedBy: string;
  format: 'pdf' | 'excel' | 'json';
  fileUrl?: string;
}
