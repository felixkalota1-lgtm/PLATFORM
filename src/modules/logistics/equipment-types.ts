// Equipment types for heavy vehicles and machinery
export type EquipmentType = 
  | 'truck'
  | 'tipper-truck'
  | 'tanker-truck'
  | 'flatbed-truck'
  | 'tlb' // Tractor with Loader and Backhoe
  | 'grader'
  | 'excavator'
  | 'loader'
  | 'dozer'
  | 'compactor'
  | 'roller'
  | 'crane'
  | 'concrete-mixer'
  | 'dump-truck'
  | 'other';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface CompanyEquipment {
  id: string;
  companyId: string;
  equipmentType: EquipmentType;
  registrationNumber: string;
  make: string;
  model: string;
  yearAcquired: number;
  purchasePrice: number;
  operator?: string;
  status: 'available' | 'in-use' | 'maintenance' | 'idle' | 'retired';
  totalHours?: number; // Operating hours
  totalKm?: number; // Distance traveled
  acquisitionDate: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentUsageLog {
  id: string;
  equipmentId: string;
  date: Date;
  hoursWorked?: number;
  kmTraveled?: number;
  operator: string;
  description: string;
  fuelConsumed?: number;
  costIncurred?: number;
  location?: string;
  status: 'active' | 'idle' | 'maintenance';
}

export interface EquipmentMaintenanceLog {
  id: string;
  equipmentId: string;
  date: Date;
  type: 'routine' | 'preventive' | 'corrective' | 'emergency';
  description: string;
  partsUsed?: string[];
  costAmount: number;
  completedBy: string;
  nextMaintenanceDue?: Date;
  downtime?: number; // hours
}

export interface DailyReport {
  id: string;
  equipmentId: string;
  date: Date;
  equipmentType: EquipmentType;
  hoursWorked: number;
  kmTraveled: number;
  fuelUsed: number;
  statusUpdates: string[];
  issues?: string[];
  revenue?: number;
  costIncurred: number;
  operator: string;
}

export interface WeeklyReport {
  id: string;
  equipmentId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  totalHoursWorked: number;
  totalKmTraveled: number;
  totalFuelUsed: number;
  totalRevenueGenerated: number;
  totalCosts: number;
  maintenanceRequired: boolean;
  avgDailyUtilization: number; // percentage
  issues: string[];
}

export interface MonthlyReport {
  id: string;
  equipmentId: string;
  year: number;
  month: number;
  totalHoursWorked: number;
  totalKmTraveled: number;
  totalFuelUsed: number;
  totalRevenueGenerated: number;
  totalMaintenanceCost: number;
  totalOperatingCost: number;
  profitMargin: number; // revenue - costs
  avgDailyUtilization: number;
  maintenanceRecordsCount: number;
  issuesResolved: number;
}

export interface YearlyReport {
  id: string;
  equipmentId: string;
  year: number;
  totalHoursWorked: number;
  totalKmTraveled: number;
  totalFuelUsed: number;
  totalRevenueGenerated: number;
  totalMaintenanceCost: number;
  totalOperatingCost: number;
  profitMargin: number;
  avgMonthlyUtilization: number;
  depreciationValue: number;
  currentValue: number;
  maintenanceIssuesCount: number;
  downtimeHours: number;
}
