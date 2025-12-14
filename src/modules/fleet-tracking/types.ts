export interface FleetVehicle {
  id: string;
  companyId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  status: 'available' | 'in-transit' | 'maintenance' | 'idle';
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
    address: string;
  };
  driver?: {
    id: string;
    name: string;
    phone: string;
  };
  fuelType: 'diesel' | 'petrol' | 'electric' | 'hybrid';
  currentFuelLevel?: number;
  totalMileage: number;
  lastServiceDate: Date;
  nextServiceDate: Date;
}

export interface SparePartTracking {
  id: string;
  vehicleId: string;
  partName: string;
  partNumber: string;
  category: string;
  lastInstalled: Date;
  replacementInterval: {
    distance?: number;
    time?: number; // days
  };
  nextDueDate: Date;
  status: 'good' | 'warning' | 'critical';
  cost: number;
}

export interface VehicleRoute {
  id: string;
  vehicleId: string;
  orderId?: string;
  startPoint: {
    lat: number;
    lng: number;
    address: string;
    timestamp: Date;
  };
  endPoint: {
    lat: number;
    lng: number;
    address: string;
  };
  currentPoint?: {
    lat: number;
    lng: number;
    timestamp: Date;
  };
  estimatedDistance: number;
  actualDistance?: number;
  estimatedDuration: number; // minutes
  actualDuration?: number;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  waypoints: Array<{
    lat: number;
    lng: number;
    address: string;
    timestamp: Date;
  }>;
}

export interface MaintenanceAlert {
  id: string;
  vehicleId: string;
  sparePartId?: string;
  alertType: 'service-due' | 'spare-part-due' | 'inspection-due' | 'fuel-low' | 'temperature-high';
  severity: 'info' | 'warning' | 'critical';
  dueDate: Date;
  message: string;
  acknowledged: boolean;
  createdAt: Date;
}

export interface VehicleMetrics {
  vehicleId: string;
  totalDistance: number;
  totalFuelConsumed: number;
  averageFuelConsumption: number; // km per liter
  totalMaintenanceCost: number;
  activeRoutes: number;
  completedRoutes: number;
  delayedRoutes: number;
}
