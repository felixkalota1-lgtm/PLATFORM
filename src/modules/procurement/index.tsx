import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import procurementService, { Order } from '../../services/procurementService';
import OrderManagement from './components/OrderManagement';
import VendorManagement from './components/VendorManagement';
import OrderTracking from './components/OrderTracking';
import ProcurementDashboard from './components/ProcurementDashboard';
import './ProcurementModule.css';

const ProcurementModule: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'default';
  const [orders, setOrders] = useState<Order[]>([]);
  const [receivedOrders, setReceivedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get active tab from URL path
  const getActiveTab = () => {
    const path = location.pathname.split('/').pop()
    return path || 'dashboard'
  }

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

  const activeTab = getActiveTab()

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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-4 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'orders', label: 'Orders', icon: '📦' },
              { id: 'tracking', label: 'Tracking', icon: '🚚' },
              { id: 'vendors', label: 'Vendors', icon: '🏢' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => navigate(`/procurement/${tab.id}`)}
                className={`px-4 py-4 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.id === 'orders' && unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
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

        <Routes>
          <Route path="/" element={<Navigate to="/procurement/dashboard" replace />} />
          <Route path="/dashboard" element={
            !loading && (
              <ProcurementDashboard
                sentOrdersCount={orders.length}
                receivedOrdersCount={receivedOrders.length}
                unreadCount={unreadCount}
                recentOrders={[...orders, ...receivedOrders]
                  .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
                  .slice(0, 5)}
                onViewOrders={() => navigate('/procurement/orders')}
              />
            )
          } />
          <Route path="/orders" element={
            !loading && (
              <OrderManagement
                sentOrders={orders}
                receivedOrders={receivedOrders}
                tenantId={tenantId}
                onOrderCreated={() => {
                  procurementService.getOrdersBySender(tenantId).then(setOrders);
                }}
              />
            )
          } />
          <Route path="/tracking" element={
            !loading && <OrderTracking orders={[...orders, ...receivedOrders]} />
          } />
          <Route path="/vendors" element={
            !loading && <VendorManagement tenantId={tenantId} />
          } />
        </Routes>
      </div>
    </div>
  );
};

export default ProcurementModule;
