import React, { useState } from 'react';
import { Eye, TrendingUp } from 'lucide-react';
import { FinancialReport, BankTransaction } from '../../../services/accountingService';
import '../AccountingModule.css';

interface ReportsTabProps {
  reports: FinancialReport[];
  transactions: BankTransaction[];
  onRefresh?: () => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ reports, transactions }) => {
  const [selectedReport, setSelectedReport] = useState<FinancialReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'reports' | 'transactions'>('reports');

  const reconciled = transactions.filter((t) => t.reconciled).length;
  const totalTransactions = transactions.length;

  return (
    <div>
      {/* Tabs for Reports and Transactions */}
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        <button
          onClick={() => setReportType('reports')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
            reportType === 'reports'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Financial Reports ({reports.length})
        </button>
        <button
          onClick={() => setReportType('transactions')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
            reportType === 'transactions'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Bank Transactions ({totalTransactions})
        </button>
      </div>

      {reportType === 'reports' && (
        <div>
          {reports.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>No financial reports available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-white text-lg capitalize">{report.type}</h3>
                      <p className="text-slate-400 text-sm">{report.period}</p>
                    </div>
                    <TrendingUp className="text-emerald-400" size={24} />
                  </div>

                  <div className="space-y-3 mb-4">
                    {report.type === 'balance sheet' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Total Assets</span>
                          <span className="font-bold text-white">
                            ${report.totalAssets?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Total Liabilities</span>
                          <span className="font-bold text-white">
                            ${report.totalLiabilities?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-700 pt-2">
                          <span className="text-slate-400 text-sm">Total Equity</span>
                          <span className="font-bold text-emerald-400">
                            ${report.totalEquity?.toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}

                    {report.type === 'income statement' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Total Revenue</span>
                          <span className="font-bold text-emerald-400">
                            ${report.totalRevenue?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Total Expenses</span>
                          <span className="font-bold text-red-400">
                            ${report.totalExpenses?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-700 pt-2">
                          <span className="text-slate-400 text-sm font-bold">Net Income</span>
                          <span className="font-bold text-emerald-400">
                            ${report.netIncome?.toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}

                    {report.type === 'cash flow' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Operating Activities</span>
                          <span className="font-bold text-white">$125,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Investing Activities</span>
                          <span className="font-bold text-white">-$75,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Financing Activities</span>
                          <span className="font-bold text-white">$0</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                    <span className="text-xs text-slate-400">Generated: {report.generatedDate}</span>
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowReportModal(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm flex items-center gap-1.5 transition-colors"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {reportType === 'transactions' && (
        <div>
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-slate-400 text-sm font-semibold mb-1">Reconciled</p>
                <p className="text-2xl font-bold text-emerald-400">{reconciled}</p>
                <p className="text-xs text-slate-400 mt-1">of {totalTransactions}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-slate-400 text-sm font-semibold mb-1">Pending Reconciliation</p>
                <p className="text-2xl font-bold text-amber-400">{totalTransactions - reconciled}</p>
              </div>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>No transactions available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-300">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-300">Description</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-300">Reference</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-300">Type</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-300">Amount</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-300">Balance</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-300">Reconciled</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trans, idx) => (
                    <tr
                      key={trans.id}
                      className={`border-b border-slate-700 hover:bg-slate-800/50 transition-colors ${
                        idx % 2 === 0 ? 'bg-slate-900/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-300">{trans.date}</td>
                      <td className="px-4 py-3 text-white font-medium">{trans.description}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{trans.reference}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            trans.type === 'credit'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {trans.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        <span
                          className={trans.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}
                        >
                          {trans.type === 'credit' ? '+' : '-'}${trans.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        ${trans.balance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            trans.reconciled
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {trans.reconciled ? '✓' : '○'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white capitalize">{selectedReport.type}</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Period</p>
                  <p className="text-white font-bold">{selectedReport.period}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Generated</p>
                  <p className="text-white">{selectedReport.generatedDate}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Start Date</p>
                  <p className="text-white">{selectedReport.startDate}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">End Date</p>
                  <p className="text-white">{selectedReport.endDate}</p>
                </div>
              </div>

              {selectedReport.totalAssets && (
                <div className="bg-slate-700/50 rounded p-4 space-y-2">
                  <h3 className="font-bold text-white mb-2">Balance Sheet Summary</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Total Assets:</span>
                    <span className="font-bold text-white">
                      ${selectedReport.totalAssets.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Total Liabilities:</span>
                    <span className="font-bold text-white">
                      ${selectedReport.totalLiabilities?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-600 pt-2">
                    <span className="text-slate-300 font-semibold">Total Equity:</span>
                    <span className="font-bold text-emerald-400">
                      ${selectedReport.totalEquity?.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {selectedReport.totalRevenue && (
                <div className="bg-slate-700/50 rounded p-4 space-y-2">
                  <h3 className="font-bold text-white mb-2">Income Statement Summary</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Total Revenue:</span>
                    <span className="font-bold text-emerald-400">
                      ${selectedReport.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Total Expenses:</span>
                    <span className="font-bold text-red-400">
                      ${selectedReport.totalExpenses?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-600 pt-2">
                    <span className="text-slate-300 font-semibold">Net Income:</span>
                    <span className="font-bold text-emerald-400">
                      ${selectedReport.netIncome?.toLocaleString()}
                    </span>
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

export default ReportsTab;
