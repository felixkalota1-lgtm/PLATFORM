import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  CreditCard,
  DollarSign,
  TrendingUp,
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

const AccountingModule: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getActiveTab = () => {
    const path = location.pathname.split('/').pop();
    return path || 'accounts';
  };

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

  const activeTab = getActiveTab();
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
    { id: 'accounts', label: 'Chart of Accounts', icon: <BarChart3 size={20} />, count: accounts.length },
    { id: 'invoices', label: 'Invoices', icon: <FileText size={20} />, count: invoices.length },
    { id: 'receivables', label: 'Receivables', icon: <DollarSign size={20} />, count: overdueInvoices },
    { id: 'bills', label: 'Bills', icon: <CreditCard size={20} />, count: bills.length },
    { id: 'payables', label: 'Payables', icon: <CreditCard size={20} />, count: overdueBills },
    { id: 'expenses', label: 'Expenses', icon: <DollarSign size={20} />, count: expenses.length },
    { id: 'bank', label: 'Bank Transactions', icon: <CreditCard size={20} />, count: transactions.length },
    { id: 'tax', label: 'Tax Management', icon: <AlertCircle size={20} />, count: 0 },
    { id: 'budget', label: 'Budget Planning', icon: <TrendingUp size={20} />, count: 0 },
    { id: 'reports', label: 'Reports', icon: <TrendingUp size={20} />, count: reports.length },
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
        <div className="bg-slate-900 bg-opacity-50 border-t border-slate-700 overflow-x-auto sticky">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-2">
              {tabConfig.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => navigate(`/accounting/${tab.id}`)}
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

        <Routes>
          <Route path="/" element={<Navigate to="/accounting/accounts" replace />} />
          <Route path="/accounts" element={<AccountsTab accounts={accounts} onRefresh={loadAccountingData} />} />
          <Route path="/invoices" element={<InvoicesTab invoices={invoices} onRefresh={loadAccountingData} />} />
          <Route path="/receivables" element={<ReceivablesTab invoices={invoices} totalReceivable={totalReceivable} overdueCount={overdueInvoices} />} />
          <Route path="/bills" element={<BillsTab bills={bills} onRefresh={loadAccountingData} />} />
          <Route path="/payables" element={<PayablesTab bills={bills} totalPayable={totalPayable} overdueCount={overdueBills} />} />
          <Route path="/expenses" element={<ExpensesTab expenses={expenses} onRefresh={loadAccountingData} />} />
          <Route path="/bank" element={<BankTransactionsTab transactions={transactions} />} />
          <Route path="/tax" element={<TaxManagementTab />} />
          <Route path="/budget" element={<BudgetPlanningTab />} />
          <Route path="/reports" element={<ReportsTab reports={reports} transactions={transactions} onRefresh={loadAccountingData} />} />
        </Routes>
      </div>
    </div>
  );
};

