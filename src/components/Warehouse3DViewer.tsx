/**
 * 3D Warehouse Visualization Component
 * 
 * Interactive 3D warehouse viewer with support for:
 * - Multiple shelf levels
 * - Real-time inventory tracking
 * - Click-to-select bins
 * - Picking route visualization
 * - Zone highlighting
 * - Camera controls (orbit, pan, zoom)
 */

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Preload } from '@react-three/drei';
import * as THREE from 'three';
import { Warehouse3D, Bin3D, create3DWarehouse, PickingRoute } from '../services/warehouse3dService';

interface Warehouse3DViewerProps {
  warehouse: Warehouse3D;
  pickingRoute?: PickingRoute;
  selectedBinId?: string;
  onBinSelected?: (binId: string) => void;
  onBinUpdated?: (binId: string, newStock: number) => void;
  showStats?: boolean;
  showGridLines?: boolean;
  autoRotate?: boolean;
}

/**
 * Interactive bin mesh for clicking
 */
const InteractiveBin: React.FC<{
  bin: Bin3D;
  onSelect: (binId: string) => void;
  isSelected: boolean;
  onRoute: boolean;
}> = ({ bin, onSelect, isSelected, onRoute }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.set(1.1, 1.1, 1.1);
      } else if (onRoute) {
        meshRef.current.scale.set(1.05, 1.05, 1.05);
      } else {
        meshRef.current.scale.set(1, 1, 1);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={bin.position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={() => onSelect(bin.id)}
      castShadow
      receiveShadow
    >
      <boxGeometry args={bin.size} />
      <meshStandardMaterial
        color={getStockColor(bin.currentStock, bin.capacity)}
        roughness={0.4}
        metalness={0.2}
        emissive={hovered ? '#444444' : '#000000'}
        emissiveIntensity={hovered ? 0.5 : 0}
      />
    </mesh>
  );
};

/**
 * Main warehouse scene
 */
const WarehouseScene: React.FC<{
  warehouse: Warehouse3D;
  pickingRoute?: PickingRoute;
  selectedBinId?: string;
  onBinSelected?: (binId: string) => void;
  showGridLines?: boolean;
  autoRotate?: boolean;
}> = ({
  warehouse,
  pickingRoute,
  selectedBinId,
  onBinSelected,
  showGridLines = true,
  autoRotate = false,
}) => {
  const { camera } = useThree();
  const [warehouseGroup] = useState(() => create3DWarehouse(warehouse));
  const pickingLineRef = useRef<THREE.Line>(null);

  useEffect(() => {
    // Set camera to view entire warehouse
    const bbox = new THREE.Box3().setFromObject(warehouseGroup);
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 2;

    camera.position.z = cameraZ;
    camera.lookAt(warehouseGroup.position);
  }, [warehouseGroup, camera]);

  // Draw picking route
  useEffect(() => {
    if (pickingRoute && pickingRoute.bins.length > 0 && pickingLineRef.current) {
      const points = pickingRoute.bins.map(
        (bin) => new THREE.Vector3(bin.position[0], bin.position[1], bin.position[2])
      );
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      pickingLineRef.current.geometry = geometry;
    }
  }, [pickingRoute]);

  useFrame(() => {
    if (autoRotate && warehouseGroup) {
      warehouseGroup.rotation.y += 0.0005;
    }
  });

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[warehouse.dimensions[0] / 2, warehouse.dimensions[1], warehouse.dimensions[2] / 2]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, warehouse.dimensions[1] / 2, 0]} intensity={0.4} />

      {/* Grid lines */}
      {showGridLines && <gridHelper args={[warehouse.dimensions[0], 10]} />}

      {/* Warehouse floor and structure */}
      <primitive object={warehouseGroup} />

      {/* Interactive bins */}
      {warehouse.shelves.map((shelf) =>
        shelf.bins.map((bin) => (
          <InteractiveBin
            key={bin.id}
            bin={bin}
            isSelected={bin.id === selectedBinId}
            onRoute={pickingRoute?.bins.some((b) => b.id === bin.id) || false}
            onSelect={onBinSelected || (() => {})}
          />
        ))
      )}

      {/* Picking route visualization */}
      {pickingRoute && pickingRoute.bins.length > 0 && (
        <line ref={pickingLineRef} castShadow>
          <bufferGeometry />
          <lineBasicMaterial color={0xff0000} linewidth={3} />
        </line>
      )}

      {/* Picking route start marker */}
      {pickingRoute && pickingRoute.bins.length > 0 && (
        <mesh position={[pickingRoute.bins[0].position[0], pickingRoute.bins[0].position[1] + 0.5, pickingRoute.bins[0].position[2]]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial color={0x00ff00} />
        </mesh>
      )}

      {/* Picking route end marker */}
      {pickingRoute && pickingRoute.bins.length > 0 && (
        <mesh position={[pickingRoute.bins[pickingRoute.bins.length - 1].position[0], pickingRoute.bins[pickingRoute.bins.length - 1].position[1] + 0.5, pickingRoute.bins[pickingRoute.bins.length - 1].position[2]]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial color={0xff0000} />
        </mesh>
      )}

      <Preload all />
    </>
  );
};

