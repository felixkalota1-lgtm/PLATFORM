import React, { useState, useEffect } from 'react';
import { MapPin, Truck, Package, Calendar, ArrowRight, Search, Filter, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import procurementService, { Order } from '../services/procurementService';

const OrderTrackingPage: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'default';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

      const allOrders = [...sentOrders, ...receivedOrdersList].sort(
        (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
      ).map(order => ({
        ...order,
        toCompanyName: order.toCompanyName || 'Company'
      }));
      setOrders(allOrders);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load order tracking data');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = React.useMemo(() => {
    let result = orders;

    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    if (searchTerm) {
      result = result.filter(order =>
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.toCompanyName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [orders, statusFilter, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      case 'confirmed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'shipped':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'in_transit':
        return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={18} />;
      case 'in_transit':
        return <Truck size={18} />;
      case 'pending':
        return <Clock size={18} />;
      default:
        return <Package size={18} />;
    }
  };

  const statuses = ['all', 'pending', 'confirmed', 'in_transit', 'shipped', 'completed'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Tracking & Logistics</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Track shipments, monitor delivery status, and manage logistics in real-time</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-2">{orders.length}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">In Transit</p>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-2">{orders.filter(o => o.status === 'accepted').length}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-300 mt-2">{orders.filter(o => o.status === 'draft').length}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Delivered</p>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mt-2">{orders.filter(o => o.status === 'completed').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-24 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by order number or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                    statusFilter === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <Filter size={16} />
                  {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
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
              <p className="text-red-900 dark:text-red-200 font-medium">Error Loading Tracking Data</p>
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
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading tracking information...</p>
            </div>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{order.orderNumber || 'Order #' + order.id.slice(0, 8)}</h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">{order.toCompanyName || 'Company'}</p>
                  </div>
                  <ArrowRight
                    size={24}
                    className={`text-gray-400 dark:text-gray-600 transition-transform ${selectedOrder?.id === order.id ? 'rotate-90' : ''}`}
                  />
                </div>

                {/* Timeline */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      Ordered: {order.createdAt.toDate().toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-purple-500" />
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {order.items?.length || 0} items • Total: ${(order.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedOrder?.id === order.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Delivery Timeline</h4>
                    <div className="space-y-4">
                      {[
                        { status: 'ordered', date: order.createdAt.toDate() },
                        { status: 'confirmed', date: new Date(order.createdAt.toDate().getTime() + 86400000) },
                        { status: 'shipped', date: new Date(order.createdAt.toDate().getTime() + 172800000) },
                        { status: 'in_transit', date: new Date(order.createdAt.toDate().getTime() + 259200000) },
                        { status: 'delivered', date: new Date(order.createdAt.toDate().getTime() + 604800000) },
                      ].map((milestone, idx) => {
                        const isCompleted = order.status === 'completed' || 
                          (order.status === 'accepted' && ['ordered', 'confirmed', 'shipped'].includes(milestone.status));
                        return (
                          <div key={idx} className="flex gap-4">
                            <div className={`flex flex-col items-center ${idx < 4 ? 'pb-4' : ''}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                isCompleted || milestone.status === order.status
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                              }`}>
                                {isCompleted || milestone.status === order.status ? '✓' : idx + 1}
                              </div>
                              {idx < 4 && (
                                <div className={`w-0.5 h-12 ${
                                  isCompleted ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                                }`} />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white capitalize">
                                {milestone.status.replace('_', ' ')}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {milestone.date.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Truck className="mx-auto text-gray-400 dark:text-gray-600" size={48} />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No Orders to Track</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Create an order to start tracking shipments</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPage;
