import { useState, useCallback } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';
import { useIntegrationStore } from '../../services/integrationStore';

// ============================================================================
// Inventory Adjustments Integration Layer
// Physical count adjustments, damage/shrinkage tracking, variance analysis
// ============================================================================

interface InventoryAdjustment {
  id: string;
  sku: string;
  previousQuantity: number;
  adjustedQuantity: number;
  adjustmentReason: 'physical_count' | 'damage' | 'shrinkage' | 'theft' | 'miscount' | 'other';
  quantity: number;
  date: Date;
  adjustedBy: string;
  notes: string;
  variance: number;
}

interface DamageRecord {
  id: string;
  sku: string;
  quantity: number;
  severity: 'minor' | 'major' | 'total_loss';
  location: string;
  cause: string;
  date: Date;
  replacementCost: number;
}

// Hook 1: Physical count adjustments
export function usePhysicalCountAdjustment() {
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const store = useIntegrationStore();

  const recordPhysicalCount = useCallback(
    (sku: string, countedQuantity: number, adjustedBy: string, notes?: string) => {
      const stockLevel = store.stockLevels.get(sku);
      if (!stockLevel) return;

      const previousQuantity = stockLevel.warehouseQuantity;
      const variance = countedQuantity - previousQuantity;

      const adjustment: InventoryAdjustment = {
        id: `ADJ-${Date.now()}`,
        sku,
        previousQuantity,
        adjustedQuantity: countedQuantity,
        adjustmentReason: 'physical_count',
        quantity: variance,
        date: new Date(),
        adjustedBy,
        notes: notes || '',
        variance,
      };

      setAdjustments((prev) => [...prev, adjustment]);

      // Update stock level
      store.updateStockLevel(sku, {
        ...stockLevel,
        warehouseQuantity: countedQuantity,
      });

      eventBus.emit(INTEGRATION_EVENTS.INVENTORY_ADJUSTMENT_RECORDED, {
        adjustmentId: adjustment.id,
        sku,
        variance,
        timestamp: new Date(),
      });

      if (Math.abs(variance) > stockLevel.warehouseQuantity * 0.1) {
        eventBus.emit(INTEGRATION_EVENTS.INVENTORY_VARIANCE_ALERT, {
          sku,
          variance,
          variancePercentage: (Math.abs(variance) / previousQuantity) * 100,
          timestamp: new Date(),
        });
      }
    },
    [store]
  );

  return {
    adjustments,
    recordPhysicalCount,
  };
}

// Hook 2: Damage and shrinkage tracking
export function useDamageShrinkageTracking() {
  const [damageRecords, setDamageRecords] = useState<DamageRecord[]>([]);
  const store = useIntegrationStore();

  const recordDamage = useCallback(
    (sku: string, quantity: number, severity: string, location: string, cause: string, replacementCost: number) => {
      const damageId = `DMG-${Date.now()}`;

      const record: DamageRecord = {
        id: damageId,
        sku,
        quantity,
        severity: (severity as any) || 'minor',
        location,
        cause,
        date: new Date(),
        replacementCost,
      };

      setDamageRecords((prev) => [...prev, record]);

      // Adjust inventory
      const stockLevel = store.stockLevels.get(sku);
      if (stockLevel) {
        const newQuantity = Math.max(0, stockLevel.warehouseQuantity - quantity);
        store.updateStockLevel(sku, {
          ...stockLevel,
          warehouseQuantity: newQuantity,
        });
      }

      eventBus.emit(INTEGRATION_EVENTS.INVENTORY_DAMAGE_RECORDED, {
        damageId,
        sku,
        quantity,
        severity,
        replacementCost,
        timestamp: new Date(),
      });
    },
    [store]
  );

  const recordShrinkage = useCallback(
    (sku: string, quantity: number, location: string) => {
      recordDamage(sku, quantity, 'minor', location, 'shrinkage', 0);
    },
    [recordDamage]
  );

  return {
    damageRecords,
    recordDamage,
    recordShrinkage,
  };
}

// Hook 3: Variance analysis
export function useVarianceAnalysis() {
  const [variances, setVariances] = useState<any[]>([]);

  const calculateVarianceMetrics = useCallback((adjustments: InventoryAdjustment[]) => {
    const totalVariance = adjustments.reduce((sum, a) => sum + Math.abs(a.variance), 0);
    const averageVariance = totalVariance / (adjustments.length || 1);
    const highVarianceAdjustments = adjustments.filter((a) => Math.abs(a.variance) > averageVariance * 1.5);

    const analysis = {
      id: `VAR-${Date.now()}`,
      totalAdjustments: adjustments.length,
      totalVariance,
      averageVariance,
      highVarianceCount: highVarianceAdjustments.length,
      date: new Date(),
    };

    setVariances((prev) => [...prev, analysis]);

    eventBus.emit(INTEGRATION_EVENTS.INVENTORY_VARIANCE_ANALYSIS_COMPLETE, {
      analysis,
      timestamp: new Date(),
    });

    return analysis;
  }, []);

  return {
    variances,
    calculateVarianceMetrics,
  };
}
