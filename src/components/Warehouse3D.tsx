/**
 * 3D Warehouse Visualization Component
 * Interactive visualization of warehouse layout with bins, aisles, shelves
 * Shows stock levels in real-time
 */

import React, { useState, useEffect } from 'react';
import './Warehouse3D.css';

interface WarehouseLocation {
  bin: string;
  aisle: number;
  shelf: number;
  position: string;
  sku?: string;
  productName?: string;
  quantity?: number;
  capacity?: number;
}

interface Warehouse3DProps {
  warehouseId: string;
  inventory: any[];
  onSelectLocation?: (location: WarehouseLocation) => void;
}

export const Warehouse3D: React.FC<Warehouse3DProps> = ({
  warehouseId,
  inventory = [],
  onSelectLocation
}) => {
  const [selectedLocation, setSelectedLocation] = useState<WarehouseLocation | null>(null);
  const [viewMode, setViewMode] = useState<'top' | 'front' | 'side'>('top');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filterBin, setFilterBin] = useState<string>('');

  // Extract unique bins and aisles from inventory
  const bins = [...new Set(inventory.map(item => item.location?.bin))].sort();
  const aisles = [...new Set(inventory.map(item => item.location?.aisle))].sort((a, b) => a - b);
  const shelves = [...new Set(inventory.map(item => item.location?.shelf))].sort((a, b) => a - b);

  // Get items at location
  const getItemsAtLocation = (position: string) => {
    return inventory.filter(item => item.location?.position === position);
  };

  // Calculate occupancy percentage
  const getOccupancy = (position: string) => {
    const items = getItemsAtLocation(position);
    if (items.length === 0) return 0;
    const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    return Math.min(100, (totalQty / 100) * 100); // Assuming 100 units max per bin
  };

  // Get color based on occupancy
  const getOccupancyColor = (occupancy: number) => {
    if (occupancy === 0) return '#f0f0f0'; // Empty - light gray
    if (occupancy < 30) return '#ffeb3b'; // Low - yellow
    if (occupancy < 70) return '#4caf50'; // Medium - green
    return '#2196f3'; // High - blue
  };

  // Handle location click
  const handleLocationClick = (bin: string, aisle: number, shelf: number) => {
    const position = `${bin}-${aisle}-${shelf}`;
    const items = getItemsAtLocation(position);
    const location: WarehouseLocation = {
      bin,
      aisle,
      shelf,
      position,
      sku: items[0]?.sku,
      productName: items[0]?.productName,
      quantity: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
      capacity: 100
    };
    setSelectedLocation(location);
    onSelectLocation?.(location);
  };

  // Render top-down view
  const renderTopView = () => {
    const filteredBins = filterBin ? bins.filter(b => b.includes(filterBin)) : bins;
    
    return (
      <div className="warehouse-view top-view">
        <div className="warehouse-grid">
          {filteredBins.map((bin, binIdx) => (
            <div key={bin} className="bin-column">
              <div className="bin-label">{bin}</div>
              {aisles.map((aisle) => (
                <div key={`${bin}-${aisle}`} className="aisle-row">
                  {shelves.map((shelf) => {
                    const position = `${bin}-${aisle}-${shelf}`;
                    const occupancy = getOccupancy(position);
                    const items = getItemsAtLocation(position);
                    const isSelected = selectedLocation?.position === position;
                    
                    return (
                      <div
                        key={position}
                        className={`bin-cell ${isSelected ? 'selected' : ''}`}
                        style={{
                          backgroundColor: getOccupancyColor(occupancy),
                          opacity: 0.7 + (occupancy / 100) * 0.3
                        }}
                        onClick={() => handleLocationClick(bin, aisle, shelf)}
                        title={`${position}: ${items.length} item(s), ${items.reduce((sum, i) => sum + (i.quantity || 0), 0)} units`}
                      >
                        <div className="bin-info">
                          <span className="shelf-num">{shelf}</span>
                          <span className="qty-badge">{items.length > 0 ? items.reduce((sum, i) => sum + (i.quantity || 0), 0) : 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render front view
  const renderFrontView = () => {
    return (
      <div className="warehouse-view front-view">
        <div className="warehouse-3d">
          {aisles.map((aisle) => (
            <div key={aisle} className="aisle-group">
              <div className="aisle-label">Aisle {aisle}</div>
              <div className="shelves-stack">
                {shelves.map((shelf) => (
                  <div key={shelf} className="shelf-row">
                    {bins.map((bin) => {
                      const position = `${bin}-${aisle}-${shelf}`;
                      const occupancy = getOccupancy(position);
                      const items = getItemsAtLocation(position);
                      const isSelected = selectedLocation?.position === position;
                      
                      return (
                        <div
                          key={position}
                          className={`bin-3d ${isSelected ? 'selected' : ''}`}
                          style={{
                            backgroundColor: getOccupancyColor(occupancy),
                            height: `${20 + occupancy / 5}px`
                          }}
                          onClick={() => handleLocationClick(bin, aisle, shelf)}
                          title={position}
                        >
                          <span className="bin-label-mini">{bin}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render side view
  const renderSideView = () => {
    return (
      <div className="warehouse-view side-view">
        <div className="warehouse-3d">
          {bins.map((bin) => (
            <div key={bin} className="bin-group">
              <div className="bin-label">{bin}</div>
              <div className="shelves-stack">
                {shelves.map((shelf) => (
                  <div key={shelf} className="shelf-row">
                    {aisles.map((aisle) => {
                      const position = `${bin}-${aisle}-${shelf}`;
                      const occupancy = getOccupancy(position);
                      const items = getItemsAtLocation(position);
                      const isSelected = selectedLocation?.position === position;
                      
                      return (
                        <div
                          key={position}
                          className={`bin-3d ${isSelected ? 'selected' : ''}`}
                          style={{
                            backgroundColor: getOccupancyColor(occupancy),
                            height: `${20 + occupancy / 5}px`
                          }}
                          onClick={() => handleLocationClick(bin, aisle, shelf)}
                          title={position}
                        >
                          <span className="aisle-label-mini">A{aisle}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="warehouse-3d-container">
      <div className="warehouse-controls">
        <div className="view-mode-controls">
          <button
            className={`view-btn ${viewMode === 'top' ? 'active' : ''}`}
            onClick={() => setViewMode('top')}
          >
            📦 Top View
          </button>
          <button
            className={`view-btn ${viewMode === 'front' ? 'active' : ''}`}
            onClick={() => setViewMode('front')}
          >
            👁️ Front View
          </button>
          <button
            className={`view-btn ${viewMode === 'side' ? 'active' : ''}`}
            onClick={() => setViewMode('side')}
          >
            🔍 Side View
          </button>
        </div>

        <div className="zoom-controls">
          <button onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}>−</button>
          <span>{(zoomLevel * 100).toFixed(0)}%</span>
          <button onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}>+</button>
        </div>

        <div className="filter-controls">
          <input
            type="text"
            placeholder="Filter bins..."
            value={filterBin}
            onChange={(e) => setFilterBin(e.target.value)}
            className="bin-filter"
          />
        </div>
      </div>

      <div className="warehouse-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f0f0f0' }}></div>
          <span>Empty</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ffeb3b' }}></div>
          <span>Low (&lt;30%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#4caf50' }}></div>
          <span>Medium (30-70%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#2196f3' }}></div>
          <span>High (&gt;70%)</span>
        </div>
      </div>

      <div className="warehouse-view-container" style={{ transform: `scale(${zoomLevel})` }}>
        {viewMode === 'top' && renderTopView()}
        {viewMode === 'front' && renderFrontView()}
        {viewMode === 'side' && renderSideView()}
      </div>

      {selectedLocation && (
        <div className="location-details">
          <h4>Location: {selectedLocation.position}</h4>
          <p><strong>Bin:</strong> {selectedLocation.bin}</p>
          <p><strong>Aisle:</strong> {selectedLocation.aisle}</p>
          <p><strong>Shelf:</strong> {selectedLocation.shelf}</p>
          {selectedLocation.sku && (
            <>
              <p><strong>SKU:</strong> {selectedLocation.sku}</p>
              <p><strong>Product:</strong> {selectedLocation.productName}</p>
              <p><strong>Quantity:</strong> {selectedLocation.quantity} units</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Warehouse3D;