/**
 * Main 3D Warehouse Viewer Component
 */
export const Warehouse3DViewer: React.FC<Warehouse3DViewerProps> = ({
  warehouse,
  pickingRoute,
  selectedBinId,
  onBinSelected,
  onBinUpdated,
  showStats = true,
  showGridLines = true,
  autoRotate = false,
}) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Calculate warehouse statistics
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
      (count, shelf) => count + shelf.bins.filter((b) => b.currentStock === 0).length,
      0
    );

    setStats({
      totalCapacity,
      totalStock,
      utilization,
      emptyBins,
      totalBins: warehouse.shelves.reduce((sum, s) => sum + s.bins.length, 0),
      totalShelves: warehouse.shelves.length,
    });
  }, [warehouse]);

  const selectedBin = warehouse.shelves
    .flatMap((s) => s.bins)
    .find((b) => b.id === selectedBinId);

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* 3D Canvas */}
      <div className="w-full h-full relative">
        <Canvas
          shadows
          camera={{ position: [0, 0, 50], fov: 50 }}
          className="w-full h-full"
        >
          <WarehouseScene
            warehouse={warehouse}
            pickingRoute={pickingRoute}
            selectedBinId={selectedBinId}
            onBinSelected={onBinSelected}
            showGridLines={showGridLines}
            autoRotate={autoRotate}
          />
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            autoRotate={autoRotate}
            autoRotateSpeed={2}
          />
          <PerspectiveCamera makeDefault position={[0, 0, 50]} />
        </Canvas>

        {/* Stats Overlay */}
        {showStats && stats && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-4 rounded-lg text-sm space-y-2">
            <div className="font-bold text-lg mb-2">Warehouse Stats</div>
            <div>Shelves: {stats.totalShelves}</div>
            <div>Total Bins: {stats.totalBins}</div>
            <div>Empty Bins: {stats.emptyBins}</div>
            <div>Stock Level: {stats.totalStock}/{stats.totalCapacity}</div>
            <div>Utilization: {stats.utilization}%</div>
            {pickingRoute && (
              <>
                <div className="border-t border-gray-600 mt-2 pt-2">
                  <div className="font-bold">Picking Route</div>
                  <div>Distance: {pickingRoute.optimizedDistance}m</div>
                  <div>Est. Time: {pickingRoute.estimatedTime} min</div>
                  <div>Items: {pickingRoute.bins.length}</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Selected Bin Info */}
        {selectedBin && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg text-sm max-w-xs">
            <div className="font-bold text-lg mb-2">Bin Info</div>
            <div>ID: {selectedBin.id}</div>
            <div>Zone: {selectedBin.zone}</div>
            <div>Level: {selectedBin.level}</div>
            {selectedBin.sku && <div>SKU: {selectedBin.sku}</div>}
            <div>Stock: {selectedBin.currentStock}/{selectedBin.capacity}</div>
            <div className="w-full bg-gray-700 rounded h-2 mt-2">
              <div
                className="bg-green-500 h-full rounded"
                style={{
                  width: `${(selectedBin.currentStock / selectedBin.capacity) * 100}%`,
                }}
              />
            </div>
            {selectedBin.temperature !== undefined && (
              <div>Temp: {selectedBin.temperature}°C</div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-xs space-y-1">
          <div className="font-bold mb-2">Stock Level</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#00aa00' }} />
            <span>Full (80-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#88aa00' }} />
            <span>High (50-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ffaa00' }} />
            <span>Low (20-50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ff0000' }} />
            <span>Critical (0-20%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Get stock color based on capacity
 */
const getStockColor = (current: number, capacity: number): string => {
  const percentage = current / capacity;
  if (percentage >= 0.8) return '#00aa00';
  if (percentage >= 0.5) return '#88aa00';
  if (percentage >= 0.2) return '#ffaa00';
  return '#ff0000';
};

export default Warehouse3DViewer;
