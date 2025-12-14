import React, { useState } from 'react';
import { useFleetTrackingStore } from './store';

export const FleetTrackingModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'live-map' | 'vehicles' | 'routes' | 'maintenance'>('vehicles');
  const { vehicles, routes, alerts } = useFleetTrackingStore();

  const activeRoutes = routes.filter((r) => r.status === 'in-progress');
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical' && !a.acknowledged);

  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Fleet & Vehicle Tracking</h1>

          {criticalAlerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-semibold">
                ⚠️ {criticalAlerts.length} critical maintenance alert(s)
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('live-map')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'live-map'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Live Map
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'vehicles'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Vehicles ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'routes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Active Routes ({activeRoutes.length})
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'maintenance'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Maintenance ({alerts.length})
          </button>
        </div>

        {activeTab === 'live-map' && <LiveMapView />}
        {activeTab === 'vehicles' && <VehiclesView />}
        {activeTab === 'routes' && <RoutesView />}
        {activeTab === 'maintenance' && <MaintenanceView />}
      </div>
    </div>
  );
};

const LiveMapView: React.FC = () => {
  const { vehicles } = useFleetTrackingStore();
  const activeVehicles = vehicles.filter((v) => v.currentLocation);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 bg-white rounded-lg shadow p-6">
        <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg h-96 flex items-center justify-center text-gray-600">
          <div className="text-center">
            <p className="text-xl font-semibold mb-2">🗺️ Real-Time Fleet Map</p>
            <p className="text-sm">
              {activeVehicles.length} vehicle(s) in transit
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Google Maps / Mapbox integration would go here
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 bg-white rounded-lg shadow p-4">
        <h3 className="font-bold text-gray-900 mb-4">Active Vehicles</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {activeVehicles.length === 0 ? (
            <p className="text-gray-500 text-sm">No vehicles in transit</p>
          ) : (
            activeVehicles.map((vehicle) => (
              <div key={vehicle.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50 cursor-pointer transition">
                <p className="font-semibold text-sm text-gray-900">{vehicle.make} {vehicle.model}</p>
                <p className="text-xs text-gray-600">{vehicle.licensePlate}</p>
                {vehicle.currentLocation && (
                  <p className="text-xs text-blue-600 mt-1">
                    📍 {vehicle.currentLocation.address}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const VehiclesView: React.FC = () => {
  const { vehicles } = useFleetTrackingStore();

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-sm">
          <div className="bg-green-50 border border-green-200 rounded px-3 py-2">
            <p className="text-green-800 font-semibold">
              Available: {vehicles.filter((v) => v.status === 'available').length}
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
            <p className="text-blue-800 font-semibold">
              In Transit: {vehicles.filter((v) => v.status === 'in-transit').length}
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded px-3 py-2">
            <p className="text-red-800 font-semibold">
              Maintenance: {vehicles.filter((v) => v.status === 'maintenance').length}
            </p>
          </div>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
          + Add Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.length === 0 ? (
          <div className="col-span-3 bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No vehicles registered
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{vehicle.make} {vehicle.model}</h3>
                  <p className="text-sm text-gray-600">{vehicle.licensePlate}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
                  vehicle.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                  vehicle.status === 'maintenance' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {vehicle.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mileage:</span>
                  <span className="font-semibold">{vehicle.totalMileage.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Year:</span>
                  <span className="font-semibold">{vehicle.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fuel Type:</span>
                  <span className="font-semibold">{vehicle.fuelType}</span>
                </div>
                {vehicle.currentFuelLevel !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fuel:</span>
                    <span className="font-semibold">{vehicle.currentFuelLevel}%</span>
                  </div>
                )}
              </div>

              <button className="w-full bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition font-semibold text-sm">
                View Details
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const RoutesView: React.FC = () => {
  const { routes, vehicles } = useFleetTrackingStore();
  const activeRoutes = routes.filter((r) => r.status === 'in-progress');

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold">Active Routes</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {activeRoutes.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No active routes currently
          </div>
        ) : (
          activeRoutes.map((route) => (
            <div key={route.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">
                    Route {route.id.slice(0, 8)}
                    {route.orderId && ` - Order ${route.orderId.slice(0, 8)}`}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Vehicle: {vehicles.find((v) => v.id === route.vehicleId)?.make} {vehicles.find((v) => v.id === route.vehicleId)?.model}
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                  IN PROGRESS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">From</p>
                  <p className="font-semibold text-gray-900">{route.startPoint.address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">To</p>
                  <p className="font-semibold text-gray-900">{route.endPoint.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Distance</p>
                  <p className="font-bold text-gray-900">{route.estimatedDistance} km</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Est. Duration</p>
                  <p className="font-bold text-gray-900">{route.estimatedDuration} min</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Progress</p>
                  <p className="font-bold text-gray-900">45%</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MaintenanceView: React.FC = () => {
  const { alerts, spareParts, acknowledgeAlert } = useFleetTrackingStore();
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Maintenance Alerts</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {unacknowledgedAlerts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No maintenance alerts
            </div>
          ) : (
            unacknowledgedAlerts.map((alert) => (
              <div key={alert.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{alert.alertType.toUpperCase()}</p>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Due: {new Date(alert.dueDate).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Spare Parts Status</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {spareParts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No spare parts tracked
            </div>
          ) : (
            spareParts.map((part) => (
              <div key={part.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{part.partName}</p>
                    <p className="text-sm text-gray-600">Part #: {part.partNumber}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    part.status === 'good' ? 'bg-green-100 text-green-800' :
                    part.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {part.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Last Installed</p>
                    <p className="font-semibold">{new Date(part.lastInstalled).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Next Due</p>
                    <p className="font-semibold">{new Date(part.nextDueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Cost</p>
                    <p className="font-semibold">${part.cost.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FleetTrackingModule;
