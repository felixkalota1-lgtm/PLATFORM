import React, { useState, useMemo } from 'react';
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import { Contract, Employee } from '../../../services/hrService';
import '../HRModule.css';

interface ContractsTabProps {
  contracts: Contract[];
  employees?: Employee[];
  onRefresh?: () => void;
}

const ContractsTab: React.FC<ContractsTabProps> = ({ contracts }) => {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredContracts = useMemo(() => {
    if (filterStatus === 'all') return contracts;
    return contracts.filter((c) => c.status === filterStatus);
  }, [contracts, filterStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' };
      case 'expiring':
        return { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' };
      case 'expired':
        return { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' };
      default:
        return { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={18} />;
      case 'expiring':
        return <AlertCircle size={18} />;
      case 'expired':
        return <XCircle size={18} />;
      default:
        return <Clock size={18} />;
    }
  };

  // Summary Stats
  const stats = [
    {
      label: 'Active Contracts',
      value: contracts.filter((c) => c.status === 'active').length,
      color: 'from-green-600 to-green-400',
      icon: '✓',
    },
    {
      label: 'Expiring Soon',
      value: contracts.filter((c) => c.status === 'expiring').length,
      color: 'from-amber-600 to-amber-400',
      icon: '⚠',
    },
    {
      label: 'Expired',
      value: contracts.filter((c) => c.status === 'expired').length,
      color: 'from-red-600 to-red-400',
      icon: '✕',
    },
    {
      label: 'Total Value',
      value: `$${(contracts.reduce((sum, c) => sum + c.salary, 0) / 1000000).toFixed(1)}M`,
      color: 'from-blue-600 to-blue-400',
      icon: '$',
    },
  ];

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

      {/* Filter */}
      <div className="flex gap-4">
        <div className="flex gap-2">
          {['all', 'active', 'expiring', 'expired'].map((status) => (
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

      {/* Contracts Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-700/50 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Employee</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Position</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Type</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Salary</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Start Date</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Status</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Days Remaining</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map((contract) => {
              const colors = getStatusColor(contract.status);
              return (
                <tr
                  key={contract.id}
                  className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-6 py-4 text-white font-medium">{contract.employeeName}</td>
                  <td className="px-6 py-4 text-slate-300">{contract.position}</td>
                  <td className="px-6 py-4 text-slate-300">
                    <span className="px-2 py-1 bg-slate-600 rounded text-xs">
                      {contract.type.charAt(0).toUpperCase() + contract.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">${(contract.salary / 1000).toFixed(0)}K</td>
                  <td className="px-6 py-4 text-slate-300">{contract.startDate.toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}
                    >
                      {getStatusIcon(contract.status)}
                      {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {contract.daysUntilExpiry !== undefined ? (
                      <span className={contract.daysUntilExpiry < 30 ? 'text-amber-400 font-semibold' : ''}>
                        {contract.daysUntilExpiry > 0 ? `${contract.daysUntilExpiry} days` : 'Expired'}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        setSelectedContract(contract);
                        setShowDetailModal(true);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredContracts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="w-12 h-12 text-slate-500 mb-4" />
          <p className="text-slate-400 text-lg font-medium">No contracts found</p>
        </div>
      )}

      {/* Contract Detail Modal */}
      {showDetailModal && selectedContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto border border-slate-700 shadow-2xl">
            <div className="sticky top-0 flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800">
              <h2 className="text-2xl font-bold text-white">Contract Details</h2>
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
                  <p className="text-white font-medium text-lg">{selectedContract.employeeName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Position</p>
                  <p className="text-white font-medium">{selectedContract.position}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Contract Type</p>
                  <p className="text-white font-medium">
                    {selectedContract.type.charAt(0).toUpperCase() + selectedContract.type.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  <p className={`font-medium text-${selectedContract.status === 'active' ? 'green' : selectedContract.status === 'expiring' ? 'amber' : 'red'}-400`}>
                    {selectedContract.status.charAt(0).toUpperCase() + selectedContract.status.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Start Date</p>
                  <p className="text-white font-medium">{selectedContract.startDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">End Date</p>
                  <p className="text-white font-medium">
                    {selectedContract.endDate
                      ? selectedContract.endDate.toLocaleDateString()
                      : 'Permanent'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 text-sm">Annual Salary</p>
                  <p className="text-white font-bold text-lg">${selectedContract.salary.toLocaleString()}</p>
                </div>
              </div>

              {selectedContract.benefits.length > 0 && (
                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-white font-bold mb-3">Benefits</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedContract.benefits.map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg"
                      >
                        <span className="text-blue-400">✓</span>
                        <span className="text-slate-300 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsTab;
