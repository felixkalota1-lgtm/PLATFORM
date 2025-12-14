import React, { useState } from 'react';
import { useInquiryFlowStore } from './store';
import type { Order } from '../../types';

export const InquiryModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inquiries' | 'quotes' | 'orders'>('inquiries');
  const { inquiries, quotes, orders } = useInquiryFlowStore();
  
  const pendingInquiries = inquiries.filter((i) => i.status === 'pending');
  const respondedInquiries = inquiries.filter((i) => i.status === 'responded');
  const orderedInquiries = inquiries.filter((i) => i.status === 'ordered');
  
  const pendingQuotes = quotes.filter((q) => q.status === 'pending');
  const acceptedQuotes = quotes.filter((q) => q.status === 'accepted');
  const rejectedQuotes = quotes.filter((q) => q.status === 'rejected');

  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Inquiry & Order Management</h1>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'inquiries'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Inquiries ({inquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'quotes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Quotations ({quotes.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'orders'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Orders ({orders.length})
          </button>
        </div>

        {activeTab === 'inquiries' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Pending" value={pendingInquiries.length} color="blue" />
            <MetricCard label="Responded" value={respondedInquiries.length} color="purple" />
            <MetricCard label="Ordered" value={orderedInquiries.length} color="green" />
            <MetricCard label="Cancelled" value={inquiries.filter(i => i.status === 'cancelled').length} color="red" />
          </div>
        )}
        
        {activeTab === 'quotes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <MetricCard label="Pending" value={pendingQuotes.length} color="yellow" />
            <MetricCard label="Accepted" value={acceptedQuotes.length} color="green" />
            <MetricCard label="Rejected" value={rejectedQuotes.length} color="red" />
          </div>
        )}

        {activeTab === 'inquiries' && <InquiriesView />}
        {activeTab === 'quotes' && <QuotesView />}
        {activeTab === 'orders' && <OrdersView />}
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: number; color: 'blue' | 'purple' | 'green' | 'red' | 'yellow' }> = ({ label, value, color }) => {
  const colorClasses: Record<'blue' | 'purple' | 'green' | 'red' | 'yellow', string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

const InquiriesView: React.FC = () => {
  const { inquiries, selectedInquiry, setSelectedInquiry } = useInquiryFlowStore();
  const [messageText, setMessageText] = useState('');

  const selected = selectedInquiry ? inquiries.find((i) => i.id === selectedInquiry) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 font-semibold text-gray-900">
            All Inquiries
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {inquiries.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No inquiries yet
              </div>
            ) : (
              inquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  onClick={() => setSelectedInquiry(inquiry.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                    selectedInquiry === inquiry.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <p className="font-semibold text-gray-900 text-sm">
                    Inquiry {inquiry.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{inquiry.productIds.length} product(s)</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      inquiry.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                      inquiry.status === 'responded' ? 'bg-purple-100 text-purple-800' :
                      inquiry.status === 'ordered' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {inquiry.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        {selected ? (
          <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Inquiry {selected.id.slice(0, 8)}
              </h2>
              <p className="text-sm text-gray-600 mb-3">{selected.message}</p>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  selected.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                  selected.status === 'responded' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {selected.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-600">
                  {selected.productIds.length} product(s)
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selected.messages && selected.messages.length > 0 ? (
                selected.messages.map((msg) => (
                  <div key={msg.id} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-900">{msg.senderId}</p>
                    <p className="text-sm text-gray-600 mt-1">{msg.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No messages yet</p>
              )}
            </div>

            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 h-full flex items-center justify-center">
            Select an inquiry to view details
          </div>
        )}
      </div>
    </div>
  );
};

const QuotesView: React.FC = () => {
  const { quotes, acceptQuote, rejectQuote } = useInquiryFlowStore();

  return (
    <div className="grid grid-cols-1 gap-6">
      {quotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No quotations yet
        </div>
      ) : (
        quotes.map((quote) => (
          <div key={quote.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-900">Quote {quote.id.slice(0, 8)}</h3>
                <p className="text-sm text-gray-600">Inquiry {quote.inquiryId.slice(0, 8)}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {quote.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Total Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${quote.totalPrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Valid Until</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(quote.validUntil).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-600 uppercase font-semibold mb-3">Items</p>
              <div className="space-y-2">
                {quote.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">Product {item.productId.slice(0, 8)}</span>
                    <span className="font-semibold text-gray-900">
                      {item.quantity} × ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {quote.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => acceptQuote(quote.id)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  Accept Quote
                </button>
                <button
                  onClick={() => rejectQuote(quote.id)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-semibold"
                >
                  Reject Quote
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

const OrdersView: React.FC = () => {
  const { orders, updateOrderStatus } = useInquiryFlowStore();

  return (
    <div className="grid grid-cols-1 gap-6">
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No orders yet
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-900">Order {order.id.slice(0, 8)}</h3>
                <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <select
                value={order.status}
                onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                className={`text-xs px-2 py-1 rounded-full font-semibold border-0 cursor-pointer ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">${order.totalPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Items</p>
                <p className="text-xl font-bold text-gray-900">{order.items.length}</p>
              </div>
              {order.trackingId && (
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Tracking</p>
                  <p className="text-sm font-semibold text-gray-900">{order.trackingId}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 uppercase font-semibold mb-3">Shipping Address</p>
              <p className="text-sm text-gray-900">{order.shippingAddress}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default InquiryModule;
