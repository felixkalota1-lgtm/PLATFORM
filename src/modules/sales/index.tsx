import { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useSalesStore } from './store';
import SalesQuotationsList from './components/SalesQuotationsList';
import { useProcurementStore } from '../procurement/store';
import RequestsList from '../procurement/components/RequestsList';

export default function SalesAndProcurementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quotations } = useSalesStore();
  const { requests } = useProcurementStore();

  const getActiveTab = () => {
    const path = location.pathname.split('/').pop();
    return path || 'sales';
  };

  const activeTab = getActiveTab();

  const salesStats = [
    {
      label: 'Total Quotations',
      value: quotations.length,
      icon: FileText,
      color: 'emerald',
    },
    {
      label: 'Sent',
      value: quotations.filter((q) => q.status === 'sent').length,
      icon: AlertCircle,
      color: 'blue',
    },
    {
      label: 'Accepted',
      value: quotations.filter((q) => q.status === 'accepted').length,
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Draft',
      value: quotations.filter((q) => q.status === 'draft').length,
      icon: Clock,
      color: 'yellow',
    },
  ];

  const procurementStats = [
    {
      label: 'Total Requests',
      value: requests.length,
      icon: FileText,
      color: 'blue',
    },
    {
      label: 'Pending Approval',
      value: requests.filter((r) => r.status === 'submitted').length,
      icon: Clock,
      color: 'yellow',
    },
    {
      label: 'Approved',
      value: requests.filter((r) => r.status === 'approved').length,
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Urgent',
      value: requests.filter((r) => r.priority === 'urgent').length,
      icon: AlertCircle,
      color: 'red',
    },
  ];

  const stats = activeTab === 'sales' ? salesStats : procurementStats;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Sales & Procurement Management
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const colorClasses = {
                emerald:
                  'bg-emerald-50 dark:bg-emerald-900 dark:bg-opacity-20 text-emerald-600 dark:text-emerald-400',
                blue: 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 text-blue-600 dark:text-blue-400',
                yellow:
                  'bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 text-yellow-600 dark:text-yellow-400',
                green:
                  'bg-green-50 dark:bg-green-900 dark:bg-opacity-20 text-green-600 dark:text-green-400',
                red: 'bg-red-50 dark:bg-red-900 dark:bg-opacity-20 text-red-600 dark:text-red-400',
              };

              return (
                <div
                  key={stat.label}
                  className={`p-4 rounded-lg ${
                    colorClasses[stat.color as keyof typeof colorClasses]
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <Icon className="w-8 h-8 opacity-50" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => navigate(`/sales/sales`)}
              className={`px-1 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'sales'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              💰 Sales Quotations
            </button>
            <button
              onClick={() => navigate(`/sales/procurement`)}
              className={`px-1 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'procurement'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              🛒 Procurement Requests
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/sales/sales" replace />} />
          <Route path="/sales" element={
            <div className="space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <p className="text-emerald-900 dark:text-emerald-100">
                  💡 <strong>Tip:</strong> Create sales quotations from products in your inventory. Click
                  the "💰 Create Sale Quote" button on any product to get started!
                </p>
              </div>
              <SalesQuotationsList />
            </div>
          } />
          <Route path="/procurement" element={
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-blue-900 dark:text-blue-100">
                  💡 <strong>Tip:</strong> Create procurement requests to request quotations from your suppliers.
                </p>
              </div>
              <RequestsList requests={requests} />
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}
