import React, { useState, useMemo } from 'react';
import { Search, Eye } from 'lucide-react';
import { Expense } from '../../../services/accountingService';
import '../AccountingModule.css';

interface ExpensesTabProps {
  expenses: Expense[];
  onRefresh?: () => void;
}

const ExpensesTab: React.FC<ExpensesTabProps> = ({ expenses }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const statuses = Array.from(new Set(expenses.map((e) => e.status)));
  const categories = Array.from(new Set(expenses.map((e) => e.category)));

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch =
        exp.expenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || exp.status === selectedStatus;
      const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [expenses, searchQuery, selectedStatus, selectedCategory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reimbursed':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'approved':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'paid':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  const stats = {
    total: expenses.length,
    pending: expenses.filter((e) => e.status === 'pending').length,
    approved: expenses.filter((e) => e.status === 'approved').length,
    reimbursed: expenses.filter((e) => e.status === 'reimbursed').length,
    totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
  };

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm font-semibold mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">${stats.totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm font-semibold mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm font-semibold mb-1">Approved</p>
          <p className="text-2xl font-bold text-blue-400">{stats.approved}</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm font-semibold mb-1">Reimbursed</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.reimbursed}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by expense number or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
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

      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>No expenses found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Expense #</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Date</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Submitted By</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense, idx) => (
                <tr
                  key={expense.id}
                  className={`border-b border-slate-700 hover:bg-slate-800/50 transition-colors ${
                    idx % 2 === 0 ? 'bg-slate-900/30' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-white">{expense.expenseNumber}</td>
                  <td className="px-4 py-3 text-slate-300">{expense.category}</td>
                  <td className="px-4 py-3 text-slate-300">{expense.date}</td>
                  <td className="px-4 py-3 text-right font-semibold text-white">
                    ${expense.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{expense.submittedBy}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(
                        expense.status
                      )}`}
                    >
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedExpense(expense);
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

      {showDetailModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{selectedExpense.expenseNumber}</h2>
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
                  <p className="text-slate-400 text-sm mb-1">Category</p>
                  <p className="text-white font-bold">{selectedExpense.category}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Date</p>
                  <p className="text-white">{selectedExpense.date}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Amount</p>
                  <p className="text-emerald-400 font-bold text-lg">
                    ${selectedExpense.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Payment Method</p>
                  <p className="text-white capitalize">{selectedExpense.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Submitted By</p>
                  <p className="text-white">{selectedExpense.submittedBy}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Status</p>
                  <p className="text-white capitalize font-semibold">{selectedExpense.status}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Description</p>
                <p className="text-slate-300">{selectedExpense.description}</p>
              </div>
              {selectedExpense.approvedBy && (
                <div>
                  <p className="text-slate-400 text-sm mb-1">Approved By</p>
                  <p className="text-slate-300">{selectedExpense.approvedBy}</p>
                </div>
              )}
              <div>
                <p className="text-slate-400 text-sm mb-1">Attachments</p>
                <p className="text-slate-300">{selectedExpense.attachmentCount} file(s)</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Notes</p>
                <p className="text-slate-300">{selectedExpense.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesTab;
