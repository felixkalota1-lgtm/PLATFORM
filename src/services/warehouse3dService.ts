/**
 * 3D Warehouse Tracking Service
 * 
 * Provides utilities for creating and managing 3D warehouse layouts with stacked shelves.
 * Uses Three.js and React Three Fiber for rendering.
 * 
 * Features:
 * - 3D warehouse floor plan visualization
 * - Stacked shelf support (multi-level)
 * - Interactive bin/shelf selection
 * - Real-time inventory location tracking
 * - 3D picking route visualization
 * - Export warehouse layout as 3D model
 */

import * as THREE from 'three';

export interface Bin3D {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  level: number;
  zone: string;
  capacity: number;
  currentStock: number;
  sku?: string;
  temperature?: number;
  humidity?: number;
}

export interface Shelf3D {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  levels: number;
  bins: Bin3D[];
  maxCapacity: number;
  currentLoad: number;
}

export interface Warehouse3D {
  id: string;
  name: string;
  dimensions: [number, number, number];
  shelves: Shelf3D[];
  zones: Zone3D[];
}

export interface Zone3D {
  id: string;
  name: string;
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
  type: 'receiving' | 'storage' | 'shipping' | 'cold_storage' | 'high_value';
  color?: string;
}

export interface PickingRoute {
  id: string;
  warehouseId: string;
  bins: Bin3D[];
  optimizedDistance: number;
  estimatedTime: number;
}

/**
 * Create a 3D warehouse geometry
 */
export const create3DWarehouse = (warehouse: Warehouse3D): THREE.Group => {
  const warehouseGroup = new THREE.Group();
  warehouseGroup.name = warehouse.name;

  // Create warehouse floor
  const floorGeometry = new THREE.BoxGeometry(
    warehouse.dimensions[0],
    0.1,
    warehouse.dimensions[2]
  );
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.8,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = 0;
  warehouseGroup.add(floor);

  // Create warehouse walls
  createWalls(warehouseGroup, warehouse.dimensions);

  // Create shelves
  warehouse.shelves.forEach((shelf) => {
    const shelfGroup = create3DShelf(shelf);
    warehouseGroup.add(shelfGroup);
  });

  // Create zones (colored areas)
  warehouse.zones.forEach((zone) => {
    const zoneGeometry = new THREE.BoxGeometry(
      zone.bounds.max[0] - zone.bounds.min[0],
      0.01,
      zone.bounds.max[2] - zone.bounds.min[2]
    );
    const zoneMaterial = new THREE.MeshStandardMaterial({
      color: getZoneColor(zone.type),
      transparent: true,
      opacity: 0.2,
    });
    const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);
    zoneMesh.position.set(
      (zone.bounds.min[0] + zone.bounds.max[0]) / 2,
      0.05,
      (zone.bounds.min[2] + zone.bounds.max[2]) / 2
    );
    zoneMesh.userData = { zoneId: zone.id, zoneName: zone.name };
    warehouseGroup.add(zoneMesh);
  });

  return warehouseGroup;
};

/**
 * Create 3D shelf with multiple levels and bins
 */
export const create3DShelf = (shelf: Shelf3D): THREE.Group => {
  const shelfGroup = new THREE.Group();
  shelfGroup.name = `Shelf-${shelf.id}`;
  shelfGroup.userData = { shelfId: shelf.id, capacity: shelf.maxCapacity };

  // Shelf frame
  const frameGeometry = new THREE.BoxGeometry(
    shelf.size[0],
    shelf.size[1],
    shelf.size[2]
  );
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.7,
  });
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.position.set(shelf.position[0], shelf.position[1], shelf.position[2]);
  shelfGroup.add(frame);

  // Create bins at each level
  shelf.bins.forEach((bin) => {
    const binGeometry = new THREE.BoxGeometry(bin.size[0], bin.size[1], bin.size[2]);
    const binColor = getStockColor(bin.currentStock, bin.capacity);
    const binMaterial = new THREE.MeshStandardMaterial({
      color: binColor,
      roughness: 0.4,
    });
    const binMesh = new THREE.Mesh(binGeometry, binMaterial);
    binMesh.position.set(bin.position[0], bin.position[1], bin.position[2]);
    binMesh.userData = {
      binId: bin.id,
      sku: bin.sku,
      level: bin.level,
      stock: bin.currentStock,
      capacity: bin.capacity,
      zone: bin.zone,
    };
    
    // Add click event support
    binMesh.userData.clickable = true;
    
    shelfGroup.add(binMesh);
  });

  return shelfGroup;
};

/**
 * Create warehouse walls
 */
const createWalls = (
  group: THREE.Group,
  dimensions: [number, number, number]
): void => {
  const [width, height, depth] = dimensions;
  const wallThickness = 0.1;
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    roughness: 0.9,
  });

  // North wall
  const northWallGeometry = new THREE.BoxGeometry(width, height, wallThickness);
  const northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
  northWall.position.z = -depth / 2;
  group.add(northWall);

  // South wall
  const southWall = new THREE.Mesh(northWallGeometry, wallMaterial);
  southWall.position.z = depth / 2;
  group.add(southWall);

  // East wall
  const eastWallGeometry = new THREE.BoxGeometry(wallThickness, height, depth);
  const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
  eastWall.position.x = width / 2;
  group.add(eastWall);

  // West wall
  const westWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
  westWall.position.x = -width / 2;
  group.add(westWall);
};

