import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import procurementService, { Order } from '../../services/procurementService';
import OrderManagement from './components/OrderManagement';
import VendorManagement from './components/VendorManagement';
import OrderTracking from './components/OrderTracking';
import ProcurementDashboard from './components/ProcurementDashboard';
import './ProcurementModule.css';

type Tab = 'dashboard' | 'orders' | 'tracking' | 'vendors';

const ProcurementModule: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'default';
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [receivedOrders, setReceivedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

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

        // Count unread messages
        const unreadMessages = receivedOrdersList.filter(
          order => order.hasUnreadMessages
        ).length;
        setUnreadCount(unreadMessages);
      } catch (err) {
        console.error('Error loading orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();

    // Subscribe to incoming orders
    const unsubscribe = procurementService.subscribeToOrdersAsRecipient(
      tenantId,
      (updatedOrders) => {
        setReceivedOrders(updatedOrders);
        const unread = updatedOrders.filter(o => o.hasUnreadMessages).length;
        setUnreadCount(unread);
      }
    );

    return () => unsubscribe();
  }, [user, tenantId]);

  if (!user) {
    return <div className="procurement-loading">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Procurement & Sales
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage B2B orders and vendor relationships
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              <span>📊</span> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              <span>📦</span> Orders
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-4 py-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'tracking'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              <span>🚚</span> Tracking
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-4 py-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'vendors'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              <span>🏢</span> Vendors
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-lg flex justify-between items-center">
            <p className="text-red-700 dark:text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-700 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100"
            >
              ✕
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading procurement data...</p>
            </div>
          </div>
        )}

        {!loading && activeTab === 'dashboard' && (
          <ProcurementDashboard
            sentOrdersCount={orders.length}
            receivedOrdersCount={receivedOrders.length}
            unreadCount={unreadCount}
            recentOrders={[...orders, ...receivedOrders]
              .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
              .slice(0, 5)}
            onViewOrders={() => setActiveTab('orders')}
          />
        )}

        {!loading && activeTab === 'orders' && (
          <OrderManagement
            sentOrders={orders}
            receivedOrders={receivedOrders}
            tenantId={tenantId}
            onOrderCreated={() => {
              procurementService.getOrdersBySender(tenantId).then(setOrders);
            }}
          />
        )}

        {!loading && activeTab === 'tracking' && (
          <OrderTracking orders={[...orders, ...receivedOrders]} />
        )}

        {!loading && activeTab === 'vendors' && (
          <VendorManagement tenantId={tenantId} />
        )}
      </div>

    </div>
  );
};

export default ProcurementModule;
