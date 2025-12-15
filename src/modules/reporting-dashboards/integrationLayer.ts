import { useState, useCallback } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';

// ============================================================================
// Reporting & Dashboards Integration Layer
// Cross-module analytics, real-time dashboards, KPI calculations
// ============================================================================

interface DashboardMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

interface DashboardSnapshot {
  id: string;
  timestamp: Date;
  metrics: Map<string, DashboardMetric>;
}

// Hook 1: Cross-module analytics aggregation
export function useCrossModuleAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<Map<string, any>>(new Map());

  const aggregateSupplyChainMetrics = useCallback(
    (inventoryData: any, procurementData: any, vendorData: any) => {
      const metrics = {
        totalInventoryValue: inventoryData?.totalValue || 0,
        warehouseUtilization: inventoryData?.utilization || 0,
        outstandingPOs: procurementData?.pendingCount || 0,
        totalProcurementSpend: procurementData?.totalSpend || 0,
        vendorCount: vendorData?.activeCount || 0,
        vendorPerformanceScore: vendorData?.averageScore || 0,
        aggregatedDate: new Date(),
      };

      setAnalyticsData((prev) => new Map(prev).set('supply-chain', metrics));

      eventBus.emit(INTEGRATION_EVENTS.SUPPLY_CHAIN_ANALYTICS_AGGREGATED, {
        metrics,
        timestamp: new Date(),
      });

      return metrics;
    },
    []
  );

  const aggregateSalesMetrics = useCallback(
    (ordersData: any, customersData: any, marketplaceData: any) => {
      const metrics = {
        totalOrders: ordersData?.count || 0,
        totalSalesRevenue: ordersData?.totalAmount || 0,
        averageOrderValue: ordersData?.averageAmount || 0,
        activeCustomers: customersData?.activeCount || 0,
        customerRetentionRate: customersData?.retentionRate || 0,
        marketplaceRevenue: marketplaceData?.totalRevenue || 0,
        aggregatedDate: new Date(),
      };

      setAnalyticsData((prev) => new Map(prev).set('sales', metrics));

      eventBus.emit(INTEGRATION_EVENTS.SALES_ANALYTICS_AGGREGATED, {
        metrics,
        timestamp: new Date(),
      });

      return metrics;
    },
    []
  );

  const aggregateFinancialMetrics = useCallback(
    (budgetData: any, invoiceData: any, refundData: any) => {
      const metrics = {
        totalBudget: budgetData?.totalAllocated || 0,
        budgetUtilization: budgetData?.percentageUsed || 0,
        pendingInvoices: invoiceData?.pendingCount || 0,
        totalInvoiceAmount: invoiceData?.totalAmount || 0,
        totalRefunds: refundData?.totalAmount || 0,
        refundRate: refundData?.rate || 0,
        aggregatedDate: new Date(),
      };

      setAnalyticsData((prev) => new Map(prev).set('financial', metrics));

      eventBus.emit(INTEGRATION_EVENTS.FINANCIAL_ANALYTICS_AGGREGATED, {
        metrics,
        timestamp: new Date(),
      });

      return metrics;
    },
    []
  );

  return {
    analyticsData,
    aggregateSupplyChainMetrics,
    aggregateSalesMetrics,
    aggregateFinancialMetrics,
  };
}

