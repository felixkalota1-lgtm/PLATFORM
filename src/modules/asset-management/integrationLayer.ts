import { useState, useCallback } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';

// ============================================================================
// Asset Management Integration Layer
// Fixed asset depreciation, maintenance history, asset location tracking
// ============================================================================

interface FixedAsset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  acquisitionDate: Date;
  purchasePrice: number;
  depreciationMethod: 'straight-line' | 'declining-balance';
  usefulLife: number; // years
  currentValue: number;
  location: string;
  status: 'active' | 'inactive' | 'sold';
  lastModified: Date;
}

interface MaintenanceRecord {
  id: string;
  assetId: string;
  maintenanceDate: Date;
  description: string;
  cost: number;
  type: 'preventive' | 'corrective' | 'inspection';
  nextMaintenanceDate: Date;
  technician: string;
}

// Hook 1: Fixed asset tracking with depreciation calculation
export function useFixedAssetTracking() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);

  const addAsset = useCallback(
    (
      name: string,
      category: string,
      purchasePrice: number,
      usefulLife: number,
      depreciationMethod: 'straight-line' | 'declining-balance',
      location: string
    ) => {
      const assetId = `ASSET-${Date.now()}`;

      const asset: FixedAsset = {
        id: assetId,
        assetCode: `AST-${Date.now()}`,
        name,
        category,
        acquisitionDate: new Date(),
        purchasePrice,
        depreciationMethod,
        usefulLife,
        currentValue: purchasePrice,
        location,
        status: 'active',
        lastModified: new Date(),
      };

      setAssets((prev) => [...prev, asset]);

      eventBus.emit(INTEGRATION_EVENTS.FIXED_ASSET_ADDED, {
        assetId,
        name,
        purchasePrice,
        location,
        timestamp: new Date(),
      });

      return assetId;
    },
    []
  );

  const updateAssetLocation = useCallback((assetId: string, newLocation: string) => {
    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === assetId
          ? { ...asset, location: newLocation, lastModified: new Date() }
          : asset
      )
    );

    eventBus.emit(INTEGRATION_EVENTS.ASSET_LOCATION_UPDATED, {
      assetId,
      newLocation,
      timestamp: new Date(),
    });
  }, []);

  const retireAsset = useCallback((assetId: string) => {
    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === assetId
          ? { ...asset, status: 'inactive', lastModified: new Date() }
          : asset
      )
    );

    eventBus.emit(INTEGRATION_EVENTS.ASSET_RETIRED, {
      assetId,
      timestamp: new Date(),
    });
  }, []);

  return {
    assets,
    addAsset,
    updateAssetLocation,
    retireAsset,
  };
}

// Hook 2: Asset depreciation calculation
export function useAssetDepreciation() {
  const [depreciationRecords, setDepreciationRecords] = useState<any[]>([]);

  const calculateMonthlyDepreciation = useCallback((asset: any) => {
    if (asset.depreciationMethod === 'straight-line') {
      const monthlyDepreciation = asset.purchasePrice / (asset.usefulLife * 12);
      return monthlyDepreciation;
    } else if (asset.depreciationMethod === 'declining-balance') {
      const rate = 1 / asset.usefulLife;
      return asset.currentValue * rate;
    }
    return 0;
  }, []);

  const processMonthlyDepreciation = useCallback((asset: any) => {
    const monthlyDepreciation = calculateMonthlyDepreciation(asset);
    const newValue = Math.max(0, asset.currentValue - monthlyDepreciation);

    const record = {
      id: `DEP-${Date.now()}`,
      assetId: asset.id,
      depreciationDate: new Date(),
      depreciationAmount: monthlyDepreciation,
      bookValue: newValue,
      method: asset.depreciationMethod,
    };

    setDepreciationRecords((prev) => [...prev, record]);

    eventBus.emit(INTEGRATION_EVENTS.ASSET_DEPRECIATION_RECORDED, {
      assetId: asset.id,
      depreciationAmount: monthlyDepreciation,
      bookValue: newValue,
      timestamp: new Date(),
    });

    return newValue;
  }, [calculateMonthlyDepreciation]);

  const getDepreciationSummary = useCallback((assets: any[]) => {
    const totalDepreciation = depreciationRecords.reduce((sum, r) => sum + r.depreciationAmount, 0);
    const averageDepreciation = depreciationRecords.length > 0 ? totalDepreciation / depreciationRecords.length : 0;
    const assetCount = assets.length;
    const totalBookValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

    return {
      totalDepreciation,
      averageDepreciation,
      assetCount,
      totalBookValue,
      recordCount: depreciationRecords.length,
    };
  }, [depreciationRecords]);

  return {
    depreciationRecords,
    calculateMonthlyDepreciation,
    processMonthlyDepreciation,
    getDepreciationSummary,
  };
}

// Hook 3: Asset maintenance history and scheduling
export function useAssetMaintenanceHistory() {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);

  const recordMaintenance = useCallback(
    (assetId: string, description: string, cost: number, type: 'preventive' | 'corrective' | 'inspection', technician: string) => {
      const recordId = `MAINT-${Date.now()}`;
      const maintenanceDate = new Date();
      const nextMaintenanceDate = new Date(maintenanceDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days for preventive

      const record: MaintenanceRecord = {
        id: recordId,
        assetId,
        maintenanceDate,
        description,
        cost,
        type,
        nextMaintenanceDate: type === 'preventive' ? nextMaintenanceDate : maintenanceDate,
        technician,
      };

      setMaintenanceRecords((prev) => [...prev, record]);

      eventBus.emit(INTEGRATION_EVENTS.ASSET_MAINTENANCE_RECORDED, {
        recordId,
        assetId,
        type,
        cost,
        timestamp: new Date(),
      });

      if (type === 'corrective') {
        eventBus.emit(INTEGRATION_EVENTS.ASSET_MAINTENANCE_ALERT, {
          assetId,
          alertType: 'corrective_maintenance',
          message: `Corrective maintenance performed: ${description}`,
          timestamp: new Date(),
        });
      }

      return recordId;
    },
    []
  );

  const getMaintenanceHistory = useCallback((assetId: string) => {
    return maintenanceRecords.filter((r) => r.assetId === assetId);
  }, [maintenanceRecords]);

  const getUpcomingMaintenance = useCallback(() => {
    const now = new Date();
    return maintenanceRecords.filter(
      (r) => r.nextMaintenanceDate > now && r.nextMaintenanceDate < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    );
  }, [maintenanceRecords]);

  const getTotalMaintenanceCost = useCallback(
    (assetId: string) => {
      return maintenanceRecords
        .filter((r) => r.assetId === assetId)
        .reduce((sum, r) => sum + r.cost, 0);
    },
    [maintenanceRecords]
  );

  return {
    maintenanceRecords,
    recordMaintenance,
    getMaintenanceHistory,
    getUpcomingMaintenance,
    getTotalMaintenanceCost,
  };
}
