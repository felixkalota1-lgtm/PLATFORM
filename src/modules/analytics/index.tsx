import React, { useState } from 'react';
import { useAnalyticsStore } from './store';

export const AnalyticsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'procurement' | 'operational' | 'financial' | 'compliance'>('sales');
  const { dateRange, setDateRange } = useAnalyticsStore();

  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Business Analytics Dashboard</h1>
          
          <div className="flex gap-4 items-center bg-white rounded-lg shadow p-4">
            <label className="text-sm font-semibold text-gray-700">Date Range:</label>
            <input
              type="date"
              value={dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => setDateRange({
                start: new Date(e.target.value),
                end: dateRange.end,
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-600">to</span>
            <input
              type="date"
              value={dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => setDateRange({
                start: dateRange.start,
                end: new Date(e.target.value),
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              Export Report
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'sales'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Sales
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('procurement')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'procurement'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Procurement
          </button>
          <button
            onClick={() => setActiveTab('operational')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'operational'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Operational
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'financial'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Financial
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'compliance'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Compliance
          </button>
        </div>

        {activeTab === 'sales' && <SalesAnalyticsView />}
        {activeTab === 'inventory' && <InventoryAnalyticsView />}
        {activeTab === 'procurement' && <ProcurementAnalyticsView />}
        {activeTab === 'operational' && <OperationalAnalyticsView />}
        {activeTab === 'financial' && <FinancialAnalyticsView />}
        {activeTab === 'compliance' && <ComplianceAnalyticsView />}
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: string | number; trend?: number; icon?: string }> = ({
  title,
  value,
  trend,
  icon,
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-600 text-sm font-semibold">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      {icon && <span className="text-3xl">{icon}</span>}
    </div>
    {trend !== undefined && (
      <div className="mt-4">
        <span className={trend >= 0 ? 'text-green-600' : 'text-red-600'}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      </div>
    )}
  </div>
);

const SalesAnalyticsView: React.FC = () => {
  const { salesData } = useAnalyticsStore();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sales"
          value={salesData?.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0'}
          trend={12.5}
          icon="💰"
        />
        <MetricCard
          title="Total Orders"
          value={salesData?.totalOrders || 0}
          trend={8.3}
          icon="📦"
        />
        <MetricCard
          title="Average Order Value"
          value={salesData?.averageOrderValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0'}
          trend={3.2}
          icon="📊"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${salesData?.conversionRate.toFixed(2) || 0}%`}
          trend={-2.1}
          icon="📈"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {salesData?.topProducts.map((product) => (
              <div key={product.productId} className="flex justify-between items-center pb-3 border-b border-gray-200">
                <div>
                  <p className="font-semibold text-gray-900">{product.productName}</p>
                  <p className="text-sm text-gray-600">{product.unitsSold} units</p>
                </div>
                <p className="font-bold text-gray-900">${product.revenue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sales Summary</h3>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <p className="text-sm opacity-90">Repeat Customers</p>
              <p className="text-2xl font-bold">{salesData?.repeatCustomers || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryAnalyticsView: React.FC = () => {
  const { inventoryData } = useAnalyticsStore();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Products"
          value={inventoryData?.totalProducts || 0}
          icon="📦"
        />
        <MetricCard
          title="Total Value"
          value={inventoryData?.totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0'}
          icon="💎"
        />
        <MetricCard
          title="Low Stock Items"
          value={inventoryData?.lowStockItems || 0}
          icon="⚠️"
        />
        <MetricCard
          title="Turnover Rate"
          value={`${inventoryData?.turnoverRate.toFixed(2) || 0}%`}
          icon="🔄"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Stock Movement</h3>
        <div className="space-y-3">
          {inventoryData?.stockMovement.map((movement) => (
            <div key={movement.productId} className="flex justify-between items-center pb-3 border-b border-gray-200">
              <div>
                <p className="font-semibold text-gray-900">{movement.productName}</p>
                <p className="text-sm text-gray-600">{new Date(movement.date).toLocaleDateString()}</p>
              </div>
              <span className={`font-bold ${movement.movement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {movement.movement > 0 ? '+' : ''}{movement.movement}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProcurementAnalyticsView: React.FC = () => {
  const { procurementData } = useAnalyticsStore();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Inquiries"
          value={procurementData?.totalInquiries || 0}
          icon="❓"
        />
        <MetricCard
          title="Pending Inquiries"
          value={procurementData?.pendingInquiries || 0}
          icon="⏳"
        />
        <MetricCard
          title="Quotation Rate"
          value={`${procurementData?.quotationRate.toFixed(2) || 0}%`}
          icon="📄"
        />
        <MetricCard
          title="Avg Procurement Time"
          value={`${procurementData?.averageProcurementTime || 0}d`}
          icon="⏱️"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Top Suppliers</h3>
        <div className="space-y-3">
          {procurementData?.topSuppliers.map((supplier) => (
            <div key={supplier.supplierId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{supplier.supplierName}</p>
                  <p className="text-sm text-gray-600">{supplier.ordersPlaced} orders</p>
                </div>
                <p className="font-bold text-gray-900">${supplier.totalSpent.toFixed(2)}</p>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">Delivery: {supplier.averageDeliveryTime}d</span>
                <span className="text-gray-600">Quality: ⭐ {supplier.qualityRating.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const OperationalAnalyticsView: React.FC = () => {
  const { operationalData } = useAnalyticsStore();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Warehouse Utilization"
          value={`${operationalData?.warehouseUtilization.toFixed(1) || 0}%`}
          icon="🏭"
        />
        <MetricCard
          title="Vehicle Utilization"
          value={`${operationalData?.vehicleUtilization.toFixed(1) || 0}%`}
          icon="🚚"
        />
        <MetricCard
          title="Compliance Rate"
          value={`${operationalData?.documentComplianceRate.toFixed(1) || 0}%`}
          icon="✅"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Employee Productivity</h3>
        <div className="space-y-3">
          {operationalData?.employeeProductivity.map((employee) => (
            <div key={employee.employeeId} className="flex justify-between items-center pb-3 border-b border-gray-200">
              <div>
                <p className="font-semibold text-gray-900">{employee.employeeName}</p>
                <p className="text-sm text-gray-600">{employee.department}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{employee.tasksCompleted} tasks</p>
                <p className="text-sm text-gray-600">{employee.efficiency}% efficiency</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FinancialAnalyticsView: React.FC = () => {
  const { financialData } = useAnalyticsStore();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Income"
          value={financialData?.totalIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0'}
          icon="💵"
        />
        <MetricCard
          title="Total Expenses"
          value={financialData?.totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0'}
          icon="💸"
        />
        <MetricCard
          title="Net Profit"
          value={financialData?.netProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0'}
          icon="📈"
        />
        <MetricCard
          title="Profit Margin"
          value={`${financialData?.profitMargin.toFixed(2) || 0}%`}
          icon="📊"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Invoice Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <p className="text-gray-600">Issued</p>
              <p className="font-bold text-gray-900">{financialData?.invoicesIssued || 0}</p>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <p className="text-gray-600">Paid</p>
              <p className="font-bold text-gray-900">{financialData?.invoicesPaid || 0}</p>
            </div>
            <div className="flex justify-between items-center pb-3">
              <p className="text-gray-600">Outstanding</p>
              <p className="font-bold text-red-600">
                {financialData?.outstandingPayment.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="space-y-3">
            {financialData?.expenseBreakdown.map((expense) => (
              <div key={expense.category}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-gray-600">{expense.category}</p>
                  <p className="font-semibold">{expense.percentage.toFixed(1)}%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${expense.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ComplianceAnalyticsView: React.FC = () => {
  const { complianceData } = useAnalyticsStore();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Valid Documents"
          value={complianceData?.documentsValid || 0}
          icon="📄"
        />
        <MetricCard
          title="Expiring Soon"
          value={complianceData?.documentsExpiringSoon || 0}
          icon="⚠️"
        />
        <MetricCard
          title="Valid Contracts"
          value={complianceData?.contractsValid || 0}
          icon="✍️"
        />
        <MetricCard
          title="Compliance Score"
          value={`${complianceData?.complianceScore.toFixed(0) || 0}/100`}
          icon="🎯"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Compliance Status</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold text-gray-900">Overall Compliance</p>
              <p className="text-2xl font-bold text-blue-600">
                {complianceData?.complianceScore.toFixed(0)}%
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full"
                style={{ width: `${complianceData?.complianceScore || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsModule;
