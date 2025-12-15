/**
 * LOGISTICS & FLEET INTEGRATION MODULE
 * Links fleet tracking, maintenance, and shipments across the platform
 */

import { useState } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';

interface Shipment {
  id: string;
  orderId: string;
  vehicleId: string;
  originBranch: string;
  destinationBranch: string;
  items: Array<{
    sku: string;
    productName: string;
    quantity: number;
  }>;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  dispatchedAt?: Date;
  deliveredAt?: Date;
  estimatedArrival?: Date;
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: Date;
  };
}

interface VehicleMaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  serviceType: 'oil_change' | 'tire_replacement' | 'brake_service' | 'inspection' | 'repair' | 'other';
  odometer: number;
  hours: number;
  lastServiceOdometer?: number;
  lastServiceHours?: number;
  nextServiceOdometer: number; // When to service next (km/miles)
  nextServiceHours: number; // When to service next (hours)
  status: 'due' | 'overdue' | 'pending' | 'completed';
}

/**
 * Hook for managing shipments and logistics
 */
export function useShipmentTracking() {
  const [shipments, setShipments] = useState<Shipment[]>([]);

  // Create new shipment
  const createShipment = (
    orderId: string,
    vehicleId: string,
    originBranch: string,
    destinationBranch: string,
    items: Shipment['items']
  ) => {
    const shipment: Shipment = {
      id: `SHIP-${Date.now()}`,
      orderId,
      vehicleId,
      originBranch,
      destinationBranch,
      items,
      status: 'pending',
      dispatchedAt: undefined,
      estimatedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    };

    setShipments((prev) => [...prev, shipment]);

    // Emit shipment created event
    eventBus.emit(INTEGRATION_EVENTS.SHIPMENT_CREATED, {
      shipmentId: shipment.id,
      orderId,
      origin: originBranch,
      destination: destinationBranch,
      items: items.length,
      estimatedArrival: shipment.estimatedArrival,
      timestamp: new Date(),
    });

    console.log(`✅ Shipment created: ${shipment.id}`);
    return shipment;
  };

  // Update shipment status to in-transit
  const startShipment = (shipmentId: string, currentLocation?: Shipment['currentLocation']) => {
    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipmentId
          ? {
              ...s,
              status: 'in_transit',
              dispatchedAt: new Date(),
              currentLocation: currentLocation || s.currentLocation,
            }
          : s
      )
    );

    const shipment = shipments.find((s) => s.id === shipmentId);
    if (shipment) {
      eventBus.emit(INTEGRATION_EVENTS.SHIPMENT_IN_TRANSIT, {
        shipmentId,
        orderId: shipment.orderId,
        vehicleId: shipment.vehicleId,
        timestamp: new Date(),
      });
    }
  };

  // Mark shipment as delivered
  const completeShipment = (shipmentId: string) => {
    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipmentId
          ? {
              ...s,
              status: 'delivered',
              deliveredAt: new Date(),
            }
          : s
      )
    );

    const shipment = shipments.find((s) => s.id === shipmentId);
    if (shipment) {
      eventBus.emit(INTEGRATION_EVENTS.SHIPMENT_DELIVERED, {
        shipmentId,
        orderId: shipment.orderId,
        destinationBranch: shipment.destinationBranch,
        items: shipment.items,
        deliveredAt: new Date(),
        timestamp: new Date(),
      });

      console.log(`✅ Shipment ${shipmentId} delivered`);
    }
  };

  // Update current location (GPS tracking)
  const updateLocation = (shipmentId: string, latitude: number, longitude: number) => {
    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipmentId
          ? {
              ...s,
              currentLocation: {
                latitude,
                longitude,
                lastUpdated: new Date(),
              },
            }
          : s
      )
    );
  };

  return {
    shipments,
    createShipment,
    startShipment,
    completeShipment,
    updateLocation,
    inTransitShipments: shipments.filter((s) => s.status === 'in_transit'),
    pendingShipments: shipments.filter((s) => s.status === 'pending'),
  };
}

/**
 * Hook for vehicle maintenance tracking and scheduling
 */
