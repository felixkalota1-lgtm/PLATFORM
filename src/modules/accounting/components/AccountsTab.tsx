import React, { useState, useMemo } from 'react';
import { Search, Eye } from 'lucide-react';
import { Account } from '../../../services/accountingService';
import '../AccountingModule.css';

interface AccountsTabProps {
  accounts: Account[];
  onRefresh?: () => void;
}

const AccountsTab: React.FC<AccountsTabProps> = ({ accounts }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const accountTypes = Array.from(new Set(accounts.map((a) => a.type)));

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch =
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || acc.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [accounts, searchQuery, selectedType]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'asset':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'liability':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'equity':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'revenue':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'expense':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const typeEmojis: { [key: string]: string } = {
    asset: '[Asset]',
    liability: '[Liability]',
    equity: '[Equity]',
    revenue: '[Revenue]',
    expense: '[Expense]',
  };

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by account name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Types</option>
          {accountTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {filteredAccounts.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>No accounts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((account) => (
            <div
              key={account.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{typeEmojis[account.type]}</span>
                  <div>
                    <h3 className="font-bold text-white">{account.name}</h3>
                    <p className="text-xs text-slate-500">{account.code}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded border ${getTypeColor(
                    account.type
                  )}`}
                >
                  {account.type}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Balance</span>
                  <span className="font-bold text-emerald-400">
                    ${account.balance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Status</span>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      account.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {account.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">{account.description}</p>
              </div>

              <button
                onClick={() => {
                  setSelectedAccount(account);
                  setShowDetailModal(true);
                }}
                className="w-full mt-4 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Eye size={16} />
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {showDetailModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Account Details</h2>
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
                  <p className="text-slate-400 text-sm mb-1">Account Name</p>
                  <p className="text-white font-bold">{selectedAccount.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Account Code</p>
                  <p className="text-white font-bold">{selectedAccount.code}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Type</p>
                  <p className="text-white font-bold capitalize">{selectedAccount.type}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Status</p>
                  <p className="text-white font-bold capitalize">{selectedAccount.status}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Current Balance</p>
                  <p className="text-emerald-400 font-bold text-lg">
                    ${selectedAccount.balance.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Currency</p>
                  <p className="text-white font-bold">{selectedAccount.currency}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Description</p>
                <p className="text-slate-300">{selectedAccount.description}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Last Modified</p>
                <p className="text-slate-300">{selectedAccount.lastModified}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsTab;
