export interface VehicleLocation {
  vehicleId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  altitude?: number;
}

export interface Vehicle {
  id: string;
  companyId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  status: 'available' | 'in-transit' | 'maintenance' | 'idle';
  currentLocation?: VehicleLocation;
  lastServiceDate: Date;
  nextServiceDate: Date;
  fuelType: 'diesel' | 'petrol' | 'electric' | 'hybrid';
  currentFuelLevel?: number;
  totalMileage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SparePart {
  id: string;
  vehicleId: string;
  name: string;
  partNumber: string;
  category: string;
  replacementInterval: {
    distance?: number; // in km
    time?: number; // in days
  };
  lastReplaced: Date;
  nextDueDate: Date;
  cost: number;
  supplier?: string;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: Date;
  type: 'service' | 'repair' | 'spare-part-replacement' | 'inspection';
  description: string;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  mechanic: string;
  serviceCenter?: string;
  nextServiceDue: Date;
  invoiceUrl?: string;
}

export interface RouteTracking {
  id: string;
  vehicleId: string;
  orderId?: string;
  startLocation: { lat: number; lng: number; address: string };
  endLocation: { lat: number; lng: number; address: string };
  startTime: Date;
  estimatedArrival?: Date;
  actualArrival?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  distance: number; // in km
  durationEstimate: number; // in minutes
  actualDuration?: number;
  waypointHistory: VehicleLocation[];
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: Date;
  fuelAmount: number; // in liters
  cost: number;
  odometerReading: number;
  fuelStation: string;
  notes?: string;
}

export interface SparePartAlert {
  id: string;
  vehicleId: string;
  sparePartId: string;
  alertType: 'due-soon' | 'overdue' | 'high-usage';
  daysRemaining?: number;
  kmRemaining?: number;
  severity: 'warning' | 'critical';
  createdAt: Date;
  acknowledged: boolean;
}
