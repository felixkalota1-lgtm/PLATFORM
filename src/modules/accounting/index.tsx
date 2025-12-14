import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileText,
  CreditCard,
  DollarSign,
  TrendingUp,
  Plus,
  Download,
  AlertCircle,
} from 'lucide-react';
import accountingService, {
  Account,
  Invoice,
  Bill,
  Expense,
  FinancialReport,
  BankTransaction,
} from '../../services/accountingService';
import InvoicesTab from './components/InvoicesTab';
import BillsTab from './components/BillsTab';
import ExpensesTab from './components/ExpensesTab';
import AccountsTab from './components/AccountsTab';
import ReportsTab from './components/ReportsTab';
import './AccountingModule.css';

type Tab = 'accounts' | 'invoices' | 'bills' | 'expenses' | 'reports';

const AccountingModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('accounts');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccountingData();
  }, []);

  const loadAccountingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [accData, invData, billData, expData, repData, transData] = await Promise.all([
        accountingService.getAccounts(),
        accountingService.getInvoices(),
        accountingService.getBills(),
        accountingService.getExpenses(),
        accountingService.getFinancialReports(),
        accountingService.getBankTransactions(),
      ]);

      setAccounts(accData);
      setInvoices(invData);
      setBills(billData);
      setExpenses(expData);
      setReports(repData);
      setTransactions(transData);
    } catch (err) {
      console.error('Error loading accounting data:', err);
      setError('Failed to load accounting data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate key metrics
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReceivable = invoices.reduce(
    (sum, inv) => sum + (inv.amountPaid < inv.amount ? inv.amount - inv.amountPaid : 0),
    0
  );
  const totalPayable = bills.reduce(
    (sum, bill) => sum + (bill.amountPaid < bill.amount ? bill.amount - bill.amountPaid : 0),
    0
  );
  const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue').length;
  const overdueBills = bills.filter((bill) => bill.status === 'overdue').length;
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const tabConfig = [
    {
      id: 'accounts' as Tab,
      label: 'Chart of Accounts',
      icon: <BarChart3 size={20} />,
      count: accounts.length,
    },
    {
      id: 'invoices' as Tab,
      label: 'Invoices',
      icon: <FileText size={20} />,
      count: invoices.length,
    },
    {
      id: 'bills' as Tab,
      label: 'Bills',
      icon: <CreditCard size={20} />,
      count: bills.length,
    },
    {
      id: 'expenses' as Tab,
      label: 'Expenses',
      icon: <DollarSign size={20} />,
      count: expenses.length,
    },
    {
      id: 'reports' as Tab,
      label: 'Reports',
      icon: <TrendingUp size={20} />,
      count: reports.length,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-emerald-500/20">
                  <DollarSign className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                    Accounting & Finance
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">Financial Management & Reporting System</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2 transition-colors">
                <Plus size={18} />
                New Invoice
              </button>
              <button className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium flex items-center gap-2 transition-colors">
                <Download size={18} />
                Export
              </button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
              <p className="text-slate-400 text-xs font-semibold mb-1">Total Revenue</p>
              <p className="text-lg font-bold text-emerald-400">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
              <p className="text-slate-400 text-xs font-semibold mb-1">Receivables</p>
              <p className="text-lg font-bold text-blue-400">${totalReceivable.toLocaleString()}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
              <p className="text-slate-400 text-xs font-semibold mb-1">Payables</p>
              <p className="text-lg font-bold text-amber-400">${totalPayable.toLocaleString()}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
              <p className="text-slate-400 text-xs font-semibold mb-1">Total Expenses</p>
              <p className="text-lg font-bold text-red-400">${totalExpenses.toLocaleString()}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
              <p className="text-slate-400 text-xs font-semibold mb-1">Overdue Invoices</p>
              <p className="text-lg font-bold text-red-400">{overdueInvoices}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
              <p className="text-slate-400 text-xs font-semibold mb-1">Overdue Bills</p>
              <p className="text-lg font-bold text-red-400">{overdueBills}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-900 bg-opacity-50 border-t border-slate-700 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-2">
              {tabConfig.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-4 font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-400 bg-slate-800'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1 text-xs px-2 py-1 rounded-full bg-slate-700">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-200 font-medium">{error}</p>
              <button
                onClick={loadAccountingData}
                className="text-red-300 text-sm mt-2 hover:text-red-200 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {loading && accounts.length === 0 && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              <p className="mt-4 text-slate-400">Loading accounting data...</p>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <AccountsTab accounts={accounts} onRefresh={loadAccountingData} />
        )}

        {activeTab === 'invoices' && (
          <InvoicesTab invoices={invoices} onRefresh={loadAccountingData} />
        )}

        {activeTab === 'bills' && <BillsTab bills={bills} onRefresh={loadAccountingData} />}

        {activeTab === 'expenses' && (
          <ExpensesTab expenses={expenses} onRefresh={loadAccountingData} />
        )}

        {activeTab === 'reports' && (
          <ReportsTab reports={reports} transactions={transactions} onRefresh={loadAccountingData} />
        )}
      </div>
    </div>
  );
};

export default AccountingModule;
