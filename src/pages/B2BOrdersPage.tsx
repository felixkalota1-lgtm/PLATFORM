import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Filter, Search, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import procurementService, { Order } from '../services/procurementService';

const B2BOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'default';
  const [orders, setOrders] = useState<Order[]>([]);
  const [receivedOrders, setReceivedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'sent' | 'received' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    loadOrders();
  }, [user, tenantId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sentOrders, receivedOrdersList] = await Promise.all([
        procurementService.getOrdersBySender(tenantId),
        procurementService.getOrdersAsRecipient(tenantId),
      ]);

      setOrders(sentOrders);
      setReceivedOrders(receivedOrdersList);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = React.useMemo(() => {
    let result = filterType === 'sent' ? orders : filterType === 'received' ? receivedOrders : [...orders, ...receivedOrders];
    
    if (searchTerm) {
      result = result.filter(order =>
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.toCompanyName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return result;
  }, [orders, receivedOrders, filterType, searchTerm]);

  const stats = [
    {
      label: 'Total Orders',
      value: [...orders, ...receivedOrders].length,
      icon: ShoppingCart,
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: 'Sent Orders',
      value: orders.length,
      icon: TrendingUp,
      color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      label: 'Received Orders',
      value: receivedOrders.length,
      icon: Clock,
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
    },
    {
      label: 'Pending Response',
      value: [...orders, ...receivedOrders].filter(o => o.status === 'draft').length,
      icon: AlertCircle,
      color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">B2B Orders Management</h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Create, manage, and track business-to-business orders</p>
                </div>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors">
              <Plus size={20} /> Create Order
            </button>
          </div>

          {/* Stats Grid */}
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

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search orders by number or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'sent', 'received'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    filterType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <Filter size={18} />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-900 dark:text-red-200 font-medium">Error Loading Orders</p>
              <p className="text-red-800 dark:text-red-300 text-sm mt-1">{error}</p>
              <button
                onClick={loadOrders}
                className="mt-2 text-red-600 dark:text-red-400 hover:underline text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading orders...</p>
            </div>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{order.orderNumber || 'Order #' + order.id.slice(0, 8)}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{order.toCompanyName || 'Company'}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
                    order.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                    order.status === 'draft' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                    order.status === 'accepted' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {order.status === 'completed' && <CheckCircle size={16} />}
                    {order.status === 'draft' && <Clock size={16} />}
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Order Date:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{order.createdAt.toDate().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Items:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{order.items?.length || 0} items</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                    <span className="text-gray-900 dark:text-white font-bold text-lg">${(order.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
                    View Details
                  </button>
                  <button className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Actions
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingCart className="mx-auto text-gray-400 dark:text-gray-600" size={48} />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No Orders Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Try adjusting your filters or create a new order to get started</p>
            <button className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
              Create First Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default B2BOrdersPage;
