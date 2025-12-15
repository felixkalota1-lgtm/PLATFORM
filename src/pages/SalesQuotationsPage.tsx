import React, { useState } from 'react';
import { FileText, Plus, Send, AlertCircle, CheckCircle, Clock, Download, Share2, Search } from 'lucide-react';
import { useSalesStore } from '../modules/sales/store';

const SalesQuotationsPage: React.FC = () => {
  const { quotations } = useSalesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);

  const filteredQuotations = React.useMemo(() => {
    let result = quotations;

    if (statusFilter !== 'all') {
      result = result.filter(q => q.status === statusFilter);
    }

    if (searchTerm) {
      result = result.filter(q =>
        q.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [quotations, statusFilter, searchTerm]);

  const stats = [
    {
      label: 'Total Quotations',
      value: quotations.length,
      icon: FileText,
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: 'Sent',
      value: quotations.filter(q => q.status === 'sent').length,
      icon: Send,
      color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
    },
    {
      label: 'Accepted',
      value: quotations.filter(q => q.status === 'accepted').length,
      icon: CheckCircle,
      color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      label: 'Pending',
      value: quotations.filter(q => q.status === 'draft').length,
      icon: Clock,
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'accepted':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'draft':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send size={16} />;
      case 'accepted':
        return <CheckCircle size={16} />;
      case 'rejected':
        return <AlertCircle size={16} />;
      case 'draft':
        return <Clock size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sales Quotations</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Create, send, and manage customer quotations</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors">
              <Plus size={20} /> Create Quotation
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className={`${stat.color} border ${stat.border} rounded-lg p-4 transition-all hover:shadow-md`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-75">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <Icon size={28} className="opacity-50" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-24 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search quotations by number, company, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Quotations</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {filteredQuotations.length > 0 ? (
          <div className="space-y-4">
            {filteredQuotations.map((quotation) => (
              <div
                key={quotation.id}
                onClick={() => setSelectedQuote(selectedQuote === quotation.id ? null : quotation.id)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{quotation.id || 'Quote #' + quotation.id.slice(0, 8)}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Sales Quotation</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${getStatusColor(quotation.status)}`}>
                      {getStatusIcon(quotation.status)}
                      {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Amount</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">${(quotation.totalAmount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Items</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">1 item</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Validity</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{quotation.validUntil ? new Date(quotation.validUntil).getDate() + 'd' : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Details (Expandable) */}
                {selectedQuote === quotation.id && (
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quotation Details</h4>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{quotation.productName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {quotation.quantity}</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">${quotation.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Valid Until</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Created</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {quotation.status === 'draft' && (
                        <>
                          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
                            <Send size={16} /> Send
                          </button>
                          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            Edit
                          </button>
                        </>
                      )}
                      {quotation.status === 'sent' && (
                        <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-sm transition-colors">
                          Awaiting Response
                        </button>
                      )}
                      {quotation.status === 'accepted' && (
                        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
                          <CheckCircle size={16} /> Convert to Order
                        </button>
                      )}
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                        <Download size={16} /> Download
                      </button>
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                        <Share2 size={16} /> Share
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText className="mx-auto text-gray-400 dark:text-gray-600" size={48} />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No Quotations Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Create your first quotation to get started</p>
            <button className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto">
              <Plus size={20} /> Create Quotation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesQuotationsPage;
