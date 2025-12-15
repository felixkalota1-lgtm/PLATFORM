import React, { useState } from 'react';
import { useEquipmentStore } from './equipment-store';
import { CompanyEquipment, EquipmentType } from './equipment-types';

const EQUIPMENT_TYPES: { value: EquipmentType; label: string }[] = [
  { value: 'truck', label: 'Truck' },
  { value: 'tipper-truck', label: 'Tipper Truck' },
  { value: 'tanker-truck', label: 'Tanker Truck' },
  { value: 'flatbed-truck', label: 'Flatbed Truck' },
  { value: 'dump-truck', label: 'Dump Truck' },
  { value: 'tlb', label: 'TLB (Tractor with Loader & Backhoe)' },
  { value: 'grader', label: 'Grader' },
  { value: 'excavator', label: 'Excavator' },
  { value: 'loader', label: 'Loader' },
  { value: 'dozer', label: 'Dozer' },
  { value: 'compactor', label: 'Compactor' },
  { value: 'roller', label: 'Roller' },
  { value: 'crane', label: 'Crane' },
  { value: 'concrete-mixer', label: 'Concrete Mixer' },
  { value: 'other', label: 'Other' },
];

export const CompanyVehiclesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'usage' | 'reports'>('fleet');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const { equipment, addEquipment, generateDailyReport, generateWeeklyReport, generateMonthlyReport, generateYearlyReport, monthlyReports, yearlyReports } = useEquipmentStore();

  const handleAddEquipment = (data: Partial<CompanyEquipment>) => {
    const newEquipment: CompanyEquipment = {
      id: `equip-${Date.now()}`,
      companyId: 'current-company',
      equipmentType: data.equipmentType || 'truck',
      registrationNumber: data.registrationNumber || '',
      make: data.make || '',
      model: data.model || '',
      yearAcquired: data.yearAcquired || new Date().getFullYear(),
      purchasePrice: data.purchasePrice || 0,
      operator: data.operator,
      status: 'available',
      acquisitionDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addEquipment(newEquipment);
    setShowAddForm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Vehicles & Equipment</h2>
        <p className="text-gray-600">Manage trucks, TLBs, graders, and other heavy equipment with comprehensive reporting</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 px-6 pt-4">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'fleet'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-800'
          }`}
        >
          Equipment Fleet ({equipment.length})
        </button>
        <button
          onClick={() => setActiveTab('usage')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'usage'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-800'
          }`}
        >
          Usage Logs
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'reports'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-800'
          }`}
        >
          Reports
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'fleet' && (
          <FleetManagementView
            equipment={equipment}
            onAddClick={() => setShowAddForm(true)}
            onAddEquipment={handleAddEquipment}
            showForm={showAddForm}
          />
        )}
        {activeTab === 'usage' && <UsageLogsView equipment={equipment} />}
        {activeTab === 'reports' && (
          <ReportsView
            equipment={equipment}
            selectedEquipmentId={selectedEquipmentId}
            reportType={reportType}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            monthlyReports={monthlyReports}
            yearlyReports={yearlyReports}
            onGenerateDailyReport={generateDailyReport}
            onGenerateWeeklyReport={generateWeeklyReport}
            onGenerateMonthlyReport={generateMonthlyReport}
            onGenerateYearlyReport={generateYearlyReport}
            onEquipmentChange={setSelectedEquipmentId}
            onReportTypeChange={setReportType}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
          />
        )}
      </div>
    </div>
  );
};

const FleetManagementView: React.FC<{
  equipment: CompanyEquipment[];
  onAddClick: () => void;
  onAddEquipment: (data: Partial<CompanyEquipment>) => void;
  showForm: boolean;
}> = ({ equipment, onAddClick, onAddEquipment, showForm }) => {
  const [formData, setFormData] = useState<Partial<CompanyEquipment>>({});

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Equipment Fleet</h3>
        <button
          onClick={onAddClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          + Add Equipment
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
          <h4 className="font-semibold mb-4">Add New Equipment</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Equipment Type</label>
              <select
                value={formData.equipmentType || ''}
                onChange={(e) => setFormData({ ...formData, equipmentType: e.target.value as EquipmentType })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select Type</option>
                {EQUIPMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registration Number</label>
              <input
                type="text"
                value={formData.registrationNumber || ''}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="e.g., REG-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Make</label>
              <input
                type="text"
                value={formData.make || ''}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="e.g., Volvo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <input
                type="text"
                value={formData.model || ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="e.g., FH16"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year Acquired</label>
              <input
                type="number"
                value={formData.yearAcquired || new Date().getFullYear()}
                onChange={(e) => setFormData({ ...formData, yearAcquired: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Purchase Price</label>
              <input
                type="number"
                value={formData.purchasePrice || 0}
                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Operator</label>
              <input
                type="text"
                value={formData.operator || ''}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Operator name"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onAddEquipment(formData)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Save Equipment
            </button>
            <button
              onClick={() => {
                setFormData({});
                onAddClick();
              }}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map((equip) => (
          <div key={equip.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-gray-900">{equip.registrationNumber}</h4>
                <p className="text-sm text-gray-600">
                  {EQUIPMENT_TYPES.find((t) => t.value === equip.equipmentType)?.label || 'Equipment'}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  equip.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : equip.status === 'in-use'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {equip.status.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1 mb-3">
              <p>
                <span className="font-medium">Make/Model:</span> {equip.make} {equip.model}
              </p>
              <p>
                <span className="font-medium">Year:</span> {equip.yearAcquired}
              </p>
              <p>
                <span className="font-medium">Price:</span> ${equip.purchasePrice.toFixed(2)}
              </p>
              {equip.operator && (
                <p>
                  <span className="font-medium">Operator:</span> {equip.operator}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 text-blue-600 hover:text-blue-800 text-sm font-semibold">Edit</button>
              <button className="flex-1 text-red-600 hover:text-red-800 text-sm font-semibold">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UsageLogsView: React.FC<{ equipment: CompanyEquipment[] }> = ({ equipment }) => {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Equipment Usage Logs</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            📊 Track daily usage for each piece of equipment including hours worked, kilometers traveled, fuel consumed,
            and costs incurred.
          </p>
        </div>
      </div>

      {equipment.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No equipment added yet. Add equipment to start logging usage.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {equipment.map((equip) => (
            <div key={equip.id} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                {equip.registrationNumber} - {EQUIPMENT_TYPES.find((t) => t.value === equip.equipmentType)?.label}
              </h4>
              <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">+ Log Usage</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ReportsView: React.FC<any> = ({
  equipment,
  selectedEquipmentId,
  reportType,
  selectedYear,
  selectedMonth,
  monthlyReports,
  yearlyReports,
  onGenerateDailyReport,
  onGenerateWeeklyReport,
  onGenerateMonthlyReport,
  onGenerateYearlyReport,
  onEquipmentChange,
  onReportTypeChange,
  onYearChange,
  onMonthChange,
}) => {
  const selectedEquip = equipment.find((e: CompanyEquipment) => e.id === selectedEquipmentId);

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Equipment Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Select Equipment</label>
            <select
              value={selectedEquipmentId || ''}
              onChange={(e) => onEquipmentChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Choose Equipment</option>
              {equipment.map((e: CompanyEquipment) => (
                <option key={e.id} value={e.id}>
                  {e.registrationNumber} - {e.make} {e.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => onReportTypeChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
              <option value="yearly">Yearly Report</option>
            </select>
          </div>

          {reportType !== 'daily' && reportType !== 'weekly' && (
            <div>
              <label className="block text-sm font-medium mb-2">Year</label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => onYearChange(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          )}

          {reportType === 'monthly' && (
            <div>
              <label className="block text-sm font-medium mb-2">Month</label>
              <select value={selectedMonth} onChange={(e) => onMonthChange(parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value={0}>January</option>
                <option value={1}>February</option>
                <option value={2}>March</option>
                <option value={3}>April</option>
                <option value={4}>May</option>
                <option value={5}>June</option>
                <option value={6}>July</option>
                <option value={7}>August</option>
                <option value={8}>September</option>
                <option value={9}>October</option>
                <option value={10}>November</option>
                <option value={11}>December</option>
              </select>
            </div>
          )}
        </div>

        {selectedEquip && (
          <button
            onClick={() => {
              if (reportType === 'daily') onGenerateDailyReport(selectedEquipmentId, new Date());
              else if (reportType === 'weekly') onGenerateWeeklyReport(selectedEquipmentId, new Date(), new Date());
              else if (reportType === 'monthly') onGenerateMonthlyReport(selectedEquipmentId, selectedYear, selectedMonth);
              else if (reportType === 'yearly') onGenerateYearlyReport(selectedEquipmentId, selectedYear);
            }}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            Generate {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
          </button>
        )}
      </div>

      {reportType === 'monthly' && selectedEquip && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {monthlyReports.filter((r: any) => r.equipmentId === selectedEquipmentId).map((report: any) => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="font-bold text-gray-900 mb-3">
                {new Date(selectedYear, report.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Hours Worked:</span> {report.totalHoursWorked.toFixed(1)} hrs
                </p>
                <p>
                  <span className="font-medium">Km Traveled:</span> {report.totalKmTraveled.toFixed(1)} km
                </p>
                <p>
                  <span className="font-medium">Fuel Used:</span> {report.totalFuelUsed.toFixed(1)} L
                </p>
                <p>
                  <span className="font-medium">Revenue:</span> ${report.totalRevenueGenerated.toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Operating Cost:</span> ${report.totalOperatingCost.toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Profit Margin:</span> <span className="text-green-600 font-bold">${report.profitMargin.toFixed(2)}</span>
                </p>
                <p>
                  <span className="font-medium">Utilization:</span> {report.avgDailyUtilization.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {reportType === 'yearly' && selectedEquip && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {yearlyReports.filter((r: any) => r.equipmentId === selectedEquipmentId).map((report: any) => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="font-bold text-gray-900 mb-3">Year {report.year} Report</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Hours Worked:</span> {report.totalHoursWorked.toFixed(1)} hrs
                </p>
                <p>
                  <span className="font-medium">Km Traveled:</span> {report.totalKmTraveled.toFixed(1)} km
                </p>
                <p>
                  <span className="font-medium">Fuel Used:</span> {report.totalFuelUsed.toFixed(1)} L
                </p>
                <p>
                  <span className="font-medium">Revenue:</span> ${report.totalRevenueGenerated.toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Operating Cost:</span> ${report.totalOperatingCost.toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Profit Margin:</span> <span className="text-green-600 font-bold">${report.profitMargin.toFixed(2)}</span>
                </p>
                <p>
                  <span className="font-medium">Current Value:</span> ${report.currentValue.toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Downtime Hours:</span> {report.downtimeHours.toFixed(1)} hrs
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyVehiclesSection;