/**
 * Get color based on stock level (green = full, red = empty)
 */
const getStockColor = (current: number, capacity: number): number => {
  const percentage = current / capacity;
  
  if (percentage >= 0.8) return 0x00aa00; // Green
  if (percentage >= 0.5) return 0x88aa00; // Yellow-green
  if (percentage >= 0.2) return 0xffaa00; // Orange
  return 0xff0000; // Red
};

/**
 * Get color based on zone type
 */
const getZoneColor = (type: string): number => {
  const colors: Record<string, number> = {
    receiving: 0x0066ff,     // Blue
    storage: 0x00aa00,       // Green
    shipping: 0xffaa00,      // Orange
    cold_storage: 0x0099ff,  // Light blue
    high_value: 0xff0000,    // Red
  };
  return colors[type] || 0xcccccc;
};

/**
 * Calculate optimized picking route through warehouse
 * Uses greedy nearest-neighbor algorithm
 */
export const calculatePickingRoute = (
  warehouse: Warehouse3D,
  binIds: string[]
): PickingRoute => {
  const allBins = warehouse.shelves.flatMap(s => s.bins);
  const selectedBins = allBins.filter(b => binIds.includes(b.id));
  
  if (selectedBins.length === 0) {
    return {
      id: `route-${Date.now()}`,
      warehouseId: warehouse.id,
      bins: [],
      optimizedDistance: 0,
      estimatedTime: 0,
    };
  }

  // Start from receiving area (assume 0, 0, 0)
  const route = [selectedBins[0]];
  let remaining = selectedBins.slice(1);
  let totalDistance = 0;

  while (remaining.length > 0) {
    const current = route[route.length - 1];
    let nearest = remaining[0];
    let minDistance = calculateDistance(current.position, nearest.position);

    remaining.forEach(bin => {
      const distance = calculateDistance(current.position, bin.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = bin;
      }
    });

    route.push(nearest);
    totalDistance += minDistance;
    remaining = remaining.filter(b => b.id !== nearest.id);
  }

  // Add distance back to shipping area
  const lastBin = route[route.length - 1];
  totalDistance += calculateDistance(lastBin.position, [
    warehouse.dimensions[0] / 2,
    0,
    warehouse.dimensions[2] / 2,
  ]);

  const estimatedTime = Math.ceil(totalDistance / 2); // Assume ~2 meters per minute

  return {
    id: `route-${Date.now()}`,
    warehouseId: warehouse.id,
    bins: route,
    optimizedDistance: parseFloat(totalDistance.toFixed(2)),
    estimatedTime,
  };
};

/**
 * Calculate Euclidean distance between two 3D points
 */
const calculateDistance = (
  p1: [number, number, number],
  p2: [number, number, number]
): number => {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

/**
 * Get bin by ID from warehouse
 */
export const getBinById = (warehouse: Warehouse3D, binId: string): Bin3D | undefined => {
  for (const shelf of warehouse.shelves) {
    const bin = shelf.bins.find(b => b.id === binId);
    if (bin) return bin;
  }
  return undefined;
};

/**
 * Update bin stock level
 */
export const updateBinStock = (
  warehouse: Warehouse3D,
  binId: string,
  newStock: number
): boolean => {
  const bin = getBinById(warehouse, binId);
  if (!bin || newStock > bin.capacity) return false;
  
  bin.currentStock = newStock;
  return true;
};

/**
 * Get warehouse statistics
 */
export const getWarehouseStats = (warehouse: Warehouse3D) => {
  const totalCapacity = warehouse.shelves.reduce(
    (sum, shelf) => sum + shelf.maxCapacity,
    0
  );
  const totalStock = warehouse.shelves.reduce(
    (sum, shelf) => sum + shelf.bins.reduce((s, bin) => s + bin.currentStock, 0),
    0
  );
  const utilization = ((totalStock / totalCapacity) * 100).toFixed(2);
  const emptyBins = warehouse.shelves.reduce(
    (count, shelf) => count + shelf.bins.filter(b => b.currentStock === 0).length,
    0
  );
  const fullBins = warehouse.shelves.reduce(
    (count, shelf) => count + shelf.bins.filter(b => b.currentStock === b.capacity).length,
    0
  );

  return {
    totalCapacity,
    totalStock,
    utilization: `${utilization}%`,
    emptyBins,
    fullBins,
    totalBins: warehouse.shelves.reduce((sum, s) => sum + s.bins.length, 0),
    totalShelves: warehouse.shelves.length,
    zones: warehouse.zones.length,
  };
};

/**
 * Export warehouse as JSON for backup/transfer
 */
export const exportWarehouse = (warehouse: Warehouse3D): string => {
  return JSON.stringify(warehouse, null, 2);
};

/**
 * Import warehouse from JSON
 */
export const importWarehouse = (json: string): Warehouse3D => {
  return JSON.parse(json);
};
