import React, { useState, useMemo } from 'react';
import { Search, Eye } from 'lucide-react';
import { Bill } from '../../../services/accountingService';
import '../AccountingModule.css';

interface BillsTabProps {
  bills: Bill[];
  onRefresh?: () => void;
}

const BillsTab: React.FC<BillsTabProps> = ({ bills }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const statuses = Array.from(new Set(bills.map((b) => b.status)));

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const matchesSearch =
        bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || bill.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [bills, searchQuery, selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'overdue':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'approved':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'received':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'draft':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  const stats = {
    total: bills.length,
    approved: bills.filter((b) => b.status === 'approved').length,
    pending: bills.filter((b) => b.status === 'received' || b.status === 'draft').length,
    overdue: bills.filter((b) => b.status === 'overdue').length,
    totalAmount: bills.reduce((sum, bill) => sum + bill.amount, 0),
  };

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm font-semibold mb-1">Total Bills</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm font-semibold mb-1">Approved</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.approved}</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm font-semibold mb-1">Pending</p>
          <p className="text-2xl font-bold text-blue-400">{stats.pending}</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm font-semibold mb-1">Overdue</p>
          <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search bills by number or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Status</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {filteredBills.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>No bills found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Bill #</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Vendor</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Due Date</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Amount</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Paid</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300">PO</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill, idx) => (
                <tr
                  key={bill.id}
                  className={`border-b border-slate-700 hover:bg-slate-800/50 transition-colors ${
                    idx % 2 === 0 ? 'bg-slate-900/30' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-white">{bill.billNumber}</td>
                  <td className="px-4 py-3 text-slate-300">{bill.vendorName}</td>
                  <td className="px-4 py-3 text-slate-300">{bill.dueDate}</td>
                  <td className="px-4 py-3 text-right font-semibold text-white">
                    ${bill.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400">
                    ${bill.amountPaid.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{bill.purchaseOrder}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(
                        bill.status
                      )}`}
                    >
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedBill(bill);
                        setShowDetailModal(true);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDetailModal && selectedBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{selectedBill.billNumber}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Vendor</p>
                  <p className="text-white font-bold">{selectedBill.vendorName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Email</p>
                  <p className="text-slate-300">{selectedBill.vendorEmail}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Issue Date</p>
                  <p className="text-white">{selectedBill.issueDate}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Due Date</p>
                  <p className="text-white">{selectedBill.dueDate}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Amount</p>
                  <p className="text-emerald-400 font-bold text-lg">
                    ${selectedBill.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Amount Paid</p>
                  <p className="text-emerald-400 font-bold text-lg">
                    ${selectedBill.amountPaid.toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Items</p>
                {selectedBill.items.map((item) => (
                  <div key={item.id} className="bg-slate-700/50 rounded p-2 text-slate-300 text-sm mb-1">
                    {item.description} - {item.quantity} × ${item.unitPrice} = $
                    {item.total.toLocaleString()}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Notes</p>
                <p className="text-slate-300">{selectedBill.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillsTab;
