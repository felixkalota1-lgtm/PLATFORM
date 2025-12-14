import React, { useState } from 'react';
import { Order } from '../../../services/procurementService';
import CreateOrderModal from './CreateOrderModal';
import OrderDetail from './OrderDetail';
import './OrderManagement.css';

interface OrderManagementProps {
  sentOrders: Order[];
  receivedOrders: Order[];
  tenantId: string;
  onOrderCreated: () => void;
}

type OrderTab = 'sent' | 'received';

const OrderManagement: React.FC<OrderManagementProps> = ({
  sentOrders,
  receivedOrders,
  tenantId,
  onOrderCreated,
}) => {
  const [activeTab, setActiveTab] = useState<OrderTab>('received');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const orders = activeTab === 'sent' ? sentOrders : receivedOrders;
  const filteredOrders =
    filterStatus === 'all'
      ? orders
      : orders.filter(order => order.status === filterStatus);

  if (selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        tenantId={tenantId}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

  return (
    <div className="order-management">
      {/* Header */}
      <div className="order-header">
        <div>
          <h2>Order Management</h2>
          <p>Manage your B2B orders and internal warehouse requests</p>
        </div>
        <button
          className="btn-create-order"
          onClick={() => setIsCreateModalOpen(true)}
        >
          ➕ Create New Order
        </button>
      </div>

      {/* Tabs */}
      <div className="order-tabs">
        <button
          className={`tab ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          📥 Received Orders
          {receivedOrders.filter(o => o.hasUnreadMessages).length > 0 && (
            <span className="unread-badge">
              {receivedOrders.filter(o => o.hasUnreadMessages).length}
            </span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          📤 Sent Orders ({sentOrders.length})
        </button>
      </div>

      {/* Filters */}
      <div className="order-filters">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="received">Received</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="result-count">
          Showing {filteredOrders.length} of {orders.length} orders
        </span>
      </div>

      {/* Orders List */}
      <div className="orders-container">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No {filterStatus !== 'all' ? filterStatus : ''} orders</h3>
            <p>
              {activeTab === 'sent'
                ? 'You haven\'t sent any orders yet. Create one to get started.'
                : 'No orders received from vendors yet.'}
            </p>
            {activeTab === 'sent' && (
              <button
                className="btn-primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Your First Order
              </button>
            )}
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                className={`order-card ${order.hasUnreadMessages ? 'has-unread' : ''}`}
                onClick={() => setSelectedOrder(order)}
              >
                {/* Card Header */}
                <div className="card-header">
                  <div className="order-number-type">
                    <h3 className="order-number">{order.orderNumber}</h3>
                    <span className={`order-type ${order.orderType}`}>
                      {order.orderType === 'internal' ? '🏢 Internal' : '🌍 B2B'}
                    </span>
                  </div>
                  <span className={`status-badge ${order.status}`}>
                    {order.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Card Companies */}
                <div className="card-companies">
                  {activeTab === 'sent' ? (
                    <>
                      <span className="company-from">{order.fromCompanyName}</span>
                      <span className="arrow">→</span>
                      <span className="company-to">{order.toCompanyName}</span>
                    </>
                  ) : (
                    <>
                      <span className="company-from">{order.fromCompanyName}</span>
                      <span className="arrow">→</span>
                      <span className="company-to">You</span>
                    </>
                  )}
                </div>

                {/* Card Body */}
                <div className="card-body">
                  <div className="info-row">
                    <span className="label">Items:</span>
                    <span className="value">{order.items.length}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Total:</span>
                    <span className="value">${order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Date:</span>
                    <span className="value">
                      {new Date(order.createdAt.toMillis()).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Unread Messages */}
                {order.hasUnreadMessages && (
                  <div className="unread-messages">
                    💬 {order.messageCount} new message
                    {order.messageCount !== 1 ? 's' : ''}
                  </div>
                )}

                {/* Click to expand */}
                <div className="click-to-expand">View Details →</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        tenantId={tenantId}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          onOrderCreated();
        }}
      />
    </div>
  );
};

export default OrderManagement;
