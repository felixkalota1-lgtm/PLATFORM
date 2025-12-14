import { create } from 'zustand';
import { Vehicle, SparePart, MaintenanceRecord, RouteTracking, FuelLog, SparePartAlert } from './types';

interface LogisticsStore {
  vehicles: Vehicle[];
  spareParts: SparePart[];
  maintenance: MaintenanceRecord[];
  routes: RouteTracking[];
  fuelLogs: FuelLog[];
  alerts: SparePartAlert[];
  selectedVehicle: string | null;

  // Vehicle actions
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => void;
  updateVehicleLocation: (vehicleId: string, location: any) => void;

  // Spare parts actions
  addSparePart: (part: SparePart) => void;
  updateSparePart: (id: string, part: Partial<SparePart>) => void;
  replaceSparePart: (partId: string) => void;

  // Maintenance actions
  addMaintenanceRecord: (record: MaintenanceRecord) => void;
  updateMaintenanceRecord: (id: string, record: Partial<MaintenanceRecord>) => void;

  // Route tracking actions
  createRoute: (route: RouteTracking) => void;
  updateRoute: (id: string, route: Partial<RouteTracking>) => void;
  completeRoute: (id: string) => void;

  // Fuel log actions
  addFuelLog: (log: FuelLog) => void;

  // Alert actions
  createAlert: (alert: SparePartAlert) => void;
  acknowledgeAlert: (alertId: string) => void;

  setSelectedVehicle: (id: string | null) => void;
}

export const useLogisticsStore = create<LogisticsStore>((set) => ({
  vehicles: [],
  spareParts: [],
  maintenance: [],
  routes: [],
  fuelLogs: [],
  alerts: [],
  selectedVehicle: null,

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
  updateSparePart: (id, part) =>
    set((state) => ({
      spareParts: state.spareParts.map((p) => (p.id === id ? { ...p, ...part } : p)),
    })),
  replaceSparePart: (partId) =>
    set((state) => ({
      spareParts: state.spareParts.map((p) =>
        p.id === partId
          ? {
              ...p,
              lastReplaced: new Date(),
              nextDueDate: new Date(Date.now() + (p.replacementInterval.time || 365) * 24 * 60 * 60 * 1000),
            }
          : p
      ),
    })),

  addMaintenanceRecord: (record) =>
    set((state) => ({ maintenance: [...state.maintenance, record] })),
  updateMaintenanceRecord: (id, record) =>
    set((state) => ({
      maintenance: state.maintenance.map((m) => (m.id === id ? { ...m, ...record } : m)),
    })),

  createRoute: (route) => set((state) => ({ routes: [...state.routes, route] })),
  updateRoute: (id, route) =>
    set((state) => ({
      routes: state.routes.map((r) => (r.id === id ? { ...r, ...route } : r)),
    })),
  completeRoute: (id) =>
    set((state) => ({
      routes: state.routes.map((r) =>
        r.id === id ? { ...r, status: 'completed', actualArrival: new Date() } : r
      ),
    })),

  addFuelLog: (log) => set((state) => ({ fuelLogs: [...state.fuelLogs, log] })),

  createAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)),
    })),

  setSelectedVehicle: (id) => set({ selectedVehicle: id }),
}));
