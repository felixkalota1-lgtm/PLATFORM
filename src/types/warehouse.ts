/**
 * Warehouse and Inventory Type Definitions
 */

export type UserRole = 'director' | 'admin' | 'warehouse_manager' | 'branch_manager' | 'staff';

export interface WarehouseUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  assignedWarehouses: string[]; // Array of warehouse IDs
  primaryWarehouse: string; // Main warehouse for this user
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string; // e.g., "Nebraska Main Warehouse", "Arizona Branch"
  type: 'warehouse' | 'branch'; // warehouse = main, branch = sell point
  location: {
    city: string;
    state: string;
    address?: string;
    zipCode?: string;
  };
  capacity: number; // Total storage capacity
  manager: string; // User ID of warehouse manager
  staff: string[]; // Array of user IDs assigned to this warehouse
  isMainWarehouse: boolean;
  parentWarehouse?: string; // If branch, parent warehouse ID
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  warehouseId: string; // Which warehouse this is in
  sku: string;
  productName: string;
  category: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  location?: {
    bin: string;
    aisle: number;
    shelf: number;
    position: string; // e.g., "A1-1-3"
  };
  unitCost: number;
  reorderLevel: number;
  foulWater?: {
    defectiveCount: number;
    expiredCount: number;
    damageCount: number;
    returnedCount: number;
    totalWaste: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  type: 'warehouse_to_branch' | 'branch_to_warehouse' | 'sale' | 'adjustment' | 'return';
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  sku: string;
  quantity: number;
  status: 'pending' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  initiatedBy: string; // User ID who initiated
  createdAt: string;
  deliveredAt?: string;
  notes?: string;
  trackingNumber?: string;
}

export interface FoulWaterRecord {
  id: string;
  warehouseId: string;
  sku: string;
  type: 'defective' | 'expired' | 'damaged' | 'returned';
  quantity: number;
  notes: string;
  recordedBy: string; // User ID
  createdAt: string;
}

export interface WarehouseStats {
  warehouseId: string;
  warehouseName: string;
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  utilizationPercentage: string;
  totalWaste: number;
  staffCount: number;
  lastUpdated: string;
}
