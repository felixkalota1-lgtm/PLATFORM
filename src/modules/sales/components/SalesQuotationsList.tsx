import React from 'react';
import { Edit2, Trash2, Send, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useSalesStore } from '../store';
import { SalesQuotation } from '../types';

export default function SalesQuotationsList() {
  const { quotations, updateQuotation, deleteQuotation } = useSalesStore();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const getStatusColor = (status: SalesQuotation['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
      case 'sent':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'accepted':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
    }
  };

  const handleStatusChange = (id: string, newStatus: SalesQuotation['status']) => {
    updateQuotation(id, { status: newStatus, updatedAt: new Date() });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      deleteQuotation(id);
    }
  };

  if (quotations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <div className="inline-block p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
          <Eye className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          No sales quotations yet. Add products from inventory to create quotations!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quotations.map((quote) => (
        <div
          key={quote.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition"
        >
          <button
            onClick={() =>
              setExpandedId(expandedId === quote.id ? null : quote.id)
            }
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {quote.quotationNumber}
                  </h3>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(
                      quote.status
                    )}`}
                  >
                    {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {quote.customerName} • {quote.productName}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                  ${quote.finalAmount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(quote.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {expandedId === quote.id ? (
              <ChevronUp className="ml-2" />
            ) : (
              <ChevronDown className="ml-2" />
            )}
          </button>

          {expandedId === quote.id && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                    Quantity
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {quote.quantity}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                    Unit Price
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${quote.unitPrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                    Subtotal
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${quote.totalAmount.toFixed(2)}
                  </p>
                </div>
                {quote.discount && quote.discount > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                      Discount
                    </p>
                    <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      -{quote.discountType === 'percentage' ? quote.discount + '%' : '$' + quote.discount.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {quote.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {quote.description}
                  </p>
                </div>
              )}

              {quote.customerEmail || quote.customerPhone ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Customer Contact
                  </p>
                  <div className="space-y-1">
                    {quote.customerEmail && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📧 {quote.customerEmail}
                      </p>
                    )}
                    {quote.customerPhone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📱 {quote.customerPhone}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              {quote.validUntil && (
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                    Valid Until
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(quote.validUntil).toLocaleDateString()}
                  </p>
                </div>
              )}

              {quote.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {quote.notes}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                {quote.status === 'draft' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(quote.id, 'sent')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                    >
                      <Send size={18} />
                      Send
                    </button>
                    <button
                      onClick={() => handleDelete(quote.id)}
                      className="px-4 py-2 border-2 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}

                {quote.status === 'sent' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(quote.id, 'accepted')}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                    >
                      ✓ Mark Accepted
                    </button>
                    <button
                      onClick={() => handleStatusChange(quote.id, 'rejected')}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                    >
                      ✗ Mark Rejected
                    </button>
                  </>
                )}

                {(quote.status === 'accepted' || quote.status === 'rejected') && (
                  <button
                    onClick={() => handleDelete(quote.id)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