// Receivables Tab Component
const ReceivablesTab: React.FC<{ invoices: Invoice[], totalReceivable: number, overdueCount: number }> = ({ invoices, totalReceivable, overdueCount }) => {
  const receivableInvoices = invoices.filter(inv => inv.amountPaid < inv.amount);
  
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm mb-2">Total Receivable</p>
          <p className="text-3xl font-bold text-cyan-400">${totalReceivable.toFixed(2)}</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm mb-2">Overdue Invoices</p>
          <p className="text-3xl font-bold text-red-400">{overdueCount}</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm mb-2">Active Receivables</p>
          <p className="text-3xl font-bold text-emerald-400">{receivableInvoices.length}</p>
        </div>
      </div>
      
      <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
        <h3 className="text-xl font-bold text-white mb-4">Outstanding Invoices</h3>
        <div className="space-y-3">
          {receivableInvoices.map(inv => (
            <div key={inv.id} className="bg-slate-800 p-4 rounded border border-slate-600 flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">{inv.id}</p>
                <p className="text-slate-400 text-sm">{inv.description || 'Invoice'}</p>
              </div>
              <div className="text-right">
                <p className="text-cyan-400 font-bold">${(inv.amount - inv.amountPaid).toFixed(2)}</p>
                <p className={`text-sm ${inv.status === 'overdue' ? 'text-red-400' : 'text-emerald-400'}`}>{inv.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Payables Tab Component
const PayablesTab: React.FC<{ bills: Bill[], totalPayable: number, overdueCount: number }> = ({ bills, totalPayable, overdueCount }) => {
  const payableBills = bills.filter(bill => bill.amountPaid < bill.amount);
  
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm mb-2">Total Payable</p>
          <p className="text-3xl font-bold text-red-400">${totalPayable.toFixed(2)}</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm mb-2">Overdue Bills</p>
          <p className="text-3xl font-bold text-orange-400">{overdueCount}</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm mb-2">Active Payables</p>
          <p className="text-3xl font-bold text-cyan-400">{payableBills.length}</p>
        </div>
      </div>
      
      <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
        <h3 className="text-xl font-bold text-white mb-4">Outstanding Bills</h3>
        <div className="space-y-3">
          {payableBills.map(bill => (
            <div key={bill.id} className="bg-slate-800 p-4 rounded border border-slate-600 flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">{bill.id}</p>
                <p className="text-slate-400 text-sm">{bill.vendorName}</p>
              </div>
              <div className="text-right">
                <p className="text-red-400 font-bold">${(bill.amount - bill.amountPaid).toFixed(2)}</p>
                <p className={`text-sm ${bill.status === 'overdue' ? 'text-red-400' : 'text-emerald-400'}`}>{bill.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Bank Transactions Tab Component
const BankTransactionsTab: React.FC<{ transactions: BankTransaction[] }> = ({ transactions }) => {
  const totalDebits = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
  const totalCredits = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm mb-2">Total Debits</p>
          <p className="text-3xl font-bold text-red-400">${totalDebits.toFixed(2)}</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm mb-2">Total Credits</p>
          <p className="text-3xl font-bold text-emerald-400">${totalCredits.toFixed(2)}</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm mb-2">Net Balance</p>
          <p className={`text-3xl font-bold ${totalCredits - totalDebits >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${(totalCredits - totalDebits).toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
        <h3 className="text-xl font-bold text-white mb-4">Recent Transactions</h3>
        <div className="space-y-2">
          {transactions.slice(0, 10).map(trans => (
            <div key={trans.id} className="bg-slate-800 p-4 rounded border border-slate-600 flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">{trans.reference}</p>
                <p className="text-slate-400 text-sm">{new Date(trans.date).toLocaleDateString()}</p>
              </div>
              <p className={`text-lg font-bold ${trans.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                {trans.type === 'credit' ? '+' : '-'}${trans.amount.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Tax Management Tab Component
const TaxManagementTab: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
        <h2 className="text-2xl font-bold text-white mb-6">Tax Management & Compliance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded border border-slate-600">
            <p className="text-slate-400 text-sm mb-2">VAT Accrued</p>
            <p className="text-2xl font-bold text-cyan-400">$2,150.00</p>
          </div>
          <div className="bg-slate-800 p-4 rounded border border-slate-600">
            <p className="text-slate-400 text-sm mb-2">Tax Liability</p>
            <p className="text-2xl font-bold text-red-400">$4,320.00</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-800 p-4 rounded border border-slate-600">
            <p className="text-white font-semibold">Q4 2025 Tax Filing</p>
            <p className="text-slate-400 text-sm mt-1">Status: In Progress</p>
          </div>
          <div className="bg-slate-800 p-4 rounded border border-slate-600">
            <p className="text-white font-semibold">Annual Tax Return 2024</p>
            <p className="text-slate-400 text-sm mt-1">Status: Filed ✓</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Budget Planning Tab Component
const BudgetPlanningTab: React.FC = () => {
  const budgets = [
    { category: 'Operations', allocated: 50000, spent: 32450, percentage: 65 },
    { category: 'Marketing', allocated: 25000, spent: 18900, percentage: 76 },
    { category: 'Personnel', allocated: 100000, spent: 92100, percentage: 92 },
    { category: 'IT & Infrastructure', allocated: 15000, spent: 8750, percentage: 58 },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm mb-2">Total Budget</p>
          <p className="text-3xl font-bold text-cyan-400">$190,000</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <p className="text-slate-400 text-sm mb-2">Total Spent</p>
          <p className="text-3xl font-bold text-orange-400">$152,200</p>
        </div>
      </div>

      <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
        <h3 className="text-xl font-bold text-white mb-4">Budget By Category</h3>
        <div className="space-y-4">
          {budgets.map((budget, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-center mb-2">
                <p className="text-white font-semibold">{budget.category}</p>
                <p className="text-slate-400 text-sm">${budget.spent} / ${budget.allocated}</p>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${budget.percentage > 90 ? 'bg-red-500' : budget.percentage > 75 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                  style={{ width: `${budget.percentage}%` }}
                ></div>
              </div>
              <p className="text-slate-400 text-xs mt-1">{budget.percentage}% used</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountingModule;