export function useVehicleMaintenanceTracking(vehicleId: string, vehicleName: string) {
  const [maintenanceRecords, setMaintenanceRecords] = useState<VehicleMaintenanceRecord[]>([]);

  // Add maintenance record
  const addMaintenanceRecord = (
    serviceType: VehicleMaintenanceRecord['serviceType'],
    odometer: number,
    hours: number,
    nextOdometerThreshold: number,
    nextHoursThreshold: number
  ) => {
    const record: VehicleMaintenanceRecord = {
      id: `MAINT-${Date.now()}`,
      vehicleId,
      vehicleName,
      serviceType,
      odometer,
      hours,
      lastServiceOdometer: odometer,
      lastServiceHours: hours,
      nextServiceOdometer: odometer + nextOdometerThreshold,
      nextServiceHours: hours + nextHoursThreshold,
      status: 'completed',
    };

    setMaintenanceRecords((prev) => [...prev, record]);
    console.log(`✅ Maintenance record added for ${vehicleName}`);
    return record;
  };

  // Check if maintenance is due
  const checkMaintenanceDue = (currentOdometer: number, currentHours: number) => {
    const dueRecords = maintenanceRecords.filter((record) => {
      const odometerDue = currentOdometer >= record.nextServiceOdometer;
      const hoursDue = currentHours >= record.nextServiceHours;
      return odometerDue || hoursDue;
    });

    // Emit maintenance due events
    dueRecords.forEach((record) => {
      if (record.status !== 'due' && record.status !== 'overdue') {
        eventBus.emit(INTEGRATION_EVENTS.VEHICLE_MAINTENANCE_DUE, {
          vehicleId,
          vehicleName,
          serviceType: record.serviceType,
          odometer: currentOdometer,
          hours: currentHours,
          nextServiceOdometer: record.nextServiceOdometer,
          nextServiceHours: record.nextServiceHours,
          daysOverdue: 0,
          timestamp: new Date(),
        });

        // Update status
        setMaintenanceRecords((prev) =>
          prev.map((r) => (r.id === record.id ? { ...r, status: 'due' } : r))
        );

        console.log(`⚠️ Maintenance due for ${vehicleName}: ${record.serviceType}`);
      }
    });

    return {
      isDue: dueRecords.length > 0,
      dueRecords,
    };
  };

  return {
    maintenanceRecords,
    addMaintenanceRecord,
    checkMaintenanceDue,
    dueServices: maintenanceRecords.filter((r) => r.status === 'due' || r.status === 'overdue'),
  };
}

/**
 * Hook for fuel tracking and cost analysis
 */
export function useFuelTracking(vehicleId: string) {
  const [fuelLogs, setFuelLogs] = useState<
    Array<{
      id: string;
      date: Date;
      vehicleId: string;
      fuelStation: string;
      liters: number;
      costPerLiter: number;
      totalCost: number;
      odometer: number;
    }>
  >([]);

  // Log fuel purchase
  const logFuel = (
    fuelStation: string,
    liters: number,
    costPerLiter: number,
    odometer: number
  ) => {
    const log = {
      id: `FUEL-${Date.now()}`,
      date: new Date(),
      vehicleId,
      fuelStation,
      liters,
      costPerLiter,
      totalCost: liters * costPerLiter,
      odometer,
    };

    setFuelLogs((prev) => [...prev, log]);
    console.log(`✅ Fuel logged for vehicle ${vehicleId}: ${liters} liters`);
    return log;
  };

  // Calculate fuel efficiency
  const calculateFuelEfficiency = (lastOdometer: number, currentOdometer: number) => {
    const distance = currentOdometer - lastOdometer;
    const recentLogs = fuelLogs.slice(-1);

    if (recentLogs.length > 0) {
      const efficiency = distance / recentLogs[0].liters;
      return efficiency; // km/liter
    }
    return 0;
  };

  return {
    fuelLogs,
    logFuel,
    calculateFuelEfficiency,
    totalLitersFueled: fuelLogs.reduce((sum, log) => sum + log.liters, 0),
    totalFuelCost: fuelLogs.reduce((sum, log) => sum + log.totalCost, 0),
  };
}

export default {
  useShipmentTracking,
  useVehicleMaintenanceTracking,
  useFuelTracking,
};
