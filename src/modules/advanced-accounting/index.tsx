import React, { useState } from 'react';
import { useAdvancedAccountingStore } from './store';

export const AdvancedAccountingModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'journals' | 'ledger' | 'reports' | 'budgets' | 'tax' | 'depreciation'>('journals');
  const {
    journals,
    generalLedgers,
    financialStatements,
    budgets,
    taxCalculations,
    depreciationSchedules,
  } = useAdvancedAccountingStore();

  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Advanced Accounting</h1>

        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('journals')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'journals'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Journals ({journals.length})
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'ledger'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            General Ledger ({generalLedgers.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'reports'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Reports ({financialStatements.length})
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'budgets'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Budgets ({budgets.length})
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'tax'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Tax ({taxCalculations.length})
          </button>
          <button
            onClick={() => setActiveTab('depreciation')}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'depreciation'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Depreciation ({depreciationSchedules.length})
          </button>
        </div>

        {activeTab === 'journals' && <JournalsView />}
        {activeTab === 'ledger' && <LedgerView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'budgets' && <BudgetsView />}
        {activeTab === 'tax' && <TaxView />}
        {activeTab === 'depreciation' && <DepreciationView />}
      </div>
    </div>
  );
};

const JournalsView: React.FC = () => {
  const { journals } = useAdvancedAccountingStore();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Journal Entries</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
          + New Journal
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Entries</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {journals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No journals created yet
                </td>
              </tr>
            ) : (
              journals.map((journal) => (
                <tr key={journal.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(journal.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{journal.description}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ${journal.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{journal.entries.length}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      journal.status === 'posted' ? 'bg-green-100 text-green-800' :
                      journal.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {journal.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LedgerView: React.FC = () => {
  const { generalLedgers } = useAdvancedAccountingStore();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold">General Ledger</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Account</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Opening</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Debit</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Credit</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Closing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {generalLedgers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No general ledger entries
                </td>
              </tr>
            ) : (
              generalLedgers.map((ledger) => (
                <tr key={ledger.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{ledger.accountName}</p>
                    <p className="text-xs text-gray-600">{ledger.accountId}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{ledger.accountType}</td>
                  <td className="px-6 py-4 text-sm text-right font-semibold">
                    ${ledger.opening.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-blue-600 font-semibold">
                    ${ledger.debit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-red-600 font-semibold">
                    ${ledger.credit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">
                    ${ledger.closing.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReportsView: React.FC = () => {
  const { financialStatements, trialBalances } = useAdvancedAccountingStore();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition">
          <p className="text-sm font-semibold text-gray-600">Income Statements</p>
          <p className="text-2xl font-bold text-gray-900">
            {financialStatements.filter((f) => f.type === 'income-statement').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition">
          <p className="text-sm font-semibold text-gray-600">Balance Sheets</p>
          <p className="text-2xl font-bold text-gray-900">
            {financialStatements.filter((f) => f.type === 'balance-sheet').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition">
          <p className="text-sm font-semibold text-gray-600">Trial Balances</p>
          <p className="text-2xl font-bold text-gray-900">{trialBalances.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Financial Statements</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {financialStatements.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No financial statements generated yet
            </div>
          ) : (
            financialStatements.map((statement) => (
              <div key={statement.id} className="p-6 hover:bg-gray-50 transition cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">{statement.type.replace('-', ' ')}</p>
                    <p className="text-sm text-gray-600">Period: {statement.period}</p>
                    <p className="text-xs text-gray-500">
                      Generated: {new Date(statement.generatedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                    View / Download
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const BudgetsView: React.FC = () => {
  const { budgets } = useAdvancedAccountingStore();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">Budget Allocation</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
            + Allocate Budget
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {budgets.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No budgets allocated
            </div>
          ) : (
            budgets.map((budget) => (
              <div key={budget.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{budget.department} - {budget.category}</p>
                    <p className="text-sm text-gray-600">Period: {budget.period}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    budget.status === 'on-track' ? 'bg-green-100 text-green-800' :
                    budget.status === 'at-risk' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {budget.status.toUpperCase()}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Spent: ${budget.spentAmount.toFixed(2)}</span>
                    <span className="font-semibold text-gray-900">
                      ${budget.allocatedAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        budget.status === 'on-track'
                          ? 'bg-green-500'
                          : budget.status === 'at-risk'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          (budget.spentAmount / budget.allocatedAmount) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const TaxView: React.FC = () => {
  const { taxCalculations } = useAdvancedAccountingStore();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Tax Calculations</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
          + Calculate Tax
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {taxCalculations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No tax calculations
          </div>
        ) : (
          taxCalculations.map((tax) => (
            <div key={tax.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-gray-900">Tax Calculation - {tax.period}</p>
                  <p className="text-sm text-gray-600">Tax Rate: {(tax.taxRate * 100).toFixed(2)}%</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  tax.status === 'paid' ? 'bg-green-100 text-green-800' :
                  tax.status === 'filed' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {tax.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Taxable Income</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${tax.taxableIncome.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Total Tax</p>
                  <p className="text-lg font-bold text-red-600">${tax.totalTax.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const DepreciationView: React.FC = () => {
  const { depreciationSchedules } = useAdvancedAccountingStore();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Asset Depreciation</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
          + New Asset
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Asset</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Cost</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Accumulated</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Book Value</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Method</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {depreciationSchedules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No depreciation schedules
                </td>
              </tr>
            ) : (
              depreciationSchedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{schedule.assetName}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(schedule.purchaseDate).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold">
                    ${schedule.originalCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-red-600">
                    ${schedule.accumulatedDepreciation.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    ${schedule.bookValue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                    {schedule.depreciationMethod.replace('-', ' ')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdvancedAccountingModule;
