import { create } from 'zustand';
import {
  CompanyEquipment,
  EquipmentUsageLog,
  EquipmentMaintenanceLog,
  DailyReport,
  WeeklyReport,
  MonthlyReport,
  YearlyReport,
} from './equipment-types';

interface EquipmentStore {
  equipment: CompanyEquipment[];
  usageLogs: EquipmentUsageLog[];
  maintenanceLogs: EquipmentMaintenanceLog[];
  dailyReports: DailyReport[];
  weeklyReports: WeeklyReport[];
  monthlyReports: MonthlyReport[];
  yearlyReports: YearlyReport[];

  // Equipment management
  addEquipment: (equip: CompanyEquipment) => void;
  updateEquipment: (id: string, equip: Partial<CompanyEquipment>) => void;
  deleteEquipment: (id: string) => void;

  // Usage logging
  addUsageLog: (log: EquipmentUsageLog) => void;
  updateUsageLog: (id: string, log: Partial<EquipmentUsageLog>) => void;

  // Maintenance logging
  addMaintenanceLog: (log: EquipmentMaintenanceLog) => void;
  updateMaintenanceLog: (id: string, log: Partial<EquipmentMaintenanceLog>) => void;

  // Reporting
  generateDailyReport: (equipmentId: string, date: Date) => DailyReport;
  generateWeeklyReport: (equipmentId: string, startDate: Date, endDate: Date) => WeeklyReport;
  generateMonthlyReport: (equipmentId: string, year: number, month: number) => MonthlyReport;
  generateYearlyReport: (equipmentId: string, year: number) => YearlyReport;

  // Report queries
  getEquipmentDailyReports: (equipmentId: string) => DailyReport[];
  getEquipmentWeeklyReports: (equipmentId: string) => WeeklyReport[];
  getEquipmentMonthlyReports: (equipmentId: string) => MonthlyReport[];
  getEquipmentYearlyReports: (equipmentId: string) => YearlyReport[];
}

