import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useLogisticsStore } from './store';
import CompanyVehiclesSection from './company-vehicles';

export const LogisticsModule: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { vehicles, routes } = useLogisticsStore();

  const getActiveTab = () => {
    const path = location.pathname.split('/').pop();
    return path || 'fleet';
  };

  const activeTab = getActiveTab();
  const activeRoutes = routes.filter(r => r.status === 'in-progress');

  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Fleet & Logistics Management</h1>

        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto sticky top-0 bg-gray-50 pb-2">
          {[
            { id: 'fleet', label: 'Fleet Vehicles', count: vehicles.length },
            { id: 'company-vehicles', label: 'Company Equipment', count: null },
            { id: 'shipments', label: 'Shipments', count: null },
            { id: 'tracking', label: 'Vehicle Tracking', count: activeRoutes.length },
            { id: 'fuel', label: 'Fuel Logs', count: null },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => navigate(`/logistics/${tab.id}`)}
              className={`px-4 py-2 font-semibold whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label} {tab.count !== null && `(${tab.count})`}
            </button>
          ))}
        </div>

        <Routes>
          <Route path="/" element={<Navigate to="/logistics/fleet" replace />} />
          <Route path="/fleet" element={<VehiclesView />} />
          <Route path="/company-vehicles" element={<CompanyVehiclesSection />} />
          <Route path="/shipments" element={<ShipmentsView />} />
          <Route path="/tracking" element={<TrackingView routes={activeRoutes} />} />
          <Route path="/fuel" element={<FuelLogsView />} />
        </Routes>
      </div>
    </div>
  );
};

const VehiclesView: React.FC = () => {
  const { vehicles } = useLogisticsStore();

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Fleet Vehicles</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
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
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">Year: {vehicle.year}</p>
                <p className="text-gray-600">Mileage: {vehicle.totalMileage} km</p>
                <p className="text-gray-600">Fuel: {vehicle.fuelType}</p>
                {vehicle.currentLocation && (
                  <p className="text-blue-600">📍 {vehicle.currentLocation.speed || 0} km/h</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface TrackingViewProps {
  routes: any[];
}

const TrackingView: React.FC<TrackingViewProps> = ({ routes: activeRoutes }: any) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold">Real-Time Route Tracking</h2>
      </div>
      
      <div className="p-6">
        {activeRoutes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No active routes currently
          </div>
        ) : (
          <div className="space-y-4">
            {activeRoutes.map((route: any) => (
              <div key={route.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Order {route.orderId?.slice(0, 8)}</h3>
                    <p className="text-sm text-gray-600">Vehicle {route.vehicleId.slice(0, 8)}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    IN TRANSIT
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">From</p>
                    <p className="text-gray-900">{route.startLocation.address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">To</p>
                    <p className="text-gray-900">{route.endLocation.address}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-600">Distance</p>
                    <p className="font-semibold">{route.distance} km</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-600">Est. Arrival</p>
                    <p className="font-semibold">
                      {route.estimatedArrival ? new Date(route.estimatedArrival).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-600">Progress</p>
                    <p className="font-semibold">45%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ShipmentsView: React.FC = () => {
  const shipments = [
    { id: 'SH-001', orderId: 'ORD-4521', company: 'ABC Manufacturing', status: 'in-transit', departure: '2025-12-14', eta: '2025-12-15', driver: 'John Doe', vehicle: 'TK-101' },
    { id: 'SH-002', orderId: 'ORD-4520', company: 'XYZ Supplies', status: 'delivered', departure: '2025-12-13', eta: '2025-12-14', driver: 'Jane Smith', vehicle: 'TK-102' },
    { id: 'SH-003', orderId: 'ORD-4519', company: 'Global Trade', status: 'pending', departure: '2025-12-16', eta: '2025-12-17', driver: 'Mike Johnson', vehicle: 'TK-103' },
  ];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Shipments</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + New Shipment
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="p-6 hover:bg-gray-50 transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{shipment.id} - {shipment.company}</h3>
                <p className="text-sm text-gray-600">Order: {shipment.orderId}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                shipment.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {shipment.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Driver</p>
                <p className="font-semibold">{shipment.driver}</p>
              </div>
              <div>
                <p className="text-gray-600">Vehicle</p>
                <p className="font-semibold">{shipment.vehicle}</p>
              </div>
              <div>
                <p className="text-gray-600">Departure</p>
                <p className="font-semibold">{shipment.departure}</p>
              </div>
              <div>
                <p className="text-gray-600">ETA</p>
                <p className="font-semibold">{shipment.eta}</p>
              </div>
              <div>
                <button className="bg-blue-100 text-blue-800 px-3 py-2 rounded hover:bg-blue-200 transition text-xs font-semibold">
                  Track
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FuelLogsView: React.FC = () => {
  const fuelLogs = [
    { id: 'FL-001', vehicleId: 'VH-001', vehicle: 'Mercedes Sprinter - TK-101', fuelStation: 'Shell BP - Lusaka Main', date: '2025-12-14', fuelAmount: 50, cost: 275, odometerReading: 45230 },
    { id: 'FL-002', vehicleId: 'VH-002', vehicle: 'Hino 500 - TK-102', fuelStation: 'PUMA Energy - Ndola', date: '2025-12-14', fuelAmount: 80, cost: 440, odometerReading: 32145 },
    { id: 'FL-003', vehicleId: 'VH-001', vehicle: 'Mercedes Sprinter - TK-101', fuelStation: 'Shell BP - Chipata', date: '2025-12-13', fuelAmount: 45, cost: 247, odometerReading: 45100 },
    { id: 'FL-004', vehicleId: 'VH-003', vehicle: 'Volvo FH - TK-103', fuelStation: 'Total Energies - Livingstone', date: '2025-12-13', fuelAmount: 100, cost: 550, odometerReading: 28567 },
    { id: 'FL-005', vehicleId: 'VH-002', vehicle: 'Hino 500 - TK-102', fuelStation: 'PUMA Energy - Kitwe', date: '2025-12-12', fuelAmount: 75, cost: 412, odometerReading: 32010 },
    { id: 'FL-006', vehicleId: 'VH-001', vehicle: 'Mercedes Sprinter - TK-101', fuelStation: 'Shell BP - Lusaka Main', date: '2025-12-12', fuelAmount: 50, cost: 275, odometerReading: 45000 },
  ];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Fuel Logs</h2>
          <p className="text-sm text-gray-600 mt-1">Total fuel consumption tracking and cost management</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
          + Log Fuel
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {fuelLogs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No fuel logs yet
          </div>
        ) : (
          fuelLogs.map((log) => (
            <div key={log.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{log.vehicle}</h3>
                  <p className="text-sm text-gray-600">{log.fuelStation}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">{log.id}</span>
              </div>

              <div className="grid grid-cols-5 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-600 text-xs font-semibold">Date</p>
                  <p className="font-semibold text-gray-900 mt-1">{log.date}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-600 text-xs font-semibold">Fuel Amount</p>
                  <p className="font-semibold text-gray-900 mt-1">{log.fuelAmount}L</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-600 text-xs font-semibold">Cost (ZMW)</p>
                  <p className="font-semibold text-red-600 mt-1">K{log.cost}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-600 text-xs font-semibold">Odometer</p>
                  <p className="font-semibold text-gray-900 mt-1">{log.odometerReading} km</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-600 text-xs font-semibold">Cost/L</p>
                  <p className="font-semibold text-gray-900 mt-1">K{(log.cost / log.fuelAmount).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 p-6 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Fuel Summary (Last 6 Logs)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">Total Fuel</p>
            <p className="text-2xl font-bold text-blue-600">{fuelLogs.reduce((sum, log) => sum + log.fuelAmount, 0)}L</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">Total Cost</p>
            <p className="text-2xl font-bold text-red-600">K{fuelLogs.reduce((sum, log) => sum + log.cost, 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">Average Cost/L</p>
            <p className="text-2xl font-bold text-green-600">K{(fuelLogs.reduce((sum, log) => sum + log.cost, 0) / fuelLogs.reduce((sum, log) => sum + log.fuelAmount, 0)).toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">Log Entries</p>
            <p className="text-2xl font-bold text-purple-600">{fuelLogs.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsModule;
