import { create } from 'zustand';
import { FleetVehicle, SparePartTracking, VehicleRoute, MaintenanceAlert, VehicleMetrics } from './types';

interface FleetTrackingStore {
  vehicles: FleetVehicle[];
  spareParts: SparePartTracking[];
  routes: VehicleRoute[];
  alerts: MaintenanceAlert[];
  metrics: VehicleMetrics[];
  selectedVehicle: string | null;
  mapCenter: { lat: number; lng: number };

  // Vehicle actions
  addVehicle: (vehicle: FleetVehicle) => void;
  updateVehicle: (id: string, vehicle: Partial<FleetVehicle>) => void;
  updateVehicleLocation: (vehicleId: string, location: any) => void;

  // Spare parts actions
  addSparePart: (part: SparePartTracking) => void;
  updateSparePartStatus: (partId: string, status: SparePartTracking['status']) => void;

  // Route actions
  createRoute: (route: VehicleRoute) => void;
  updateRoute: (id: string, route: Partial<VehicleRoute>) => void;
  updateRouteStatus: (id: string, status: VehicleRoute['status']) => void;
  updateRouteLocation: (routeId: string, location: any) => void;

  // Alert actions
  createAlert: (alert: MaintenanceAlert) => void;
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;

  // Metrics
  updateMetrics: (vehicleId: string, metrics: VehicleMetrics) => void;

  // Selection
  setSelectedVehicle: (id: string | null) => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;
}

export const useFleetTrackingStore = create<FleetTrackingStore>((set) => ({
  vehicles: [],
  spareParts: [],
  routes: [],
  alerts: [],
  metrics: [],
  selectedVehicle: null,
  mapCenter: { lat: 0, lng: 0 },

  addVehicle: (vehicle) => set((state) => ({ vehicles: [...state.vehicles, vehicle] })),
  updateVehicle: (id, vehicle) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...vehicle } : v)),
    })),
  updateVehicleLocation: (vehicleId, location) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === vehicleId ? { ...v, currentLocation: location } : v
      ),
    })),

  addSparePart: (part) => set((state) => ({ spareParts: [...state.spareParts, part] })),
  updateSparePartStatus: (partId, status) =>
    set((state) => ({
      spareParts: state.spareParts.map((p) =>
        p.id === partId ? { ...p, status } : p
      ),
    })),

  createRoute: (route) => set((state) => ({ routes: [...state.routes, route] })),
  updateRoute: (id, route) =>
    set((state) => ({
      routes: state.routes.map((r) => (r.id === id ? { ...r, ...route } : r)),
    })),
  updateRouteStatus: (id, status) =>
    set((state) => ({
      routes: state.routes.map((r) =>
        r.id === id ? { ...r, status } : r
      ),
    })),
  updateRouteLocation: (routeId, location) =>
    set((state) => ({
      routes: state.routes.map((r) =>
        r.id === routeId
          ? {
              ...r,
              currentPoint: location,
              waypoints: [...(r.waypoints || []), { ...location, address: 'Current Location' }],
            }
          : r
      ),
    })),

  createAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      ),
    })),
  dismissAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
    })),

  updateMetrics: (vehicleId, metrics) =>
    set((state) => ({
      metrics: [
        ...state.metrics.filter((m) => m.vehicleId !== vehicleId),
        { ...metrics, vehicleId },
      ],
    })),

  setSelectedVehicle: (id) => set({ selectedVehicle: id }),
  setMapCenter: (center) => set({ mapCenter: center }),
}));