export const useEquipmentStore = create<EquipmentStore>((set, get) => ({
  equipment: [],
  usageLogs: [],
  maintenanceLogs: [],
  dailyReports: [],
  weeklyReports: [],
  monthlyReports: [],
  yearlyReports: [],

  // Equipment actions
  addEquipment: (equip) => set((state) => ({ equipment: [...state.equipment, equip] })),
  updateEquipment: (id, equip) =>
    set((state) => ({
      equipment: state.equipment.map((e) => (e.id === id ? { ...e, ...equip } : e)),
    })),
  deleteEquipment: (id) =>
    set((state) => ({
      equipment: state.equipment.filter((e) => e.id !== id),
    })),

  // Usage logging
  addUsageLog: (log) => set((state) => ({ usageLogs: [...state.usageLogs, log] })),
  updateUsageLog: (id, log) =>
    set((state) => ({
      usageLogs: state.usageLogs.map((u) => (u.id === id ? { ...u, ...log } : u)),
    })),

  // Maintenance logging
  addMaintenanceLog: (log) => set((state) => ({ maintenanceLogs: [...state.maintenanceLogs, log] })),
  updateMaintenanceLog: (id, log) =>
    set((state) => ({
      maintenanceLogs: state.maintenanceLogs.map((m) => (m.id === id ? { ...m, ...log } : m)),
    })),

  // Report generation
  generateDailyReport: (equipmentId, date) => {
    const state = get();
    const dailyLogs = state.usageLogs.filter(
      (log) =>
        log.equipmentId === equipmentId &&
        new Date(log.date).toDateString() === date.toDateString()
    );

    const issues = dailyLogs
      .filter((log) => log.status === 'maintenance')
      .map((log) => log.description);

    const dailyReport: DailyReport = {
      id: `daily-${equipmentId}-${date.getTime()}`,
      equipmentId,
      date,
      equipmentType: state.equipment.find((e) => e.id === equipmentId)?.equipmentType || 'other',
      hoursWorked: dailyLogs.reduce((acc, log) => acc + (log.hoursWorked || 0), 0),
      kmTraveled: dailyLogs.reduce((acc, log) => acc + (log.kmTraveled || 0), 0),
      fuelUsed: dailyLogs.reduce((acc, log) => acc + (log.fuelConsumed || 0), 0),
      statusUpdates: dailyLogs.map((log) => log.description),
      issues,
      costIncurred: dailyLogs.reduce((acc, log) => acc + (log.costIncurred || 0), 0),
      operator: dailyLogs[0]?.operator || 'Unknown',
    };

    set((state) => ({ dailyReports: [...state.dailyReports, dailyReport] }));
    return dailyReport;
  },

  generateWeeklyReport: (equipmentId, startDate, endDate) => {
    const state = get();
    const weeklyLogs = state.usageLogs.filter(
      (log) =>
        log.equipmentId === equipmentId &&
        new Date(log.date) >= startDate &&
        new Date(log.date) <= endDate
    );

    const weeklyReport: WeeklyReport = {
      id: `weekly-${equipmentId}-${startDate.getTime()}`,
      equipmentId,
      weekStartDate: startDate,
      weekEndDate: endDate,
      totalHoursWorked: weeklyLogs.reduce((acc, log) => acc + (log.hoursWorked || 0), 0),
      totalKmTraveled: weeklyLogs.reduce((acc, log) => acc + (log.kmTraveled || 0), 0),
      totalFuelUsed: weeklyLogs.reduce((acc, log) => acc + (log.fuelConsumed || 0), 0),
      totalRevenueGenerated: weeklyLogs.reduce((acc, log) => acc + (log.costIncurred || 0), 0) * 1.2,
      totalCosts: weeklyLogs.reduce((acc, log) => acc + (log.costIncurred || 0), 0),
      maintenanceRequired: state.maintenanceLogs.some((m) => m.equipmentId === equipmentId),
      avgDailyUtilization: (weeklyLogs.reduce((acc, log) => acc + (log.hoursWorked || 0), 0) / 7 / 24) * 100,
      issues: weeklyLogs
        .filter((log) => log.status === 'maintenance')
        .map((log) => log.description),
    };

    set((state) => ({ weeklyReports: [...state.weeklyReports, weeklyReport] }));
    return weeklyReport;
  },

  generateMonthlyReport: (equipmentId, year, month) => {
    const state = get();
    const monthlyLogs = state.usageLogs.filter((log) => {
      const logDate = new Date(log.date);
      return (
        log.equipmentId === equipmentId &&
        logDate.getFullYear() === year &&
        logDate.getMonth() === month
      );
    });

    const monthlyMaintenance = state.maintenanceLogs.filter((m) => {
      const mDate = new Date(m.date);
      return (
        m.equipmentId === equipmentId &&
        mDate.getFullYear() === year &&
        mDate.getMonth() === month
      );
    });

    const totalCosts = monthlyLogs.reduce((acc, log) => acc + (log.costIncurred || 0), 0);
    const maintenanceCost = monthlyMaintenance.reduce((acc, m) => acc + m.costAmount, 0);
    const revenue = (totalCosts + maintenanceCost) * 1.5;

    const monthlyReport: MonthlyReport = {
      id: `monthly-${equipmentId}-${year}-${month}`,
      equipmentId,
      year,
      month,
      totalHoursWorked: monthlyLogs.reduce((acc, log) => acc + (log.hoursWorked || 0), 0),
      totalKmTraveled: monthlyLogs.reduce((acc, log) => acc + (log.kmTraveled || 0), 0),
      totalFuelUsed: monthlyLogs.reduce((acc, log) => acc + (log.fuelConsumed || 0), 0),
      totalRevenueGenerated: revenue,
      totalMaintenanceCost: maintenanceCost,
      totalOperatingCost: totalCosts,
      profitMargin: revenue - (totalCosts + maintenanceCost),
      avgDailyUtilization: (monthlyLogs.reduce((acc, log) => acc + (log.hoursWorked || 0), 0) / 30 / 24) * 100,
      maintenanceRecordsCount: monthlyMaintenance.length,
      issuesResolved: monthlyMaintenance.filter((m) => m.type === 'corrective').length,
    };

    set((state) => ({ monthlyReports: [...state.monthlyReports, monthlyReport] }));
    return monthlyReport;
  },

  generateYearlyReport: (equipmentId, year) => {
    const state = get();
    const yearlyLogs = state.usageLogs.filter((log) => {
      const logDate = new Date(log.date);
      return log.equipmentId === equipmentId && logDate.getFullYear() === year;
    });

    const yearlyMaintenance = state.maintenanceLogs.filter((m) => {
      const mDate = new Date(m.date);
      return m.equipmentId === equipmentId && mDate.getFullYear() === year;
    });

    const equipment = state.equipment.find((e) => e.id === equipmentId);
    const purchasePrice = equipment?.purchasePrice || 0;
    const yearsOwned = year - (equipment?.yearAcquired || year);
    const depreciationRate = 0.1; // 10% per year
    const depreciation = purchasePrice * depreciationRate * Math.max(yearsOwned, 1);

    const totalCosts = yearlyLogs.reduce((acc, log) => acc + (log.costIncurred || 0), 0);
    const maintenanceCost = yearlyMaintenance.reduce((acc, m) => acc + m.costAmount, 0);
    const operatingCost = totalCosts + maintenanceCost;
    const revenue = operatingCost * 1.5;

    const yearlyReport: YearlyReport = {
      id: `yearly-${equipmentId}-${year}`,
      equipmentId,
      year,
      totalHoursWorked: yearlyLogs.reduce((acc, log) => acc + (log.hoursWorked || 0), 0),
      totalKmTraveled: yearlyLogs.reduce((acc, log) => acc + (log.kmTraveled || 0), 0),
      totalFuelUsed: yearlyLogs.reduce((acc, log) => acc + (log.fuelConsumed || 0), 0),
      totalRevenueGenerated: revenue,
      totalMaintenanceCost: maintenanceCost,
      totalOperatingCost: operatingCost,
      profitMargin: revenue - operatingCost,
      avgMonthlyUtilization: (yearlyLogs.reduce((acc, log) => acc + (log.hoursWorked || 0), 0) / 12 / 24) * 100,
      depreciationValue: depreciation,
      currentValue: purchasePrice - depreciation,
      maintenanceIssuesCount: yearlyMaintenance.length,
      downtimeHours: yearlyMaintenance.reduce((acc, m) => acc + (m.downtime || 0), 0),
    };

    set((state) => ({ yearlyReports: [...state.yearlyReports, yearlyReport] }));
    return yearlyReport;
  },

  // Report queries
  getEquipmentDailyReports: (equipmentId) =>
    get().dailyReports.filter((r) => r.equipmentId === equipmentId),
  getEquipmentWeeklyReports: (equipmentId) =>
    get().weeklyReports.filter((r) => r.equipmentId === equipmentId),
  getEquipmentMonthlyReports: (equipmentId) =>
    get().monthlyReports.filter((r) => r.equipmentId === equipmentId),
  getEquipmentYearlyReports: (equipmentId) =>
    get().yearlyReports.filter((r) => r.equipmentId === equipmentId),
}));