// Hook 2: Real-time dashboard updates
export function useRealTimeDashboards() {
  const [dashboardSnapshots, setDashboardSnapshots] = useState<DashboardSnapshot[]>([]);

  const createDashboardSnapshot = useCallback((metrics: Map<string, DashboardMetric>) => {
    const snapshot: DashboardSnapshot = {
      id: `DASH-${Date.now()}`,
      timestamp: new Date(),
      metrics: new Map(metrics),
    };

    setDashboardSnapshots((prev) => [...prev, snapshot].slice(-100)); // Keep last 100 snapshots

    eventBus.emit(INTEGRATION_EVENTS.DASHBOARD_SNAPSHOT_CREATED, {
      snapshotId: snapshot.id,
      metricCount: metrics.size,
      timestamp: new Date(),
    });

    return snapshot.id;
  }, []);

  const getLatestDashboard = useCallback(() => {
    if (dashboardSnapshots.length === 0) return null;
    return dashboardSnapshots[dashboardSnapshots.length - 1];
  }, [dashboardSnapshots]);

  const getDashboardTrend = useCallback((metricName: string, periodHours: number = 24) => {
    const cutoffTime = new Date(Date.now() - periodHours * 60 * 60 * 1000);
    const recentSnapshots = dashboardSnapshots.filter((s) => s.timestamp > cutoffTime);

    const values: number[] = [];
    recentSnapshots.forEach((snapshot) => {
      const metric = snapshot.metrics.get(metricName);
      if (metric) values.push(metric.value);
    });

    if (values.length < 2) return null;

    const oldValue = values[0];
    const newValue = values[values.length - 1];
    const changePercentage = ((newValue - oldValue) / oldValue) * 100;

    return {
      metricName,
      startValue: oldValue,
      endValue: newValue,
      changePercentage,
      trend: changePercentage > 2 ? 'up' : changePercentage < -2 ? 'down' : 'stable',
      snapshotCount: recentSnapshots.length,
    };
  }, [dashboardSnapshots]);

  return {
    dashboardSnapshots,
    createDashboardSnapshot,
    getLatestDashboard,
    getDashboardTrend,
  };
}

// Hook 3: KPI calculation and monitoring
export function useKPICalculation() {
  const [kpis, setKpis] = useState<Map<string, any>>(new Map());

  const calculateInventoryKPIs = useCallback((inventoryData: any) => {
    const kpiData = {
      turnoverRatio: inventoryData?.turnover || 0,
      stockoutRate: inventoryData?.stockoutRate || 0,
      carryCost: inventoryData?.carryCost || 0,
      serviceLevel: inventoryData?.serviceLevel || 0,
      accuracy: inventoryData?.accuracy || 0,
      calculatedDate: new Date(),
    };

    setKpis((prev) => new Map(prev).set('inventory-kpis', kpiData));

    eventBus.emit(INTEGRATION_EVENTS.INVENTORY_KPI_CALCULATED, {
      kpis: kpiData,
      timestamp: new Date(),
    });

    return kpiData;
  }, []);

  const calculateProcurementKPIs = useCallback((procurementData: any) => {
    const kpiData = {
      procurementCycleTime: procurementData?.cycleTime || 0,
      vendorOnTimeRate: procurementData?.onTimeRate || 0,
      procurementCost: procurementData?.cost || 0,
      qualityRate: procurementData?.qualityRate || 0,
      costSavings: procurementData?.savings || 0,
      calculatedDate: new Date(),
    };

    setKpis((prev) => new Map(prev).set('procurement-kpis', kpiData));

    eventBus.emit(INTEGRATION_EVENTS.PROCUREMENT_KPI_CALCULATED, {
      kpis: kpiData,
      timestamp: new Date(),
    });

    return kpiData;
  }, []);

  const calculateSalesKPIs = useCallback((salesData: any) => {
    const kpiData = {
      salesGrowth: salesData?.growthRate || 0,
      customerAcquisitionCost: salesData?.acqCost || 0,
      customerLifetimeValue: salesData?.lifetime || 0,
      conversionRate: salesData?.conversionRate || 0,
      avgOrderValue: salesData?.avgValue || 0,
      customerSatisfaction: salesData?.satisfaction || 0,
      calculatedDate: new Date(),
    };

    setKpis((prev) => new Map(prev).set('sales-kpis', kpiData));

    eventBus.emit(INTEGRATION_EVENTS.SALES_KPI_CALCULATED, {
      kpis: kpiData,
      timestamp: new Date(),
    });

    return kpiData;
  }, []);

  const getKPIAlert = useCallback((kpiName: string, threshold: number, actualValue: number) => {
    const isAlert = actualValue < threshold;

    if (isAlert) {
      eventBus.emit(INTEGRATION_EVENTS.KPI_ALERT_TRIGGERED, {
        kpiName,
        threshold,
        actualValue,
        variance: threshold - actualValue,
        timestamp: new Date(),
      });
    }

    return {
      kpiName,
      threshold,
      actualValue,
      isAlert,
      variance: threshold - actualValue,
    };
  }, []);

  return {
    kpis,
    calculateInventoryKPIs,
    calculateProcurementKPIs,
    calculateSalesKPIs,
    getKPIAlert,
  };
}
