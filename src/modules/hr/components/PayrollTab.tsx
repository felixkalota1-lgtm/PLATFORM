import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Eye,
} from 'lucide-react';
import { PayrollRecord, Employee } from '../../../services/hrService';
import '../HRModule.css';

interface PayrollTabProps {
  payroll: PayrollRecord[];
  employees?: Employee[];
  onRefresh?: () => void;
}

const PayrollTab: React.FC<PayrollTabProps> = ({ payroll, employees: _employees, onRefresh: _onRefresh }) => {
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  const periods = Array.from(new Set(payroll.map((p) => p.period))).sort().reverse();

  const filteredPayroll = useMemo(() => {
    return payroll.filter((p) => {
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchesPeriod = selectedPeriod === 'all' || p.period === selectedPeriod;
      return matchesStatus && matchesPeriod;
    });
  }, [payroll, filterStatus, selectedPeriod]);

  // Summary Stats
  const totalNetPayroll = filteredPayroll.reduce((sum, p) => sum + p.netSalary, 0);
  const totalTaxes = filteredPayroll.reduce((sum, p) => sum + p.taxes, 0);
  const totalAllowances = filteredPayroll.reduce((sum, p) => sum + p.allowances, 0);

  const stats = [
    {
      label: 'Total Net Payroll',
      value: `$${(totalNetPayroll / 1000).toFixed(1)}K`,
      color: 'from-green-600 to-green-400',
      icon: '💰',
    },
    {
      label: 'Total Taxes',
      value: `$${(totalTaxes / 1000).toFixed(1)}K`,
      color: 'from-amber-600 to-amber-400',
      icon: '📊',
    },
    {
      label: 'Total Allowances',
      value: `$${(totalAllowances / 1000).toFixed(1)}K`,
      color: 'from-blue-600 to-blue-400',
      icon: '➕',
    },
    {
      label: 'Records',
      value: filteredPayroll.length,
      color: 'from-purple-600 to-purple-400',
      icon: '📋',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'processed':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'pending':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl bg-gradient-to-br ${stat.color} p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium opacity-90">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className="text-2xl opacity-50">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Periods</option>
          {periods.map((period) => (
            <option key={period} value={period}>
              {period}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          {['all', 'pending', 'processed', 'paid'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-700/50 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Employee</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Period</th>
              <th className="px-6 py-4 text-right font-semibold text-slate-300">Basic Salary</th>
              <th className="px-6 py-4 text-right font-semibold text-slate-300">Allowances</th>
              <th className="px-6 py-4 text-right font-semibold text-slate-300">Taxes</th>
              <th className="px-6 py-4 text-right font-semibold text-slate-300">Net Salary</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Status</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayroll.map((record) => (
              <tr
                key={record.id}
                className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
              >
                <td className="px-6 py-4 text-white font-medium">{record.employeeName}</td>
                <td className="px-6 py-4 text-slate-300">{record.period}</td>
                <td className="px-6 py-4 text-right text-white font-medium">
                  ${record.basicSalary.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right text-white font-medium">
                  ${record.allowances.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right text-white font-medium">
                  ${record.taxes.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right text-white font-bold">
                  ${record.netSalary.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                    {record.status === 'paid' ? '✓' : record.status === 'processed' ? '⏳' : '⏱'}{' '}
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => {
                      setSelectedRecord(record);
                      setShowDetailModal(true);
                    }}
                    className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <Eye size={16} />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPayroll.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <DollarSign className="w-12 h-12 text-slate-500 mb-4" />
          <p className="text-slate-400 text-lg font-medium">No payroll records found</p>
        </div>
      )}

      {/* Payroll Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">Payroll Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Employee</p>
                  <p className="text-white font-medium text-lg">{selectedRecord.employeeName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Period</p>
                  <p className="text-white font-medium">{selectedRecord.period}</p>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-white font-bold mb-4">Salary Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-300">Basic Salary</span>
                    <span className="text-white font-semibold">${selectedRecord.basicSalary.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <span className="text-slate-300">Allowances</span>
                    <span className="text-green-300 font-semibold">+${selectedRecord.allowances.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <span className="text-slate-300">Deductions</span>
                    <span className="text-red-300 font-semibold">-${selectedRecord.deductions.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <span className="text-slate-300">Taxes</span>
                    <span className="text-amber-300 font-semibold">-${selectedRecord.taxes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-500/10 border-2 border-blue-500/30 rounded-lg">
                    <span className="text-white font-bold">Net Salary</span>
                    <span className="text-blue-300 font-bold text-lg">${selectedRecord.netSalary.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-white font-bold mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Payment Method</p>
                    <p className="text-white font-medium">
                      {selectedRecord.paymentMethod === 'bank-transfer'
                        ? 'Bank Transfer'
                        : selectedRecord.paymentMethod.charAt(0).toUpperCase() + selectedRecord.paymentMethod.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Payment Date</p>
                    <p className="text-white font-medium">{selectedRecord.paymentDate.toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 text-sm">Status</p>
                    <p
                      className={`font-medium text-lg ${
                        selectedRecord.status === 'paid'
                          ? 'text-green-400'
                          : selectedRecord.status === 'processed'
                          ? 'text-blue-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollTab;
