import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useLogisticsStore } from './store';
import CompanyVehiclesSection from './company-vehicles';

export const LogisticsModule: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { vehicles, routes, maintenance, fuelLogs } = useLogisticsStore();

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
            { id: 'tracking', label: 'Active Routes', count: activeRoutes.length },
            { id: 'maintenance', label: 'Maintenance', count: maintenance.length },
            { id: 'fuel', label: 'Fuel Logs', count: fuelLogs.length },
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
          <Route path="/tracking" element={<TrackingView routes={activeRoutes} />} />
          <Route path="/maintenance" element={<MaintenanceView />} />
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

const MaintenanceView: React.FC = () => {
  const { maintenance, vehicles } = useLogisticsStore();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Maintenance Records</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + New Record
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {maintenance.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No maintenance records yet
          </div>
        ) : (
          maintenance.map((record) => (
            <div key={record.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{record.description}</h3>
                  <p className="text-sm text-gray-600">
                    {vehicles.find(v => v.id === record.vehicleId)?.make} {vehicles.find(v => v.id === record.vehicleId)?.model}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  record.type === 'service' ? 'bg-blue-100 text-blue-800' :
                  record.type === 'repair' ? 'bg-orange-100 text-orange-800' :
                  record.type === 'spare-part-replacement' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {record.type.toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 text-sm">
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-semibold">{new Date(record.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Cost</p>
                  <p className="font-semibold text-red-600">${record.totalCost}</p>
                </div>
                <div>
                  <p className="text-gray-600">Mechanic</p>
                  <p className="font-semibold">{record.mechanic}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const FuelLogsView: React.FC = () => {
  const { fuelLogs, vehicles } = useLogisticsStore();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Fuel Consumption Logs</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
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
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {vehicles.find(v => v.id === log.vehicleId)?.make} {vehicles.find(v => v.id === log.vehicleId)?.model}
                  </h3>
                  <p className="text-sm text-gray-600">{log.fuelStation}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 text-sm">
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-semibold">{new Date(log.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Amount</p>
                  <p className="font-semibold">{log.fuelAmount}L</p>
                </div>
                <div>
                  <p className="text-gray-600">Cost</p>
                  <p className="font-semibold">${log.cost}</p>
                </div>
                <div>
                  <p className="text-gray-600">Odometer</p>
                  <p className="font-semibold">{log.odometerReading} km</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogisticsModule;
